import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { PDFParse } from 'pdf-parse'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!

const BOOK_MAP: Record<string, { name: string; abbr: string; testament: 'AT' | 'NT' }> = {
  'GENESIS': { name: 'Gênesis', abbr: 'Gn', testament: 'AT' },
  'EXODO': { name: 'Êxodo', abbr: 'Ex', testament: 'AT' },
  'LEVITICO': { name: 'Levítico', abbr: 'Lv', testament: 'AT' },
  'NUMEROS': { name: 'Números', abbr: 'Nm', testament: 'AT' },
  'DEUTERONOMIO': { name: 'Deuteronômio', abbr: 'Dt', testament: 'AT' },
  'JOSUE': { name: 'Josué', abbr: 'Js', testament: 'AT' },
  'JUIZES': { name: 'Juízes', abbr: 'Jz', testament: 'AT' },
  'RUTH': { name: 'Rute', abbr: 'Rt', testament: 'AT' },
  'I SAMUEL': { name: '1 Samuel', abbr: '1Sm', testament: 'AT' },
  'II SAMUEL': { name: '2 Samuel', abbr: '2Sm', testament: 'AT' },
  'I REIS': { name: '1 Reis', abbr: '1Rs', testament: 'AT' },
  'II REIS': { name: '2 Reis', abbr: '2Rs', testament: 'AT' },
  'I PARALIPOMENOS': { name: '1 Crônicas', abbr: '1Cr', testament: 'AT' },
  'II PARALIPOMENOS': { name: '2 Crônicas', abbr: '2Cr', testament: 'AT' },
  'ESDRAS': { name: 'Esdras', abbr: 'Esd', testament: 'AT' },
  'NEHEMIAS': { name: 'Neemias', abbr: 'Ne', testament: 'AT' },
  'TOBIAS': { name: 'Tobias', abbr: 'Tb', testament: 'AT' },
  'JUDITH': { name: 'Judite', abbr: 'Jdt', testament: 'AT' },
  'ESTHER': { name: 'Ester', abbr: 'Est', testament: 'AT' },
  'I MACHABEUS': { name: '1 Macabeus', abbr: '1Mc', testament: 'AT' },
  'II MACHABEUS': { name: '2 Macabeus', abbr: '2Mc', testament: 'AT' },
  'JOB': { name: 'Jó', abbr: 'Jó', testament: 'AT' },
  'PSALMOS': { name: 'Salmos', abbr: 'Sl', testament: 'AT' },
  'PROVERBIOS': { name: 'Provérbios', abbr: 'Pr', testament: 'AT' },
  'ECCLESIASTES': { name: 'Eclesiastes', abbr: 'Ecl', testament: 'AT' },
  'CANTICO DOS CANTICOS': { name: 'Cântico dos Cânticos', abbr: 'Ct', testament: 'AT' },
  'SABEDORIA': { name: 'Sabedoria', abbr: 'Sb', testament: 'AT' },
  'ECCLESIASTICO': { name: 'Eclesiástico', abbr: 'Eclo', testament: 'AT' },
  'ISAIAS': { name: 'Isaías', abbr: 'Is', testament: 'AT' },
  'JEREMIAS': { name: 'Jeremias', abbr: 'Jr', testament: 'AT' },
  'LAMENTAÇÕES': { name: 'Lamentações', abbr: 'Lm', testament: 'AT' },
  'BARUCH': { name: 'Baruc', abbr: 'Br', testament: 'AT' },
  'EZECHIEL': { name: 'Ezequiel', abbr: 'Ez', testament: 'AT' },
  'DANIEL': { name: 'Daniel', abbr: 'Dn', testament: 'AT' },
  'OSEAS': { name: 'Oséias', abbr: 'Os', testament: 'AT' },
  'JOEL': { name: 'Joel', abbr: 'Jl', testament: 'AT' },
  'AMOS': { name: 'Amós', abbr: 'Am', testament: 'AT' },
  'ABDIAS': { name: 'Abdias', abbr: 'Ab', testament: 'AT' },
  'JONAS': { name: 'Jonas', abbr: 'Jn', testament: 'AT' },
  'MICHEAS': { name: 'Miquéias', abbr: 'Mq', testament: 'AT' },
  'NAHUM': { name: 'Naum', abbr: 'Na', testament: 'AT' },
  'HABACUC': { name: 'Habacuc', abbr: 'Hab', testament: 'AT' },
  'SOPHONIAS': { name: 'Sofonias', abbr: 'Sf', testament: 'AT' },
  'AGGEU': { name: 'Ageu', abbr: 'Ag', testament: 'AT' },
  'ZACHARIAS': { name: 'Zacarias', abbr: 'Zc', testament: 'AT' },
  'MALACHIAS': { name: 'Malaquias', abbr: 'Ml', testament: 'AT' },
  'S. MATEUS': { name: 'Mateus', abbr: 'Mt', testament: 'NT' },
  'S. MARCOS': { name: 'Marcos', abbr: 'Mc', testament: 'NT' },
  'S. LUCAS': { name: 'Lucas', abbr: 'Lc', testament: 'NT' },
  'S. JOÃO': { name: 'João', abbr: 'Jo', testament: 'NT' },
  'ACTOS': { name: 'Atos dos Apóstolos', abbr: 'At', testament: 'NT' },
  'ROMANOS': { name: 'Romanos', abbr: 'Rm', testament: 'NT' },
  'I CORINTHOS': { name: '1 Coríntios', abbr: '1Cor', testament: 'NT' },
  'II CORINTHOS': { name: '2 Coríntios', abbr: '2Cor', testament: 'NT' },
  'GALATAS': { name: 'Gálatas', abbr: 'Gl', testament: 'NT' },
  'EPHESIOS': { name: 'Efésios', abbr: 'Ef', testament: 'NT' },
  'PHILIPPENSES': { name: 'Filipenses', abbr: 'Fl', testament: 'NT' },
  'COLOSSENSES': { name: 'Colossenses', abbr: 'Cl', testament: 'NT' },
  'I THESSALONICENSES': { name: '1 Tessalonicenses', abbr: '1Ts', testament: 'NT' },
  'II THESSALONICENSES': { name: '2 Tessalonicenses', abbr: '2Ts', testament: 'NT' },
  'I TIMOTHEO': { name: '1 Timóteo', abbr: '1Tm', testament: 'NT' },
  'II TIMOTHEO': { name: '2 Timóteo', abbr: '2Tm', testament: 'NT' },
  'TITO': { name: 'Tito', abbr: 'Tt', testament: 'NT' },
  'PHILEMON': { name: 'Filêmon', abbr: 'Fm', testament: 'NT' },
  'HEBREUS': { name: 'Hebreus', abbr: 'Hb', testament: 'NT' },
  'THIAGO': { name: 'Tiago', abbr: 'Tg', testament: 'NT' },
  'I PEDRO': { name: '1 Pedro', abbr: '1Pd', testament: 'NT' },
  'II PEDRO': { name: '2 Pedro', abbr: '2Pd', testament: 'NT' },
  'I JOÃO': { name: '1 João', abbr: '1Jo', testament: 'NT' },
  'II JOÃO': { name: '2 João', abbr: '2Jo', testament: 'NT' },
  'III JOÃO': { name: '3 João', abbr: '3Jo', testament: 'NT' },
  'JUDAS': { name: 'Judas', abbr: 'Jd', testament: 'NT' },
  'APOCALYPSE': { name: 'Apocalipse', abbr: 'Ap', testament: 'NT' },
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

function romanToInt(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let result = 0
  const s = roman.toUpperCase().replace(/\s/g, '').trim()
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]] || 0
    const next = map[s[i + 1]] || 0
    if (cur < next) result -= cur
    else result += cur
  }
  return result
}

