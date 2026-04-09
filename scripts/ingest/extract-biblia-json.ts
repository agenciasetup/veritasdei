/**
 * Sprint 1: Extrai a Bíblia Matos Soares 1927 do PDF para JSON estruturado.
 *
 * Estratégia:
 * 1. Busca todas as posições de livros no texto completo (usando markers conhecidos)
 * 2. Divide o texto por livro
 * 3. Dentro de cada livro, extrai capítulos e versículos
 * 4. Salva JSON limpo
 */
import fs from 'fs'
import path from 'path'
import { PDFParse } from 'pdf-parse'

// ─── Markers de cada livro no PDF (como aparecem no texto) ───────────────────
// Cada entry: [searchString, bookKey]
// A searchString é o texto que aparece no PDF no início de cada livro
const BOOK_MARKERS: [string, string][] = [
  ['GENESIS\nPRI', 'GENESIS'],
  ['EXODO\n', 'EXODO'],
  ['LEVITICO\nPRIMEIRA', 'LEVITICO'],
  ['NÚMEROS\nP', 'NUMEROS'],
  ['DEUTERONOMIO\nPRIMEIRA', 'DEUTERONOMIO'],
  ['JOSUÉ\nE', 'JOSUE'],
  ['JUIZES\nS', 'JUIZES'],
  ['RUTH\n', 'RUTH'],
  // Samuel = "I Reis" na Vulgata. Buscar contexto
  ['REIS, I,', 'I_SAMUEL_HEADER'],  // será tratado especialmente
  ['SAMUEL\nPRIMEIRA PARTE\nDavid reina em Hebron', 'II SAMUEL'],
  // III e IV Reis = 1 e 2 Reis modernos
  ['ESDRAS\nOs dois livros', 'ESDRAS'],
  ['LIVRO DE NEEMIAS', 'NEHEMIAS'],
  ['TOBIAS\nEste livro', 'TOBIAS'],
  ['JUDITH\n', 'JUDITH'],
  ['ESTHER\n', 'ESTHER'],
  // Macabeus
  ['JOB E OS SEUS AMIGOS', 'JOB'],
  // Salmos
  ['PROFECIA DE ISAÍAS', 'ISAIAS'],
  ['JEREMIAS\nJeremias', 'JEREMIAS'],
  ['EZECHIEL\n', 'EZECHIEL'],
  ['DANIEL\nDaniel é', 'DANIEL'],
  ['JOEL\nTítulo', 'JOEL'],
  ['ABDIAS\n', 'ABDIAS'],
  ['JONAS\nEnviado', 'JONAS'],
  ['HABACUC\nHabacuc', 'HABACUC'],
  // NT
  ['MATEUS\nE X Ó R D I O', 'S. MATEUS'],
  ['MARCOS\nI N T R O D U', 'S. MARCOS'],
  ['LUCAS\nP R Ó L O G O', 'S. LUCAS'],
  ['JOÃO\nP R Ó L O G O', 'S. JOÃO'],
  ['ACTOS DOS APÓSTOLOS', 'ACTOS'],
  ['EPÍSTOLA DE S. PAULO\nA O S R O M A N O S', 'ROMANOS'],
  ['HEBREUS\nCristo é', 'HEBREUS'],
  ['PEDRO\nEsta epístola', 'I PEDRO'],
  ['APOCALYPSE', 'APOCALYPSE'],
]

