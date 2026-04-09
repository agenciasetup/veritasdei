#!/bin/bash
set -e

# Load env vars
source <(grep -v '^#' .env.local | grep -v '^$' | sed 's/^/export /')

SEED_FILE="scripts/ingest/data/patristica-seed.json"
COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SEED_FILE','utf8')).length)")
echo "=== Ingestão Patrística: $COUNT entradas ==="

for i in $(seq 0 $((COUNT-1))); do
  # Extract entry fields
  ENTRY=$(node -e "
    const d=JSON.parse(require('fs').readFileSync('$SEED_FILE','utf8'))[$i];
    console.log(JSON.stringify(d));
  ")

  REF=$(echo "$ENTRY" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.reference)")
  TEXT=$(echo "$ENTRY" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.text)")

  echo "[$((i+1))/$COUNT] $REF"

  # Generate embedding via curl
  EMBEDDING=$(curl -s --max-time 30 https://api.openai.com/v1/embeddings \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(node -e "
      const d=JSON.parse(require('fs').readFileSync('$SEED_FILE','utf8'))[$i];
      console.log(JSON.stringify({model:'text-embedding-3-small',input:d.text.replace(/\\n/g,' ')}))
    ")" | node -e "
      let buf='';process.stdin.on('data',c=>buf+=c);process.stdin.on('end',()=>{
        const r=JSON.parse(buf);
        if(r.data) console.log(JSON.stringify(r.data[0].embedding));
        else { console.error('API Error:',JSON.stringify(r)); process.exit(1); }
      })
    ")

  if [ -z "$EMBEDDING" ]; then
    echo "  ERRO: embedding vazio"
    continue
  fi

  # Insert into Supabase via REST API
  BODY=$(node -e "
    const d=JSON.parse(require('fs').readFileSync('$SEED_FILE','utf8'))[$i];
    const emb=$EMBEDDING;
    console.log(JSON.stringify({
      author: d.author,
      author_years: d.author_years,
      work: d.work,
      chapter: d.chapter,
      reference: d.reference,
      text: d.text,
      verified: d.verified,
      embedding: emb
    }))
  ")

  RESULT=$(curl -s --max-time 15 \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/patristica" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates" \
    -d "$BODY" \
    -w "\n%{http_code}" | tail -1)

  if [ "$RESULT" = "201" ] || [ "$RESULT" = "200" ]; then
    echo "  OK"
  else
    echo "  ERRO HTTP: $RESULT"
  fi
done

echo "=== Ingestão Patrística concluída ==="
