"""Allowlist of Telegram user IDs who may talk to the bot."""

from __future__ import annotations

import os
from pathlib import Path


def _config_dir() -> Path:
    return Path(os.environ.get("CONFIG_DIR") or os.environ.get("CONFIG") or "./config")


def normalize_entry(entry: str) -> str:
    """Keep only a numeric Telegram ID. Comments and other text become ''."""
    value = entry.strip()
    if not value or value.startswith("#"):
        return ""
    return value if value.isdigit() else ""


def _entries_from_text(text: str) -> set[str]:
    return {norm for line in text.splitlines() if (norm := normalize_entry(line))}


def load_allowlist(path: Path | None = None) -> set[str]:
    """Load allowed numeric IDs from file and optional ALLOWED_USERS env."""
    allowlist: set[str] = set()
    file_path = path or (_config_dir() / "allowed_users.txt")
    if file_path.is_file():
        allowlist.update(_entries_from_text(file_path.read_text(encoding="utf-8")))
    extra = os.environ.get("ALLOWED_USERS", "")
    if extra:
        allowlist.update(_entries_from_text(extra.replace(",", "\n")))
    return allowlist


def is_user_allowed(user_id: int | str | None) -> bool:
    """True only if the numeric Telegram ID is on the allowlist."""
    allowlist = load_allowlist()
    if not allowlist or user_id is None:
        return False
    return str(user_id) in allowlist
