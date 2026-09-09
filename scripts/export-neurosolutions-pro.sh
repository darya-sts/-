#!/usr/bin/env bash
# Build four neurosolutions-pro repos from the deployable tips of darya-sts/-
# and try to create/push them on GitHub.
set -euo pipefail

SRC_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${NS_PRO_OUT:-/tmp/ns-pro}"
BUNDLE_DIR="${NS_PRO_BUNDLES:-/opt/cursor/artifacts/neurosolutions-pro}"
ORG="neurosolutions-pro"

cd "$SRC_ROOT"
git fetch origin --prune

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR" "$BUNDLE_DIR"

git_identity() {
  git -C "$1" config user.name "$(git -C "$SRC_ROOT" config user.name)"
  git -C "$1" config user.email "$(git -C "$SRC_ROOT" config user.email)"
}

clone_tip() {
  local dest="$1"
  local src_ref="$2"
  mkdir -p "$dest"
  git -C "$dest" init -q
  git -C "$dest" fetch --quiet "$SRC_ROOT" "$src_ref:refs/heads/main"
  git -C "$dest" checkout -q main
  git_identity "$dest"
}

# --- forge-mill: full history of the VPS tip ---
echo "==> forge-mill from origin/cursor/forgemill-auth-23f0"
clone_tip "$OUT_DIR/forge-mill" refs/remotes/origin/cursor/forgemill-auth-23f0
cat > "$OUT_DIR/forge-mill/ORIGIN.md" <<'EOF'
# Origin

- Source: `darya-sts/-` branch `cursor/forgemill-auth-23f0`
- VPS: `/opt/my_services/forge-mill-src` on neurosolutions-app1
- Prod: https://app1.neurosolutions.pro/
EOF
git -C "$OUT_DIR/forge-mill" add ORIGIN.md
git -C "$OUT_DIR/forge-mill" commit -m "Document origin branch and VPS path"

# --- content-tg-bot ---
echo "==> content-tg-bot from origin/cursor/tg-bot-testovyy-7ea1"
clone_tip "$OUT_DIR/content-tg-bot" refs/remotes/origin/cursor/tg-bot-testovyy-7ea1
cat > "$OUT_DIR/content-tg-bot/ORIGIN.md" <<'EOF'
# Origin

- Source: `darya-sts/-` branch `cursor/tg-bot-testovyy-7ea1`
- VPS: `/opt/my_services/content-tg-bot` on neurosolutions-app1
- Bot: @suyuyu_bot
EOF
git -C "$OUT_DIR/content-tg-bot" add ORIGIN.md
git -C "$OUT_DIR/content-tg-bot" commit -m "Document origin branch and VPS path"

# --- MarvinBot: sanitized orphan (history contains live tokens) ---
echo "==> MarvinBot from origin/cursor/marvinbot-mcp-686f (secrets stripped)"
MCP_SRC=$(mktemp -d)
clone_tip "$MCP_SRC" refs/remotes/origin/cursor/marvinbot-mcp-686f
mkdir -p "$OUT_DIR/MarvinBot/scripts" "$OUT_DIR/MarvinBot/.cursor"
cp "$MCP_SRC/scripts/start-telegram-worker.sh" "$OUT_DIR/MarvinBot/scripts/"
cp "$MCP_SRC/scripts/patch-telegram-slash-commands.py" "$OUT_DIR/MarvinBot/scripts/"
chmod +x "$OUT_DIR/MarvinBot/scripts/start-telegram-worker.sh"
rm -rf "$MCP_SRC"

cat > "$OUT_DIR/MarvinBot/.cursor/mcp.json" <<'EOF'
{
  "mcpServers": {
    "telegram": {
      "command": "npx",
      "args": ["-y", "cursor-telegram-mcp"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "",
        "TELEGRAM_CHAT_ID": "",
        "CURSOR_API_KEY": ""
      }
    }
  }
}
EOF

cat > "$OUT_DIR/MarvinBot/.env.example" <<'EOF'
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
CURSOR_API_KEY=
EOF

cat > "$OUT_DIR/MarvinBot/.gitignore" <<'EOF'
.env
**/.env
EOF

cat > "$OUT_DIR/MarvinBot/README.md" <<'EOF'
# MarvinBot

Telegram-воркер Cursor через MCP `cursor-telegram-mcp` (`@Marvin42_main_bot`).

Прод: контейнер `marvinbot` на neurosolutions-app1, путь `/opt/my_services/marvinbot`.

Секреты **не** хранятся в git. Скопируйте `.env.example` → `.env` или заполните `.cursor/mcp.json` локально (файл с токенами в индекс не коммитить).

```bash
cp .env.example .env
./scripts/start-telegram-worker.sh
cursor-telegram-mcp doctor
```

Команды в Telegram: `/workspaces`, `/#`.
EOF

cat > "$OUT_DIR/MarvinBot/ORIGIN.md" <<'EOF'
# Origin

- Source: `darya-sts/-` branch `cursor/marvinbot-mcp-686f`
- History was not copied: that branch committed live Telegram/Cursor tokens
- VPS: `/opt/my_services/marvinbot` on neurosolutions-app1
EOF

