/**
 * Deterministic Bible reference extractor.
 *
 * Reads the text of Catechism paragraphs (or any Catholic source text) and
 * pulls out every Bible citation written in the Brazilian Portuguese
 * conventions: "Jr 1,5", "1 Cor 13,4", "Sl 139,13-16", "Mt 5,21-22".
 *
 * Why this matters:
 *   The Catechism already cites every Bible verse that justifies its
 *   teaching. Instead of asking an embedding model to guess which verses
 *   are relevant to "aborto", we just READ the CIC paragraphs it returned
 *   and extract the refs it explicitly cites. That turns the Catechism
 *   into the index that drives biblical retrieval, making the whole
 *   pipeline far more accurate on topics where the Bible uses
 *   metaphorical language the embeddings can't match.
 */

/**
 * Canonical list of Brazilian Portuguese Catholic Bible book abbreviations.
 * Source: Bíblia Ave Maria (the translation used in the `biblia` table).
 * We enumerate every valid abbr so the regex matches cannot leak random
 * tokens like "Ex" (exercise) or "At" (at sign) from prose.
 */
const BOOK_ABBRS = new Set<string>([
  // Pentateuco
  'Gn', 'Ex', 'Êx', 'Lv', 'Nm', 'Dt',
  // Históricos
  'Js', 'Jz', 'Rt',
  '1Sm', '2Sm', '1Rs', '2Rs', '1Cr', '2Cr',
  'Esd', 'Ne', 'Tb', 'Jt', 'Est',
  '1Mc', '2Mc',
  // Sapienciais
  'Jó', 'Jb', 'Sl', 'Pr', 'Ecl', 'Qo', 'Ct', 'Sb', 'Eclo', 'Sr',
  // Proféticos
  'Is', 'Jr', 'Lm', 'Br', 'Ez', 'Dn',
  'Os', 'Jl', 'Am', 'Ab', 'Jn', 'Mq', 'Na', 'Hab', 'Ha', 'Sf', 'Ag', 'Zc', 'Ml',
  // Evangelhos + Atos
  'Mt', 'Mc', 'Lc', 'Jo', 'At',
  // Paulinas
  'Rm', '1Cor', '2Cor', 'Gl', 'Ef', 'Fl', 'Cl',
  '1Ts', '2Ts', '1Tm', '2Tm', 'Tt', 'Fm',
  // Hebreus
  'Hb',
  // Católicas
  'Tg', '1Pd', '2Pd', '1Jo', '2Jo', '3Jo', 'Jd',
  // Apocalipse
  'Ap',
])

/**
 * Canonicalize a raw book token from the regex match so it matches the
 * BOOK_ABBRS set exactly. Handles:
 *   - "1 Cor" → "1Cor"
 *   - "I Cor" → "1Cor"
 *   - "II Sm" → "2Sm"
 *   - "Êx" → "Ex" (we accept both forms as input but normalize)
 *   - case variations
 */
function canonicalizeBook(raw: string): string | null {
  // Strip whitespace, normalize Roman numerals to Arabic for the prefix.
  const compact = raw.replace(/\s+/g, '')
  const romanMap: Record<string, string> = {
    'I': '1', 'II': '2', 'III': '3',
  }
  const match = compact.match(/^(I{1,3}|\d)?([A-Za-zÀ-ÿ]+)$/u)
  if (!match) return null
  const prefix = match[1] ? (romanMap[match[1]] ?? match[1]) : ''
  const rawBook = match[2]

  // Case-correct each candidate in the set that shares the same letters.
  // This also handles the "Êx ↔ Ex" collapse.
  const candidates = [prefix + rawBook, prefix + rawBook.toLowerCase(), prefix + capitalize(rawBook)]
  for (const cand of candidates) {
    if (BOOK_ABBRS.has(cand)) return cand
  }

  // Second pass: diacritic-insensitive match (handles "Êx" pool vs "Ex" input).
  const norm = stripDiacritics(prefix + rawBook)
  for (const abbr of BOOK_ABBRS) {
    if (stripDiacritics(abbr).toLowerCase() === norm.toLowerCase()) return abbr
  }

  return null
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1).toLowerCase()
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * The reference regex. Matches patterns like:
 *   Jr 1,5
 *   Sl 139,15
 *   Sl 139,13-16
 *   1 Cor 13,4
 *   1Cor 13,4-7
 *   Mt 5,21-22
 *
 * Non-capturing groups so we can map over `matchAll` and only keep the
 * book, chapter, verse_start, verse_end groups we care about.
 */
const REF_REGEX =
  /\b((?:[1-3I]{1,3}\s?)?(?:[A-Za-zÀ-ÿ]{1,4}))\s+(\d{1,3}),(\d{1,3})(?:[-–](\d{1,3}))?\b/gu

export interface ExtractedRef {
  /** Canonical single-verse form, e.g. "Jr 1,5". This is what we query. */
  reference: string
  /** Book, for grouping and debug. */
  book: string
  chapter: number
  verse: number
}

/**
 * Extract every Bible reference from a block of text. Ranges like "Sl 139,13-16"
 * are EXPANDED into individual verses ("Sl 139,13", "Sl 139,14", "Sl 139,15",
 * "Sl 139,16") because the `biblia` table stores one row per verse and that's
 * what `fetchMustIncludeVerses` expects. We cap range expansion at 12 verses
 * per citation to avoid accidental explosions on malformed input.
 */
export function extractBibleRefs(text: string): ExtractedRef[] {
  if (!text || text.length === 0) return []

  const out: ExtractedRef[] = []
  const matches = text.matchAll(REF_REGEX)

  for (const m of matches) {
    const rawBook = m[1]
    const chapter = parseInt(m[2], 10)
    const verseStart = parseInt(m[3], 10)
    const verseEnd = m[4] ? parseInt(m[4], 10) : verseStart

    if (Number.isNaN(chapter) || Number.isNaN(verseStart)) continue
    if (verseEnd < verseStart) continue

    const canonicalBook = canonicalizeBook(rawBook)
    if (!canonicalBook) continue

    // Expand ranges, capped at 12 verses per citation.
    const end = Math.min(verseEnd, verseStart + 11)
    for (let v = verseStart; v <= end; v++) {
      out.push({
        reference: `${canonicalBook} ${chapter},${v}`,
        book: canonicalBook,
        chapter,
        verse: v,
      })
    }
  }

  return out
}

/**
 * Extract + deduplicate refs from a batch of source rows (typically the
 * catechism paragraphs retrieved for a query). Returns a FREQUENCY-ordered
 * list: refs cited by multiple CIC paragraphs go first. That ordering
 * reflects theological weight — a verse cited by both CIC 2270 and 2271
 * on abortion is a much stronger signal than one that appears only once.
 */
export function extractBibleRefsFromRows(
  rows: Array<{ text?: string; text_pt?: string }>,
): string[] {
  const freq = new Map<string, number>()

  for (const row of rows) {
    const body = row.text ?? row.text_pt ?? ''
    if (!body) continue
    const refs = extractBibleRefs(body)
    // Dedupe within a single source row — one row that repeats a ref
    // shouldn't count twice toward frequency.
    const seenInRow = new Set<string>()
    for (const r of refs) {
      if (seenInRow.has(r.reference)) continue
      seenInRow.add(r.reference)
      freq.set(r.reference, (freq.get(r.reference) ?? 0) + 1)
    }
  }

  // Sort by frequency desc, then alphabetically for determinism.
  return [...freq.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0])
    })
    .map(([ref]) => ref)
}
