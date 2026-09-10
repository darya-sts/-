"""Project filesystem reader for MarvinDeepSeekBot."""

from __future__ import annotations

from project_reader.indexer import ProjectIndexer
from project_reader.models import FileEntry, GrepHit, ProjectInfo, ReadResult
from project_reader.reader import build_tree, grep_project, read_file, resolve_under_root
from project_reader.scanner import is_secret_path, iter_files

__all__ = [
    "FileEntry",
    "GrepHit",
    "ProjectIndexer",
    "ProjectInfo",
    "ReadResult",
    "build_tree",
    "grep_project",
    "is_secret_path",
    "iter_files",
    "read_file",
    "resolve_under_root",
]
