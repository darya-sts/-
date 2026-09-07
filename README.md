# Timeweb Cloud — neurosolutions-app1

Базовый VPS в Timeweb Cloud для приложений за Nginx + Docker Compose.

## Сервер

| Параметр | Значение |
|---|---|
| Provider | Timeweb Cloud |
| Name | `neurosolutions-app1` |
| Server ID | `9039463` |
| Location | Amsterdam (`nl-1` / `ams-1`) |
| Spec | 1 vCPU / 2 GB RAM / 30 GB NVMe |
| OS | Ubuntu 24.04 |
| IPv4 | `72.56.18.124` |
| IPv6 | `2a03:6f02::1:6b4f` |
| Domain | `app1.neurosolutions.pro` (ожидает DNS A → IPv4) |

## Установлено

- Docker CE `29.8.0` + Compose plugin
- Nginx `1.24.0` (site `my_apps`, пока placeholder)
- Каталог проекта: `/opt/my_services`

## DNS

Создай A-запись:

```text
app1.neurosolutions.pro  →  72.56.18.124
```

SSL (Certbot) подключим после того, как DNS начнёт резолвиться на сервер.

## Дальше

Приложения ещё не выбраны. Когда будут готовы данные (образ, порт, env, volumes) — добавим `docker-compose.yml` и переключим Nginx на `proxy_pass`.

## Управление на сервере

```bash
cd /opt/my_services && docker compose up -d
cd /opt/my_services && docker compose down
docker logs <container>
sudo nginx -t && sudo systemctl reload nginx
```

SSH (ключ сессии Cursor agent уже добавлен в Timeweb):

```bash
ssh -i ~/.ssh/timeweb_cursor_ed25519 root@72.56.18.124
```
