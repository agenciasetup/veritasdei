import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_KEY })

interface PatristicEntry {
  author: string
  author_years: string
  work: string
  chapter: string
  reference: string
  text: string
  verified: boolean
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  })
  return response.data[0].embedding
}

async function main() {
  const seedPath = path.join(__dirname, 'data', 'patristica-seed.json')

  if (!fs.existsSync(seedPath)) {
    console.error(`Arquivo não encontrado: ${seedPath}`)
    process.exit(1)
  }

  const rawData = fs.readFileSync(seedPath, 'utf-8')
  const entries: PatristicEntry[] = JSON.parse(rawData)

  console.log(`${entries.length} citações patrísticas encontradas no seed`)

  let inserted = 0
  for (const entry of entries) {
    console.log(`Processando: ${entry.reference}...`)

    const embedding = await generateEmbedding(entry.text)

    const { error } = await supabase
      .from('patristica')
      .upsert(
        {
          author: entry.author,
          author_years: entry.author_years,
          work: entry.work,
          chapter: entry.chapter,
          reference: entry.reference,
          text: entry.text,
          verified: entry.verified,
          embedding,
        },
        { onConflict: 'reference' }
      )

    if (error) {
      console.error(`  Erro ao inserir ${entry.reference}:`, error.message)
    } else {
      inserted++
      console.log(`  ✓ Inserido`)
    }
  }

  console.log(`\nIngestão completa: ${inserted}/${entries.length} citações patrísticas inseridas.`)
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
