"""Telegram commands for browsing ALLOWED_ROOTS via project_reader."""

from __future__ import annotations

import logging

from telegram import Update
from telegram.ext import ContextTypes

from config import PROJECT_READER_GREP_LIMIT
from handlers.common import allowed, reply_long
from project_reader import service as pr
from project_reader.reader import build_tree, grep_project

log = logging.getLogger("marvindeepseek.commands.projects")


def _gate(update: Update) -> bool:
    user = update.effective_user
    return allowed(user.id if user else None)


async def cmd_projects(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _gate(update):
        await update.message.reply_text("Доступ ограничен.")
        return
    try:
        infos = pr.list_projects_info()
    except Exception as exc:
        log.exception("cmd_projects failed")
        await update.message.reply_text(f"Не удалось просканировать проекты: {exc}")
        return
    if not infos:
        await update.message.reply_text(
            "Проекты не найдены. Проверьте ALLOWED_ROOTS."
        )
        return
    lines = ["Доступные проекты:\n"]
    for info in infos:
        lines.append(
            f"• *{info.name}* — файлов: {info.file_count}, "
            f"размер: {pr.format_size(info.total_size)} "
            f"(text {info.text_files} / bin {info.binary_files})"
        )
    await reply_long(update, "\n".join(lines))


async def cmd_tree(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _gate(update):
        return
    args = context.args or []
    if not args:
        await update.message.reply_text("Использование: /tree <project> [глубина]")
        return
    name = args[0]
    depth = 2
    if len(args) > 1:
        try:
            depth = max(1, min(6, int(args[1])))
        except ValueError:
            await update.message.reply_text("Глубина должна быть числом.")
            return
    root = pr.resolve_project(name)
    if root is None:
        await update.message.reply_text(f"Проект «{name}» не найден. Смотрите /projects")
        return
    tree = build_tree(root, depth=depth)
    await reply_long(update, f"```\n{tree}\n```")


async def cmd_cat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _gate(update):
        return
    args = context.args or []
    if len(args) < 2:
        await update.message.reply_text("Использование: /cat <project> <path>")
        return
    project, rel = args[0], " ".join(args[1:]).strip()
    user_id = update.effective_user.id if update.effective_user else None
    result = await pr.cat_file(project, rel, user_id)
    if result.error:
        await update.message.reply_text(result.error)
        return
    header = f"`{result.path}` ({pr.format_size(result.size)})"
    if result.truncated:
        header += " — обрезано"
    await update.message.reply_text(header)
    for i, part in enumerate(result.parts, start=1):
        prefix = f"[{i}/{len(result.parts)}]\n" if len(result.parts) > 1 else ""
        await reply_long(update, prefix + f"```\n{part}\n```")


async def cmd_grep(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _gate(update):
        return
    args = context.args or []
    if len(args) < 2:
        await update.message.reply_text("Использование: /grep <project> <pattern>")
        return
    project = args[0]
    pattern = " ".join(args[1:]).strip()
    root = pr.resolve_project(project)
    if root is None:
        await update.message.reply_text(f"Проект «{project}» не найден.")
        return
    user_id = update.effective_user.id if update.effective_user else None
    try:
        hits = await grep_project(
            root, pattern, max_hits=PROJECT_READER_GREP_LIMIT, user_id=user_id
        )
    except ValueError as exc:
        await update.message.reply_text(str(exc))
        return
    if not hits:
        await update.message.reply_text("Совпадений нет.")
        return
    lines = [f"Найдено {len(hits)} (лимит {PROJECT_READER_GREP_LIMIT}):\n"]
    for h in hits:
        lines.append(f"`{h.path}:{h.line_no}` {h.line}")
    await reply_long(update, "\n".join(lines))


async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _gate(update):
        return
    args = context.args or []
    if not args:
        await update.message.reply_text("Использование: /stats <project>")
        return
    name = args[0]
    root = pr.resolve_project(name)
    if root is None:
        await update.message.reply_text(f"Проект «{name}» не найден.")
        return
    info = pr.ensure_indexed(name, root)
    top = pr.get_indexer().largest(name, limit=10)
    lines = [
        f"Статистика *{info.name}*",
        f"Корень: `{info.root}`",
        f"Файлов: {info.file_count}",
        f"Размер: {pr.format_size(info.total_size)}",
        f"Текст: {info.text_files} · бинарные: {info.binary_files}",
        "",
        "Топ-10 крупнейших:",
    ]
    for i, e in enumerate(top, start=1):
        lines.append(f"{i}. `{e.path}` — {pr.format_size(e.size)} ({e.kind})")
    await reply_long(update, "\n".join(lines))
