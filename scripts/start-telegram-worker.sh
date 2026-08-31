#!/usr/bin/env bash
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
if [ -s "${HOME}/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${HOME}/.nvm/nvm.sh"
  nvm use default >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
fi
export TG_AGENT_CWD="${TG_AGENT_CWD:-/workspace}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "$SCRIPT_DIR/patch-telegram-slash-commands.py"
exec cursor-telegram-mcp worker