function parseBible(fullText: string): BibleVerse[] {
  const verses: BibleVerse[] = []

  // Find book positions
  const bookPositions: { key: string; pos: number; info: typeof BOOK_MAP[string] }[] = []
  for (const [key, info] of Object.entries(BOOK_MAP)) {
    const idx = fullText.indexOf(key)
    if (idx >= 0) {
      bookPositions.push({ key, pos: idx, info })
    }
  }
  bookPositions.sort((a, b) => a.pos - b.pos)

  // Remove duplicates where same abbreviation appears twice (e.g. MATEUS vs S. MATEUS)
  const seen = new Set<string>()
  const uniqueBooks = bookPositions.filter(bp => {
    if (seen.has(bp.info.abbr)) return false
    seen.add(bp.info.abbr)
    return true
  })

  console.log(`${uniqueBooks.length} livros detectados`)

  for (let b = 0; b < uniqueBooks.length; b++) {
    const book = uniqueBooks[b]
    const bookEnd = b + 1 < uniqueBooks.length ? uniqueBooks[b + 1].pos : fullText.length
    const bookText = fullText.substring(book.pos, bookEnd)
    const lines = bookText.split('\n')

    let currentChapter = 0
    let inCommentary = false
    let pendingText = ''
    let pendingVerse = 0
    let bookVerses = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Skip page markers
      if (line.match(/^-- \d+ of \d+ --$/)) continue

      // Skip margin annotations (short single words like "Primeiro", "dia da", "criação.")
      if (line.length < 15 && !line.match(/^\d/) && !line.match(/^Ca[Pp]\./i)) continue

      // Detect chapter start in Bible text: "Cap. X — 1 text..."
      const capBibleMatch = line.match(/^Ca[Pp]\.\s+([IVXLCDMivxlcdm\s]+)\s*[—–-]\s*(\d+)\s+(.+)/)
      if (capBibleMatch) {
        // Flush pending verse
        if (pendingVerse > 0 && pendingText && currentChapter > 0) {
          verses.push(makeVerse(book.info, currentChapter, pendingVerse, pendingText))
          bookVerses++
        }
        currentChapter = romanToInt(capBibleMatch[1])
        pendingVerse = parseInt(capBibleMatch[2], 10)
        pendingText = capBibleMatch[3].trim()
        inCommentary = false
        continue
      }

      // Detect standalone commentary header: "CAP. X" (just the header, no verse text)
      const capCommentaryMatch = line.match(/^CAP\.\s+([IVXLCDMivxlcdm\s]+)\.?\s*$/)
      if (capCommentaryMatch) {
        // Flush pending verse before entering commentary
        if (pendingVerse > 0 && pendingText && currentChapter > 0) {
          verses.push(makeVerse(book.info, currentChapter, pendingVerse, pendingText))
          bookVerses++
          pendingVerse = 0
          pendingText = ''
        }
        // Set chapter from commentary header (useful when Bible text doesn't have explicit Cap.)
        const commentCh = romanToInt(capCommentaryMatch[1])
        if (commentCh > 0) currentChapter = commentCh
        inCommentary = true
        continue
      }

      // Skip commentary lines (those starting with "number." pattern)
      if (inCommentary) {
        // Commentary ends when we see a new verse line or page reference pattern
        // Check if this line starts a new verse (number without period)
        if (line.match(/^\d{1,3}\s+[A-Za-záàãéêíóôõúçÁÀÃÉÊÍÓÔÕÚÇ]/) && !line.match(/^\d{1,3}\./)) {
          inCommentary = false
          // Fall through to verse detection below
        } else {
          continue
        }
      }

      // Detect verse at start of line: "2 A terra..." (no period after number)
      const verseStartMatch = line.match(/^(\d{1,3})\s+([A-Za-záàãéêíóôõúçÁÀÃÉÊÍÓÔÕÚÇ("].+)/)
      if (verseStartMatch && !line.match(/^\d{1,3}\./) && currentChapter > 0) {
        const vNum = parseInt(verseStartMatch[1], 10)
        if (vNum > 0 && vNum < 200) {
          // Flush previous pending verse
          if (pendingVerse > 0 && pendingText) {
            verses.push(makeVerse(book.info, currentChapter, pendingVerse, pendingText))
            bookVerses++
          }
          pendingVerse = vNum
          pendingText = verseStartMatch[2].trim()
          continue
        }
      }

      // Handle inline verse numbers in middle of lines: "... text. 4 E Deus..."
      if (currentChapter > 0 && pendingVerse > 0) {
        // Check for inline verse numbers
        const inlinePattern = /\.\s+(\d{1,3})\s+([A-Za-záàãéêíóôõúçÁÀÃÉÊÍÓÔÕÚÇ("])/g
        let match
        let lastEnd = 0
        let foundInline = false

        while ((match = inlinePattern.exec(line)) !== null) {
          const inlineVNum = parseInt(match[1], 10)
          if (inlineVNum > 0 && inlineVNum < 200 && inlineVNum > pendingVerse) {
            // Add text before this inline verse to pending
            const beforeText = line.substring(lastEnd, match.index + 1).trim()
            if (beforeText) pendingText += ' ' + beforeText

            // Flush pending verse
            verses.push(makeVerse(book.info, currentChapter, pendingVerse, pendingText))
            bookVerses++

            // Start new pending verse
            pendingVerse = inlineVNum
            pendingText = match[2]
            lastEnd = match.index + match[0].length
            foundInline = true
          }
        }

        if (foundInline) {
          // Add remaining text after last inline verse
          const remaining = line.substring(lastEnd).trim()
          if (remaining) pendingText += remaining
        } else {
          // Continuation line - append to pending verse
          if (pendingVerse > 0) {
            pendingText += ' ' + line
          }
        }
      }
    }

    // Flush last pending verse for this book
    if (pendingVerse > 0 && pendingText && currentChapter > 0) {
      verses.push(makeVerse(book.info, currentChapter, pendingVerse, pendingText))
      bookVerses++
    }

    if (bookVerses > 0) {
      console.log(`  ${book.info.name}: ${bookVerses} versículos`)
    }
  }

  return verses
}

function makeVerse(info: typeof BOOK_MAP[string], chapter: number, verse: number, text: string): BibleVerse {
  // Clean up text
  let clean = text.replace(/\s+/g, ' ').trim()
  // Remove trailing partial words from line breaks
  clean = clean.replace(/\s+$/, '')
  // Limit size
  if (clean.length > 2000) clean = clean.substring(0, 2000)

  return {
    book: info.name,
    bookAbbr: info.abbr,
    chapter,
    verse,
    reference: `${info.abbr} ${chapter},${verse}`,
    text: clean,
    testament: info.testament,
  }
}

function curlEmbedding(text: string): number[] {
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
    if (attempt < 2) execSync('sleep 2')
  }
  throw new Error('Embedding failed after 3 attempts')
}

function curlSupabaseInsert(data: Record<string, unknown>): boolean {
  fs.writeFileSync('/tmp/supa_req.json', JSON.stringify(data))
  try {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${SUPABASE_URL}/rest/v1/biblia" -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" -d @/tmp/supa_req.json`,
      { encoding: 'utf-8', timeout: 20000 }
    )
    return result.trim() === '201' || result.trim() === '200'
  } catch {
    return false
  }
}

async function main() {
  const pdfPath = path.join(__dirname, 'data', 'biblia-matos-soares-1927.pdf')
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF não encontrado:', pdfPath)
    process.exit(1)
  }

  console.log('Lendo PDF da Bíblia (47MB, aguarde)...')
  const buffer = fs.readFileSync(pdfPath)
  const uint8 = new Uint8Array(buffer)
  const parser = new PDFParse(uint8)
  const result = await parser.getText()

  console.log(`PDF lido: ${result.total} páginas`)
  console.log('Extraindo versículos...')

  const verses = parseBible(result.text)
  console.log(`\nTotal: ${verses.length} versículos extraídos`)

  if (verses.length === 0) {
    console.error('Nenhum versículo detectado.')
    process.exit(1)
  }

  // Show samples
  console.log('\nAmostras:')
  for (const v of verses.slice(0, 3)) {
    console.log(`  ${v.reference}: ${v.text.substring(0, 100)}`)
  }

  // Deduplicate by reference (keep first occurrence)
  const seen = new Map<string, boolean>()
  const uniqueVerses = verses.filter(v => {
    if (seen.has(v.reference)) return false
    seen.set(v.reference, true)
    return true
  })
  console.log(`${uniqueVerses.length} versículos únicos (${verses.length - uniqueVerses.length} duplicados removidos)`)

  let totalInserted = 0
  let errors = 0
  for (let i = 0; i < uniqueVerses.length; i++) {
    const v = uniqueVerses[i]
    if (i % 100 === 0) {
      console.log(`[${i + 1}/${uniqueVerses.length}] ${v.reference} (inseridos: ${totalInserted}, erros: ${errors})`)
    }

    try {
      const embedding = curlEmbedding(v.text)
      const ok = curlSupabaseInsert({
        book: v.book,
        book_abbr: v.bookAbbr,
        chapter: v.chapter,
        verse: v.verse,
        reference: v.reference,
        text_pt: v.text,
        testament: v.testament,
        embedding,
      })
      if (ok) totalInserted++
      else errors++
    } catch {
      errors++
    }
  }

  console.log(`\nIngestão completa: ${totalInserted}/${uniqueVerses.length} versículos (${errors} erros).`)
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
