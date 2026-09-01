"""Writer agent: article URLs → Telegram channel post draft."""

from __future__ import annotations

import os
import re
import uuid
from typing import Any

KIND_HELP = "help"
KIND_AWAIT = "await"
KIND_RUN = "run"

WRITER_COMMANDS = {"/writer_agent", "/writer"}
CALLBACK_PREFIX = "writer:"
MAX_URLS = 8

_URL_RE = re.compile(r"https?://[^\s<>\"')\]]+", re.I)

WRITER_USAGE = (
    "Агент /writer_agent пишет пост для канала по статьям.\n\n"
    "Пришлите одну или несколько ссылок — в этом сообщении или следующим:\n"
    "/writer_agent https://example.com/a https://example.com/b"
)

_pending_chats: set[int] = set()
_drafts: dict[str, dict[str, Any]] = {}


class WriterRequest:
    def __init__(self, kind: str, urls: list[str] | None = None) -> None:
        self.kind = kind
        self.urls = urls or []


def extract_urls(text: str | None) -> list[str]:
    """Unique http(s) URLs, trailing punctuation stripped."""
    if not text:
        return []
    found: list[str] = []
    seen: set[str] = set()
    for raw in _URL_RE.findall(text):
        url = raw.rstrip(").,;]")
        if url in seen:
            continue
        seen.add(url)
        found.append(url)
        if len(found) >= MAX_URLS:
            break
    return found


def parse_writer_message(text: str | None) -> WriterRequest | None:
    """Detect /writer_agent. None means this is not the writer command."""
    if not text:
        return None
    raw = text.strip()
    first, _, rest = raw.partition(" ")
    cmd = first.partition("@")[0].lower()
    if cmd not in WRITER_COMMANDS:
        return None
    urls = extract_urls(raw)
    if urls:
        return WriterRequest(KIND_RUN, urls)
    return WriterRequest(KIND_AWAIT)


def set_pending(chat_id: int, pending: bool) -> None:
    if pending:
        _pending_chats.add(chat_id)
    else:
        _pending_chats.discard(chat_id)


def is_pending(chat_id: int) -> bool:
    return chat_id in _pending_chats


def save_draft(*, user_id: int, text: str, urls: list[str]) -> str:
    draft_id = uuid.uuid4().hex[:8]
    _drafts[draft_id] = {"user_id": user_id, "text": text, "urls": list(urls)}
    return draft_id


def pop_draft(draft_id: str) -> dict[str, Any] | None:
    return _drafts.pop(draft_id, None)


def get_draft(draft_id: str) -> dict[str, Any] | None:
    return _drafts.get(draft_id)


def parse_writer_callback(data: str | None) -> tuple[str, str] | None:
    """Return (action, draft_id) for writer:ok:id / writer:no:id."""
    if not data or not data.startswith(CALLBACK_PREFIX):
        return None
    parts = data.split(":", 2)
    if len(parts) != 3 or parts[0] != "writer" or parts[1] not in {"ok", "no"}:
        return None
    return parts[1], parts[2]


def channel_chat_id() -> str | int | None:
    raw = (os.getenv("TELEGRAM_CHANNEL_ID") or os.getenv("TELEGRAM_CHANNEL") or "").strip()
    if not raw:
        return None
    if raw.startswith("@"):
        return raw
    if raw.lstrip("-").isdigit():
        return int(raw)
    return f"@{raw}" if not raw.startswith("-") else raw


def run_process_articles(urls: list[str]) -> tuple[str, list[str]]:
    """Load mcp_servers/deepseek_article.py and write one post from URLs."""
    import sys
    from pathlib import Path

    root = Path(__file__).resolve().parents[3]
    mcp_dir = str(root / "mcp_servers")
    if mcp_dir not in sys.path:
        sys.path.insert(0, mcp_dir)
    from deepseek_article import process_articles

    return process_articles(urls)


def approval_keyboard(draft_id: str):
    from telebot.types import InlineKeyboardButton, InlineKeyboardMarkup

    markup = InlineKeyboardMarkup()
    markup.add(
        InlineKeyboardButton("Опубликовать", callback_data=f"writer:ok:{draft_id}"),
        InlineKeyboardButton("Отклонить", callback_data=f"writer:no:{draft_id}"),
    )
    return markup
