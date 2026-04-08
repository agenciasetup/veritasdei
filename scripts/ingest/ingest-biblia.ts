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

// Mapeamento de livros bíblicos para abreviações e testamento
const BOOKS: Record<string, { abbr: string; testament: 'AT' | 'NT' }> = {
  'Gênesis': { abbr: 'Gn', testament: 'AT' },
  'Êxodo': { abbr: 'Ex', testament: 'AT' },
  'Levítico': { abbr: 'Lv', testament: 'AT' },
  'Números': { abbr: 'Nm', testament: 'AT' },
  'Deuteronômio': { abbr: 'Dt', testament: 'AT' },
  'Josué': { abbr: 'Js', testament: 'AT' },
  'Juízes': { abbr: 'Jz', testament: 'AT' },
  'Rute': { abbr: 'Rt', testament: 'AT' },
  '1 Samuel': { abbr: '1Sm', testament: 'AT' },
  '2 Samuel': { abbr: '2Sm', testament: 'AT' },
  '1 Reis': { abbr: '1Rs', testament: 'AT' },
  '2 Reis': { abbr: '2Rs', testament: 'AT' },
  '1 Crônicas': { abbr: '1Cr', testament: 'AT' },
  '2 Crônicas': { abbr: '2Cr', testament: 'AT' },
  'Esdras': { abbr: 'Esd', testament: 'AT' },
  'Neemias': { abbr: 'Ne', testament: 'AT' },
  'Tobias': { abbr: 'Tb', testament: 'AT' },
  'Judite': { abbr: 'Jdt', testament: 'AT' },
  'Ester': { abbr: 'Est', testament: 'AT' },
  '1 Macabeus': { abbr: '1Mc', testament: 'AT' },
  '2 Macabeus': { abbr: '2Mc', testament: 'AT' },
  'Jó': { abbr: 'Jó', testament: 'AT' },
  'Salmos': { abbr: 'Sl', testament: 'AT' },
  'Provérbios': { abbr: 'Pr', testament: 'AT' },
  'Eclesiastes': { abbr: 'Ecl', testament: 'AT' },
  'Cântico dos Cânticos': { abbr: 'Ct', testament: 'AT' },
  'Sabedoria': { abbr: 'Sb', testament: 'AT' },
  'Eclesiástico': { abbr: 'Eclo', testament: 'AT' },
  'Isaías': { abbr: 'Is', testament: 'AT' },
  'Jeremias': { abbr: 'Jr', testament: 'AT' },
  'Lamentações': { abbr: 'Lm', testament: 'AT' },
  'Baruc': { abbr: 'Br', testament: 'AT' },
  'Ezequiel': { abbr: 'Ez', testament: 'AT' },
  'Daniel': { abbr: 'Dn', testament: 'AT' },
  'Oséias': { abbr: 'Os', testament: 'AT' },
  'Joel': { abbr: 'Jl', testament: 'AT' },
  'Amós': { abbr: 'Am', testament: 'AT' },
  'Abdias': { abbr: 'Ab', testament: 'AT' },
  'Jonas': { abbr: 'Jn', testament: 'AT' },
  'Miquéias': { abbr: 'Mq', testament: 'AT' },
  'Naum': { abbr: 'Na', testament: 'AT' },
  'Habacuc': { abbr: 'Hab', testament: 'AT' },
  'Sofonias': { abbr: 'Sf', testament: 'AT' },
  'Ageu': { abbr: 'Ag', testament: 'AT' },
  'Zacarias': { abbr: 'Zc', testament: 'AT' },
  'Malaquias': { abbr: 'Ml', testament: 'AT' },
  'Mateus': { abbr: 'Mt', testament: 'NT' },
  'Marcos': { abbr: 'Mc', testament: 'NT' },
  'Lucas': { abbr: 'Lc', testament: 'NT' },
  'João': { abbr: 'Jo', testament: 'NT' },
  'Atos dos Apóstolos': { abbr: 'At', testament: 'NT' },
  'Romanos': { abbr: 'Rm', testament: 'NT' },
  '1 Coríntios': { abbr: '1Cor', testament: 'NT' },
  '2 Coríntios': { abbr: '2Cor', testament: 'NT' },
  'Gálatas': { abbr: 'Gl', testament: 'NT' },
  'Efésios': { abbr: 'Ef', testament: 'NT' },
  'Filipenses': { abbr: 'Fl', testament: 'NT' },
  'Colossenses': { abbr: 'Cl', testament: 'NT' },
  '1 Tessalonicenses': { abbr: '1Ts', testament: 'NT' },
  '2 Tessalonicenses': { abbr: '2Ts', testament: 'NT' },
  '1 Timóteo': { abbr: '1Tm', testament: 'NT' },
  '2 Timóteo': { abbr: '2Tm', testament: 'NT' },
  'Tito': { abbr: 'Tt', testament: 'NT' },
  'Filêmon': { abbr: 'Fm', testament: 'NT' },
  'Hebreus': { abbr: 'Hb', testament: 'NT' },
  'Tiago': { abbr: 'Tg', testament: 'NT' },
  '1 Pedro': { abbr: '1Pd', testament: 'NT' },
  '2 Pedro': { abbr: '2Pd', testament: 'NT' },
  '1 João': { abbr: '1Jo', testament: 'NT' },
  '2 João': { abbr: '2Jo', testament: 'NT' },
  '3 João': { abbr: '3Jo', testament: 'NT' },
  'Judas': { abbr: 'Jd', testament: 'NT' },
  'Apocalipse': { abbr: 'Ap', testament: 'NT' },
}

