"""Простой Telegram-бот: /start показывает кнопки «да» и «нет»."""

from __future__ import annotations

import logging
import os
import sys

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
    application = Application.builder().token(get_token()).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(on_button))
    logger.info("Бот запущен")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
