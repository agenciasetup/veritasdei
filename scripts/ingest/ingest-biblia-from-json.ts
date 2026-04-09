/**
 * Ingere versículos da Bíblia a partir do JSON estruturado.
 * Usa curl para OpenAI (embeddings) e Supabase (insert).
 *
 * Uso: node --env-file=.env.local node_modules/.bin/tsx scripts/ingest/ingest-biblia-from-json.ts [START]
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!

interface Verse {
  book: string
  book_abbr: string
  chapter: number
  verse: number
  reference: string
  text: string
  testament: 'AT' | 'NT'
}

function curlEmbedding(text: string): number[] | null {
  const body = JSON.stringify({ model: 'text-embedding-3-small', input: text.replace(/\n/g, ' ') })
  fs.writeFileSync('/tmp/embed_req.json', body)

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = execSync(
        `curl -s --max-time 30 https://api.openai.com/v1/embeddings -H "Authorization: Bearer ${OPENAI_KEY}" -H "Content-Type: application/json" -d @/tmp/embed_req.json`,
        { encoding: 'utf-8', timeout: 35000 }
      )
      const parsed = JSON.parse(result)
      if (parsed.data?.[0]?.embedding) return parsed.data[0].embedding
    } catch {}
    if (attempt < 2) { try { execSync('sleep 2') } catch {} }
  }
  return null
}

function curlSupabaseInsert(data: Record<string, unknown>): boolean {
  fs.writeFileSync('/tmp/supa_req.json', JSON.stringify(data))
  try {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${SUPABASE_URL}/rest/v1/biblia" -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" -d @/tmp/supa_req.json`,
      { encoding: 'utf-8', timeout: 20000 }
    )
    const code = result.trim()
    return code === '201' || code === '200'
  } catch {
    return false
  }
}

function main() {
  const jsonPath = path.join(__dirname, 'data', 'biblia-structured.json')
  const verses: Verse[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const start = parseInt(process.argv[2] || '0', 10)

  console.log(`=== Ingestão Bíblia: ${verses.length} versículos (iniciando em ${start}) ===`)

  let inserted = 0
  let errors = 0

  for (let i = start; i < verses.length; i++) {
    const v = verses[i]

    if (i % 50 === 0 || i === start) {
      console.log(`[${i}/${verses.length}] ${v.reference} (ok: ${inserted}, err: ${errors})`)
    }

    const embedding = curlEmbedding(v.text)
    if (!embedding) {
      errors++
      continue
    }

    const ok = curlSupabaseInsert({
      book: v.book,
      book_abbr: v.book_abbr,
      chapter: v.chapter,
      verse: v.verse,
      reference: v.reference,
      text_pt: v.text,
      testament: v.testament,
      embedding,
    })

    if (ok) inserted++
    else errors++
  }

  console.log(`\n=== Concluído: ${inserted} inseridos, ${errors} erros ===`)
}

main()
