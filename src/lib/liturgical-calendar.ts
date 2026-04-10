/**
 * Calendário Litúrgico Romano — Cálculo algorítmico
 * Computa Páscoa, festas móveis, tempos litúrgicos e santos fixos.
 * Baseado no Calendário Romano Geral com adaptações para o Brasil.
 */

export interface LiturgicalDay {
  name: string
  title: string
  season: string
  color: 'branco' | 'vermelho' | 'verde' | 'roxo' | 'rosa'
  grade: 'solenidade' | 'festa' | 'memorial' | 'memorial_facultativo' | 'feria'
}

// ── Computus: Cálculo da Páscoa (Algoritmo Anônimo Gregoriano) ──

function computeEaster(year: number): Date {
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
  return new Date(year, month - 1, day)
}

// ── Utilidades de data ──

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function dateKey(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

// ── Festas Fixas (Solenidades e Festas que prevalecem sobre o Tempo Comum) ──

interface FixedFeast {
  name: string
  title: string
  color: 'branco' | 'vermelho' | 'verde' | 'roxo' | 'rosa'
  grade: 'solenidade' | 'festa' | 'memorial' | 'memorial_facultativo'
  overrideSeason?: boolean // true = prevalece sobre tempos fortes
}

const FIXED_FEASTS: Record<string, FixedFeast> = {
  // Solenidades (prevalecem sobre quase tudo)
  '01-01': { name: 'Maria, Santíssima Mãe de Deus', title: 'Solenidade', color: 'branco', grade: 'solenidade', overrideSeason: true },
  '01-06': { name: 'Epifania do Senhor', title: 'Solenidade', color: 'branco', grade: 'solenidade', overrideSeason: true },
  '02-02': { name: 'Apresentação do Senhor', title: 'Festa do Senhor', color: 'branco', grade: 'festa', overrideSeason: true },
  '03-19': { name: 'São José', title: 'Esposo da Virgem Maria', color: 'branco', grade: 'solenidade', overrideSeason: true },
  '03-25': { name: 'Anunciação do Senhor', title: 'Solenidade', color: 'branco', grade: 'solenidade', overrideSeason: true },
  '06-24': { name: 'Natividade de São João Batista', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  '06-29': { name: 'Santos Pedro e Paulo', title: 'Apóstolos', color: 'vermelho', grade: 'solenidade' },
  '08-06': { name: 'Transfiguração do Senhor', title: 'Festa', color: 'branco', grade: 'festa' },
  '08-15': { name: 'Assunção de Nossa Senhora', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  '09-14': { name: 'Exaltação da Santa Cruz', title: 'Festa', color: 'vermelho', grade: 'festa' },
  '10-12': { name: 'Nossa Senhora Aparecida', title: 'Padroeira do Brasil', color: 'branco', grade: 'solenidade' },
  '11-01': { name: 'Todos os Santos', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  '11-02': { name: 'Comemoração dos Fiéis Defuntos', title: 'Comemoração', color: 'roxo', grade: 'memorial' },
  '12-08': { name: 'Imaculada Conceição', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  '12-25': { name: 'Natividade do Senhor', title: 'Natal — Solenidade', color: 'branco', grade: 'solenidade', overrideSeason: true },
  '12-26': { name: 'Santo Estêvão', title: 'Primeiro Mártir', color: 'vermelho', grade: 'festa', overrideSeason: true },
  '12-27': { name: 'São João Evangelista', title: 'Apóstolo e Evangelista', color: 'branco', grade: 'festa', overrideSeason: true },
  '12-28': { name: 'Santos Inocentes', title: 'Mártires', color: 'vermelho', grade: 'festa', overrideSeason: true },

  // Festas e Memoriais importantes
  '01-17': { name: 'Santo Antão', title: 'Abade', color: 'branco', grade: 'memorial' },
  '01-25': { name: 'Conversão de São Paulo', title: 'Apóstolo', color: 'branco', grade: 'festa' },
  '01-28': { name: 'São Tomás de Aquino', title: 'Doutor da Igreja', color: 'branco', grade: 'memorial' },
  '01-31': { name: 'São João Bosco', title: 'Presbítero', color: 'branco', grade: 'memorial' },
  '02-11': { name: 'Nossa Senhora de Lourdes', title: 'Dia Mundial do Enfermo', color: 'branco', grade: 'memorial_facultativo' },
  '02-22': { name: 'Cátedra de São Pedro', title: 'Apóstolo', color: 'branco', grade: 'festa' },
  '04-23': { name: 'São Jorge', title: 'Mártir', color: 'vermelho', grade: 'memorial' },
  '04-25': { name: 'São Marcos', title: 'Evangelista', color: 'vermelho', grade: 'festa' },
  '04-29': { name: 'Santa Catarina de Sena', title: 'Doutora da Igreja', color: 'branco', grade: 'memorial' },
  '05-01': { name: 'São José Operário', title: 'Memória', color: 'branco', grade: 'memorial' },
  '05-13': { name: 'Nossa Senhora de Fátima', title: 'Memória Facultativa', color: 'branco', grade: 'memorial_facultativo' },
  '05-14': { name: 'São Matias', title: 'Apóstolo', color: 'vermelho', grade: 'festa' },
  '05-31': { name: 'Visitação de Nossa Senhora', title: 'Festa', color: 'branco', grade: 'festa' },
  '06-13': { name: 'Santo Antônio de Pádua', title: 'Doutor Evangélico', color: 'branco', grade: 'memorial' },
  '07-03': { name: 'São Tomé', title: 'Apóstolo', color: 'vermelho', grade: 'festa' },
  '07-11': { name: 'São Bento', title: 'Abade, Padroeiro da Europa', color: 'branco', grade: 'memorial' },
  '07-16': { name: 'Nossa Senhora do Carmo', title: 'Memória Facultativa', color: 'branco', grade: 'memorial_facultativo' },
  '07-22': { name: 'Santa Maria Madalena', title: 'Festa', color: 'branco', grade: 'festa' },
  '07-25': { name: 'São Tiago Maior', title: 'Apóstolo', color: 'vermelho', grade: 'festa' },
  '07-26': { name: 'Santos Joaquim e Ana', title: 'Pais de Nossa Senhora', color: 'branco', grade: 'memorial' },
  '08-04': { name: 'São João Maria Vianney', title: 'Cura d\'Ars', color: 'branco', grade: 'memorial' },
  '08-08': { name: 'São Domingos de Gusmão', title: 'Presbítero', color: 'branco', grade: 'memorial' },
  '08-10': { name: 'São Lourenço', title: 'Diácono e Mártir', color: 'vermelho', grade: 'festa' },
  '08-22': { name: 'Virgem Maria Rainha', title: 'Memória', color: 'branco', grade: 'memorial' },
  '08-24': { name: 'São Bartolomeu', title: 'Apóstolo', color: 'vermelho', grade: 'festa' },
  '08-28': { name: 'Santo Agostinho', title: 'Bispo e Doutor da Igreja', color: 'branco', grade: 'memorial' },
  '09-08': { name: 'Natividade de Nossa Senhora', title: 'Festa', color: 'branco', grade: 'festa' },
  '09-15': { name: 'Nossa Senhora das Dores', title: 'Memória', color: 'branco', grade: 'memorial' },
  '09-21': { name: 'São Mateus', title: 'Apóstolo e Evangelista', color: 'vermelho', grade: 'festa' },
  '09-23': { name: 'São Pio de Pietrelcina', title: 'Padre Pio', color: 'branco', grade: 'memorial' },
  '09-29': { name: 'Santos Arcanjos Miguel, Gabriel e Rafael', title: 'Festa', color: 'branco', grade: 'festa' },
  '10-01': { name: 'Santa Teresinha do Menino Jesus', title: 'Doutora da Igreja', color: 'branco', grade: 'memorial' },
  '10-02': { name: 'Santos Anjos da Guarda', title: 'Memória', color: 'branco', grade: 'memorial' },
  '10-04': { name: 'São Francisco de Assis', title: 'Memória', color: 'branco', grade: 'memorial' },
  '10-07': { name: 'Nossa Senhora do Rosário', title: 'Memória', color: 'branco', grade: 'memorial' },
  '10-15': { name: 'Santa Teresa de Ávila', title: 'Doutora da Igreja', color: 'branco', grade: 'memorial' },
  '10-18': { name: 'São Lucas', title: 'Evangelista', color: 'vermelho', grade: 'festa' },
  '10-28': { name: 'Santos Simão e Judas', title: 'Apóstolos', color: 'vermelho', grade: 'festa' },
  '11-09': { name: 'Dedicação da Basílica de Latrão', title: 'Festa', color: 'branco', grade: 'festa' },
  '11-21': { name: 'Apresentação de Nossa Senhora', title: 'Memória', color: 'branco', grade: 'memorial' },
  '11-22': { name: 'Santa Cecília', title: 'Virgem e Mártir', color: 'vermelho', grade: 'memorial' },
  '11-30': { name: 'Santo André', title: 'Apóstolo', color: 'vermelho', grade: 'festa' },
  '12-03': { name: 'São Francisco Xavier', title: 'Padroeiro das Missões', color: 'branco', grade: 'memorial' },
  '12-12': { name: 'Nossa Senhora de Guadalupe', title: 'Padroeira das Américas', color: 'branco', grade: 'festa' },
  '12-14': { name: 'São João da Cruz', title: 'Doutor da Igreja', color: 'branco', grade: 'memorial' },
}

// ── Festas Móveis (relativas à Páscoa) ──

interface MoveableFeast {
  offset: number // dias a partir da Páscoa
  name: string
  title: string
  color: 'branco' | 'vermelho' | 'verde' | 'roxo' | 'rosa'
  grade: 'solenidade' | 'festa' | 'memorial' | 'feria'
}

const MOVEABLE_FEASTS: MoveableFeast[] = [
  // Quaresma
  { offset: -46, name: 'Quarta-feira de Cinzas', title: 'Início da Quaresma', color: 'roxo', grade: 'feria' },

  // Semana Santa
  { offset: -7, name: 'Domingo de Ramos', title: 'Paixão do Senhor', color: 'vermelho', grade: 'solenidade' },
  { offset: -6, name: 'Segunda-feira Santa', title: 'Semana Santa', color: 'roxo', grade: 'feria' },
  { offset: -5, name: 'Terça-feira Santa', title: 'Semana Santa', color: 'roxo', grade: 'feria' },
  { offset: -4, name: 'Quarta-feira Santa', title: 'Semana Santa', color: 'roxo', grade: 'feria' },
  { offset: -3, name: 'Quinta-feira Santa', title: 'Ceia do Senhor', color: 'branco', grade: 'solenidade' },
  { offset: -2, name: 'Sexta-feira Santa', title: 'Paixão do Senhor', color: 'vermelho', grade: 'solenidade' },
  { offset: -1, name: 'Sábado Santo', title: 'Vigília Pascal', color: 'branco', grade: 'solenidade' },

  // Páscoa e Oitava
  { offset: 0, name: 'Domingo da Páscoa', title: 'Ressurreição do Senhor', color: 'branco', grade: 'solenidade' },
  { offset: 1, name: 'Segunda-feira da Oitava da Páscoa', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  { offset: 2, name: 'Terça-feira da Oitava da Páscoa', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  { offset: 3, name: 'Quarta-feira da Oitava da Páscoa', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  { offset: 4, name: 'Quinta-feira da Oitava da Páscoa', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  { offset: 5, name: 'Sexta-feira da Oitava da Páscoa', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  { offset: 6, name: 'Sábado da Oitava da Páscoa', title: 'Solenidade', color: 'branco', grade: 'solenidade' },

  // Domingos da Páscoa
  { offset: 7, name: '2º Domingo da Páscoa', title: 'Divina Misericórdia', color: 'branco', grade: 'solenidade' },
  { offset: 14, name: '3º Domingo da Páscoa', title: 'Tempo Pascal', color: 'branco', grade: 'solenidade' },
  { offset: 21, name: '4º Domingo da Páscoa', title: 'Bom Pastor', color: 'branco', grade: 'solenidade' },
  { offset: 28, name: '5º Domingo da Páscoa', title: 'Tempo Pascal', color: 'branco', grade: 'solenidade' },
  { offset: 35, name: '6º Domingo da Páscoa', title: 'Tempo Pascal', color: 'branco', grade: 'solenidade' },

  // Ascensão e Pentecostes
  { offset: 39, name: 'Ascensão do Senhor', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  { offset: 42, name: '7º Domingo da Páscoa', title: 'Tempo Pascal', color: 'branco', grade: 'solenidade' },
  { offset: 49, name: 'Domingo de Pentecostes', title: 'Solenidade', color: 'vermelho', grade: 'solenidade' },

  // Após Pentecostes
  { offset: 56, name: 'Santíssima Trindade', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  { offset: 60, name: 'Corpus Christi', title: 'Corpo e Sangue de Cristo', color: 'branco', grade: 'solenidade' },
  { offset: 68, name: 'Sagrado Coração de Jesus', title: 'Solenidade', color: 'branco', grade: 'solenidade' },
  { offset: 69, name: 'Imaculado Coração de Maria', title: 'Memória', color: 'branco', grade: 'memorial' },
]

// ── Cálculo do 1º Domingo do Advento ──

function computeAdvent1(year: number): Date {
  // Advent 1 = 4 domingos antes do Natal
  // = domingo mais próximo de 30 de novembro (entre 27/nov e 3/dez)
  const christmas = new Date(year, 11, 25)
  const christmasDow = christmas.getDay() // 0=domingo
  // Advent 4 = último domingo antes de 25/dez (ou 24/dez se for domingo)
  const advent4 = christmasDow === 0
    ? addDays(christmas, -7)
    : addDays(christmas, -christmasDow)
  return addDays(advent4, -21)
}

// ── Cálculo do Batismo do Senhor ──

function computeBaptismOfLord(year: number): Date {
  const epiphany = new Date(year, 0, 6)
  const epiphanyDow = epiphany.getDay()
  if (epiphanyDow === 0) {
    // Epifania no domingo → Batismo na segunda seguinte
    return addDays(epiphany, 1)
  }
  // Batismo = próximo domingo após Epifania
  return addDays(epiphany, 7 - epiphanyDow)
}

// ── Determinação do Tempo Litúrgico ──

function getLiturgicalSeason(
  date: Date,
  easter: Date,
  advent1: Date,
  baptism: Date,
): { season: string; week: number } {
  const year = date.getFullYear()
  const daysFromEaster = daysBetween(easter, date)
  const ashWednesday = addDays(easter, -46)
  const pentecost = addDays(easter, 49)
  const christmas = new Date(year, 11, 25)

  // Advent (1º Domingo do Advento até 24 de dezembro)
  if (date >= advent1 && date < christmas) {
    const weeksSinceAdvent1 = Math.floor(daysBetween(advent1, date) / 7)
    return { season: 'Advento', week: weeksSinceAdvent1 + 1 }
  }

  // Natal (25 de dezembro até Batismo do Senhor do ano seguinte)
  const prevYearChristmas = new Date(year - 1, 11, 25)
  if (date >= christmas || date < baptism) {
    if (date >= christmas) {
      return { season: 'Natal', week: 1 }
    }
    return { season: 'Natal', week: 2 }
  }

  // Quaresma (Quarta-feira de Cinzas até Quinta-feira Santa exclusive)
  const holyThursday = addDays(easter, -3)
  if (date >= ashWednesday && date < holyThursday) {
    const weeksSinceAsh = Math.floor(daysBetween(ashWednesday, date) / 7)
    return { season: 'Quaresma', week: weeksSinceAsh + 1 }
  }

  // Tríduo Pascal (Quinta-feira Santa até Sábado Santo)
  if (daysFromEaster >= -3 && daysFromEaster < 0) {
    return { season: 'Tríduo Pascal', week: 1 }
  }

  // Tempo Pascal (Páscoa até Pentecostes)
  if (daysFromEaster >= 0 && daysFromEaster <= 49) {
    const week = Math.floor(daysFromEaster / 7) + 1
    return { season: 'Tempo Pascal', week }
  }

  // Tempo Comum
  // Fase I: do Batismo do Senhor até Quarta-feira de Cinzas
  if (date >= baptism && date < ashWednesday) {
    const weeksSinceBaptism = Math.floor(daysBetween(baptism, date) / 7)
    return { season: 'Tempo Comum', week: weeksSinceBaptism + 1 }
  }

  // Fase II: de Pentecostes até o Advento
  if (date > pentecost && date < advent1) {
    // Contar semanas regressivamente a partir do Advento
    // Semana 34 é a última do Tempo Comum
    const weeksUntilAdvent = Math.floor(daysBetween(date, advent1) / 7)
    const week = 34 - weeksUntilAdvent
    return { season: 'Tempo Comum', week: Math.max(week, 9) }
  }

  return { season: 'Tempo Comum', week: 1 }
}

// ── Domingos da Quaresma ──

function getLentSunday(weekNum: number): { name: string; color: 'roxo' | 'rosa' } {
  if (weekNum === 4) {
    return { name: '4º Domingo da Quaresma (Laetare)', color: 'rosa' }
  }
  const ordinals = ['', '1º', '2º', '3º', '4º', '5º']
  return { name: `${ordinals[weekNum] ?? `${weekNum}º`} Domingo da Quaresma`, color: 'roxo' }
}

// ── Domingos do Advento ──

function getAdventSunday(weekNum: number): { name: string; color: 'roxo' | 'rosa' } {
  if (weekNum === 3) {
    return { name: '3º Domingo do Advento (Gaudete)', color: 'rosa' }
  }
  const ordinals = ['', '1º', '2º', '3º', '4º']
  return { name: `${ordinals[weekNum] ?? `${weekNum}º`} Domingo do Advento`, color: 'roxo' }
}

// ── Função principal ──

export function getLiturgicalDay(date: Date): LiturgicalDay {
  const year = date.getFullYear()
  const dow = date.getDay() // 0=domingo
  const key = dateKey(date)

  const easter = computeEaster(year)
  const advent1 = computeAdvent1(year)
  const baptism = computeBaptismOfLord(year)

  // 1. Verificar festas móveis (prioridade máxima — Páscoa, Oitava, etc.)
  const daysFromEaster = daysBetween(easter, date)
  for (const feast of MOVEABLE_FEASTS) {
    if (feast.offset === daysFromEaster) {
      return {
        name: feast.name,
        title: feast.title,
        season: daysFromEaster >= -46 && daysFromEaster < -7 ? 'Quaresma'
          : daysFromEaster >= -7 && daysFromEaster < 0 ? 'Semana Santa'
          : daysFromEaster >= 0 && daysFromEaster <= 49 ? 'Tempo Pascal'
          : 'Tempo Comum',
        color: feast.color,
        grade: feast.grade,
      }
    }
  }

  // 2. Determinar o tempo litúrgico
  const { season, week } = getLiturgicalSeason(date, easter, advent1, baptism)

  // 3. Festas fixas — verificar se prevalecem
  const fixed = FIXED_FEASTS[key]
  if (fixed) {
    // Solenidades e festas prevalecem sobre Tempo Comum
    // Solenidades com overrideSeason prevalecem sobre tempos fortes
    const inStrongSeason = season === 'Quaresma' || season === 'Advento' ||
      season === 'Tempo Pascal' || season === 'Tríduo Pascal'

    if (!inStrongSeason || fixed.overrideSeason ||
        (fixed.grade === 'solenidade' && season !== 'Tríduo Pascal')) {
      return {
        name: fixed.name,
        title: fixed.title,
        season,
        color: fixed.color,
        grade: fixed.grade,
      }
    }
  }

  // 4. Domingos dos tempos litúrgicos
  if (dow === 0) {
    if (season === 'Quaresma') {
      const lent = getLentSunday(week)
      return { name: lent.name, title: 'Quaresma', season, color: lent.color, grade: 'solenidade' }
    }
    if (season === 'Advento') {
      const advent = getAdventSunday(week)
      return { name: advent.name, title: 'Advento', season, color: advent.color, grade: 'solenidade' }
    }
    if (season === 'Natal') {
      if (sameDay(date, baptism) || sameDay(date, addDays(baptism, -1))) {
        // Handle: sometimes Baptism falls on different days
      }
      return { name: 'Domingo do Tempo do Natal', title: 'Tempo do Natal', season, color: 'branco', grade: 'solenidade' }
    }
    if (season === 'Tempo Pascal') {
      // Sundays of Easter already handled in moveable feasts
    }
    if (season === 'Tempo Comum') {
      const ordinal = week
      return {
        name: `${ordinal}º Domingo do Tempo Comum`,
        title: 'Tempo Comum',
        season,
        color: 'verde',
        grade: 'solenidade',
      }
    }
  }

  // 5. Batismo do Senhor (pode não ser domingo em alguns casos)
  if (sameDay(date, baptism)) {
    return {
      name: 'Batismo do Senhor',
      title: 'Festa do Senhor',
      season: 'Natal',
      color: 'branco',
      grade: 'festa',
    }
  }

  // 6. Férias dos tempos litúrgicos
  const diaSemana = DIAS_SEMANA[dow]

  if (season === 'Quaresma') {
    if (week === 1 && daysFromEaster > -46 && daysFromEaster < -46 + 4) {
      // Dias após Quarta-feira de Cinzas (antes do 1º Domingo)
      return {
        name: `${diaSemana} depois de Cinzas`,
        title: 'Quaresma',
        season,
        color: 'roxo',
        grade: 'feria',
      }
    }
    return {
      name: `${diaSemana} da ${week}ª semana da Quaresma`,
      title: 'Quaresma',
      season,
      color: 'roxo',
      grade: 'feria',
    }
  }

  if (season === 'Tempo Pascal') {
    return {
      name: `${diaSemana} da ${week}ª semana da Páscoa`,
      title: 'Tempo Pascal',
      season,
      color: 'branco',
      grade: 'feria',
    }
  }

  if (season === 'Advento') {
    return {
      name: `${diaSemana} da ${week}ª semana do Advento`,
      title: 'Advento',
      season,
      color: 'roxo',
      grade: 'feria',
    }
  }

  if (season === 'Natal') {
    return {
      name: `${diaSemana} do Tempo do Natal`,
      title: 'Tempo do Natal',
      season,
      color: 'branco',
      grade: 'feria',
    }
  }

  // 7. Memoriais em Tempo Comum (santos fixos de menor grau)
  if (fixed && season === 'Tempo Comum') {
    return {
      name: fixed.name,
      title: fixed.title,
      season,
      color: fixed.color,
      grade: fixed.grade,
    }
  }

  // 8. Féria do Tempo Comum
  return {
    name: `${diaSemana} da ${week}ª semana do Tempo Comum`,
    title: 'Tempo Comum',
    season,
    color: 'verde',
    grade: 'feria',
  }
}
