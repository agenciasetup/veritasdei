# Supabase Setup

## 1. Habilitar pgvector
No dashboard do Supabase: Database → Extensions → buscar "vector" → Enable

## 2. Rodar o schema
Database → SQL Editor → colar o conteúdo de `schema.sql` → Run

## 3. Onde colocar os PDFs para ingestão
Coloque os arquivos na pasta `/scripts/ingest/data/`:
- `biblia-matos-soares-1927.pdf`  ← Bíblia (Matos Soares 1927)
- `catecismo-igreja-catolica.pdf` ← Catecismo da Igreja Católica em português

## 4. Rodar a ingestão (após o Sprint 3)
```bash
npx tsx scripts/ingest/ingest-biblia.ts
npx tsx scripts/ingest/ingest-catecismo.ts
```

## 5. Rodar os scripts de ingestão

Coloque os PDFs na pasta scripts/ingest/data/ antes de rodar.

```bash
# Ingestão da Bíblia (pode demorar 10-20 min)
npx tsx scripts/ingest/ingest-biblia.ts

# Ingestão do Catecismo
npx tsx scripts/ingest/ingest-catecismo.ts

# Seed da Patrística
npx tsx scripts/ingest/ingest-patristica.ts
```
