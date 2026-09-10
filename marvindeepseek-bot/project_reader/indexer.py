"""Project index builder (SQLite)."""

from __future__ import annotations

import logging
import sqlite3
import time
from pathlib import Path

from project_reader.models import FileEntry, ProjectInfo
from project_reader.scanner import iter_files

log = logging.getLogger("marvindeepseek.project_reader.indexer")

SCHEMA = """
CREATE TABLE IF NOT EXISTS files (
    project TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    mtime REAL NOT NULL,
    kind TEXT NOT NULL,
    preview TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (project, path)
);
CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_files_kind ON files(kind);
CREATE INDEX IF NOT EXISTS idx_files_size ON files(size DESC);
"""


class ProjectIndexer:
    def __init__(self, db_path: Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(SCHEMA)

    def rebuild_project(
        self, name: str, root: Path, *, max_file_bytes: int = 1_048_576
    ) -> ProjectInfo:
        root = root.resolve()
        entries = iter_files(root, max_file_bytes=max_file_bytes)
        rows = [
            (name, e.path, e.size, e.mtime, e.kind, e.preview if e.kind != "secret" else "")
            for e in entries
        ]
        with self._connect() as conn:
            conn.execute("DELETE FROM files WHERE project = ?", (name,))
            conn.executemany(
                "INSERT INTO files(project, path, size, mtime, kind, preview) VALUES (?,?,?,?,?,?)",
                rows,
            )
            conn.execute(
                "INSERT INTO meta(key, value) VALUES(?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (f"built_at:{name}", str(time.time())),
            )
        info = self.project_info(name, root)
        log.info(
            "indexed project=%s files=%s size=%s",
            name,
            info.file_count,
            info.total_size,
        )
        return info

    def project_info(self, name: str, root: Path | None = None) -> ProjectInfo:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT kind, COUNT(*) AS c, COALESCE(SUM(size),0) AS s "
                "FROM files WHERE project=? GROUP BY kind",
                (name,),
            ).fetchall()
        file_count = 0
        total_size = 0
        text_files = 0
        binary_files = 0
        for row in rows:
            kind = row["kind"]
            c = int(row["c"])
            s = int(row["s"])
            if kind == "secret":
                continue
            file_count += c
            total_size += s
            if kind == "text":
                text_files += c
            elif kind == "binary":
                binary_files += c
        return ProjectInfo(
            name=name,
            root=str(root) if root else name,
            file_count=file_count,
            total_size=total_size,
            text_files=text_files,
            binary_files=binary_files,
        )

    def list_entries(self, project: str, *, kind: str | None = None) -> list[FileEntry]:
        q = "SELECT path, size, mtime, kind, preview FROM files WHERE project=?"
        args: list[object] = [project]
        if kind:
            q += " AND kind=?"
            args.append(kind)
        q += " ORDER BY path"
        with self._connect() as conn:
            rows = conn.execute(q, args).fetchall()
        return [
            FileEntry(
                path=r["path"],
                size=r["size"],
                mtime=r["mtime"],
                kind=r["kind"],
                preview=r["preview"],
                project=project,
            )
            for r in rows
        ]

    def largest(self, project: str, limit: int = 10) -> list[FileEntry]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT path, size, mtime, kind, preview FROM files "
                "WHERE project=? AND kind != 'secret' ORDER BY size DESC LIMIT ?",
                (project, limit),
            ).fetchall()
        return [
            FileEntry(
                path=r["path"],
                size=r["size"],
                mtime=r["mtime"],
                kind=r["kind"],
                preview=r["preview"],
                project=project,
            )
            for r in rows
        ]
