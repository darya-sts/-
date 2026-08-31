# MarvinBot

Проект Telegram-бота для работы с Cursor через MCP-сервер `cursor-telegram-mcp`.

Конфигурация MCP: `.cursor/mcp.json`. После изменения файла: Command Palette → **Developer: Reload Window**.

Команда `/#` обрабатывается **фоновым worker**, а не самим Cursor. Worker должен быть запущен на машине с конфигом (`~/.config/cursor-telegram/config.json`):

```bash
./scripts/start-telegram-worker.sh
```

Проверка: `cursor-telegram-mcp doctor`. В Telegram: `/workspaces` или `/#`.
