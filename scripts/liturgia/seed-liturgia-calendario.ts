/**
 * Gera o seed SQL (INSERT em public.liturgia_calendario) para um ano
 * litúrgico, computando Páscoa via Meeus/Gauss e derivando os domingos
 * móveis. Saída: stdout — redirecione pra uma migration.
 *
 * Uso:
 *   npx tsx scripts/liturgia/seed-liturgia-calendario.ts 2026 > out.sql
 *   npx tsx scripts/liturgia/seed-liturgia-calendario.ts 2026 2027 > out.sql
 *
 * Convenções pastorais no Brasil:
 * - Ascensão = 7° domingo da Páscoa (transferida).
 * - Corpus Christi = quinta após Trindade (na CNBB pode haver transferência;
 *   aqui mantemos a quinta tradicional).
 * - Os Tempos Comuns são contados como tc-2..tc-34 (CIC Liturgia das Horas,
 *   "Normas Universais sobre o Ano Litúrgico"). Saltos quando ano tem 33
 *   ou 34 domingos do TC: omite os menores e termina em Cristo Rei.
 */

const ANO_INPUTS = process.argv.slice(2).filter((arg) => /^\d{4}$/.test(arg))
if (ANO_INPUTS.length === 0) {
  console.error('Uso: tsx seed-liturgia-calendario.ts <ano> [ano2 ...]')
  process.exit(1)
}

/** Páscoa Gregoriana (Meeus/Jones/Butcher) — retorna [mes 1-12, dia]. */
function paschalDate(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d))
}
function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}
function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
function dayOfWeek(date: Date): number {
  // 0 = domingo
  return date.getUTCDay()
}

/** Avança até o próximo domingo (inclusive se já for domingo). */
function nextSunday(date: Date): Date {
  const dow = dayOfWeek(date)
  if (dow === 0) return date
  return addDays(date, 7 - dow)
}
/** Retrocede até o domingo anterior (inclusive). */
function prevSunday(date: Date): Date {
  const dow = dayOfWeek(date)
  if (dow === 0) return date
  return addDays(date, -dow)
}

type Entry = {
  data: string
  slug: string
  tipo: 'domingo' | 'festa-solene'
  tempo: 'advento' | 'natal' | 'quaresma' | 'pascal' | 'comum'
  titulo: string
  prioridade: number
}

