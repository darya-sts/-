"""Простой Telegram-бот: /start показывает кнопки «да» и «нет»."""

from __future__ import annotations

import logging
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BUTTON_YES = "да"
BUTTON_NO = "нет"


def reply_for_choice(choice: str) -> str | None:
    """Вернуть текст ответа бота для нажатой кнопки."""
    if choice == BUTTON_YES:
        return "привет"
    if choice == BUTTON_NO:
        return "пока"
    return None


def start_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(BUTTON_YES, callback_data=BUTTON_YES),
                InlineKeyboardButton(BUTTON_NO, callback_data=BUTTON_NO),
            ]
        ]
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    await update.message.reply_text("Выберите:", reply_markup=start_keyboard())


async def on_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None or query.message is None:
        return
    await query.answer()
    text = reply_for_choice(query.data or "")
    if text is None:
        return
    await query.message.reply_text(text)


def health_port() -> int:
    return int(os.environ.get("PORT", "8080"))


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, format: str, *args) -> None:
        return


def start_health_server(port: int | None = None) -> HTTPServer:
    """HTTP-эндпоинт для health-check и прокси Timeweb Apps."""
    listen_port = health_port() if port is None else port
    server = HTTPServer(("0.0.0.0", listen_port), HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info("Health-check сервер слушает порт %s", listen_port)
    return server


def get_token() -> str:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        print(
            "Не задан TELEGRAM_BOT_TOKEN. "
            "Установите переменную окружения с токеном бота от @BotFather.",
            file=sys.stderr,
        )
        sys.exit(1)
    return token


def main() -> None:
    token = get_token()
    start_health_server()
    application = Application.builder().token(token).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(on_button))
    logger.info("Бот запущен")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
