# Timeweb Cloud — neurosolutions-app1

VPS в Timeweb Cloud (Amsterdam) для приложений за Nginx + Docker Compose.

## Сервер

| Параметр | Значение |
|---|---|
| Name | `neurosolutions-app1` |
| Server ID | `9039463` |
| Location | Amsterdam (`nl-1` / `ams-1`) |
| Spec | 1 vCPU / 2 GB RAM / 30 GB NVMe |
| OS | Ubuntu 24.04 |
| IPv4 | `72.56.18.124` |
| Domain | `https://app1.neurosolutions.pro` |

## Стек

- Docker CE + Compose plugin
- Nginx reverse proxy + Let's Encrypt (Certbot)
- Каталог: `/opt/my_services`

## Маршрутизация

| URL | Куда |
|---|---|
| `https://app1.neurosolutions.pro/` | **Forge Mill / Media Factory** (прокси на Timeweb Apps) |
| `https://app1.neurosolutions.pro/bot-health` | health-check Telegram-бота (`ok`) |
| `http://127.0.0.1:8080/` | Telegram-бот напрямую на VPS |

## Приложения

| Приложение | Где |
|---|---|
| Forge Mill (Media Factory) | Timeweb Apps → прокси с VPS Nginx |
| `tg-bot` (`content-tg-bot`) | `/opt/my_services/content-tg-bot` на VPS |

Секреты бота: `/opt/my_services/content-tg-bot/.env`  
Канал: `@neurosolutionspro`  
Старое Timeweb Apps `TG_Bot_active` удалено (конфликт 409).

## Управление ботом

```bash
cd /opt/my_services/content-tg-bot && docker compose up -d
cd /opt/my_services/content-tg-bot && docker compose down
docker logs -f tg-bot
sudo nginx -t && sudo systemctl reload nginx
```

SSH:

```bash
ssh -i ~/.ssh/timeweb_cursor_ed25519 root@72.56.18.124
```
