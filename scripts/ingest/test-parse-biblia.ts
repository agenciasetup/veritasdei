import fs from 'fs'
import { PDFParse } from 'pdf-parse'

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

function romanToInt(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let result = 0
  const s = roman.toUpperCase().replace(/\s/g, '')
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]] || 0
    const next = map[s[i + 1]] || 0
    if (cur < next) result -= cur
    else result += cur
  }
  return result
}

interface ParsedVerse { ch: number; v: number; text: string }

function parseBookText(bookText: string): ParsedVerse[] {
  const lines = bookText.split('\n')
  const verses: ParsedVerse[] = []
  let chapter = 0
  let lastVerse = 0
  let inCommentary = false
  let pendingV = 0
  let pendingText = ''

  function flush() {
    if (pendingV > 0 && pendingText && chapter > 0) {
      const clean = pendingText.replace(/\s+/g, ' ').trim()
      if (clean.length > 5) {
        verses.push({ ch: chapter, v: pendingV, text: clean })
      }
    }
    pendingV = 0
    pendingText = ''
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.match(/^-- \d+ of/)) continue

    // Explicit chapter start: "CaP. X — 1 text..."
    const capBible = t.match(/^Ca[Pp]\.\s+([IVXLCDMivxlcdm\s]+)\s*[—–-]\s*(\d+)\s+(.+)/)
    if (capBible) {
      flush()
      chapter = romanToInt(capBible[1])
      pendingV = parseInt(capBible[2], 10)
      pendingText = capBible[3]
      lastVerse = pendingV
      inCommentary = false
      continue
    }

    // Commentary header: standalone "CAP. X"
    const capComm = t.match(/^CAP\.\s+([IVXLCDMivxlcdm\s]+)\.?\s*$/)
    if (capComm) {
      flush()
      // Use commentary chapter to track where we are
      const commCh = romanToInt(capComm[1])
      if (commCh > 0 && commCh >= chapter) {
        chapter = commCh
      }
      inCommentary = true
      lastVerse = 0
      continue
    }

    // In commentary: skip until verse line found
    if (inCommentary) {
      const mv = t.match(/^(\d{1,3})\s+[A-Za-záàãéêíóôõúç]/)
      if (mv && !t.match(/^\d{1,3}\.\s/)) {
        inCommentary = false
        // Fall through
      } else {
        continue
      }
    }

    // Skip short margin notes
    if (t.length < 12 && !t.match(/^\d{1,3}\s/)) continue

    // Verse at start of line
    const verseMatch = t.match(/^(\d{1,3})\s+(.+)/)
    if (verseMatch && !t.match(/^\d{1,3}\.\s/) && chapter > 0) {
      const vn = parseInt(verseMatch[1], 10)
      if (vn > 0 && vn < 200) {
        // Detect chapter change: verse number reset
        if (vn === 1 && lastVerse > 5) {
          flush()
          chapter++
          pendingV = vn
          pendingText = verseMatch[2]
          lastVerse = vn
          continue
        }

        // Normal verse
        if (vn >= lastVerse || vn === lastVerse + 1 || (vn > lastVerse - 3)) {
          flush()
          pendingV = vn
          pendingText = verseMatch[2]
          lastVerse = vn
          continue
        }
      }
    }

    // Continuation
    if (chapter > 0 && pendingV > 0) {
      pendingText += ' ' + t
    }
  }

  flush()
  return verses
}

async function main() {
  console.log('Reading PDF...')
  const buf = fs.readFileSync('scripts/ingest/data/biblia-matos-soares-1927.pdf')
  const parser = new PDFParse(new Uint8Array(buf))
  const result = await parser.getText()
  const fullText = result.text

  console.log(`PDF: ${result.total} pages, ${fullText.length} chars`)

  const bookPositions: { key: string; pos: number; info: typeof BOOK_MAP[string] }[] = []
  for (const [key, info] of Object.entries(BOOK_MAP)) {
    const idx = fullText.indexOf(key)
    if (idx >= 0) bookPositions.push({ key, pos: idx, info })
  }
  bookPositions.sort((a, b) => a.pos - b.pos)

  const seen = new Set<string>()
  const books = bookPositions.filter(bp => {
    if (seen.has(bp.info.abbr)) return false
    seen.add(bp.info.abbr)
    return true
  })

  let totalVerses = 0
  for (let b = 0; b < books.length; b++) {
    const book = books[b]
    const bookEnd = b + 1 < books.length ? books[b + 1].pos : fullText.length
    const bookText = fullText.substring(book.pos, bookEnd)
    const verses = parseBookText(bookText)
    const chapters = [...new Set(verses.map(v => v.ch))].sort((a, b2) => a - b2)

    if (verses.length > 0) {
      console.log(`${book.info.name} (${book.info.abbr}): ${verses.length} v, ${chapters.length} ch [${chapters[0]}-${chapters[chapters.length - 1]}]`)
    } else {
      console.log(`${book.info.name} (${book.info.abbr}): 0 verses`)
    }

    totalVerses += verses.length
  }

  console.log(`\nTOTAL: ${totalVerses} versículos, ${books.length} livros`)
}

main().catch(console.error)
