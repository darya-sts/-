"""Telegram bot handlers."""

from asyncio import Event, create_subprocess_exec, gather, sleep, to_thread
from datetime import datetime
from io import BytesIO
from os import getenv
from pathlib import Path
from subprocess import DEVNULL, PIPE
from traceback import print_exc
from typing import Any

import aiofiles.os  # ty: explicit submodule import
from dotenv import load_dotenv
from langchain.messages import HumanMessage
from telebot.types import CallbackQuery, InputFile, InputMediaPhoto, Message

from ...core.llm import LLM, can_listen
from ...utils import extract_response
from ..abstract import AgenticBot, handler
from ...core.mcp_mode import format_mcp_status, run_mcp_query
from ...core.mcp_routing import KIND_HELP, KIND_TOOLS, MCP_HELP, parse_mcp_message
from ...core.writer_agent import (
    KIND_AWAIT,
    KIND_RUN,
    WRITER_USAGE,
    approval_keyboard,
    channel_chat_id,
    extract_urls,
    get_draft,
    is_pending,
    parse_writer_callback,
    parse_writer_message,
    pop_draft,
    run_process_articles,
    save_draft,
    set_pending,
)
from ..start_menu import COMMANDS_HELP, action_reply, is_start_command, start_keyboard
from ..utils import str_size, unpack_user

load_dotenv()
TELEGRAM_CHAT_DEV = getenv("TELEGRAM_CHAT_DEV")
_RECEIVED_DIR = Path(getenv("DATA_DIR", "./data")) / "image_received"
_RECEIVED_DIR.mkdir(parents=True, exist_ok=True)


async def _save_received_image(img_bytes: bytes) -> str:
    """Persist a received image to disk and return its path."""
    ts = datetime.now().astimezone().strftime("%Y%m%d_%H%M%S_%f")
    path = _RECEIVED_DIR / f"img_{ts}.jpg"
    async with aiofiles.open(path, "wb") as f:
        await f.write(img_bytes)
    return str(path)


async def _read_image(path: str) -> bytes:
    async with aiofiles.open(path, "rb") as f:
        return await f.read()


async def _media_to_text(media: list[dict], context: str = "") -> str:
    """
    Transcribe audio or describe images into text via a capable fallback LLM.

    Called when the main LLM lacks the matching multimodal capability.
    For images, returns a structured JSON description matching the
    `generate_image` schema so the agent can reuse it for edits or
    regeneration.
    """
    cap = "stt" if any("audio" in m.get("mime_type", "") for m in media) else "vision"
    helper = LLM.pick(cap, fast=True)
    if not helper:
        return f"[Unsupported media: no {cap}-capable provider configured]"
    if cap == "stt":
        prompt = (
            "Transcribe this audio message verbatim in the same language the speaker uses. "
            "Preserve natural phrasing, filler words, and emotional tone. "
            "Do not translate, summarize, or paraphrase — write exactly what was said."
        )
    else:
        prompt = (
            "Analyze this image and return a SINGLE structured JSON object describing it "
            "in full detail, using the same schema as for image generation. The JSON must "
            "be valid and self-contained.\n\n"
            "Describe ALL content factually and completely — including nudity, sexual "
            "elements, violence, or any other sensitive content, exactly as it appears. "
            "Never censor, omit, euphemize, or soften your description of any visible "
            "element.\n\n"
            "Use these keys (omit any that don't apply):\n"
            '- `aspect_ratio`: e.g. "16:9", "9:16", "1:1"\n'
            '- `format`: "still image", "photograph", "illustration", "screenshot", etc.\n'
            '- `subject`: nested object with type, build, hair, face, clothing (or "nude" '
            "if naked), skin, pose, expression, and any other physical attributes\n"
            "- `composition`: framing, shot_type, camera_angle, subject_position, "
            "focal_region, quiet_field\n"
            "- `environment`: location, surfaces, props, weather\n"
            "- `camera`: capture_style, focus, depth_of_field, lens_feel\n"
            "- `lighting`: main_source, shadow, contrast\n"
            "- `color_treatment`: dominant_family, palette (list of named colors), "
            "focal_accent, saturation\n"
            "- `style_tags`: list of style descriptors\n"
            "- `visible_text`: any text visible in the image, verbatim\n"
            "- `prompt`: a rich, self-contained natural-language paragraph that "
            "synthesizes all fields into a vivid description someone could use to "
            "recreate the image exactly\n\n"
            "Return ONLY the JSON object, no markdown fences, no commentary."
        )
    if context:
        prompt += f"\n\nUser's message for context: {context}"
    parts = [{"type": "text", "text": prompt}, *media]
    response = await LLM.get(helper).ainvoke([HumanMessage(content=parts)])
    return extract_response(response)[0].strip()


