"""Start menu: /start shows action buttons."""

from __future__ import annotations

START_PREFIX = "start:"

START_ACTIONS: dict[str, str] = {
    "start:ask": "Напишите ваш вопрос — отвечу с помощью DeepSeek.",
    "start:skills": (
        "Я чат-бот @suyuyu_bot. Отвечаю на вопросы через DeepSeek. "
        "Нажмите «Задать вопрос» или просто напишите сообщение."
    ),
}

START_BUTTONS: tuple[tuple[str, str], ...] = (
    ("Задать вопрос", "start:ask"),
    ("Что ты умеешь?", "start:skills"),
)


def is_start_command(text: str | None) -> bool:
    """True for /start and /help, including /start@botname."""
    if not text:
        return False
    cmd = text.strip().split()[0].partition("@")[0]
    return cmd in {"/start", "/help"}


def start_keyboard():
    from telebot.types import InlineKeyboardButton, InlineKeyboardMarkup

    markup = InlineKeyboardMarkup()
    for title, callback_data in START_BUTTONS:
        markup.add(InlineKeyboardButton(title, callback_data=callback_data))
    return markup


def action_reply(callback_data: str | None) -> str | None:
    if not callback_data:
        return None
    return START_ACTIONS.get(callback_data)
