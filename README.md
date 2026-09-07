# MarvinBot Studio для Forge Mill

Модуль автоматического сбора постов из Telegram-каналов, формирования дайджеста (дважды в день по Новосибирску) и генерации статей на русском языке с минимальным расходом токенов.

## Стек

- **Backend:** NestJS + Prisma + PostgreSQL + Redis
- **Frontend:** Next.js (App Router)
- **Telegram:** Bot API (inline-кнопки) + публичный парсинг `t.me/s/{username}` + опциональный Telethon worker
- **AI:** MarvinBot / совместимый OpenAI-like endpoint (Ollama и др.) + локальный fallback без платных API

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build
```

Сервисы:

| Сервис | URL |
|--------|-----|
| Web UI | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

Demo-режим (`DEMO_MODE=true`) генерирует реалистичные посты без реального Telegram — удобно для проверки пайплайна.

### Локальный запуск без Docker (API)

```bash
# поднять postgres + redis
docker compose up -d postgres redis

cd backend
cp ../.env.example ../.env
# DATABASE_URL=postgresql://marvin:marvin@localhost:5432/marvinbot?schema=public
# REDIS_URL=redis://localhost:6379
# MARVINBOT_FORCE_LOCAL=true
# DEMO_MODE=true
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

### Тесты

```bash
cd backend && npm test
```

## Алгоритм

1. **CRON** `0 6,18 * * *` (`Asia/Novosibirsk`) — сбор постов за 12 часов  
2. Фильтрация (длина, реклама, дубли) → классификация → score → TOP-10  
3. Дайджест в Telegram с кнопками ✅/⬜ и «🚀 Сгенерировать статью»  
4. Минимум 2 / максимум 5 выбранных постов → статья Markdown ≤ 2500 символов / ≤ 2000 токенов  
5. Дубль выбора и просмотра — в UI Forge Mill (`/marvinbot/*`)

## Основные API

- `GET/POST/PUT/DELETE /api/sources`
- `POST /api/sources/test`, `POST /api/sources/:id/parse`
- `GET/POST /api/digests`, `POST /api/digests/generate`, `POST /api/digests/:id/approve`
- `GET/PUT/DELETE /api/articles`, `POST /api/articles/:id/publish`
- `GET/PUT /api/settings`, `GET/POST/DELETE /api/experts`
- `GET /api/stats/dashboard|tokens|sources`
- `POST /api/telegram/webhook`

Полная документация: Swagger UI `/api/docs`.

## Переменные окружения

См. `.env.example`. Секреты не хранятся в коде.

## Telethon (опционально)

```bash
docker compose --profile telethon up --build
```

Нужны `TELEGRAM_API_ID`, `TELEGRAM_API_HASH` и авторизованная сессия. Без них используется публичный HTML-парсер.

## Хранение дайджестов

30 дней (`DIGEST_RETENTION_DAYS`), затем автоочистка.

## Лицензия

MIT