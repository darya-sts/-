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

## Приложения

| Домен | Порт | Контейнер | Путь |
|---|---|---|---|
| `app1.neurosolutions.pro` | `8080` | `tg-bot` | `/opt/my_services/content-tg-bot` |

Источник: [neurosolutions-pro/content-tg-bot](https://github.com/neurosolutions-pro/content-tg-bot)  
Секреты: `/opt/my_services/content-tg-bot/.env` (не в git).  
Канал публикации: `@neurosolutionspro`.

Старое Timeweb Apps `TG_Bot_active` поставлено на паузу (тот же bot token нельзя крутить в двух местах).

## Управление

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