@handler
async def telegram_start_callback(instance: AgenticBot, call: CallbackQuery) -> None:
    """Handle /start action buttons."""
    if not call.from_user or not instance.agent.is_allowed(call.from_user.id):
        await instance.bot.core.answer_callback_query(call.id)
        return
    await instance.bot.core.answer_callback_query(call.id)
    text = action_reply(call.data)
    if text and isinstance(call.message, Message):
        await instance.bot.send(call.message, text)


def _urls_from_message(msg: Message) -> list[str]:
    text = msg.text or msg.caption or ""
    urls = extract_urls(text)
    entities = list(msg.entities or []) + list(getattr(msg, "caption_entities", None) or [])
    for ent in entities:
        if ent.type == "url":
            urls.extend(extract_urls(text[ent.offset : ent.offset + ent.length]))
        elif ent.type == "text_link" and ent.url:
            urls.extend(extract_urls(ent.url) or [ent.url])
    unique: list[str] = []
    seen: set[str] = set()
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        unique.append(url)
    return unique


async def _run_writer_and_ask(
    instance: AgenticBot, msg: Message, urls: list[str]
) -> None:
    """Generate a post and send it to the user for approval."""
    waiting = await instance.bot.send(
        msg, f"⏳ Пишу пост по {len(urls)} статьям…"
    )
    try:
        post, errors = await to_thread(run_process_articles, urls)
    except Exception as e:
        print_exc()
        await telegram_report_issue(instance, msg, waiting, e)
        return
    try:
        await instance.bot.delete(waiting)
    except Exception:
        pass
    if not post or post.startswith("DEEPSEEK_API_KEY"):
        detail = post or "\n".join(errors) or "Не удалось написать пост."
        await instance.bot.send(msg, detail)
        return
    if post.startswith("Ошибка DeepSeek"):
        await instance.bot.send(msg, post)
        return
    user_id = msg.from_user.id if msg.from_user else 0
    draft_id = save_draft(user_id=user_id, text=post, urls=urls)
    preview = (
        "Черновик поста. Нажмите «Опубликовать», чтобы отправить в канал, "
        "или «Отклонить».\n\n"
        f"{post}"
    )
    if errors:
        preview += "\n\n⚠️ Не удалось прочитать:\n" + "\n".join(errors)
    if len(preview) > 3500:
        preview = preview[:3490] + "…"
    await instance.bot.send(msg, preview, reply_markup=approval_keyboard(draft_id))


