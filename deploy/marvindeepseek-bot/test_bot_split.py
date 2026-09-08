"""Unit tests for Telegram split helpers (no telegram/httpx required)."""
from __future__ import annotations
import ast
import pathlib
import re
import unittest

SRC = pathlib.Path(__file__).with_name("bot.py").read_text(encoding="utf-8")


def load_helpers():
    tree = ast.parse(SRC)
    wanted = {"split_telegram_message", "_split_block", "_hard_split", "format_telegram_parts"}
    ns = {"TELEGRAM_CHUNK_LIMIT": 3500, "re": re}
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name in wanted:
            exec(compile(ast.Module(body=[node], type_ignores=[]), "<bot>", "exec"), ns)
    return ns


class SplitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.h = load_helpers()

    def test_short(self):
        self.assertEqual(self.h["split_telegram_message"]("hi"), ["hi"])

    def test_long_never_drops(self):
        text = ("## H\n\n" + ("слово " * 80) + "\n\n") * 10
        chunks = self.h["split_telegram_message"](text, 3500)
        self.assertGreater(len(chunks), 1)
        joined = "\n\n".join(chunks)
        self.assertIn("## H", joined)
        for c in chunks:
            self.assertLessEqual(len(c), 3500)

    def test_no_hard_truncate_in_source(self):
        self.assertNotIn("answer[:3990]", SRC)
        self.assertIn("reply_long", SRC)

    def test_format_parts(self):
        parts = self.h["format_telegram_parts"](["aaa", "bbb"])
        self.assertTrue(parts[0].startswith("📌 Часть 1 из 2"))
        self.assertIn("✅ Конец ответа", parts[-1])


if __name__ == "__main__":
    unittest.main()
