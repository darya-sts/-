"""Service facade: discover projects under ALLOWED_ROOTS and serve reader ops."""

from __future__ import annotations

import logging
from pathlib import Path

from config import (
    ALLOWED_ROOTS,
    INDEX_DB_PATH,
    PROJECT_READER_MAX_CHARS,
    PROJECT_READER_MAX_FILE_BYTES,
)
from project_reader.indexer import ProjectIndexer
from project_reader.models import ProjectInfo, ReadResult
from project_reader.reader import build_tree, grep_project, read_file

log = logging.getLogger("marvindeepseek.project_reader.service")

_indexer: ProjectIndexer | None = None


def get_indexer() -> ProjectIndexer:
    global _indexer
    if _indexer is None:
        _indexer = ProjectIndexer(INDEX_DB_PATH)
    return _indexer


def discover_projects() -> dict[str, Path]:
    """Map project name -> absolute root.

    Each immediate child directory of every ALLOWED_ROOT is a project.
    If a root itself looks like a single project (has files at top), include it too.
    """
    projects: dict[str, Path] = {}
    for root in ALLOWED_ROOTS:
        if not root.is_dir():
            log.warning("allowed root missing: %s", root)
            continue
        # include root itself under its name
        root_name = root.name or "workspace"
        projects[root_name] = root
        try:
            children = sorted([p for p in root.iterdir() if p.is_dir()], key=lambda p: p.name.lower())
        except OSError:
            continue
        for child in children:
            if child.name.startswith(".") and child.name not in {".cursor"}:
                continue
            if child.name in {"node_modules", ".venv", "venv", "__pycache__"}:
                continue
            # prefer unique names; on collision prefix with parent
            name = child.name
            if name in projects and projects[name] != child.resolve():
                name = f"{root.name}__{child.name}"
            projects[name] = child.resolve()
    return projects


def resolve_project(name: str) -> Path | None:
    projects = discover_projects()
    if name in projects:
        return projects[name]
    # case-insensitive
    lower = {k.lower(): v for k, v in projects.items()}
    return lower.get(name.lower())


def ensure_indexed(name: str, root: Path) -> ProjectInfo:
    return get_indexer().rebuild_project(
        name, root, max_file_bytes=PROJECT_READER_MAX_FILE_BYTES
    )


def list_projects_info() -> list[ProjectInfo]:
    out: list[ProjectInfo] = []
    for name, root in discover_projects().items():
        info = ensure_indexed(name, root)
        out.append(info)
    return sorted(out, key=lambda p: p.name.lower())


def format_size(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    if n < 1024 * 1024:
        return f"{n / 1024:.1f} KB"
    return f"{n / (1024 * 1024):.1f} MB"


async def cat_file(project: str, rel_path: str, user_id: int | None) -> ReadResult:
    root = resolve_project(project)
    if root is None:
        return ReadResult(path=rel_path, content="", error=f"Проект «{project}» не найден.")
    return await read_file(
        root,
        rel_path,
        max_chars=PROJECT_READER_MAX_CHARS,
        user_id=user_id,
    )
