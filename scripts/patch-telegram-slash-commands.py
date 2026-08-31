#!/usr/bin/env python3
"""Make /# and /workspaces work when Telegram appends @BotName."""
from pathlib import Path

targets = [
    Path.home() / ".nvm/versions/node/v22.22.2/lib/node_modules/cursor-telegram-mcp/dist/parseInbound.js",
]
needle = "function stripBotCommandMention(text) {"
insert_fn = '''/** Telegram appends @BotName to slash commands (e.g. /#@Marvin42_main_bot). */
function stripBotCommandMention(text) {
    return text.replace(/^(\\/\\S+?)@[A-Za-z0-9_]+/, "$1");
}
'''
for path in targets:
    if not path.exists():
        print(f"skip missing {path}")
        continue
    text = path.read_text()
    if needle in text:
        print(f"already patched {path}")
        continue
    text = text.replace(
        "export function parseTopLevelCommand(text) {\n    const t = text.trim();",
        insert_fn + "export function parseTopLevelCommand(text) {\n    const t = stripBotCommandMention(text.trim());",
        1,
    )
    text = text.replace(
        "export function splitInboundMessage(text) {\n    const trimmed = text.trim();",
        "export function splitInboundMessage(text) {\n    const trimmed = stripBotCommandMention(text.trim());",
        1,
    )
    if needle not in text:
        raise SystemExit(f"failed to patch {path}")
    path.write_text(text)
    print(f"patched {path}")