interface BibleVerse {
  book: string
  bookAbbr: string
  chapter: number
  verse: number
  reference: string
  text: string
  testament: 'AT' | 'NT'
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  })
  return response.data[0].embedding
}

function parseVerses(fullText: string): BibleVerse[] {
  const verses: BibleVerse[] = []
  const lines = fullText.split('\n')

  let currentBook = ''
  let currentBookInfo = { abbr: '', testament: 'AT' as 'AT' | 'NT' }
  let currentChapter = 0

  // Regex para detectar início de capítulo: "CAPÍTULO X" ou "Capítulo X"
  const chapterRegex = /^(?:CAP[ÍI]TULO|Cap[ií]tulo)\s+(\d+)/i
  // Regex para detectar versículo: número seguido de texto
  const verseRegex = /^(\d+)\s+(.+)/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Detectar nome de livro
    for (const [bookName, info] of Object.entries(BOOKS)) {
      if (trimmed.toUpperCase() === bookName.toUpperCase() ||
          trimmed.startsWith(bookName.toUpperCase())) {
        currentBook = bookName
        currentBookInfo = info
        currentChapter = 0
        break
      }
    }

    // Detectar capítulo
    const chapterMatch = trimmed.match(chapterRegex)
    if (chapterMatch) {
      currentChapter = parseInt(chapterMatch[1], 10)
      continue
    }

    // Detectar versículo
    if (currentBook && currentChapter > 0) {
      const verseMatch = trimmed.match(verseRegex)
      if (verseMatch) {
        const verseNum = parseInt(verseMatch[1], 10)
        const text = verseMatch[2].trim()

        if (verseNum > 0 && verseNum < 200 && text.length > 3) {
          verses.push({
            book: currentBook,
            bookAbbr: currentBookInfo.abbr,
            chapter: currentChapter,
            verse: verseNum,
            reference: `${currentBookInfo.abbr} ${currentChapter},${verseNum}`,
            text,
            testament: currentBookInfo.testament,
          })
        }
      }
    }
  }

  return verses
}

async function insertBatch(verses: BibleVerse[]): Promise<number> {
  let inserted = 0

  for (const verse of verses) {
    const embedding = await generateEmbedding(verse.text)

    const { error } = await supabase
      .from('biblia')
      .upsert(
        {
          book: verse.book,
          book_abbr: verse.bookAbbr,
          chapter: verse.chapter,
          verse: verse.verse,
          reference: verse.reference,
          text_pt: verse.text,
          testament: verse.testament,
          embedding,
        },
        { onConflict: 'reference' }
      )

    if (error) {
      console.error(`  Erro ao inserir ${verse.reference}:`, error.message)
    } else {
      inserted++
    }
  }

  return inserted
}

async function main() {
  const pdfPath = path.join(__dirname, 'data', 'biblia-matos-soares-1927.pdf')

  if (!fs.existsSync(pdfPath)) {
    console.error(`Arquivo não encontrado: ${pdfPath}`)
    console.error('Coloque o PDF da Bíblia em scripts/ingest/data/biblia-matos-soares-1927.pdf')
    process.exit(1)
  }

  console.log('Lendo PDF da Bíblia...')
  const buffer = fs.readFileSync(pdfPath)
  const data = await pdfParse(buffer)

  console.log(`PDF lido: ${data.numpages} páginas`)
  console.log('Extraindo versículos...')

  const verses = parseVerses(data.text)
  console.log(`${verses.length} versículos encontrados`)

  if (verses.length === 0) {
    console.error('Nenhum versículo detectado. Verifique o formato do PDF.')
    process.exit(1)
  }

  // Inserir em batches
  let totalInserted = 0
  for (let i = 0; i < verses.length; i += BATCH_SIZE) {
    const batch = verses.slice(i, i + BATCH_SIZE)
    const firstVerse = batch[0]
    console.log(`[${firstVerse.book}] Capítulo ${firstVerse.chapter} — processando batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(verses.length / BATCH_SIZE)}...`)

    const inserted = await insertBatch(batch)
    totalInserted += inserted
    console.log(`  ${inserted} versículos inseridos (total: ${totalInserted})`)
  }

  console.log(`\nIngestão completa: ${totalInserted} versículos inseridos na tabela biblia.`)
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
