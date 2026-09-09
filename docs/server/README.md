# my_services — neurosolutions-app1

## Host
- Server: neurosolutions-app1 (Timeweb, Amsterdam)
- IP: 72.56.18.124
- Domain: https://app1.neurosolutions.pro
- OS: Ubuntu 24.04 + Docker 29.x + Compose v5 + Nginx 1.24 + Certbot

## Apps

| Домен / URL | Внешний порт | Контейнер | Путь |
|---|---|---|---|
| https://app1.neurosolutions.pro/ | 8081 | forge-mill | /opt/my_services/forge-mill-src |
| https://app1.neurosolutions.pro/api/marvinbot/ | 3001 | marvinbot-api | /opt/my_services/forge-mill-src |
| https://app1.neurosolutions.pro/bot-health | 8080 | tg-bot | /opt/my_services/content-tg-bot |
| https://app1.neurosolutions.pro/marvin-health | 8787 | marvinbot | /opt/my_services/marvinbot |
| https://app1.neurosolutions.pro/agent-memory/ | 3000 | memory-mcp | /opt/my_services/memory-mcp |
| localhost:8082/health | 8082 | marvindeepseek-bot | /opt/my_services/marvindeepseek-bot |
| (internal) | — | forge-postgres | postgres:16-alpine |
| (internal) | — | forge-redis | redis:7-alpine |
| (Watchtower) | — | watchtower | /opt/my_services/watchtower |

## Watchtower
Используется `nickfedor/watchtower:1.22.0` (совместим с Docker 29 API).
Автообновляет **только** `forge-postgres` и `forge-redis` каждые 6 часов.
Кастомные приложения собираются локально — обновляйте вручную через `docker compose up -d --build`.

## Управление

```bash
cd /opt/my_services/forge-mill-src && docker compose up -d
cd /opt/my_services/content-tg-bot && docker compose up -d
cd /opt/my_services/marvinbot && docker compose up -d --build
cd /opt/my_services/marvindeepseek-bot && docker compose up -d --build
cd /opt/my_services/memory-mcp && docker compose up -d
cd /opt/my_services/watchtower && docker compose up -d

cd /opt/my_services/<app> && docker compose down
docker logs -f <имя_контейнера>
docker ps
```

## Nginx / SSL
- Конфиг: `/etc/nginx/sites-available/my_apps`
- SSL: Let's Encrypt, `certbot.timer` включён
- Проверка: `nginx -t && systemctl reload nginx`

## Важно
- Не удаляйте volumes без бэкапа.
- Docker уже установлен — не переустанавливать.
- VPS: 1 vCPU / 2 GB RAM.
