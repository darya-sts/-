# Timeweb Cloud — neurosolutions-app1

VPS в Timeweb Cloud (Amsterdam). Все приложения крутятся **только здесь** (Docker + Nginx). Timeweb App Platform очищен.

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

## Приложения на VPS

| URL | Порт | Контейнер | Путь |
|---|---|---|---|
| `https://app1.neurosolutions.pro/` | `8081` | `forge-mill` | `/opt/my_services/forge-mill` |
| `https://app1.neurosolutions.pro/bot-health` | `8080` | `tg-bot` | `/opt/my_services/content-tg-bot` |

Forge Mill собран из ветки `cursor/media-factory-3d2b`.  
Бот: [neurosolutions-pro/content-tg-bot](https://github.com/neurosolutions-pro/content-tg-bot), секреты в `.env`.

## Управление

```bash
cd /opt/my_services/forge-mill && docker compose up -d --build
cd /opt/my_services/content-tg-bot && docker compose up -d
docker logs -f forge-mill
docker logs -f tg-bot
sudo nginx -t && sudo systemctl reload nginx
```

SSH:

```bash
ssh -i ~/.ssh/timeweb_cursor_ed25519 root@72.56.18.124
```
