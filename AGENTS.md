# Forge Mill

Playbook app for a YouTube / X / Telegram content factory.
Keep copy specific. Do not invent live CPM or payout numbers — change `src/data/` instead.

## Prompt Studio

Раздел `/prompts`: пользователь формулирует задачу → система собирает промт →
сохраняет PDF с метаданными → перед делегированием в Cursor всегда показывает
чек-лист (агенты, модель, публикация, память) и ждёт **ручного подтверждения**.
История промтов и заданий хранится в Postgres. Внешние интеграции
(Slack/Telegram/Notion/Jira) не используются. Публикация — файлы проекта,
git commit/push и вывод в чат (как сейчас).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
