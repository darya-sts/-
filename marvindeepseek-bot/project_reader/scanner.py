"""Directory scanner with .gitignore + safety filters."""

from __future__ import annotations

import logging
import mimetypes
import os
from pathlib import Path

import pathspec

from project_reader.models import FileEntry

log = logging.getLogger("marvindeepseek.project_reader.scanner")

DEFAULT_SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".next",
    "dist",
    "build",
    "coverage",
    ".turbo",
    ".cache",
    "out",
}

SECRET_NAME_PATTERNS = (
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    "credentials",
    "id_rsa",
    "id_ed25519",
    "id_dsa",
)

SECRET_SUFFIXES = (".pem", ".key", ".p12", ".pfx", ".jks")

BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".gz",
    ".tar",
    ".7z",
    ".rar",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot",
    ".mp3",
    ".mp4",
    ".wav",
    ".ogg",
    ".webm",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".bin",
    ".pyc",
    ".pyo",
    ".class",
    ".o",
    ".a",
    ".sqlite",
    ".db",
    ".lock",
}

TEXT_EXTENSIONS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".md",
    ".txt",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".cfg",
    ".css",
    ".scss",
    ".html",
    ".htm",
    ".xml",
    ".svg",
    ".sh",
    ".bash",
    ".zsh",
    ".sql",
    ".env.example",
    ".gitignore",
    ".dockerignore",
    ".editorconfig",
    ".rs",
    ".go",
    ".java",
    ".kt",
    ".c",
    ".h",
    ".cpp",
    ".hpp",
    ".rb",
    ".php",
    ".cs",
    ".swift",
    ".dockerfile",
}


def is_secret_path(path: Path) -> bool:
    name = path.name.lower()
    if name in SECRET_NAME_PATTERNS or name.startswith(".env"):
        return True
    if any(name.startswith(p) for p in ("id_rsa", "id_ed25519", "id_dsa", "credentials")):
        return True
    if name.endswith(SECRET_SUFFIXES):
        return True
    if "credentials" in name:
        return True
    return False


def is_probably_binary(path: Path, sample: bytes | None = None) -> bool:
    ext = path.suffix.lower()
    if ext in BINARY_EXTENSIONS:
        return True
    if ext in TEXT_EXTENSIONS or path.name.lower() in {
        "dockerfile",
        "makefile",
        "license",
        "readme",
        "gemfile",
        "procfile",
    }:
        return False
    mime, _ = mimetypes.guess_type(str(path))
    if mime and mime.startswith("text/"):
        return False
    if sample is None:
        try:
            with path.open("rb") as fh:
                sample = fh.read(2048)
        except OSError:
            return True
    if b"\x00" in sample:
        return True
    try:
        sample.decode("utf-8")
        return False
    except UnicodeDecodeError:
        return True


def load_gitignore(root: Path) -> pathspec.PathSpec | None:
    gi = root / ".gitignore"
    if not gi.is_file():
        return None
    try:
        lines = gi.read_text(encoding="utf-8", errors="ignore").splitlines()
        return pathspec.PathSpec.from_lines("gitwildmatch", lines)
    except OSError as exc:
        log.warning("cannot read .gitignore in %s: %s", root, exc)
        return None


def iter_files(
    root: Path,
    *,
    max_file_bytes: int = 1_048_576,
    skip_dirs: set[str] | None = None,
    preview_chars: int = 200,
) -> list[FileEntry]:
    """Walk `root` and return FileEntry list (secrets marked, large/binary skipped)."""
    root = root.resolve()
    skip = set(DEFAULT_SKIP_DIRS) | (skip_dirs or set())
    spec = load_gitignore(root)
    entries: list[FileEntry] = []

    for dirpath, dirnames, filenames in os.walk(root):
        # prune dirs in-place
        dirnames[:] = [d for d in dirnames if d not in skip and not d.startswith(".venv")]
        current = Path(dirpath)
        for name in filenames:
            path = current / name
            try:
                rel = path.relative_to(root).as_posix()
            except ValueError:
                continue
            if spec is not None and spec.match_file(rel):
                continue
            if is_secret_path(path):
                entries.append(
                    FileEntry(
                        path=rel,
                        size=0,
                        mtime=0.0,
                        kind="secret",
                        preview="",
                    )
                )
                continue
            try:
                st = path.stat()
            except OSError:
                continue
            if st.st_size > max_file_bytes:
                entries.append(
                    FileEntry(
                        path=rel,
                        size=st.st_size,
                        mtime=st.st_mtime,
                        kind="skipped",
                        preview=f"> {max_file_bytes} bytes",
                    )
                )
                continue
            try:
                sample = path.read_bytes()[:4096]
            except OSError:
                continue
            if is_probably_binary(path, sample):
                entries.append(
                    FileEntry(
                        path=rel,
                        size=st.st_size,
                        mtime=st.st_mtime,
                        kind="binary",
                    )
                )
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            entries.append(
                FileEntry(
                    path=rel,
                    size=st.st_size,
                    mtime=st.st_mtime,
                    kind="text",
                    preview=text[:preview_chars],
                )
            )
    return entries