@handler
async def telegram_writer_callback(instance: AgenticBot, call: CallbackQuery) -> None:
    """Publish or reject a writer-agent draft."""
    if not call.from_user or not instance.agent.is_allowed(call.from_user.id):
        await instance.bot.core.answer_callback_query(call.id)
        return
    parsed = parse_writer_callback(call.data)
    if parsed is None:
        await instance.bot.core.answer_callback_query(call.id)
        return
    action, draft_id = parsed
    draft = get_draft(draft_id)
    if draft is None:
        await instance.bot.core.answer_callback_query(
            call.id, "Черновик уже обработан или устарел."
        )
        return
    if draft["user_id"] != call.from_user.id:
        await instance.bot.core.answer_callback_query(
            call.id, "Согласовать может только автор черновика."
        )
        return
    if not isinstance(call.message, Message):
        await instance.bot.core.answer_callback_query(call.id)
        return

    if action == "no":
        pop_draft(draft_id)
        await instance.bot.core.answer_callback_query(call.id, "Пост отклонён")
        try:
            await instance.bot.core.edit_message_reply_markup(
                call.message.chat.id, call.message.id, reply_markup=None
            )
        except Exception:
            pass
        await instance.bot.send(call.message, "❌ Пост отклонён, в канал не отправлялся.")
        return

    channel = channel_chat_id()
    if channel is None:
        await instance.bot.core.answer_callback_query(
            call.id, "Не задан TELEGRAM_CHANNEL_ID"
        )
        await instance.bot.send(
            call.message,
            "Чтобы публиковать, задайте TELEGRAM_CHANNEL_ID "
            "(@channel или -100…) и добавьте бота администратором канала.",
        )
        return
    try:
        await instance.bot.core.send_message(channel, draft["text"])
    except Exception as e:
        await instance.bot.core.answer_callback_query(call.id, "Не удалось опубликовать")
        await instance.bot.send(
            call.message, f"Не удалось отправить пост в канал: {e}"
        )
        return
    pop_draft(draft_id)
    await instance.bot.core.answer_callback_query(call.id, "Опубликовано")
    try:
        await instance.bot.core.edit_message_reply_markup(
            call.message.chat.id, call.message.id, reply_markup=None
        )
    except Exception:
        pass
    await instance.bot.send(call.message, "✅ Пост опубликован в канал.")


@handler
async def telegram_report_issue(
    instance: AgenticBot, orig_msg: Message, reply_msg: Message, e: Exception | str
) -> None:
    """Report an issue to the admin and notify the user."""
    cause = "Agent" if isinstance(e, str) else "Telegram"
    error = f"\n{e}"
    instance.log.error(f"{cause} -> Exception: {e}")
    if TELEGRAM_CHAT_DEV:  # Report to admin
        user, name = unpack_user(orig_msg)
        await instance.bot.send(
            TELEGRAM_CHAT_DEV,
            instance.bot.logify(
                "Error",
                f"⚠️ {cause} issue detected on chat:\n[{orig_msg.chat.id}] {orig_msg.chat.title or 'Private'}\n[@{user}] {name}{error}",
            ),
        )
    if str(orig_msg.chat.id) != TELEGRAM_CHAT_DEV:  # Notify user
        await instance.bot.reply(
            reply_msg,
            instance.bot.logify(
                "Error",
                f"⚠️ Something went wrong with {cause}...\n🚒 Reported automatically to admin, meanwhile you can still try again.",
            ),
        )


def _user_admin(instance: AgenticBot, cmd: str) -> str:
    """Handle admin user-management commands: /allow-user, /list-user (alias
    /list-users), /ban-user."""
    name, _, arg = cmd.partition(" ")
    name = name.partition("@")[
        0
    ]  # /cmd@botname — Telegram appends the bot mention in groups
    arg = arg.strip()
    if name == "/allow-user":
        uid, sep, user = arg.partition("=")
        uid, user = uid.strip(), user.strip()
        if not sep or not uid.isdigit() or not user:
            return "⚠️ Usage: /allow-user user_id=name"
        instance.agent.add_allowed_user(uid, user)
        return f"✅ {user} ({uid}) can now talk to me."
    if name == "/ban-user":
        if not arg.isdigit():
            return "⚠️ Usage: /ban-user user_id"
        if instance.agent.is_admin(arg):
            return "⚠️ Can't ban an admin."
        if not instance.agent.remove_allowed_user(arg):
            return f"⚠️ {arg} is not in the allowed list."
        return f"🚫 {arg} can no longer talk to me."
    if name not in ("/list-user", "/list-users"):
        return "⚠️ Unknown user command. Try /allow-user, /list-user or /ban-user."

    # /list-user
    def fmt(title: str, users: dict[str, str]) -> str:
        return title + (
            "\n" + "\n".join(f"  {i}: {n}" for i, n in users.items())
            if users
            else "\n  (none)"
        )

    return "\n".join(
        [
            fmt("👑 Admin:", instance.agent._group_users("admin")),
            fmt("👥 Allowed:", instance.agent._group_users("allowed")),
        ]
    )


