## MarvinBot Studio

Модуль `/marvinbot` в Forge Mill + NestJS API (`backend/`) с Prisma/PostgreSQL/Redis.

### API
- `POST /api/marvinbot/generate`
- `POST /api/marvinbot/generate/stream` (SSE)
- `GET /api/marvinbot/articles`
- `GET /api/marvinbot/articles/:id`
- `GET /api/marvinbot/articles/:id/export?format=pdf|docx`
- `PUT /api/marvinbot/skills`
- `GET /api/marvinbot/skills`
- `POST /api/marvinbot/chat`
- `POST /api/marvinbot/analyze-telegram`

### Local
```bash
docker compose up -d --build
# UI: http://localhost:8081/marvinbot/
# API: http://localhost:3001/api/marvinbot/articles
```

Set `DEEPSEEK_API_KEY` (or `MARVINBOT_API_KEY`) in the environment before compose.
