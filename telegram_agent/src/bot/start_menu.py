"""Start menu: /start shows a single agent button."""

from __future__ import annotations

START_PREFIX = "start:"

COMMANDS_HELP = (
    "Чтобы запустить агента, отправьте команду:\n\n"
    "/writer_agent — написать пост в канал по ссылкам на статьи\n"
    "Пример:\n"
    "/writer_agent https://example.com/a https://example.com/b\n\n"
    "Можно несколько ссылок сразу или прислать их следующим сообщением. "
    "Готовый пост придёт вам на согласование. "
    "«Опубликовать» отправит его в канал."
)

START_ACTIONS: dict[str, str] = {
    "start:agent": COMMANDS_HELP,
}

START_BUTTONS: tuple[tuple[str, str], ...] = (
    ("Обратиться к агенту", "start:agent"),
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
