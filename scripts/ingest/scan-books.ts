import fs from 'fs'
import { PDFParse } from 'pdf-parse'

/**
 * Scan the Biblia Matos Soares 1927 PDF for all 73 book markers.
 * Searches multiple spelling variations for each book and reports positions + context.
 */

// All 73 books with multiple search variations for the 1927 Portuguese text
const BOOK_SEARCHES: {
  canonical: string
  abbr: string
  testament: 'AT' | 'NT'
  patterns: string[]
}[] = [
  // ===== OLD TESTAMENT (46 books) =====
  // Pentateuch
  { canonical: 'Genesis', abbr: 'Gn', testament: 'AT', patterns: ['GENESIS', 'GÊNESIS', 'GENESI'] },
  { canonical: 'Exodo', abbr: 'Ex', testament: 'AT', patterns: ['EXODO', 'ÊXODO', 'ÉXODO'] },
  { canonical: 'Levitico', abbr: 'Lv', testament: 'AT', patterns: ['LEVITICO', 'LEVÍTICO'] },
  { canonical: 'Numeros', abbr: 'Nm', testament: 'AT', patterns: ['NUMEROS', 'NÚMEROS'] },
  { canonical: 'Deuteronomio', abbr: 'Dt', testament: 'AT', patterns: ['DEUTERONOMIO', 'DEUTERONÔMIO', 'DEUTERONÓMIO'] },

  // Historical
  { canonical: 'Josue', abbr: 'Js', testament: 'AT', patterns: ['JOSUÉ', 'JOSUE'] },
  { canonical: 'Juizes', abbr: 'Jz', testament: 'AT', patterns: ['JUIZES', 'JUÍZES'] },
  { canonical: 'Rute', abbr: 'Rt', testament: 'AT', patterns: ['RUTH', 'RUTE', 'RUTH '] },
  { canonical: '1 Samuel', abbr: '1Sm', testament: 'AT', patterns: ['I SAMUEL', 'I LIVRO DOS REIS', 'PRIMEIRO LIVRO DOS REIS', '1.° LIVRO DOS REIS', 'I DOS REIS', 'I REIS'] },
  { canonical: '2 Samuel', abbr: '2Sm', testament: 'AT', patterns: ['II SAMUEL', 'II LIVRO DOS REIS', 'SEGUNDO LIVRO DOS REIS', '2.° LIVRO DOS REIS', 'II DOS REIS', 'II REIS'] },
  { canonical: '1 Reis', abbr: '1Rs', testament: 'AT', patterns: ['III REIS', 'III LIVRO DOS REIS', 'TERCEIRO LIVRO DOS REIS', '3.° LIVRO DOS REIS', 'III DOS REIS'] },
  { canonical: '2 Reis', abbr: '2Rs', testament: 'AT', patterns: ['IV REIS', 'IV LIVRO DOS REIS', 'QUARTO LIVRO DOS REIS', '4.° LIVRO DOS REIS', 'IV DOS REIS'] },
  { canonical: '1 Cronicas', abbr: '1Cr', testament: 'AT', patterns: ['I PARALIPOMENOS', 'I PARALIPÓMENOS', 'PRIMEIRO PARALIPOMENOS', '1.° PARALIPOMENOS', 'LIVRO PRIMEIRO\nDOS PARALIPÓMENOS', 'LIVRO PRIMEIRO\nDOS PARALIPOMENOS', 'DOS PARALIPÓMENOS'] },
  { canonical: '2 Cronicas', abbr: '2Cr', testament: 'AT', patterns: ['II PARALIPOMENOS', 'II PARALIPÓMENOS', 'SEGUNDO PARALIPOMENOS', '2.° PARALIPOMENOS', 'LIVRO SEGUNDO\nDOS PARALIPÓMENOS', 'LIVRO SEGUNDO\nDOS PARALIPOMENOS'] },
  { canonical: 'Esdras', abbr: 'Esd', testament: 'AT', patterns: ['ESDRAS'] },
  { canonical: 'Neemias', abbr: 'Ne', testament: 'AT', patterns: ['NEHEMIAS', 'NEEMIAS', 'NEEMÍAS'] },
  { canonical: 'Tobias', abbr: 'Tb', testament: 'AT', patterns: ['TOBIAS'] },
  { canonical: 'Judite', abbr: 'Jdt', testament: 'AT', patterns: ['JUDITH', 'JUDITE'] },
  { canonical: 'Ester', abbr: 'Est', testament: 'AT', patterns: ['ESTHER', 'ESTER'] },
  { canonical: '1 Macabeus', abbr: '1Mc', testament: 'AT', patterns: ['I MACHABEUS', 'I MACABEUS', 'PRIMEIRO MACHABEUS', '1.° MACHABEUS'] },
  { canonical: '2 Macabeus', abbr: '2Mc', testament: 'AT', patterns: ['II MACHABEUS', 'II MACABEUS', 'SEGUNDO MACHABEUS', '2.° MACHABEUS'] },

  // Wisdom/Poetic
  { canonical: 'Jo', abbr: 'Jó', testament: 'AT', patterns: ['JOB', 'JÓ'] },
  { canonical: 'Salmos', abbr: 'Sl', testament: 'AT', patterns: ['PSALMOS', 'SALMOS', 'LIVRO DOS PSALMOS', 'LIVRO DOS SALMOS'] },
  { canonical: 'Proverbios', abbr: 'Pr', testament: 'AT', patterns: ['PROVERBIOS', 'PROVÉRBIOS'] },
  { canonical: 'Eclesiastes', abbr: 'Ecl', testament: 'AT', patterns: ['ECCLESIASTES', 'ECLESIASTES'] },
  { canonical: 'Cantico dos Canticos', abbr: 'Ct', testament: 'AT', patterns: ['CANTICO DOS CANTICOS', 'CÂNTICO DOS CÂNTICOS', 'CANTAR DOS CANTARES'] },
  { canonical: 'Sabedoria', abbr: 'Sb', testament: 'AT', patterns: ['SABEDORIA', 'LIVRO DA SABEDORIA'] },
  { canonical: 'Eclesiastico', abbr: 'Eclo', testament: 'AT', patterns: ['ECCLESIASTICO', 'ECLESIÁSTICO', 'SIRACIDES', 'SIRACIDA'] },

  // Major Prophets
  { canonical: 'Isaias', abbr: 'Is', testament: 'AT', patterns: ['ISAÍAS', 'ISAIAS'] },
  { canonical: 'Jeremias', abbr: 'Jr', testament: 'AT', patterns: ['JEREMIAS'] },
  { canonical: 'Lamentacoes', abbr: 'Lm', testament: 'AT', patterns: ['LAMENTAÇÕES', 'LAMENTACOES', 'LAMENTAÇÕES DE JEREMIAS'] },
  { canonical: 'Baruc', abbr: 'Br', testament: 'AT', patterns: ['BARUCH', 'BARUC'] },
  { canonical: 'Ezequiel', abbr: 'Ez', testament: 'AT', patterns: ['EZECHIEL', 'EZEQUIEL'] },
  { canonical: 'Daniel', abbr: 'Dn', testament: 'AT', patterns: ['DANIEL'] },

  // Minor Prophets
  { canonical: 'Oseias', abbr: 'Os', testament: 'AT', patterns: ['OSEAS', 'OSÉAS', 'OSÉIAS'] },
  { canonical: 'Joel', abbr: 'Jl', testament: 'AT', patterns: ['JOEL'] },
  { canonical: 'Amos', abbr: 'Am', testament: 'AT', patterns: ['AMOS', 'AMÓS'] },
  { canonical: 'Abdias', abbr: 'Ab', testament: 'AT', patterns: ['ABDIAS'] },
  { canonical: 'Jonas', abbr: 'Jn', testament: 'AT', patterns: ['JONAS'] },
  { canonical: 'Miqueias', abbr: 'Mq', testament: 'AT', patterns: ['MICHEAS', 'MIQUÉIAS', 'MIQUEIAS'] },
  { canonical: 'Naum', abbr: 'Na', testament: 'AT', patterns: ['NAHUM', 'NAUM'] },
  { canonical: 'Habacuc', abbr: 'Hab', testament: 'AT', patterns: ['HABACUC'] },
  { canonical: 'Sofonias', abbr: 'Sf', testament: 'AT', patterns: ['SOPHONIAS', 'SOFONIAS'] },
  { canonical: 'Ageu', abbr: 'Ag', testament: 'AT', patterns: ['AGGEU', 'AGEU'] },
  { canonical: 'Zacarias', abbr: 'Zc', testament: 'AT', patterns: ['ZACHARIAS', 'ZACARIAS'] },
  { canonical: 'Malaquias', abbr: 'Ml', testament: 'AT', patterns: ['MALACHIAS', 'MALAQUIAS'] },

  // ===== NEW TESTAMENT (27 books) =====
  // Gospels
  { canonical: 'Mateus', abbr: 'Mt', testament: 'NT', patterns: ['S. MATEUS', 'MATEUS', 'SANTO EVANGELHO SEGUNDO S. MATEUS', 'EVANGELHO SEGUNDO S. MATEUS', 'EVANGELHO DE S. MATEUS'] },
  { canonical: 'Marcos', abbr: 'Mc', testament: 'NT', patterns: ['S. MARCOS', 'MARCOS', 'SANTO EVANGELHO SEGUNDO S. MARCOS', 'EVANGELHO SEGUNDO S. MARCOS', 'EVANGELHO DE S. MARCOS'] },
  { canonical: 'Lucas', abbr: 'Lc', testament: 'NT', patterns: ['S. LUCAS', 'LUCAS', 'SANTO EVANGELHO SEGUNDO S. LUCAS', 'EVANGELHO SEGUNDO S. LUCAS', 'EVANGELHO DE S. LUCAS'] },
  { canonical: 'Joao', abbr: 'Jo', testament: 'NT', patterns: ['S. JOÃO', 'S. JOAO', 'SANTO EVANGELHO SEGUNDO S. JOÃO', 'EVANGELHO SEGUNDO S. JOÃO', 'EVANGELHO DE S. JOÃO'] },

  // Acts
  { canonical: 'Atos', abbr: 'At', testament: 'NT', patterns: ['ACTOS DOS APOSTOLOS', 'ACTOS DOS APÓSTOLOS', 'ACTOS', 'ATOS DOS APÓSTOLOS'] },

  // Pauline Epistles
  { canonical: 'Romanos', abbr: 'Rm', testament: 'NT', patterns: ['ROMANOS', 'EPISTOLA AOS ROMANOS', 'EPÍSTOLA AOS ROMANOS'] },
  { canonical: '1 Corintios', abbr: '1Cor', testament: 'NT', patterns: ['I CORINTHOS', 'I CORINTHIOS', 'I AOS CORINTHOS', 'PRIMEIRA EPISTOLA AOS CORINTHOS', 'PRIMEIRA EPÍ STOLA', 'PRI MEI RA EPÍ STOLA', 'AOS CORÍNTIOS', 'AOS CORINTHIOS', 'A O S C O R Í N T I O S'] },
  { canonical: '2 Corintios', abbr: '2Cor', testament: 'NT', patterns: ['II CORINTHOS', 'II CORINTHIOS', 'II AOS CORINTHOS', 'SEGUNDA EPISTOLA AOS CORINTHOS', 'S E G U N D A EPÍ S TOLA', 'SEGUNDA EPÍ STOLA', 'SEGUNDA EPÍSTOLA AOS CORÍNTIOS'] },
  { canonical: 'Galatas', abbr: 'Gl', testament: 'NT', patterns: ['GALATAS', 'EPISTOLA AOS GALATAS', 'EPÍSTOLA AOS GALATAS', 'EPÍSTOLA AOS GÁLATAS', 'GÁLATAS'] },
  { canonical: 'Efesios', abbr: 'Ef', testament: 'NT', patterns: ['EPHESIOS', 'EFÉSIOS', 'EFESIOS', 'EPISTOLA AOS EPHESIOS'] },
  { canonical: 'Filipenses', abbr: 'Fl', testament: 'NT', patterns: ['PHILIPPENSES', 'FILIPENSES', 'EPISTOLA AOS PHILIPPENSES'] },
  { canonical: 'Colossenses', abbr: 'Cl', testament: 'NT', patterns: ['COLOSSENSES', 'EPISTOLA AOS COLOSSENSES'] },
  { canonical: '1 Tessalonicenses', abbr: '1Ts', testament: 'NT', patterns: ['I THESSALONICENSES', 'I TESSALONICENSES', 'I AOS THESSALONICENSES', 'PRI MEI RA EPÍSTOLA\nAOS TESSALONICENSES', 'PRIMEIRA EPÍSTOLA\nAOS TESSALONICENSES', 'AOS TESSALONICENSES'] },
  { canonical: '2 Tessalonicenses', abbr: '2Ts', testament: 'NT', patterns: ['II THESSALONICENSES', 'II TESSALONICENSES', 'II AOS THESSALONICENSES', 'S E G U N D A EPÍ STOLA\nAOS TESSALONICENSES', 'SEGUNDA EPÍSTOLA\nAOS TESSALONICENSES'] },
  { canonical: '1 Timoteo', abbr: '1Tm', testament: 'NT', patterns: ['I TIMOTHEO', 'I TIMOTEO', 'PRIMEIRA EPISTOLA A TIMOTHEO', 'I A TIMOTHEO'] },
  { canonical: '2 Timoteo', abbr: '2Tm', testament: 'NT', patterns: ['II TIMOTHEO', 'II TIMOTEO', 'SEGUNDA EPISTOLA A TIMOTHEO', 'II A TIMOTHEO'] },
  { canonical: 'Tito', abbr: 'Tt', testament: 'NT', patterns: ['TITO', 'EPISTOLA A TITO', 'EPÍSTOLA A TITO'] },
  { canonical: 'Filemon', abbr: 'Fm', testament: 'NT', patterns: ['PHILEMON', 'FILÉMON', 'FILEMON', 'EPISTOLA A PHILEMON'] },
  { canonical: 'Hebreus', abbr: 'Hb', testament: 'NT', patterns: ['HEBREUS', 'EPISTOLA AOS HEBREUS', 'EPÍSTOLA AOS HEBREUS'] },

  // Catholic Epistles
  { canonical: 'Tiago', abbr: 'Tg', testament: 'NT', patterns: ['THIAGO', 'TIAGO', 'EPISTOLA DE S. THIAGO', 'EPISTOLA DE THIAGO'] },
  { canonical: '1 Pedro', abbr: '1Pd', testament: 'NT', patterns: ['I PEDRO', 'I DE S. PEDRO', 'PRIMEIRA EPISTOLA DE S. PEDRO', 'I S. PEDRO', 'I DE PEDRO', 'DE S. PEDRO', 'EPÍSTOLA DE S. PEDRO'] },
  { canonical: '2 Pedro', abbr: '2Pd', testament: 'NT', patterns: ['II PEDRO', 'II DE S. PEDRO', 'SEGUNDA EPISTOLA DE S. PEDRO', 'II S. PEDRO', 'II DE PEDRO', 'SEGUNDA EPÍSTOLA DE S. PEDRO'] },
  { canonical: '1 Joao', abbr: '1Jo', testament: 'NT', patterns: ['I JOÃO', 'I DE S. JOÃO', 'PRIMEIRA EPISTOLA DE S. JOÃO', 'I S. JOÃO', 'I JOAO'] },
  { canonical: '2 Joao', abbr: '2Jo', testament: 'NT', patterns: ['II JOÃO', 'II DE S. JOÃO', 'SEGUNDA EPISTOLA DE S. JOÃO', 'II S. JOÃO', 'II JOAO', 'SEGUNDA E TERCEIRA\nEPÍSTOLA DE S. JOÃO', 'SEGUNDA E TERCEIRA EPÍSTOLA DE S. JOÃO', 'SEGUNDA EPÍSTOLA DE S. JOÃO'] },
  { canonical: '3 Joao', abbr: '3Jo', testament: 'NT', patterns: ['III JOÃO', 'III DE S. JOÃO', 'TERCEIRA EPISTOLA DE S. JOÃO', 'III S. JOÃO', 'III JOAO', 'TERCEIRA EPÍSTOLA DE S. JOAO', 'TERCEIRA EPÍSTOLA DE S. JOÃO'] },
  { canonical: 'Judas', abbr: 'Jd', testament: 'NT', patterns: ['JUDAS', 'EPISTOLA DE S. JUDAS', 'EPISTOLA DE JUDAS'] },

  // Revelation
  { canonical: 'Apocalipse', abbr: 'Ap', testament: 'NT', patterns: ['APOCALYPSE', 'APOCALIPSE', 'APOCALYPSE DE S. JOÃO'] },
]