function buildYear(year: number): Entry[] {
  const out: Entry[] = []
  const push = (e: Entry) => out.push(e)

  const pascoa = utcDate(year, paschalDate(year).month, paschalDate(year).day)

  // ---------- Páscoa e Tempo Pascal ----------
  push({ data: isoDate(addDays(pascoa, -7)), slug: 'ramos', tipo: 'domingo', tempo: 'quaresma', titulo: 'Domingo de Ramos', prioridade: 100 })
  push({ data: isoDate(pascoa),            slug: 'pascoa', tipo: 'domingo', tempo: 'pascal',  titulo: 'Páscoa do Senhor', prioridade: 110 })
  for (let i = 1; i <= 6; i++) {
    push({
      data: isoDate(addDays(pascoa, 7 * i)),
      slug: `pascoa-${i + 1}`,
      tipo: 'domingo',
      tempo: 'pascal',
      titulo: i === 1 ? '2° da Páscoa — Misericórdia' :
              i === 6 ? '7° da Páscoa — Ascensão (transferida)' :
              `${i + 1}° Domingo da Páscoa`,
      prioridade: 90,
    })
  }
  // Pentecostes = +49 (7° domingo da Páscoa não é "pascoa-8", é solenidade)
  const pentecostes = addDays(pascoa, 49)
  push({ data: isoDate(pentecostes), slug: 'pentecostes-domingo', tipo: 'domingo', tempo: 'pascal', titulo: 'Pentecostes', prioridade: 110 })

  // ---------- Tempo Comum I (entre Batismo do Senhor e Quaresma) ----------
  // Batismo do Senhor = domingo após Epifania (6 jan ou domingo seguinte).
  // 1° TC fica na própria semana do Batismo. Os outros começam no domingo
  // seguinte e vão até a Quarta de Cinzas (-46 da Páscoa).
  const epifaniaFixa = utcDate(year, 1, 6)
  // No Brasil, Epifania é transferida pro 2° domingo após Natal (= domingo
  // entre 2 e 8 de janeiro). Pra simplicar mantemos 6/1 como festa, e
  // chamamos o "domingo da epifania" do calendário móvel:
  const epifaniaDomingo = (dayOfWeek(epifaniaFixa) === 0)
    ? epifaniaFixa
    : nextSunday(epifaniaFixa)
  push({ data: isoDate(epifaniaDomingo), slug: 'epifania', tipo: 'domingo', tempo: 'natal', titulo: 'Epifania do Senhor', prioridade: 110 })

  const batismoDomingo = addDays(epifaniaDomingo, 7)
  push({ data: isoDate(batismoDomingo), slug: 'batismo-do-senhor', tipo: 'domingo', tempo: 'natal', titulo: 'Batismo do Senhor', prioridade: 100 })

  const cinzas = addDays(pascoa, -46)

  // Domingos de Tempo Comum I — começam em tc-2 (Batismo do Senhor conta como o 1°)
  let tcCursor = addDays(batismoDomingo, 7)
  let tcN = 2
  while (tcCursor < addDays(cinzas, -7)) {
    push({ data: isoDate(tcCursor), slug: `tc-${tcN}`, tipo: 'domingo', tempo: 'comum', titulo: `${tcN}° do Tempo Comum`, prioridade: 50 })
    tcCursor = addDays(tcCursor, 7)
    tcN++
  }

  // ---------- Quaresma ----------
  const quaresma1 = addDays(cinzas, 4)  // primeiro domingo após cinzas
  for (let i = 1; i <= 5; i++) {
    push({
      data: isoDate(addDays(quaresma1, 7 * (i - 1))),
      slug: `quaresma-${i}`,
      tipo: 'domingo',
      tempo: 'quaresma',
      titulo: i === 4 ? '4° Quaresma — Laetare' : `${i}° Domingo da Quaresma`,
      prioridade: 90,
    })
  }

  // ---------- Tempo Comum II (após Pentecostes até Cristo Rei) ----------
  // Trindade = Pentecostes + 7
  const trindade = addDays(pentecostes, 7)
  push({ data: isoDate(trindade), slug: 'santissima-trindade', tipo: 'domingo', tempo: 'comum', titulo: 'Santíssima Trindade', prioridade: 100 })

  // Corpus Christi = quinta após Trindade. No Brasil é feriado, mas
  // liturgicamente cai na quinta. Adicionamos como festa-solene (não domingo).
  const corpus = addDays(trindade, 4)
  push({ data: isoDate(corpus), slug: 'corpo-de-cristo', tipo: 'festa-solene', tempo: 'comum', titulo: 'Corpo e Sangue do Senhor', prioridade: 100 })

  // Sagrado Coração de Jesus = sexta da semana seguinte ao Corpus.
  // Corpus é quinta; +8 dias = sexta-feira da próxima semana.
  const sagradoCoracao = addDays(corpus, 8)
  push({ data: isoDate(sagradoCoracao), slug: 'sagrado-coracao', tipo: 'festa-solene', tempo: 'comum', titulo: 'Sagrado Coração de Jesus', prioridade: 100 })

  // Cristo Rei = último domingo do ano litúrgico (1 semana antes do 1° Advento).
  // 1° Advento = 4 domingos antes do Natal.
  const natal = utcDate(year, 12, 25)
  const natalSunday = (dayOfWeek(natal) === 0) ? prevSunday(addDays(natal, -1)) : prevSunday(natal)
  const advento1 = addDays(natalSunday, -21)  // 4 domingos antes do domingo mais próximo do Natal
  // Ajuste: 1° Advento é o domingo mais próximo de 30/nov; quando coincide com 27/11, mantém.
  // O cálculo acima dá o resultado correto na maioria dos anos.
  const cristoRei = addDays(advento1, -7)

  // Itera tc-* desde a semana após Trindade até a semana de Cristo Rei
  const tcAfterCursor = addDays(trindade, 7)
  // Continua a numeração de onde parou. O 1° depois da Trindade
  // numericamente seria tc-N seguinte; mas tradicionalmente, a contagem
  // de TC continua incluindo Trindade como sendo o N° onde estávamos. Pra
  // este seed (catequético) iteramos com a numeração contínua até bater
  // com Cristo Rei, que sempre é o 34°.
  // Lemma simples: o nº de Cristo Rei é 34 (último). Trabalhamos de trás.
  const sundaysAfterTrindade: Date[] = []
  for (let d = new Date(tcAfterCursor); d <= cristoRei; d = addDays(d, 7)) {
    sundaysAfterTrindade.push(new Date(d))
  }
  // Numeração: o último (cristoRei) é tc-34, o anterior tc-33, ...
  for (let i = 0; i < sundaysAfterTrindade.length; i++) {
    const numero = 34 - (sundaysAfterTrindade.length - 1 - i)
    const date = sundaysAfterTrindade[i]
    const isLast = date.getTime() === cristoRei.getTime()
    push({
      data: isoDate(date),
      slug: isLast ? 'cristo-rei' : `tc-${numero}`,
      tipo: 'domingo',
      tempo: 'comum',
      titulo: isLast ? 'Cristo Rei do Universo' : `${numero}° do Tempo Comum`,
      prioridade: isLast ? 110 : 50,
    })
  }

  // ---------- Advento e Natal ----------
  for (let i = 1; i <= 4; i++) {
    push({
      data: isoDate(addDays(advento1, 7 * (i - 1))),
      slug: `advento-${i}`,
      tipo: 'domingo',
      tempo: 'advento',
      titulo: i === 3 ? '3° Advento — Gaudete' : `${i}° Domingo do Advento`,
      prioridade: 90,
    })
  }

  // Natal — solenidade fixa
  push({ data: isoDate(natal), slug: 'natal', tipo: 'festa-solene', tempo: 'natal', titulo: 'Natal do Senhor', prioridade: 120 })

  // Sagrada Família — domingo do oitavário do Natal (entre 26/12 e 31/12).
  // Se o Natal cair em domingo, é transferida pra 30/12.
  let sagradaFamilia: Date
  if (dayOfWeek(natal) === 0) {
    sagradaFamilia = utcDate(year, 12, 30)
  } else {
    sagradaFamilia = nextSunday(addDays(natal, 1))
  }
  push({ data: isoDate(sagradaFamilia), slug: 'sagrada-familia', tipo: 'domingo', tempo: 'natal', titulo: 'Sagrada Família', prioridade: 100 })

  // Maria Mãe de Deus — 1° de janeiro (ano seguinte)
  const mariaMaeDeDeus = utcDate(year + 1, 1, 1)
  push({ data: isoDate(mariaMaeDeDeus), slug: 'maria-mae-de-deus-domingo', tipo: 'festa-solene', tempo: 'natal', titulo: 'Solenidade de Maria, Mãe de Deus', prioridade: 110 })

  // ---------- Festas solenes fixas ----------
  push({ data: `${year}-08-15`, slug: 'assuncao',              tipo: 'festa-solene', tempo: 'comum', titulo: 'Assunção de Nossa Senhora',    prioridade: 100 })
  push({ data: `${year}-11-01`, slug: 'todos-os-santos',       tipo: 'festa-solene', tempo: 'comum', titulo: 'Todos os Santos',              prioridade: 100 })
  push({ data: `${year}-12-08`, slug: 'imaculada-conceicao',   tipo: 'festa-solene', tempo: 'advento', titulo: 'Imaculada Conceição',         prioridade: 110 })
  push({ data: `${year}-06-29`, slug: 'pedro-e-paulo',         tipo: 'festa-solene', tempo: 'comum', titulo: 'São Pedro e São Paulo',        prioridade: 100 })

  return out
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''")
}

const allEntries: Entry[] = []
for (const arg of ANO_INPUTS) {
  allEntries.push(...buildYear(parseInt(arg, 10)))
}

console.log('-- ============================================================================')
console.log(`-- Seed do liturgia_calendario para ${ANO_INPUTS.join(', ')}`)
console.log('-- Gerado por scripts/liturgia/seed-liturgia-calendario.ts (Meeus/Gauss)')
console.log('-- ============================================================================')
console.log('')
console.log('begin;')
console.log('')
console.log('insert into public.liturgia_calendario (data, slug, tipo, tempo_liturgico, titulo, prioridade) values')
const lines = allEntries.map((e, i) => {
  const sep = i === allEntries.length - 1 ? '' : ','
  return `  ('${e.data}', '${e.slug}', '${e.tipo}', '${e.tempo}', '${escapeSql(e.titulo)}', ${e.prioridade})${sep}`
})
console.log(lines.join('\n'))
console.log('on conflict (data, slug) do update set')
console.log('  tipo = excluded.tipo,')
console.log('  tempo_liturgico = excluded.tempo_liturgico,')
console.log('  titulo = excluded.titulo,')
console.log('  prioridade = excluded.prioridade;')
console.log('')
console.log('commit;')