git -C "$OUT_DIR/MarvinBot" init -q
git -C "$OUT_DIR/MarvinBot" checkout -B main
git_identity "$OUT_DIR/MarvinBot"
git -C "$OUT_DIR/MarvinBot" add .
git -C "$OUT_DIR/MarvinBot" commit -m "Import MarvinBot MCP worker without embedded secrets"

# --- marvindeepseek-bot: subdirectory of rules branch ---
echo "==> marvindeepseek-bot from origin/cursor/marvindeepseek-rules-97cc"
DS_SRC=$(mktemp -d)
clone_tip "$DS_SRC" refs/remotes/origin/cursor/marvindeepseek-rules-97cc
git -C "$DS_SRC" subtree split -P deploy/marvindeepseek-bot -b deepseek-main
mkdir -p "$OUT_DIR/marvindeepseek-bot"
git -C "$OUT_DIR/marvindeepseek-bot" init -q
git -C "$OUT_DIR/marvindeepseek-bot" fetch --quiet "$DS_SRC" deepseek-main:refs/heads/main
git -C "$OUT_DIR/marvindeepseek-bot" checkout -q main
git_identity "$OUT_DIR/marvindeepseek-bot"

mkdir -p "$OUT_DIR/marvindeepseek-bot/.cursor/rules" "$OUT_DIR/marvindeepseek-bot/scripts"
cp "$DS_SRC/.cursor/rules/"* "$OUT_DIR/marvindeepseek-bot/.cursor/rules/" 2>/dev/null || true
cp "$DS_SRC/marvindeepseek_rules.md" "$OUT_DIR/marvindeepseek-bot/"
cp "$DS_SRC/marvindeepseek_skills.md" "$OUT_DIR/marvindeepseek-bot/"
cp "$DS_SRC/scripts/"*.py "$OUT_DIR/marvindeepseek-bot/scripts/"
rm -rf "$DS_SRC"

cat > "$OUT_DIR/marvindeepseek-bot/ORIGIN.md" <<'EOF'
# Origin

- Source: `darya-sts/-` branch `cursor/marvindeepseek-rules-97cc`
- Repo root is former `deploy/marvindeepseek-bot/` (matches VPS checkout)
- VPS: `/opt/my_services/marvindeepseek-bot` on neurosolutions-app1
- Uses `memory-mcp` on the same host
EOF
git -C "$OUT_DIR/marvindeepseek-bot" add ORIGIN.md .cursor marvindeepseek_rules.md marvindeepseek_skills.md scripts
git -C "$OUT_DIR/marvindeepseek-bot" commit -m "Add origin note, Cursor rules, and Telegram split scripts"

# --- bundles ---
echo "==> writing git bundles"
for name in forge-mill content-tg-bot MarvinBot marvindeepseek-bot; do
  git -C "$OUT_DIR/$name" bundle create "$BUNDLE_DIR/${name}.bundle" main
  echo "    $BUNDLE_DIR/${name}.bundle"
done

# --- GitHub create + push ---
push_repo() {
  local name="$1"
  local desc="$2"
  echo "==> GitHub $ORG/$name"
  if gh repo view "$ORG/$name" >/dev/null 2>&1; then
    echo "    repo exists"
  else
    if ! gh repo create "$ORG/$name" --public --description "$desc"; then
      echo "    ERROR: cannot create $ORG/$name (need org write access)"
      return 1
    fi
  fi
  git -C "$OUT_DIR/$name" remote remove origin 2>/dev/null || true
  git -C "$OUT_DIR/$name" remote add origin "https://github.com/${ORG}/${name}.git"
  if git -C "$OUT_DIR/$name" push -u origin main; then
    echo "    pushed main"
    return 0
  fi
  echo "    ERROR: cannot push to $ORG/$name"
  return 1
}

fail=0
push_repo forge-mill "Forge Mill — content factory OS (neurosolutions-app1)" || fail=1
push_repo content-tg-bot "@suyuyu_bot writer-agent (neurosolutions-app1)" || fail=1
push_repo MarvinBot "Cursor Telegram MCP worker (neurosolutions-app1)" || fail=1
push_repo marvindeepseek-bot "MarvinDeepSeekBot with Memory MCP (neurosolutions-app1)" || fail=1

{
  echo "# neurosolutions-pro export"
  echo
  echo "Built: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  for name in forge-mill content-tg-bot MarvinBot marvindeepseek-bot; do
    echo "## $name"
    echo '```'
    git -C "$OUT_DIR/$name" log --oneline -5
    echo "files: $(git -C "$OUT_DIR/$name" ls-tree -r --name-only HEAD | wc -l)"
    echo "HEAD: $(git -C "$OUT_DIR/$name" rev-parse --short HEAD)"
    echo '```'
    echo
  done
} > "$BUNDLE_DIR/export-summary.md"

if [ "$fail" -ne 0 ]; then
  echo "Local repos and bundles are ready; GitHub push did not fully succeed."
  exit 2
fi
echo "All four repositories pushed to $ORG."