@handler
async def telegram_chat(
    instance: AgenticBot, msg: Message, overwrite: Message | None = None
) -> None:
    """Handle chat messages and orchestrate agent responses."""
    timer = instance.log.received(msg)
    # Reject anonymous users and users not in admin or allowed — no reply at all.
    # Relay-injected messages carry message_id 0 (Telegram never sends it) and
    # already passed token auth, so they skip the allowlist.
    if not msg.from_user or (
        msg.message_id != 0
        and not instance.agent.is_allowed(msg.from_user.id)
    ):
        return
    if is_start_command(msg.text):
        await instance.bot.send(
            msg,
            "Выберите действие:",
            reply_markup=start_keyboard(),
        )
        return
    if msg.text == "/tts":
        user_id = msg.from_user.id if msg.from_user else 0
        current = instance.tts_enabled.get(user_id, False)
        instance.tts_enabled[user_id] = not current
        state = "on 🔊" if not current else "off 🔇"
        await instance.bot.send(msg, f"TTS is now {state}")
        return
    cmd = msg.text or ""
    if cmd.split(" ")[0].partition("@")[0] in (
        "/allow-user",
        "/list-user",
        "/list-users",  # plural alias
        "/ban-user",
    ):
        if not instance.agent.is_admin(msg.from_user.id):
            return  # Admin-only: silently ignored for everyone else
        await instance.bot.send(msg, _user_admin(instance, cmd))
        return

    chat_id = msg.chat.id
    if msg.text == "/cancel":
        set_pending(chat_id, False)
        if chat_id in instance.cancel_events:
            instance.cancel_events[chat_id].set()
            await instance.bot.send(msg, "⏹️ Cancelling...")
        else:
            await instance.bot.send(msg, "Nothing to cancel.")
        return

    writer_req = parse_writer_message(msg.text)
    urls = _urls_from_message(msg)
    if writer_req is None and is_pending(chat_id) and urls:
        writer_req = parse_writer_message("/writer_agent " + " ".join(urls))
    if writer_req is not None:
        if writer_req.kind == KIND_AWAIT:
            set_pending(chat_id, True)
            await instance.bot.send(msg, WRITER_USAGE)
            return
        if writer_req.kind == KIND_RUN:
            set_pending(chat_id, False)
            if chat_id in instance.cancel_events:
                await instance.bot.send(
                    msg,
                    "⏳ I'm still working on your previous message. Send /cancel to abort.",
                )
                return
            instance.cancel_events[chat_id] = Event()
            try:
                await _run_writer_and_ask(instance, msg, writer_req.urls)
            finally:
                instance.cancel_events.pop(chat_id, None)
            return

    if is_pending(chat_id) and not urls:
        await instance.bot.send(msg, WRITER_USAGE)
        return

    # Optional MCP path: /mcp, /agent, mcp:
    mcp_request = parse_mcp_message(msg.text)
    if mcp_request is not None:
        if mcp_request.kind == KIND_HELP:
            await instance.bot.send(msg, MCP_HELP)
            return
        if mcp_request.kind == KIND_TOOLS:
            await instance.bot.send(msg, await format_mcp_status())
            return
        if chat_id in instance.cancel_events:
            await instance.bot.send(
                msg, "⏳ I'm still working on your previous message. Send /cancel to abort."
            )
            return
        cancel_event = Event()
        instance.cancel_events[chat_id] = cancel_event
        waiting = await instance.bot.send(msg)
        try:
            answer = await run_mcp_query(mcp_request.query)
            await instance.bot.edit(waiting, answer, replace=True, final=True)
        except Exception as e:
            print_exc()
            await telegram_report_issue(instance, msg, waiting, e)
        finally:
            instance.cancel_events.pop(chat_id, None)
        return

    await instance.bot.send(msg, COMMANDS_HELP)
    instance.log.sent(msg, timer)
    return


