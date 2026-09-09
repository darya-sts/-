# Перенос на neurosolutions-pro

Из `darya-sts/-` на организацию [neurosolutions-pro](https://github.com/neurosolutions-pro) уходят **только сервисы, которые крутятся на VPS `neurosolutions-app1`**. Предки, дубли и черновики Cursor-агентов не переносятся.

## Что переносится

| Новый репозиторий | Источник в `darya-sts/-` | На сервере |
| --- | --- | --- |
| `neurosolutions-pro/forge-mill` | `cursor/forgemill-auth-23f0` | `/opt/my_services/forge-mill-src` (`forge-mill` + `marvinbot-api`) |
| `neurosolutions-pro/content-tg-bot` | `cursor/tg-bot-testovyy-7ea1` | `/opt/my_services/content-tg-bot` (`@suyuyu_bot`) |
| `neurosolutions-pro/MarvinBot` | `cursor/marvinbot-mcp-686f` (без секретов, без истории с токенами) | `/opt/my_services/marvinbot` |
| `neurosolutions-pro/marvindeepseek-bot` | `cursor/marvindeepseek-rules-97cc` → каталог `deploy/marvindeepseek-bot` | `/opt/my_services/marvindeepseek-bot` |

## Что не переносится

| Ветка | Почему |
| --- | --- |
| `cursor/media-factory-3d2b` | Кабинет/vault/tasks; на VPS не этот срез (App Platform / старый путь `forge-mill`) |
| `cursor/forgemill-architecture-23f0` | Предок `forgemill-auth` |
| `cursor/marvinbot-forgemill-692a` | Предок `forgemill-auth` |
| `cursor/marvinbot-studio-0ffa` | Предок `forgemill-auth` |
| `cursor/marvinbot-studio-692a` | Параллельный прототип Studio |
| `cursor/marvindeepseek-chat-23f0` | Старый простой чат; на сервере стек с `memory-mcp` = ветка `rules` |
| `cursor/timeweb-amsterdam-server-0ffa` | Устаревший README VPS |
| `cursor/server-watchtower-setup-e0fa` | Документация, не код сервиса |
| `cursor/install-orchestrator-skills-84a3` | Учебный hello HTTP |
| `cursor/telegram-ai-chatbot-7845` | Незавершённый анализ |
| `main` | Пустой README |

`memory-mcp` на сервере есть, исходников в этом репозитории нет — переносить нечего.

## Как выгрузить

```bash
./scripts/export-neurosolutions-pro.sh
```

Скрипт собирает четыре git-репозитория в `/tmp/ns-pro/`, пишет bundle-файлы в `/opt/cursor/artifacts/neurosolutions-pro/` и пытается создать/запушить репозитории в GitHub.

Нужны права: GitHub App, установленный на организацию `neurosolutions-pro`, или PAT с правом создавать репозитории в этой орг.

Агент Cursor (`cursor[bot]`) сейчас видит только `darya-sts/-` и **не может** создать/запушить репозитории в `neurosolutions-pro` (403). Пустой `neurosolutions-pro/MarvinBot` уже есть, но пуш в него тоже запрещён.

Если запускаете вручную с PAT:

```bash
export GH_TOKEN=ghp_...   # admin/write на neurosolutions-pro
./scripts/export-neurosolutions-pro.sh
```

Или из готовых bundle:

```bash
gh repo create neurosolutions-pro/forge-mill --public --description "Forge Mill (neurosolutions-app1)"
git clone forge-mill.bundle forge-mill && cd forge-mill && git remote add origin https://github.com/neurosolutions-pro/forge-mill.git && git push -u origin main
```

То же для `content-tg-bot`, `MarvinBot`, `marvindeepseek-bot`.