interface Match {
  canonical: string
  abbr: string
  testament: 'AT' | 'NT'
  pattern: string
  position: number
  snippet: string
}

async function main() {
  console.log('Reading PDF...')
  const buf = fs.readFileSync('scripts/ingest/data/biblia-matos-soares-1927.pdf')
  const parser = new PDFParse(new Uint8Array(buf))
  const result = await parser.getText()
  const fullText = result.text
  const upperText = fullText.toUpperCase()

  console.log(`PDF parsed: ${result.total} pages, ${fullText.length} chars\n`)

  const allMatches: Match[] = []
  const notFound: string[] = []

  for (const book of BOOK_SEARCHES) {
    let found = false

    for (const pattern of book.patterns) {
      const upperPattern = pattern.toUpperCase()

      // Search for ALL occurrences, not just the first
      let searchFrom = 0
      while (true) {
        const idx = upperText.indexOf(upperPattern, searchFrom)
        if (idx < 0) break

        const snippetStart = Math.max(0, idx - 50)
        const snippetEnd = Math.min(fullText.length, idx + pattern.length + 150)
        const snippet = fullText.substring(snippetStart, snippetEnd).replace(/\n/g, '\\n').replace(/\r/g, '')

        allMatches.push({
          canonical: book.canonical,
          abbr: book.abbr,
          testament: book.testament,
          pattern,
          position: idx,
          snippet,
        })
        found = true

        // Move past this match to find next occurrence
        searchFrom = idx + upperPattern.length
      }
    }

    if (!found) {
      notFound.push(`${book.canonical} (${book.abbr})`)
    }
  }

  // Sort all matches by position
  allMatches.sort((a, b) => a.position - b.position)

  // Print all matches
  console.log('='.repeat(120))
  console.log('ALL MATCHES (sorted by position in PDF text)')
  console.log('='.repeat(120))

  for (const m of allMatches) {
    console.log(`\n[${m.testament}] ${m.canonical} (${m.abbr}) — pattern: "${m.pattern}" — pos: ${m.position}`)
    console.log(`  snippet: ...${m.snippet}...`)
  }

  // Summary: first occurrence per book, sorted by position
  console.log('\n\n' + '='.repeat(120))
  console.log('FIRST OCCURRENCE PER BOOK (sorted by position — this should be the book order in the PDF)')
  console.log('='.repeat(120))

  const firstPerBook = new Map<string, Match>()
  for (const m of allMatches) {
    const key = m.abbr
    if (!firstPerBook.has(key) || m.position < firstPerBook.get(key)!.position) {
      firstPerBook.set(key, m)
    }
  }

  const firstList = [...firstPerBook.values()].sort((a, b) => a.position - b.position)
  let bookNum = 0
  for (const m of firstList) {
    bookNum++
    console.log(`${String(bookNum).padStart(2)}. [${m.testament}] ${m.canonical.padEnd(25)} (${m.abbr.padEnd(4)}) — pos: ${String(m.position).padStart(8)} — pattern: "${m.pattern}"`)
  }

  // Summary stats
  console.log('\n\n' + '='.repeat(120))
  console.log('SUMMARY')
  console.log('='.repeat(120))
  console.log(`Total matches found: ${allMatches.length}`)
  console.log(`Unique books found: ${firstPerBook.size} / 73`)
  console.log(`AT books found: ${firstList.filter(m => m.testament === 'AT').length} / 46`)
  console.log(`NT books found: ${firstList.filter(m => m.testament === 'NT').length} / 27`)

  if (notFound.length > 0) {
    console.log(`\nBOOKS NOT FOUND (${notFound.length}):`)
    for (const nf of notFound) {
      console.log(`  - ${nf}`)
    }
  } else {
    console.log('\nAll 73 books found!')
  }

  // Also do a broader search for potential book headers we might be missing
  // Look for lines that appear to be book titles (all caps, short lines)
  console.log('\n\n' + '='.repeat(120))
  console.log('POTENTIAL BOOK HEADERS (all-caps lines > 4 chars, standalone)')
  console.log('='.repeat(120))
  const lines = fullText.split('\n')
  const seenHeaders = new Set<string>()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    // Look for short all-caps lines that might be book titles
    if (
      line.length > 4 &&
      line.length < 80 &&
      line === line.toUpperCase() &&
      /^[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ\s.°]+$/.test(line) &&
      !line.match(/^CAP\./) &&
      !line.match(/^\d/) &&
      !seenHeaders.has(line)
    ) {
      seenHeaders.add(line)
      // Find position in full text
      const pos = fullText.indexOf(line)
      if (pos >= 0) {
        console.log(`  pos ${String(pos).padStart(8)}: "${line}"`)
      }
    }
  }
}

main().catch(console.error)