@handler
async def telegram_file(instance: AgenticBot, msg: Message) -> None:
    """Handle file/document uploads from users."""
    if not msg.from_user or not instance.agent.is_allowed(msg.from_user.id):
        return
    try:
        if msg.document:
            file_name = msg.document.file_name
            file_info = await instance.bot.core.get_file(msg.document.file_id)
            file_path = file_info.file_path
            file_size = str_size(file_info.file_size)
            msg.text = f"DOCUMENT ({file_size}): {file_name} = {file_path}"
            timer = instance.log.received(msg)
            await instance.managers["document"].notify(
                msg.chat.id,
                {"filename": file_name, "size": file_size, "path": file_path},
            )
            instance.log.sent(msg, timer)
    except Exception as e:
        if str(e).endswith("too big"):
            await instance.managers["document"].file_too_large(
                msg.chat.id, str(getattr(msg.document, "file_name", "unknown"))
            )
            instance.log.warning("File: too big. Redirected to Docs UI.")
        else:
            await telegram_report_issue(instance, msg, msg, e)
            instance.log.exception("File handling error")


@handler
async def telegram_voice(instance: AgenticBot, msg: Message) -> None:
    """Handle voice messages: attach audio as media and process through agent."""
    if not msg.from_user or not instance.agent.is_allowed(msg.from_user.id):
        return
    reply = None
    try:
        voice = msg.voice
        if not voice:
            return
        # Rate limiting: reject early before expensive download/transcription
        if msg.chat.id in instance.cancel_events:
            await instance.bot.send(
                msg,
                "⏳ I'm still working on your previous message. Send /cancel to abort.",
            )
            return
        # Claim the slot immediately to prevent concurrent runs.
        cancel_event = Event()
        instance.cancel_events[msg.chat.id] = cancel_event
        # Send "I'm listening..." immediately, before download/transcription
        init = instance.bot.reply if msg.chat.type != "private" else instance.bot.send
        reply = await init(msg, "🔊 I'm listening...")
        file_info = await instance.bot.core.get_file(voice.file_id)
        audio = await instance.bot.core.download_file(file_info.file_path)
        media = [{"type": "media", "data": audio, "mime_type": "audio/ogg"}]
        main = LLM.pick()
        if can_listen(main):
            msg.media = media  # ty: ignore[unresolved-attribute]
            msg.text = "🎤 [voice message]"
        else:
            transcription = await _media_to_text(media)
            msg.text = f"🎤 [voice message]: {transcription}"
        # Replace "I'm listening..." with "I'm thinking..." and set up edit cache
        await instance.bot.edit(reply, instance.bot.waiting, replace=True)
        instance.bot.edit_cache[reply.id] = {  # ty: ignore[unresolved-attribute]
            "current": 0,
            "content": [instance.bot.waiting],
        }
        # telegram_chat will claim the slot we already set; pass overwrite so
        # it skips the init() call and reuses our reply.
        instance.cancel_events.pop(msg.chat.id, None)
        await telegram_chat(instance, msg, overwrite=reply)
    except Exception as e:
        print_exc()
        await telegram_report_issue(instance, msg, reply or msg, e)
    finally:
        instance.cancel_events.pop(msg.chat.id, None)


