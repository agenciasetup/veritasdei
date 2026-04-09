#!/bin/bash
# Ingestão da Bíblia a partir do JSON estruturado
# Uso: bash scripts/ingest/ingest-biblia-from-json.sh [START_INDEX]
set -e

source <(grep -v '^#' .env.local | grep -v '^$' | sed 's/^/export /')

JSON_FILE="scripts/ingest/data/biblia-structured.json"
TOTAL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$JSON_FILE','utf8')).length)")
START=${1:-0}

echo "=== Ingestão Bíblia: $TOTAL versículos (começando em $START) ==="

INSERTED=0
ERRORS=0

for i in $(seq $START $((TOTAL-1))); do
  # Extract verse data
  VERSE=$(node -e "
    const d=JSON.parse(require('fs').readFileSync('$JSON_FILE','utf8'))[$i];
    console.log(JSON.stringify(d));
  ")

  REF=$(echo "$VERSE" | node -e "process.stdin.on('data',c=>{const d=JSON.parse(c);console.log(d.reference)})")
  TEXT=$(echo "$VERSE" | node -e "process.stdin.on('data',c=>{const d=JSON.parse(c);console.log(d.text)})")

  # Progress every 50
  if [ $((i % 50)) -eq 0 ]; then
    echo "[$i/$TOTAL] $REF (ok: $INSERTED, err: $ERRORS)"
  fi

  # Generate embedding
  echo "$VERSE" | node -e "
    process.stdin.on('data', c => {
      const d = JSON.parse(c);
      console.log(JSON.stringify({model:'text-embedding-3-small', input: d.text.replace(/\n/g,' ')}));
    });
  " > /tmp/embed_req.json

  EMBED_RESULT=$(curl -s --max-time 30 https://api.openai.com/v1/embeddings \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d @/tmp/embed_req.json 2>/dev/null)

  # Check if embedding was returned
  HAS_DATA=$(echo "$EMBED_RESULT" | node -e "
    let b='';process.stdin.on('data',c=>b+=c);process.stdin.on('end',()=>{
      try{const r=JSON.parse(b);console.log(r.data?'yes':'no')}catch{console.log('no')}
    })
  ")

  if [ "$HAS_DATA" != "yes" ]; then
    ERRORS=$((ERRORS+1))
    continue
  fi

  # Build insert body with embedding
  echo "$VERSE" | node -e "
    const emb = JSON.parse('$(echo "$EMBED_RESULT" | node -e "let b='';process.stdin.on('data',c=>b+=c);process.stdin.on('end',()=>{const r=JSON.parse(b);console.log(JSON.stringify(r.data[0].embedding))})")');
    process.stdin.on('data', c => {
      const d = JSON.parse(c);
      console.log(JSON.stringify({
        book: d.book, book_abbr: d.book_abbr, chapter: d.chapter,
        verse: d.verse, reference: d.reference, text_pt: d.text,
        testament: d.testament, embedding: emb
      }));
    });
  " > /tmp/supa_req.json

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/biblia" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates" \
    -d @/tmp/supa_req.json 2>/dev/null)

  if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    INSERTED=$((INSERTED+1))
  else
    ERRORS=$((ERRORS+1))
  fi
done

echo ""
echo "=== Concluído: $INSERTED inseridos, $ERRORS erros (de $TOTAL) ==="
