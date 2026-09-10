"""Safe path-resolved file reader and helpers."""

from __future__ import annotations

import logging
import re
from pathlib import Path

import aiofiles

from project_reader.models import GrepHit, ReadResult
from project_reader.scanner import DEFAULT_SKIP_DIRS, is_secret_path, iter_files

log = logging.getLogger("marvindeepseek.project_reader.reader")
READER_LOG = logging.getLogger("marvindeepseek.reader_audit")


def resolve_under_root(root: Path, rel_path: str) -> Path:
    """Resolve relative path under root; raise ValueError on traversal / escape."""
    root = root.resolve()
    cleaned = rel_path.replace("\\", "/").lstrip("/")
    if cleaned in ("", "."):
        raise ValueError("Путь к файлу пуст.")
    if ".." in Path(cleaned).parts:
        raise ValueError("Path traversal запрещён.")
    candidate = (root / cleaned).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise ValueError("Путь вне разрешённого корня.") from exc
    return candidate


def chunk_text(text: str, limit: int = 4000) -> list[str]:
    if len(text) <= limit:
        return [text]
    parts: list[str] = []
    start = 0
    while start < len(text):
        parts.append(text[start : start + limit])
        start += limit
    return parts


async def read_file(
    root: Path,
    rel_path: str,
    *,
    max_chars: int = 4000,
    user_id: int | None = None,
) -> ReadResult:
    try:
        path = resolve_under_root(root, rel_path)
    except ValueError as exc:
        READER_LOG.warning("deny user=%s path=%s reason=%s", user_id, rel_path, exc)
        return ReadResult(path=rel_path, content="", error=str(exc))

    if is_secret_path(path):
        READER_LOG.warning("deny-secret user=%s path=%s", user_id, rel_path)
        return ReadResult(path=rel_path, content="", error="Чтение секретных файлов запрещено.")

    if not path.is_file():
        return ReadResult(path=rel_path, content="", error="Файл не найден.")

    size = path.stat().st_size
    if size > 1_048_576:
        return ReadResult(
            path=rel_path,
            content="",
            size=size,
            error="Файл больше 1 МБ — чтение через /cat запрещено.",
        )

    try:
        async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as fh:
            content = await fh.read()
    except OSError as exc:
        return ReadResult(path=rel_path, content="", size=size, error=f"Ошибка чтения: {exc}")

    truncated = len(content) > max_chars
    body = content[:max_chars] if truncated else content
    parts = chunk_text(body, max_chars)
    READER_LOG.info(
        "read user=%s path=%s size=%s truncated=%s", user_id, rel_path, size, truncated
    )
    return ReadResult(
        path=rel_path,
        content=body,
        truncated=truncated,
        size=size,
        parts=parts,
    )


def build_tree(root: Path, *, depth: int = 2, max_entries: int = 400) -> str:
    root = root.resolve()
    lines: list[str] = [f"{root.name}/"]
    count = 0

    def walk(current: Path, prefix: str, level: int) -> None:
        nonlocal count
        if level > depth or count >= max_entries:
            return
        try:
            children = sorted(
                current.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())
            )
        except OSError:
            return
        visible = []
        for child in children:
            if child.name in DEFAULT_SKIP_DIRS:
                continue
            if child.is_file() and is_secret_path(child):
                continue
            visible.append(child)
        for i, child in enumerate(visible):
            if count >= max_entries:
                lines.append(prefix + "…")
                return
            last = i == len(visible) - 1
            branch = "└── " if last else "├── "
            suffix = "/" if child.is_dir() else ""
            lines.append(f"{prefix}{branch}{child.name}{suffix}")
            count += 1
            if child.is_dir():
                extension = "    " if last else "│   "
                walk(child, prefix + extension, level + 1)

    walk(root, "", 1)
    return "\n".join(lines)


async def grep_project(
    root: Path,
    pattern: str,
    *,
    max_hits: int = 30,
    user_id: int | None = None,
) -> list[GrepHit]:
    try:
        rx = re.compile(pattern)
    except re.error as exc:
        raise ValueError(f"Некорректный regex: {exc}") from exc

    hits: list[GrepHit] = []
    entries = iter_files(root)
    for entry in entries:
        if entry.kind != "text":
            continue
        try:
            path = resolve_under_root(root, entry.path)
        except ValueError:
            continue
        if is_secret_path(path):
            continue
        try:
            async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as fh:
                lines = await fh.readlines()
        except OSError:
            continue
        for i, line in enumerate(lines, start=1):
            if rx.search(line):
                hits.append(
                    GrepHit(path=entry.path, line_no=i, line=line.rstrip()[:240])
                )
                if len(hits) >= max_hits:
                    READER_LOG.info(
                        "grep user=%s pattern=%s hits=%s (limit)",
                        user_id,
                        pattern,
                        len(hits),
                    )
                    return hits
    READER_LOG.info("grep user=%s pattern=%s hits=%s", user_id, pattern, len(hits))
    return hits
