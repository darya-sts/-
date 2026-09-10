"""Models for MarvinDeepSeekBot project_reader."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(slots=True)
class FileEntry:
    """Indexed file metadata."""

    path: str
    size: int
    mtime: float
    kind: str  # "text" | "binary" | "secret" | "skipped"
    preview: str = ""
    project: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class ProjectInfo:
    """Root project folder summary."""

    name: str
    root: str
    file_count: int = 0
    total_size: int = 0
    text_files: int = 0
    binary_files: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class ReadResult:
    """Safe file read outcome."""

    path: str
    content: str
    truncated: bool = False
    size: int = 0
    error: str | None = None
    parts: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class GrepHit:
    """One grep match."""

    path: str
    line_no: int
    line: str