# Media group accumulation: {media_group_id: {"images": [], "msg": Message}}
_media_groups: dict[str, dict] = {}


@handler
async def telegram_image(instance: AgenticBot, msg: Message) -> None:
    """Handle image/photo messages: attach images as media and process through agent."""
    if not msg.from_user or not instance.agent.is_allowed(msg.from_user.id):
        return
    reply = None
    try:
        if not msg.photo:
            return
        # Rate limiting: reject early before expensive download
        if msg.chat.id in instance.cancel_events:
            await instance.bot.send(
                msg,
                "⏳ I'm still working on your previous message. Send /cancel to abort.",
            )
            return
        is_album = bool(msg.media_group_id)
        if not is_album:
            # Send "I'm analyzing..." immediately, before download
            init = (
                instance.bot.reply if msg.chat.type != "private" else instance.bot.send
            )
            reply = await init(msg, "🔍 I'm analyzing...")
        # Download highest resolution
        photo = msg.photo[-1]
        file_info = await instance.bot.core.get_file(photo.file_id)
        img_bytes = await instance.bot.core.download_file(file_info.file_path)
        img_path = await _save_received_image(img_bytes)

        if is_album:
            # Album: accumulate images, debounce processing
            group_id = msg.media_group_id
            if group_id not in _media_groups:
                _media_groups[group_id] = {"images": [], "msg": msg, "reply": None}
            group = _media_groups[group_id]
            group["images"].append((img_bytes, img_path))
            my_count = len(group["images"])
            # First callback of the group sends "I'm analyzing..." once,
            # before the remaining images are debounced.
            if group["reply"] is None:
                init = (
                    instance.bot.reply
                    if msg.chat.type != "private"
                    else instance.bot.send
                )
                group["reply"] = await init(msg, "🔍 I'm analyzing...")
            # Wait briefly for more images in this group
            await sleep(1.0)
            # Only the last callback to arrive processes the group
            current = _media_groups.get(group_id)
            if not current or len(current["images"]) != my_count:
                return  # A newer callback arrived, let it handle processing
            data = _media_groups.pop(group_id)
            images = data["images"]
            album_msg = data["msg"]
            reply = data["reply"]
        else:
            images = [(img_bytes, img_path)]
            album_msg = msg

        caption = (album_msg.caption or "").strip()
        if caption:
            # Caption present: process immediately through agent.
            # Check rate limiting BEFORE storing pending media so we don't
            # leak orphaned images into pending_media if telegram_chat rejects.
            if album_msg.chat.id in instance.cancel_events:
                await instance.bot.edit(
                    reply,
                    "⏳ I'm still working on your previous message. Send /cancel to abort.",
                    replace=True,
                )
                return
            instance.pending_media.setdefault(album_msg.chat.id, []).extend(images)
            album_msg.text = caption
            # Replace "I'm analyzing..." with "I'm thinking..." and set up edit cache
            await instance.bot.edit(reply, instance.bot.waiting, replace=True)
            instance.bot.edit_cache[reply.id] = {  # ty: ignore[unresolved-attribute]
                "current": 0,
                "content": [instance.bot.waiting],
            }
            # telegram_chat will claim the slot; pass overwrite so it skips
            # the init() call and reuses our reply.
            await telegram_chat(instance, album_msg, overwrite=reply)
        else:
            # No caption: store as pending, wait for next text/voice
            instance.pending_media.setdefault(album_msg.chat.id, []).extend(images)
            timer = instance.log.received(album_msg)
            await instance.bot.edit(
                reply,
                "📷 Got it! Send a text or voice message with your instruction.",
                replace=True,
            )
            instance.log.sent(album_msg, timer)
    except Exception as e:
        if msg.media_group_id and msg.media_group_id in _media_groups:
            _media_groups.pop(msg.media_group_id, None)
        print_exc()
        await telegram_report_issue(instance, msg, reply or msg, e)
