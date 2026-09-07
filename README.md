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
| `https://app1.neurosolutions.pro/bot-health` | `8080` | `tg-bot` (`@suyuyu_bot`) | `/opt/my_services/content-tg-bot` |
| `https://app1.neurosolutions.pro/marvin-health` | `8787` | `marvinbot` (`@Marvin42_main_bot`) | `/opt/my_services/marvinbot` |

- Forge Mill: ветка `cursor/media-factory-3d2b`
- Content bot: [neurosolutions-pro/content-tg-bot](https://github.com/neurosolutions-pro/content-tg-bot)
- MarvinBot: [neurosolutions-pro/marvinbot-tg-bot](https://github.com/neurosolutions-pro/marvinbot-tg-bot) (`cursor-telegram-mcp` worker)

Секреты в `.env` на сервере (не в git).

## Управление

```bash
cd /opt/my_services/forge-mill && docker compose up -d --build
cd /opt/my_services/content-tg-bot && docker compose up -d
cd /opt/my_services/marvinbot && docker compose up -d --build
docker logs -f marvinbot
sudo nginx -t && sudo systemctl reload nginx
```

SSH:

```bash
ssh -i ~/.ssh/timeweb_cursor_ed25519 root@72.56.18.124
```
