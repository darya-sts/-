"""Tests for project_reader safety and filters."""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from project_reader.reader import read_file, resolve_under_root
from project_reader.scanner import is_secret_path, iter_files
from project_reader.indexer import ProjectIndexer


@pytest.fixture()
def sample_project(tmp_path: Path) -> Path:
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "main.py").write_text("print('hi')\n# secret=no\n", encoding="utf-8")
    (tmp_path / "README.md").write_text("# Demo\n", encoding="utf-8")
    (tmp_path / ".env").write_text("TOKEN=abc\n", encoding="utf-8")
    (tmp_path / "id_rsa").write_text("PRIVATE\n", encoding="utf-8")
    (tmp_path / "cert.pem").write_text("PEM\n", encoding="utf-8")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "pkg.js").write_text("ignored\n", encoding="utf-8")
    (tmp_path / ".venv").mkdir()
    (tmp_path / ".venv" / "x.py").write_text("ignored\n", encoding="utf-8")
    (tmp_path / "big.bin").write_bytes(b"\x00" * 100)
    # > 1MB text
    (tmp_path / "huge.txt").write_text("x" * (1_048_576 + 10), encoding="utf-8")
    (tmp_path / ".gitignore").write_text("ignored_dir/\n", encoding="utf-8")
    (tmp_path / "ignored_dir").mkdir()
    (tmp_path / "ignored_dir" / "nope.txt").write_text("nope\n", encoding="utf-8")
    return tmp_path


def test_secret_detection(sample_project: Path) -> None:
    assert is_secret_path(sample_project / ".env")
    assert is_secret_path(sample_project / "id_rsa")
    assert is_secret_path(sample_project / "cert.pem")
    assert not is_secret_path(sample_project / "README.md")


def test_iter_files_filters(sample_project: Path) -> None:
    entries = iter_files(sample_project)
    paths = {e.path: e for e in entries}
    assert "src/main.py" in paths
    assert paths["src/main.py"].kind == "text"
    assert "node_modules/pkg.js" not in paths
    assert ".venv/x.py" not in paths
    assert "ignored_dir/nope.txt" not in paths
    assert paths[".env"].kind == "secret"
    assert paths["huge.txt"].kind == "skipped"
    assert paths["big.bin"].kind == "binary"


def test_path_traversal_blocked(sample_project: Path) -> None:
    with pytest.raises(ValueError):
        resolve_under_root(sample_project, "../outside.txt")
    with pytest.raises(ValueError):
        resolve_under_root(sample_project, "src/../../etc/passwd")


def test_read_file_ok_and_secret(sample_project: Path) -> None:
    ok = asyncio.run(read_file(sample_project, "src/main.py", max_chars=4000))
    assert ok.error is None
    assert "print" in ok.content

    denied = asyncio.run(read_file(sample_project, ".env"))
    assert denied.error
    assert "секрет" in denied.error.lower() or "запрещ" in denied.error.lower()


def test_read_truncation(sample_project: Path) -> None:
    (sample_project / "long.txt").write_text("a" * 5000, encoding="utf-8")
    res = asyncio.run(read_file(sample_project, "long.txt", max_chars=4000))
    assert res.truncated is True
    assert len(res.content) == 4000
    assert len(res.parts) == 1  # already truncated to 4000 before chunking


def test_indexer_stats(sample_project: Path, tmp_path: Path) -> None:
    db = tmp_path / "index.db"
    # put db outside project to avoid scanning it oddly — indexer uses separate path
    idx = ProjectIndexer(db)
    info = idx.rebuild_project("demo", sample_project)
    assert info.file_count >= 2
    assert info.text_files >= 2
    top = idx.largest("demo", limit=5)
    assert top
    assert top[0].size >= top[-1].size
