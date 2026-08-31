import os
import sys

import pytest
from telegram import InlineKeyboardButton

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bot import (  # noqa: E402
    BUTTON_NO,
    BUTTON_YES,
    get_token,
    on_button,
    reply_for_choice,
    start,
    start_keyboard,
)


def test_yes_replies_hello() -> None:
    assert reply_for_choice("да") == "привет"


def test_no_replies_bye() -> None:
    assert reply_for_choice("нет") == "пока"


def test_unknown_choice_is_ignored() -> None:
    assert reply_for_choice("maybe") is None


def test_start_keyboard_has_yes_and_no() -> None:
    markup = start_keyboard()
    buttons = markup.inline_keyboard[0]
    assert [button.text for button in buttons] == [BUTTON_YES, BUTTON_NO]
    assert all(isinstance(button, InlineKeyboardButton) for button in buttons)
    assert [button.callback_data for button in buttons] == [BUTTON_YES, BUTTON_NO]


def test_get_token_reads_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "  test-token  ")
    assert get_token() == "test-token"


def test_get_token_exits_when_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    with pytest.raises(SystemExit) as exc:
        get_token()
    assert exc.value.code == 1


class FakeMessage:
    def __init__(self) -> None:
        self.replies: list[tuple[str, object]] = []

    async def reply_text(self, text: str, reply_markup=None) -> None:
        self.replies.append((text, reply_markup))


class FakeUpdate:
    def __init__(self, message=None, callback_query=None) -> None:
        self.message = message
        self.callback_query = callback_query


class FakeCallbackQuery:
    def __init__(self, data: str, message: FakeMessage) -> None:
        self.data = data
        self.message = message
        self.answered = False

    async def answer(self) -> None:
        self.answered = True


@pytest.mark.asyncio
async def test_start_sends_buttons() -> None:
    message = FakeMessage()
    await start(FakeUpdate(message=message), None)  # type: ignore[arg-type]
    assert len(message.replies) == 1
    text, markup = message.replies[0]
    assert text == "Выберите:"
    assert [btn.text for btn in markup.inline_keyboard[0]] == ["да", "нет"]


@pytest.mark.asyncio
async def test_yes_button_sends_hello() -> None:
    message = FakeMessage()
    query = FakeCallbackQuery("да", message)
    await on_button(FakeUpdate(callback_query=query), None)  # type: ignore[arg-type]
    assert query.answered is True
    assert message.replies == [("привет", None)]


@pytest.mark.asyncio
async def test_no_button_sends_bye() -> None:
    message = FakeMessage()
    query = FakeCallbackQuery("нет", message)
    await on_button(FakeUpdate(callback_query=query), None)  # type: ignore[arg-type]
    assert query.answered is True
    assert message.replies == [("пока", None)]
