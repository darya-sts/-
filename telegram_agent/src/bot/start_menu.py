"""Start menu: /start shows action buttons."""

from __future__ import annotations

START_PREFIX = "start:"

START_ACTIONS: dict[str, str] = {
    "start:ask": "Напишите ваш вопрос — отвечу с помощью DeepSeek.",
    "start:skills": (
        "Я чат-бот @suyuyu_bot. Обычные сообщения отвечает DeepSeek. "
        "Статью в пост: «обработай статью https://… и напиши пост» "
        "или /mcp. Timeweb Cloud: /mcp-tools, нужен TIMEWEB_TOKEN."
    ),
    "start:mcp": (
        "MCP: /mcp запрос, /mcp-tools, или «обработай статью URL и напиши пост». "
        "Есть process_article (DeepSeek) и инструменты Timeweb Cloud. "
        "Обычный чат по-прежнему идёт через DeepSeek."
    ),
}

START_BUTTONS: tuple[tuple[str, str], ...] = (
    ("Задать вопрос", "start:ask"),
    ("Что ты умеешь?", "start:skills"),
    ("MCP-агент", "start:mcp"),
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
