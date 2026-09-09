# Агенты и Боты

Статическая панель (`output: "export"`). Живого Cursor REST API и входящих вебхуков нет.

- Каталог: `src/data/agents.ts`, публичная копия: `GET /api/agents.json`
- Источники скана: `src/lib/agents/scan.ts`
- Кэш: `localStorage` `forgemill-agents-cache`, период из настроек (по умолчанию 5 минут)
- Правки скилов: `forgemill-agents-overrides`
- Синхронизация заново качает JSON и подмешивает память задач (`forgemill-task-memory`)

Маршруты: `/agents/`, `/agents/{id}/`, `/agents/settings/`

Хоткеи: `/` поиск, `R` синхронизация, `1–5` вкладки карточки, `G` затем `A` — этот раздел.
