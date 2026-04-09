import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { PDFParse } from 'pdf-parse'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!
const BATCH_SIZE = 20

interface CatechismParagraph {
  paragraph: number
  text: string
  section: string
  part: string
}

function curlEmbedding(text: string): number[] {
  const input = text.replace(/\n/g, ' ').replace(/'/g, "'\\''")
  const body = JSON.stringify({ model: 'text-embedding-3-small', input: input })
  const tmpFile = '/tmp/embed_req.json'
  fs.writeFileSync(tmpFile, body)

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = execSync(
        `curl -s --max-time 30 https://api.openai.com/v1/embeddings -H "Authorization: Bearer ${OPENAI_KEY}" -H "Content-Type: application/json" -d @${tmpFile}`,
        { encoding: 'utf-8', timeout: 35000 }
      )
      const parsed = JSON.parse(result)
      if (parsed.data?.[0]?.embedding) {
        return parsed.data[0].embedding
      }
      console.error('  API response sem embedding:', JSON.stringify(parsed).substring(0, 200))
    } catch (e: any) {
      console.error(`  Tentativa ${attempt + 1} falhou:`, e.message?.substring(0, 100))
    }
    if (attempt < 2) execSync('sleep 2')
  }
  throw new Error('Falha ao gerar embedding após 3 tentativas')
}

function curlSupabaseInsert(table: string, data: Record<string, unknown>): boolean {
  const body = JSON.stringify(data)
  const tmpFile = '/tmp/supa_req.json'
  fs.writeFileSync(tmpFile, body)

  try {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${SUPABASE_URL}/rest/v1/${table}" -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" -d @${tmpFile}`,
      { encoding: 'utf-8', timeout: 20000 }
    )
    return result.trim() === '201' || result.trim() === '200'
  } catch {
    return false
  }
}

function parseCatechism(fullText: string): CatechismParagraph[] {
  const paragraphs: CatechismParagraph[] = []
  let currentPart = ''
  let currentSection = ''
  const lines = fullText.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    const partMatch = line.match(/(Primeira|Segunda|Terceira|Quarta)\s+Parte/i)
    if (partMatch) currentPart = line

    const sectionMatch = line.match(/^(Seção|Secção|Capítulo|Artigo)\s+/i)
    if (sectionMatch) currentSection = line

    const paraMatch = line.match(/^§?\s*(\d{1,4})[\.\s](.+)/)
    if (paraMatch) {
      const paraNum = parseInt(paraMatch[1], 10)
      if (paraNum >= 1 && paraNum <= 2865) {
        let text = paraMatch[2].trim()
        let j = i + 1
        while (j < lines.length) {
          const nextLine = lines[j].trim()
          if (!nextLine) { j++; continue }
          if (nextLine.match(/^§?\s*\d{1,4}[\.\s]/)) break
          if (nextLine.match(/(Primeira|Segunda|Terceira|Quarta)\s+Parte/i)) break
          if (nextLine.match(/^(Seção|Secção|Capítulo|Artigo)\s+/i)) break
          text += ' ' + nextLine
          j++
        }
        if (text.length > 10) {
          paragraphs.push({
            paragraph: paraNum,
            text: text.slice(0, 2000),
            section: currentSection,
            part: currentPart,
          })
        }
        i = j
        continue
      }
    }
    i++
  }
  return paragraphs
}

async function main() {
  const pdfPath = path.join(__dirname, 'data', 'catecismo-igreja-catolica.pdf')
  if (!fs.existsSync(pdfPath)) {
    console.error(`Arquivo não encontrado: ${pdfPath}`)
    process.exit(1)
  }

  console.log('Lendo PDF do Catecismo...')
  const buffer = fs.readFileSync(pdfPath)
  const uint8 = new Uint8Array(buffer)
  const parser = new PDFParse(uint8)
  const result = await parser.getText()

  console.log(`PDF lido: ${result.total} páginas`)
  console.log('Extraindo parágrafos...')

  const paragraphs = parseCatechism(result.text)
  console.log(`${paragraphs.length} parágrafos encontrados`)

  if (paragraphs.length === 0) {
    console.error('Nenhum parágrafo detectado.')
    process.exit(1)
  }

  let totalInserted = 0
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    process.stdout.write(`[${i + 1}/${paragraphs.length}] § ${para.paragraph}... `)

    try {
      const embedding = curlEmbedding(para.text)
      const ok = curlSupabaseInsert('catecismo', {
        paragraph: para.paragraph,
        text: para.text,
        section: para.section || null,
        part: para.part || null,
        source: 'CIC',
        embedding,
      })

      if (ok) {
        totalInserted++
        console.log('OK')
      } else {
        console.log('ERRO Supabase')
      }
    } catch (e: any) {
      console.log('ERRO:', e.message?.substring(0, 80))
    }
  }

  console.log(`\nIngestão completa: ${totalInserted}/${paragraphs.length} parágrafos inseridos.`)
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
