"""Allowlist of Telegram users who may talk to the bot."""

from __future__ import annotations

import os
from pathlib import Path


def _config_dir() -> Path:
    return Path(os.environ.get("CONFIG_DIR") or os.environ.get("CONFIG") or "./config")


def normalize_entry(entry: str) -> str:
    """Normalize an ID or @username. Empty / comments become ''."""
    value = entry.strip()
    if not value or value.startswith("#"):
        return ""
    if value.startswith("@"):
        return value[1:].lower()
    return value.lower() if not value.isdigit() else value


def _entries_from_text(text: str) -> set[str]:
    return {norm for line in text.splitlines() if (norm := normalize_entry(line))}


def load_allowlist(path: Path | None = None) -> set[str]:
    """Load allowed IDs/usernames from file and optional ALLOWED_USERS env."""
    allowlist: set[str] = set()
    file_path = path or (_config_dir() / "allowed_users.txt")
    if file_path.is_file():
        allowlist.update(_entries_from_text(file_path.read_text(encoding="utf-8")))
    extra = os.environ.get("ALLOWED_USERS", "")
    if extra:
        allowlist.update(_entries_from_text(extra.replace(",", "\n")))
    return allowlist


def is_user_allowed(user_id: int | str | None, username: str | None = None) -> bool:
    """True only if the numeric ID or @username is on the allowlist."""
    allowlist = load_allowlist()
    if not allowlist:
        return False
    if user_id is not None and str(user_id) in allowlist:
        return True
    if username:
        name = username.lstrip("@").lower()
        if name and name in allowlist:
            return True
    return False
