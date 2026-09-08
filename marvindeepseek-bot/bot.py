"""Telegram chat bot backed by DeepSeek (Q&A only)."""

from __future__ import annotations

import logging
import os
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

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"].strip()
DEEPSEEK_API_KEY = os.environ["DEEPSEEK_API_KEY"].strip()
DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com").rstrip("/")
DEEPSEEK_API_MODEL = os.getenv("DEEPSEEK_API_MODEL", "deepseek-chat").strip()
PORT = int(os.getenv("PORT", "8082"))
MAX_HISTORY = int(os.getenv("MAX_HISTORY", "12"))
SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT",
    "You are MarvinDeepSeekBot, a helpful assistant. "
    "Answer clearly and concisely in the user's language.",
)

_raw_users = os.getenv("ALLOWED_USERS", "").strip()
ALLOWED_USERS = {int(x) for x in _raw_users.replace(";", ",").split(",") if x.strip().isdigit()}

# chat_id -> recent messages for context
_history: dict[int, deque] = defaultdict(lambda: deque(maxlen=MAX_HISTORY))


def _allowed(user_id: int | None) -> bool:
    if not ALLOWED_USERS:
        return True
    return user_id is not None and user_id in ALLOWED_USERS


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
    # Telegram hard limit ~4096; keep margin
    if len(answer) > 4000:
        answer = answer[:3990] + "…"
    try:
        await update.message.reply_text(answer, parse_mode=ParseMode.MARKDOWN)
    except Exception:
        await update.message.reply_text(answer)


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
        "Starting MarvinDeepSeekBot model=%s allowlist=%s",
        DEEPSEEK_API_MODEL,
        sorted(ALLOWED_USERS) if ALLOWED_USERS else "open",
    )
    app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)


if __name__ == "__main__":
    main()