const BOOK_INFO: Record<string, { name: string; abbr: string; testament: 'AT' | 'NT'; chapters: number }> = {
  'GENESIS': { name: 'Gênesis', abbr: 'Gn', testament: 'AT', chapters: 50 },
  'EXODO': { name: 'Êxodo', abbr: 'Ex', testament: 'AT', chapters: 40 },
  'LEVITICO': { name: 'Levítico', abbr: 'Lv', testament: 'AT', chapters: 27 },
  'NUMEROS': { name: 'Números', abbr: 'Nm', testament: 'AT', chapters: 36 },
  'DEUTERONOMIO': { name: 'Deuteronômio', abbr: 'Dt', testament: 'AT', chapters: 34 },
  'JOSUE': { name: 'Josué', abbr: 'Js', testament: 'AT', chapters: 24 },
  'JUIZES': { name: 'Juízes', abbr: 'Jz', testament: 'AT', chapters: 21 },
  'RUTH': { name: 'Rute', abbr: 'Rt', testament: 'AT', chapters: 4 },
  'I SAMUEL': { name: '1 Samuel', abbr: '1Sm', testament: 'AT', chapters: 31 },
  'II SAMUEL': { name: '2 Samuel', abbr: '2Sm', testament: 'AT', chapters: 24 },
  'I REIS': { name: '1 Reis', abbr: '1Rs', testament: 'AT', chapters: 22 },
  'II REIS': { name: '2 Reis', abbr: '2Rs', testament: 'AT', chapters: 25 },
  'ESDRAS': { name: 'Esdras', abbr: 'Esd', testament: 'AT', chapters: 10 },
  'NEHEMIAS': { name: 'Neemias', abbr: 'Ne', testament: 'AT', chapters: 13 },
  'TOBIAS': { name: 'Tobias', abbr: 'Tb', testament: 'AT', chapters: 14 },
  'JUDITH': { name: 'Judite', abbr: 'Jdt', testament: 'AT', chapters: 16 },
  'ESTHER': { name: 'Ester', abbr: 'Est', testament: 'AT', chapters: 10 },
  'JOB': { name: 'Jó', abbr: 'Jó', testament: 'AT', chapters: 42 },
  'ISAIAS': { name: 'Isaías', abbr: 'Is', testament: 'AT', chapters: 66 },
  'JEREMIAS': { name: 'Jeremias', abbr: 'Jr', testament: 'AT', chapters: 52 },
  'EZECHIEL': { name: 'Ezequiel', abbr: 'Ez', testament: 'AT', chapters: 48 },
  'DANIEL': { name: 'Daniel', abbr: 'Dn', testament: 'AT', chapters: 14 },
  'JOEL': { name: 'Joel', abbr: 'Jl', testament: 'AT', chapters: 4 },
  'ABDIAS': { name: 'Abdias', abbr: 'Ab', testament: 'AT', chapters: 1 },
  'JONAS': { name: 'Jonas', abbr: 'Jn', testament: 'AT', chapters: 4 },
  'HABACUC': { name: 'Habacuc', abbr: 'Hab', testament: 'AT', chapters: 3 },
  'S. MATEUS': { name: 'Mateus', abbr: 'Mt', testament: 'NT', chapters: 28 },
  'S. MARCOS': { name: 'Marcos', abbr: 'Mc', testament: 'NT', chapters: 16 },
  'S. LUCAS': { name: 'Lucas', abbr: 'Lc', testament: 'NT', chapters: 24 },
  'S. JOÃO': { name: 'João', abbr: 'Jo', testament: 'NT', chapters: 21 },
  'ACTOS': { name: 'Atos dos Apóstolos', abbr: 'At', testament: 'NT', chapters: 28 },
  'ROMANOS': { name: 'Romanos', abbr: 'Rm', testament: 'NT', chapters: 16 },
  'HEBREUS': { name: 'Hebreus', abbr: 'Hb', testament: 'NT', chapters: 13 },
  'I PEDRO': { name: '1 Pedro', abbr: '1Pd', testament: 'NT', chapters: 5 },
  'APOCALYPSE': { name: 'Apocalipse', abbr: 'Ap', testament: 'NT', chapters: 22 },
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

interface Verse {
  book: string
  book_abbr: string
  chapter: number
  verse: number
  reference: string
  text: string
  testament: 'AT' | 'NT'
}

function extractVersesFromSection(
  sectionText: string,
  bookKey: string
): Verse[] {
  const info = BOOK_INFO[bookKey]
  if (!info) return []

  const verses: Verse[] = []
  const lines = sectionText.split('\n')
  let chapter = 0
  let lastVerse = 0
  let inCommentary = false
  let pendingV = 0
  let pendingText = ''

  function flush() {
    if (pendingV > 0 && pendingText && chapter > 0) {
      let clean = pendingText.replace(/\s+/g, ' ').trim()
      // Remove hyphenation artifacts
      clean = clean.replace(/- /g, '')
      if (clean.length > 3 && clean.length < 3000) {
        verses.push({
          book: info.name,
          book_abbr: info.abbr,
          chapter,
          verse: pendingV,
          reference: `${info.abbr} ${chapter},${pendingV}`,
          text: clean,
          testament: info.testament,
        })
      }
    }
    pendingV = 0
    pendingText = ''
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue

    // Skip page markers
    if (t.match(/^-- \d+ of \d+ --$/)) continue

    // ─── Chapter with inline verse: "CaP. X — 1 text..." or "Cap. X — 1 text..."
    const capBible = t.match(/^Ca?\s*[Pp]\s*\.\s+([IVXLCDMivxlcdm\s]+)\s*[—–-]\s*(\d+)\s+(.+)/)
    if (capBible) {
      flush()
      chapter = romanToInt(capBible[1])
      pendingV = parseInt(capBible[2], 10)
      pendingText = capBible[3]
      lastVerse = pendingV
      inCommentary = false
      continue
    }

    // ─── Standalone commentary: "CAP. X" (all caps, no verse text)
    if (t.match(/^CAP\.\s+[IVXLCDMivxlcdm\s]+\.?\s*$/)) {
      flush()
      // Update chapter from commentary header
      const commMatch = t.match(/^CAP\.\s+([IVXLCDMivxlcdm\s]+)/)
      if (commMatch) {
        const commCh = romanToInt(commMatch[1])
        if (commCh > 0) chapter = commCh
      }
      inCommentary = true
      lastVerse = 0
      continue
    }

    // ─── In commentary: skip until verse-like line
    if (inCommentary) {
      // Commentary notes have period after number: "2. O Espirito..."
      // Bible verses don't: "2 A terra..."
      if (/^\d{1,3}\s+[A-Za-záàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ("']/.test(t) && !/^\d{1,3}\.\s/.test(t)) {
        inCommentary = false
        // fall through
      } else {
        continue
      }
    }

    // ─── Skip page headers: "2 GEN. I, 9 — 24"
    const collapsed = t.replace(/([A-Z])\s+(?=[A-Z.])/g, '$1')
    if (collapsed.match(/^\d*\s*[A-Z]{2,}\.\s*[IVXLCDM]+,\s*\d/)) {
      // Extract chapter info from header
      const hm = collapsed.match(/[A-Z]+\.\s*([IVXLCDM]+),/)
      if (hm) {
        const hCh = romanToInt(hm[1])
        if (hCh > 0 && (chapter === 0 || Math.abs(hCh - chapter) <= 2)) {
          chapter = hCh
        }
      }
      continue
    }

    // ─── Skip margin notes (short non-verse lines)
    if (t.length < 15 && !/^\d{1,3}\s/.test(t)) continue

    // ─── Commentary note (number + period): skip
    if (/^\d{1,3}\.\s/.test(t)) continue

    // ─── Verse at start of line: "2 A terra..."
    const verseMatch = t.match(/^(\d{1,3})\s+(.+)/)
    if (verseMatch && chapter > 0) {
      const vNum = parseInt(verseMatch[1], 10)
      if (vNum > 0 && vNum < 200) {
        // Chapter reset detection: verse goes to 1 after a high verse
        if (vNum === 1 && lastVerse > 3) {
          flush()
          // Only increment chapter if it doesn't exceed expected count
          if (chapter < info.chapters) {
            chapter++
          }
          pendingV = 1
          pendingText = verseMatch[2]
          lastVerse = 1
          continue
        }

        // Normal verse
        flush()
        pendingV = vNum
        pendingText = verseMatch[2]
        lastVerse = vNum
        continue
      }
    }

    // ─── Continuation line
    if (pendingV > 0 && !inCommentary && t.length > 5) {
      pendingText += ' ' + t
    }
  }

  flush()
  return verses
}

async function main() {
  console.log('Extraindo Bíblia Matos Soares 1927 do PDF...\n')
  const buf = fs.readFileSync(path.join(__dirname, 'data', 'biblia-matos-soares-1927.pdf'))
  const parser = new PDFParse(new Uint8Array(buf))
  const result = await parser.getText()
  const fullText = result.text

  console.log(`PDF: ${result.total} páginas, ${fullText.length} caracteres\n`)

  // ─── Step 1: Find book positions in full text ─────────────────────────────
  const bookPositions: { key: string; pos: number }[] = []
  for (const [marker, key] of BOOK_MARKERS) {
    const idx = fullText.indexOf(marker)
    if (idx >= 0) {
      bookPositions.push({ key, pos: idx })
      console.log(`  Encontrado: ${key} @ posição ${idx}`)
    } else {
      console.log(`  NAO encontrado: ${key}`)
    }
  }
  bookPositions.sort((a, b) => a.pos - b.pos)

  // Remove special markers
  const cleanPositions = bookPositions.filter(bp => !bp.key.endsWith('_HEADER'))

  console.log(`\n${cleanPositions.length} livros encontrados\n`)

  // ─── Step 2: Extract verses from each book section ────────────────────────
  const allVerses: Verse[] = []

  for (let i = 0; i < cleanPositions.length; i++) {
    const book = cleanPositions[i]
    const nextPos = i + 1 < cleanPositions.length ? cleanPositions[i + 1].pos : fullText.length
    const sectionText = fullText.substring(book.pos, nextPos)

    const verses = extractVersesFromSection(sectionText, book.key)

    if (verses.length > 0) {
      const chapters = [...new Set(verses.map(v => v.chapter))].sort((a, b) => a - b)
      console.log(`  ${BOOK_INFO[book.key]?.name || book.key}: ${verses.length} versículos, ${chapters.length} cap [${chapters[0]}-${chapters[chapters.length - 1]}]`)
      allVerses.push(...verses)
    } else {
      console.log(`  ${BOOK_INFO[book.key]?.name || book.key}: 0 versículos`)
    }
  }

  // ─── Step 3: Deduplicate ──────────────────────────────────────────────────
  const seen = new Map<string, Verse>()
  for (const v of allVerses) {
    const existing = seen.get(v.reference)
    if (!existing || v.text.length > existing.text.length) {
      seen.set(v.reference, v)
    }
  }
  const unique = [...seen.values()]

  console.log(`\n${allVerses.length} brutos → ${unique.length} únicos`)

  // ─── Step 4: Save JSON ────────────────────────────────────────────────────
  const outPath = path.join(__dirname, 'data', 'biblia-structured.json')
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2), 'utf-8')
  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1)
  console.log(`\nJSON salvo: ${outPath} (${sizeMB} MB)`)

  // Stats
  const bookStats = new Map<string, number>()
  for (const v of unique) {
    bookStats.set(v.book, (bookStats.get(v.book) || 0) + 1)
  }
  console.log(`\n${bookStats.size} livros, ${unique.length} versículos totais`)
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
