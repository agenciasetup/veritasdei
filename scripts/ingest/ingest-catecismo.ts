import fs from 'fs'
import path from 'path'
import pdfParse from 'pdf-parse'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!
const BATCH_SIZE = 50

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_KEY })

interface CatechismParagraph {
  paragraph: number
  text: string
  section: string
  part: string
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  })
  return response.data[0].embedding
}

function parseCatechism(fullText: string): CatechismParagraph[] {
  const paragraphs: CatechismParagraph[] = []

  let currentPart = ''
  let currentSection = ''

  // Regex para parágrafos do Catecismo: § número ou número.
  const paragraphRegex = /(?:§\s*(\d+)|^(\d{1,4})\.\s)/gm

  // Detectar partes e seções
  const partRegex = /((?:Primeira|Segunda|Terceira|Quarta)\s+Parte[^]*?)(?=\n)/gi
  const sectionRegex = /((?:Seção|Secção|Capítulo|Artigo)\s+\d*[^]*?)(?=\n)/gi

  const lines = fullText.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Detectar parte
    const partMatch = line.match(/(Primeira|Segunda|Terceira|Quarta)\s+Parte/i)
    if (partMatch) {
      currentPart = line
    }

    // Detectar seção
    const sectionMatch = line.match(/^(Seção|Secção|Capítulo|Artigo)\s+/i)
    if (sectionMatch) {
      currentSection = line
    }

    // Detectar parágrafo: § seguido de número
    const paraMatch = line.match(/^§?\s*(\d{1,4})[\.\s](.+)/)
    if (paraMatch) {
      const paraNum = parseInt(paraMatch[1], 10)

      // Catecismo vai de § 1 até § 2865
      if (paraNum >= 1 && paraNum <= 2865) {
        let text = paraMatch[2].trim()

        // Acumular linhas seguintes que não começam com novo parágrafo
        let j = i + 1
        while (j < lines.length) {
          const nextLine = lines[j].trim()
          if (!nextLine) { j++; continue }
          // Se próxima linha começa com § ou número de parágrafo, parar
          if (nextLine.match(/^§?\s*\d{1,4}[\.\s]/)) break
          // Se é título de parte/seção, parar
          if (nextLine.match(/(Primeira|Segunda|Terceira|Quarta)\s+Parte/i)) break
          if (nextLine.match(/^(Seção|Secção|Capítulo|Artigo)\s+/i)) break
          text += ' ' + nextLine
          j++
        }

        if (text.length > 10) {
          paragraphs.push({
            paragraph: paraNum,
            text: text.slice(0, 2000), // limitar tamanho para embedding
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

async function insertBatch(paragraphs: CatechismParagraph[]): Promise<number> {
  let inserted = 0

  for (const para of paragraphs) {
    const embedding = await generateEmbedding(para.text)

    const { error } = await supabase
      .from('catecismo')
      .upsert(
        {
          paragraph: para.paragraph,
          text: para.text,
          section: para.section || null,
          part: para.part || null,
          source: 'CIC',
          embedding,
        },
        { onConflict: 'paragraph' }
      )

    if (error) {
      console.error(`  Erro ao inserir § ${para.paragraph}:`, error.message)
    } else {
      inserted++
    }
  }

  return inserted
}

async function main() {
  const pdfPath = path.join(__dirname, 'data', 'catecismo-igreja-catolica.pdf')

  if (!fs.existsSync(pdfPath)) {
    console.error(`Arquivo não encontrado: ${pdfPath}`)
    console.error('Coloque o PDF do Catecismo em scripts/ingest/data/catecismo-igreja-catolica.pdf')
    process.exit(1)
  }

  console.log('Lendo PDF do Catecismo...')
  const buffer = fs.readFileSync(pdfPath)
  const data = await pdfParse(buffer)

  console.log(`PDF lido: ${data.numpages} páginas`)
  console.log('Extraindo parágrafos...')

  const paragraphs = parseCatechism(data.text)
  console.log(`${paragraphs.length} parágrafos encontrados`)

  if (paragraphs.length === 0) {
    console.error('Nenhum parágrafo detectado. Verifique o formato do PDF.')
    process.exit(1)
  }

  // Inserir em batches
  let totalInserted = 0
  for (let i = 0; i < paragraphs.length; i += BATCH_SIZE) {
    const batch = paragraphs.slice(i, i + BATCH_SIZE)
    console.log(`Processando batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(paragraphs.length / BATCH_SIZE)} (§ ${batch[0].paragraph}–§ ${batch[batch.length - 1].paragraph})...`)

    const inserted = await insertBatch(batch)
    totalInserted += inserted
    console.log(`  ${inserted} parágrafos inseridos (total: ${totalInserted})`)
  }

  console.log(`\nIngestão completa: ${totalInserted} parágrafos inseridos na tabela catecismo.`)
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
