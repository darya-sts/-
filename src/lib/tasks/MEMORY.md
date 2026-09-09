# Memory for Forge Mill task bots

Task Manager writes Markdown+JSON snapshots here when you click **Сохранить в память**.

In the static app the snapshot is stored in `localStorage` (`forgemill-task-memory`) and downloaded as `memory/tasks/<slug>-<id>.md`. Drop that file into this folder if you want Cursor agents to read it from the repo.

Format: title, status, category, executor, description, result, checklist, attachments, chat, then a JSON fence.
