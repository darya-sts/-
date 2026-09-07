#!/usr/bin/env bash
set -euo pipefail
API="${API_URL:-http://localhost:3001}"

echo "== health =="
curl -sf "$API/api/health" | tee /tmp/mb-health.json
echo

echo "== generate digest =="
DIGEST=$(curl -sf -X POST "$API/api/digests/generate")
echo "$DIGEST" | tee /tmp/mb-digest.json | head -c 400
echo

DIGEST_ID=$(node -e "const d=require('/tmp/mb-digest.json'); console.log(d.id)")
ITEM_IDS=$(node -e "const d=require('/tmp/mb-digest.json'); console.log(d.items.slice(0,3).map(i=>i.id).join(','))")

echo "== select 3 items =="
IFS=',' read -r -a ARR <<< "$ITEM_IDS"
JSON_IDS=$(printf '"%s",' "${ARR[@]}" | sed 's/,$//')
curl -sf -X POST "$API/api/digests/$DIGEST_ID/select" \
  -H 'Content-Type: application/json' \
  -d "{\"itemIds\":[${JSON_IDS}]}" > /tmp/mb-selected.json
echo "selected ok"

echo "== generate article =="
ARTICLE=$(curl -sf -X POST "$API/api/digests/$DIGEST_ID/approve")
echo "$ARTICLE" | tee /tmp/mb-article.json
LEN=$(node -e "const a=require('/tmp/mb-article.json'); console.log(a.content.length)")
TOK=$(node -e "const a=require('/tmp/mb-article.json'); console.log(a.tokensUsed)")
echo "chars=$LEN tokens=$TOK"

echo "== stats tokens =="
curl -sf "$API/api/stats/tokens" | tee /tmp/mb-tokens.json
echo
echo "E2E OK"