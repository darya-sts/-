"""Telegram chat bot backed by DeepSeek (Q&A only)."""

from __future__ import annotations

import logging
import os
import re
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

import httpx
from telegram import Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)
log = logging.getLogger("marvindeepseek")
# Avoid leaking bot token in httpx / telegram request URLs
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("telegram.ext.ExtBot").setLevel(logging.WARNING)

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"].strip()
DEEPSEEK_API_KEY = os.environ["DEEPSEEK_API_KEY"].strip()
DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com").rstrip("/")
DEEPSEEK_API_MODEL = os.getenv("DEEPSEEK_API_MODEL", "deepseek-chat").strip()
PORT = int(os.getenv("PORT", "8082"))
MAX_HISTORY = int(os.getenv("MAX_HISTORY", "12"))
# Leave room for part headers and Markdown parse-mode overhead.
TELEGRAM_CHUNK_LIMIT = int(os.getenv("TELEGRAM_CHUNK_LIMIT", "3500"))
DEFAULT_SYSTEM_PROMPT = """Ты — MarvinDeepSeekBot: универсальный помощник по ИИ-агентам, ИИ-сервисам и контент-фабрикам.
Правила:
1. Всегда отвечай ПОЛНЫМ текстом. Запрещено обрывать ответ на «Часть 1 из N», «продолжение следует» или «…».
2. Не имитируй разбиение сообщений Telegram — транспорт сам отправит несколько сообщений.
3. Сначала предпочитай open-source/бесплатные решения.
4. Отвечай на языке пользователя.
5. Для сложных тем используй заголовки, списки/таблицы и блоки кода.
6. Будь практичным и честным; не предлагай пиратство, взлом API или обход лицензий.
"""
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT).strip() or DEFAULT_SYSTEM_PROMPT

_raw_users = os.getenv("ALLOWED_USERS", "").strip()
ALLOWED_USERS = {int(x) for x in _raw_users.replace(";", ",").split(",") if x.strip().isdigit()}

# chat_id -> recent messages for context
_history: dict[int, deque] = defaultdict(lambda: deque(maxlen=MAX_HISTORY))


def _allowed(user_id: int | None) -> bool:
    if not ALLOWED_USERS:
        return True
    return user_id is not None and user_id in ALLOWED_USERS


def _hard_split(text: str, max_len: int) -> list[str]:
    return [text[i : i + max_len] for i in range(0, len(text), max_len)] or [""]


def _split_block(block: str, max_len: int) -> list[str]:
    if len(block) <= max_len:
        return [block]

    paragraphs = re.split(r"\n\n+", block)
    if len(paragraphs) > 1:
        out: list[str] = []
        current = ""
        for para in paragraphs:
            candidate = para if current == "" else f"{current}\n\n{para}"
            if len(candidate) <= max_len:
                current = candidate
            else:
                if current:
                    out.extend(_split_block(current, max_len))
                current = para
        if current:
            out.extend(_split_block(current, max_len))
        return out

    lines = block.split("\n")
    if len(lines) > 1:
        out: list[str] = []
        current = ""
        for line in lines:
            candidate = line if current == "" else f"{current}\n{line}"
            if len(candidate) <= max_len:
                current = candidate
            else:
                if current:
                    out.extend(_split_block(current, max_len))
                current = line
        if current:
            out.extend(_split_block(current, max_len))
        return out

    return _hard_split(block, max_len)


def split_telegram_message(text: str, max_len: int = TELEGRAM_CHUNK_LIMIT) -> list[str]:
    """Split text into Telegram-safe chunks without dropping content."""
    if len(text) <= max_len:
        return [text]
    return _split_block(text, max_len)


def format_telegram_parts(chunks: list[str]) -> list[str]:
    n = len(chunks)
    if n <= 1:
        return list(chunks)
    out: list[str] = []
    for i, chunk in enumerate(chunks, start=1):
        body = chunk
        if i == n:
            body = f"{chunk.rstrip()}\n\n✅ Конец ответа"
        # Reserve room for the header inside the hard Telegram limit.
        header = f"📌 Часть {i} из {n}\n"
        out.append(f"{header}{body}")
    return out


async def ask_deepseek(messages: list[dict[str, str]]) -> str:
    payload = {
        "model": DEEPSEEK_API_MODEL,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
        "temperature": 0.7,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{DEEPSEEK_API_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


async def reply_long(update: Update, text: str) -> None:
    """Send a full answer as one or more Telegram messages (never truncate)."""
    # Budget for part header so each final message stays under Telegram's 4096.
    header_budget = 40
    chunk_limit = max(512, min(TELEGRAM_CHUNK_LIMIT, 4096 - header_budget))
    parts = format_telegram_parts(split_telegram_message(text, chunk_limit))
    for i, part in enumerate(parts):
        if len(part) > 4096:
            # Absolute safety: hard-split only if somehow over limit.
            for sub in _hard_split(part, 4096):
                try:
                    await update.message.reply_text(sub, parse_mode=ParseMode.MARKDOWN)
                except Exception:
                    await update.message.reply_text(sub)
            continue
        try:
            await update.message.reply_text(part, parse_mode=ParseMode.MARKDOWN)
        except Exception:
            await update.message.reply_text(part)
        log.info("Sent Telegram part %s/%s (%s chars)", i + 1, len(parts), len(part))


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not _allowed(user.id if user else None):
        await update.message.reply_text("Доступ ограничен.")
        return
    chat_id = update.effective_chat.id
    _history[chat_id].clear()
    await update.message.reply_text(
        "Привет! Я MarvinDeepSeekBot.\n"
        "Пишите вопросы в этот чат — отвечу через DeepSeek.\n"
        "Команда /clear сбрасывает историю диалога."
    )


async def cmd_clear(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not _allowed(user.id if user else None):
        return
    _history[update.effective_chat.id].clear()
    await update.message.reply_text("История диалога очищена.")


async def on_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text:
        return
    user = update.effective_user
    if not _allowed(user.id if user else None):
        await update.message.reply_text("Доступ ограничен.")
        return

    chat_id = update.effective_chat.id
    text = update.message.text.strip()
    if not text:
        return

    await context.bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)
    hist = _history[chat_id]
    hist.append({"role": "user", "content": text})

    try:
        answer = await ask_deepseek(list(hist))
    except Exception:
        log.exception("DeepSeek request failed")
        hist.pop()  # drop failed user turn
        await update.message.reply_text(
            "Не удалось получить ответ от DeepSeek. Попробуйте ещё раз."
        )
        return

    hist.append({"role": "assistant", "content": answer})
    await reply_long(update, answer)


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") in ("", "/health"):
            body = b'{"status":"ok","service":"marvindeepseek-bot"}\n'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        log.debug("health: " + fmt, *args)


def start_health_server() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", PORT), HealthHandler)
    Thread(target=server.serve_forever, daemon=True).start()
    log.info("Health server on :%s", PORT)


def main() -> None:
    if not TELEGRAM_BOT_TOKEN or not DEEPSEEK_API_KEY:
        raise SystemExit("TELEGRAM_BOT_TOKEN and DEEPSEEK_API_KEY are required")
    start_health_server()
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("clear", cmd_clear))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))
    log.info(
        "Starting MarvinDeepSeekBot model=%s allowlist=%s chunk_limit=%s",
        DEEPSEEK_API_MODEL,
        sorted(ALLOWED_USERS) if ALLOWED_USERS else "open",
        TELEGRAM_CHUNK_LIMIT,
    )
    app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)


if __name__ == "__main__":
    main()
