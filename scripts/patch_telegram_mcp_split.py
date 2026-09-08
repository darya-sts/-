#!/usr/bin/env python3
"""Patch installed cursor-telegram-mcp so chunking reserves room for (i/N) prefixes.

Root cause of partial Telegram answers when using MarvinDeepSeekBot rules:
the model was told to self-split and often stopped after "Part 1". That prompt
bug is fixed in marvindeepseek_rules.md. This patch hardens the transport:
DEFAULT_MAX becomes 3500 and send() reserves prefix length before HARD_CLAMP.
"""

from __future__ import annotations

import pathlib
import re
import sys

MARK_BEGIN = "/* MARVIN_TG_SPLIT_PATCH_BEGIN */"
MARK_END = "/* MARVIN_TG_SPLIT_PATCH_END */"


def find_package_roots() -> list[pathlib.Path]:
    roots: list[pathlib.Path] = []
    home = pathlib.Path.home()
    candidates = [
        home / ".npm" / "_npx",
        home / ".local" / "lib" / "node_modules",
        pathlib.Path("/usr/lib/node_modules"),
        pathlib.Path("/usr/local/lib/node_modules"),
    ]
    # npx cache layout varies; search for splitMessage.js
    for base in candidates:
        if not base.exists():
            continue
        for path in base.rglob("cursor-telegram-mcp*/**/dist/splitMessage.js"):
            roots.append(path.parent.parent)
        for path in base.rglob("package/dist/splitMessage.js"):
            # npm pack style
            if (path.parent.parent / "package.json").exists():
                roots.append(path.parent.parent)
    # Also check node resolution via npm root -g if available
    return list(dict.fromkeys(roots))


def patch_split_message(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "SAFE_CHUNK_LIMIT = 3500" in text or "MARVIN_TG_SPLIT" in text:
        return False
    new = text.replace(
        "const DEFAULT_MAX = 4000;",
        "const DEFAULT_MAX = 3500; // patched: leave room for (i/N) prefix + HARD_CLAMP",
    )
    if new == text:
        raise RuntimeError(f"Could not find DEFAULT_MAX in {path}")
    path.write_text(new, encoding="utf-8")
    return True


def patch_worker_send(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if MARK_BEGIN in text:
        return False
    pattern = re.compile(
        r"async function send\(text\) \{.*?return undefined;\n        \}\n    \}",
        re.S,
    )
    replacement = '''async function send(text) {
        const plain = toPlainTelegram(text);
        /* MARVIN_TG_SPLIT_PATCH_BEGIN */
        // Reserve space for "(i/N)\\n" so chunks never hit HARD_CLAMP truncation.
        const prefixBudget = 16;
        const chunkLimit = Math.min(3500, HARD_CLAMP - prefixBudget);
        const chunks = splitMessage(plain, chunkLimit);
        /* MARVIN_TG_SPLIT_PATCH_END */
        let firstId;
        try {
            for (let i = 0; i < chunks.length; i++) {
                let chunk = chunks[i];
                if (chunks.length > 1) {
                    chunk = `(${i + 1}/${chunks.length})\\n${chunk}`;
                }
                if (chunk.length > HARD_CLAMP) {
                    chunk = chunk.slice(0, HARD_CLAMP - 20) + "\\n\\n[...truncated]";
                }
                if (i > 0)
                    await waitSendGap();
                const id = await client.sendText(config.chatId, chunk);
                lastSendAt = Date.now();
                if (i === 0)
                    firstId = id;
            }
            return firstId;
        }
        catch (err) {
            log(`Failed to send Telegram message: ${String(err)}`);
            return undefined;
        }
    }'''
    new, n = pattern.subn(replacement, text, count=1)
    if n != 1:
        raise RuntimeError(f"Could not patch send() in {path}")
    path.write_text(new, encoding="utf-8")
    return True


def main() -> int:
    roots = find_package_roots()
    # Prefer explicitly provided path
    if len(sys.argv) > 1:
        roots = [pathlib.Path(sys.argv[1])]
    if not roots:
        # Fall back: look next to a known npx install by requiring the module path via node
        import subprocess

        try:
            out = subprocess.check_output(
                ["node", "-e", "console.log(require.resolve('cursor-telegram-mcp/package.json'))"],
                text=True,
                stderr=subprocess.DEVNULL,
            ).strip()
            roots = [pathlib.Path(out).parent]
        except Exception:
            print("cursor-telegram-mcp not found locally. Pass package root as argv[1].")
            print("Prompt-side fix in marvindeepseek_rules.md is still required and applied.")
            return 1

    changed = 0
    for root in roots:
        split_js = root / "dist" / "splitMessage.js"
        worker_js = root / "dist" / "worker.js"
        if not split_js.exists() or not worker_js.exists():
            print(f"skip incomplete package: {root}")
            continue
        a = patch_split_message(split_js)
        b = patch_worker_send(worker_js)
        print(f"{root}: splitMessage={'patched' if a else 'ok'}, worker={'patched' if b else 'ok'}")
        changed += int(a or b)
    print(f"done; files updated in {changed} package(s). Restart: cursor-telegram-mcp worker")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
