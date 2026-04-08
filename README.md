# Veritas Dei

**O que a Igreja ensina — com as fontes.**

Sistema de consulta da fé católica estruturado por autoridade, com respostas em 3 pilares: Bíblia, Magistério e Patrística. Usa RAG (Retrieval-Augmented Generation) sobre base de conhecimento própria.

**Princípio:** A IA nunca responde do zero. Ela busca na base de conhecimento e organiza os trechos encontrados. Se não houver trechos suficientes, o sistema informa isso claramente.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL + pgvector)
- **OpenAI** (embeddings + formatação)
- **Vercel** (deploy)

## Como rodar localmente

```bash
# 1. Clonar
git clone https://github.com/agenciasetup/veritasdei.git
cd veritasdei

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher com as chaves do Supabase e OpenAI

# 4. Configurar o Supabase
# Ver instruções em /supabase/README.md

# 5. Rodar
npm run dev
```

## Ingestão do corpus

Após configurar o Supabase e rodar o schema:

```bash
# Colocar PDFs em scripts/ingest/data/
# Ver detalhes em /supabase/README.md

# Seed da Patrística (10 citações de teste)
npx tsx scripts/ingest/ingest-patristica.ts

# Bíblia (requer PDF)
npx tsx scripts/ingest/ingest-biblia.ts

# Catecismo (requer PDF)
npx tsx scripts/ingest/ingest-catecismo.ts
```

## Estrutura

```
src/
  app/          → Páginas e API routes
  components/   → Componentes UI
  lib/          → Clientes (Supabase, OpenAI) e motor RAG
  types/        → Tipos TypeScript globais
scripts/
  ingest/       → Scripts de ingestão do corpus
supabase/
  schema.sql    → Schema completo do banco
```

## Deploy

Ver [vercel-env-checklist.md](./vercel-env-checklist.md) para configuração das variáveis de ambiente no Vercel.
