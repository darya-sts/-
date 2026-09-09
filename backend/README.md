## MarvinBot Studio

Модуль `/marvinbot` в Forge Mill + NestJS API (`backend/`) с Prisma/PostgreSQL/Redis.

Статьи — HTML с эмодзи и изображениями (`figure`/`img`), плюс загрузка своих картинок.

### API
- `POST /api/marvinbot/generate`
- `POST /api/marvinbot/generate/stream` (SSE)
- `GET /api/marvinbot/articles`
- `GET /api/marvinbot/articles/:id`
- `PATCH /api/marvinbot/articles/:id` — правка HTML/title
- `POST /api/marvinbot/articles/:id/media` — вставка emoji / imageUrl
- `POST /api/marvinbot/upload` — multipart `file` → `{ url }`
- `GET /api/marvinbot/uploads/:filename` — раздача загруженных файлов
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
