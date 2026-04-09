'use client'

import { useEffect, useState } from 'react'
import { Crown, Calendar, BookOpen, Sun } from 'lucide-react'

interface LiturgicalData {
  saintName: string
  saintTitle: string
  feastType: string
  liturgicalColor: string
  date: string
  loading: boolean
  error: boolean
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; label: string }> = {
  branco: { bg: 'rgba(242,237,228,0.08)', border: 'rgba(242,237,228,0.2)', text: '#F2EDE4', label: 'Branco' },
  vermelho: { bg: 'rgba(217,79,92,0.08)', border: 'rgba(217,79,92,0.2)', text: '#D94F5C', label: 'Vermelho' },
  verde: { bg: 'rgba(76,175,80,0.08)', border: 'rgba(76,175,80,0.2)', text: '#66BB6A', label: 'Verde' },
  roxo: { bg: 'rgba(156,39,176,0.08)', border: 'rgba(156,39,176,0.2)', text: '#BA68C8', label: 'Roxo' },
  rosa: { bg: 'rgba(244,143,177,0.08)', border: 'rgba(244,143,177,0.2)', text: '#F48FB1', label: 'Rosa' },
  dourado: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)', text: '#C9A84C', label: 'Dourado' },
}

const FEAST_MAP: Record<string, string> = {
  'solenidade': 'Solenidade',
  'festa': 'Festa',
  'memorial': 'Memória',
  'memorial_facultativo': 'Memória Facultativa',
  'feria': 'Féria',
}

// Fallback: Santos do calendário romano por mês/dia (dados reais do Martyrologium Romanum)
const FALLBACK_SAINTS: Record<string, { name: string; title: string; color: string; feast: string }> = {
  '01-01': { name: 'Maria, Santíssima Mãe de Deus', title: 'Solenidade', color: 'branco', feast: 'solenidade' },
  '01-06': { name: 'Epifania do Senhor', title: 'Solenidade', color: 'branco', feast: 'solenidade' },
  '01-17': { name: 'Santo Antão', title: 'Abade, Pai dos Monges', color: 'branco', feast: 'memorial' },
  '01-25': { name: 'Conversão de São Paulo', title: 'Apóstolo', color: 'branco', feast: 'festa' },
  '01-28': { name: 'São Tomás de Aquino', title: 'Doutor da Igreja', color: 'branco', feast: 'memorial' },
  '01-31': { name: 'São João Bosco', title: 'Presbítero', color: 'branco', feast: 'memorial' },
  '02-02': { name: 'Apresentação do Senhor', title: 'Festa', color: 'branco', feast: 'festa' },
  '02-11': { name: 'Nossa Senhora de Lourdes', title: 'Dia Mundial do Enfermo', color: 'branco', feast: 'memorial_facultativo' },
  '02-22': { name: 'Cátedra de São Pedro', title: 'Apóstolo', color: 'branco', feast: 'festa' },
  '03-19': { name: 'São José', title: 'Esposo da Virgem Maria', color: 'branco', feast: 'solenidade' },
  '03-25': { name: 'Anunciação do Senhor', title: 'Solenidade', color: 'branco', feast: 'solenidade' },
  '04-23': { name: 'São Jorge', title: 'Mártir', color: 'vermelho', feast: 'memorial' },
  '04-25': { name: 'São Marcos', title: 'Evangelista', color: 'vermelho', feast: 'festa' },
  '04-29': { name: 'Santa Catarina de Sena', title: 'Doutora da Igreja', color: 'branco', feast: 'memorial' },
  '05-01': { name: 'São José Operário', title: 'Esposo de Maria', color: 'branco', feast: 'memorial' },
  '05-13': { name: 'Nossa Senhora de Fátima', title: 'Padroeira', color: 'branco', feast: 'memorial_facultativo' },
  '05-31': { name: 'Visitação de Nossa Senhora', title: 'Festa', color: 'branco', feast: 'festa' },
  '06-13': { name: 'Santo Antônio de Pádua', title: 'Doutor Evangélico', color: 'branco', feast: 'memorial' },
  '06-24': { name: 'Natividade de São João Batista', title: 'Solenidade', color: 'branco', feast: 'solenidade' },
  '06-29': { name: 'Santos Pedro e Paulo', title: 'Apóstolos', color: 'vermelho', feast: 'solenidade' },
  '07-03': { name: 'São Tomé', title: 'Apóstolo', color: 'vermelho', feast: 'festa' },
  '07-11': { name: 'São Bento', title: 'Abade, Padroeiro da Europa', color: 'branco', feast: 'memorial' },
  '07-16': { name: 'Nossa Senhora do Carmo', title: 'Rainha do Carmelo', color: 'branco', feast: 'memorial_facultativo' },
  '07-22': { name: 'Santa Maria Madalena', title: 'Apóstola dos Apóstolos', color: 'branco', feast: 'festa' },
  '07-25': { name: 'São Tiago', title: 'Apóstolo', color: 'vermelho', feast: 'festa' },
  '07-26': { name: 'Santos Joaquim e Ana', title: 'Pais de Nossa Senhora', color: 'branco', feast: 'memorial' },
  '08-04': { name: 'São João Maria Vianney', title: 'Cura d\'Ars', color: 'branco', feast: 'memorial' },
  '08-06': { name: 'Transfiguração do Senhor', title: 'Festa', color: 'branco', feast: 'festa' },
  '08-08': { name: 'São Domingos de Gusmão', title: 'Presbítero', color: 'branco', feast: 'memorial' },
  '08-10': { name: 'São Lourenço', title: 'Diácono e Mártir', color: 'vermelho', feast: 'festa' },
  '08-15': { name: 'Assunção de Nossa Senhora', title: 'Dogma Mariano', color: 'branco', feast: 'solenidade' },
  '08-22': { name: 'Virgem Maria Rainha', title: 'Memória', color: 'branco', feast: 'memorial' },
  '08-28': { name: 'Santo Agostinho', title: 'Bispo e Doutor da Igreja', color: 'branco', feast: 'memorial' },
  '09-08': { name: 'Natividade de Nossa Senhora', title: 'Festa', color: 'branco', feast: 'festa' },
  '09-14': { name: 'Exaltação da Santa Cruz', title: 'Festa', color: 'vermelho', feast: 'festa' },
  '09-15': { name: 'Nossa Senhora das Dores', title: 'Memória', color: 'branco', feast: 'memorial' },
  '09-21': { name: 'São Mateus', title: 'Apóstolo e Evangelista', color: 'vermelho', feast: 'festa' },
  '09-23': { name: 'São Pio de Pietrelcina', title: 'Padre Pio', color: 'branco', feast: 'memorial' },
  '09-29': { name: 'Santos Arcanjos Miguel, Gabriel e Rafael', title: 'Festa', color: 'branco', feast: 'festa' },
  '10-01': { name: 'Santa Teresinha do Menino Jesus', title: 'Doutora da Igreja', color: 'branco', feast: 'memorial' },
  '10-02': { name: 'Santos Anjos da Guarda', title: 'Memória', color: 'branco', feast: 'memorial' },
  '10-04': { name: 'São Francisco de Assis', title: 'Padroeiro da Itália', color: 'branco', feast: 'memorial' },
  '10-07': { name: 'Nossa Senhora do Rosário', title: 'Memória', color: 'branco', feast: 'memorial' },
  '10-12': { name: 'Nossa Senhora Aparecida', title: 'Padroeira do Brasil', color: 'branco', feast: 'solenidade' },
  '10-15': { name: 'Santa Teresa de Ávila', title: 'Doutora da Igreja', color: 'branco', feast: 'memorial' },
  '10-18': { name: 'São Lucas', title: 'Evangelista', color: 'vermelho', feast: 'festa' },
  '10-28': { name: 'Santos Simão e Judas', title: 'Apóstolos', color: 'vermelho', feast: 'festa' },
  '11-01': { name: 'Todos os Santos', title: 'Solenidade', color: 'branco', feast: 'solenidade' },
  '11-02': { name: 'Fiéis Defuntos', title: 'Comemoração', color: 'roxo', feast: 'memorial' },
  '11-09': { name: 'Dedicação da Basílica de Latrão', title: 'Festa', color: 'branco', feast: 'festa' },
  '11-21': { name: 'Apresentação de Nossa Senhora', title: 'Memória', color: 'branco', feast: 'memorial' },
  '11-22': { name: 'Santa Cecília', title: 'Virgem e Mártir', color: 'vermelho', feast: 'memorial' },
  '11-30': { name: 'Santo André', title: 'Apóstolo', color: 'vermelho', feast: 'festa' },
  '12-03': { name: 'São Francisco Xavier', title: 'Padroeiro das Missões', color: 'branco', feast: 'memorial' },
  '12-08': { name: 'Imaculada Conceição', title: 'Padroeira de Portugal', color: 'branco', feast: 'solenidade' },
  '12-12': { name: 'Nossa Senhora de Guadalupe', title: 'Padroeira das Américas', color: 'branco', feast: 'festa' },
  '12-14': { name: 'São João da Cruz', title: 'Doutor da Igreja', color: 'branco', feast: 'memorial' },
  '12-25': { name: 'Natividade do Senhor', title: 'Natal', color: 'branco', feast: 'solenidade' },
  '12-26': { name: 'Santo Estêvão', title: 'Primeiro Mártir', color: 'vermelho', feast: 'festa' },
  '12-27': { name: 'São João', title: 'Apóstolo e Evangelista', color: 'branco', feast: 'festa' },
}

function getTodayKey(): string {
  const now = new Date()
  return `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getFallbackData(): LiturgicalData {
  const key = getTodayKey()
  const saint = FALLBACK_SAINTS[key]

  if (saint) {
    return {
      saintName: saint.name,
      saintTitle: saint.title,
      feastType: saint.feast,
      liturgicalColor: saint.color,
      date: key,
      loading: false,
      error: false,
    }
  }

  // Default for days without specific entry: Féria do Tempo Comum
  return {
    saintName: 'Féria do Tempo Comum',
    saintTitle: 'Dia da semana',
    feastType: 'feria',
    liturgicalColor: 'verde',
    date: key,
    loading: false,
    error: false,
  }
}

export default function SantoDoDia() {
  const [data, setData] = useState<LiturgicalData>({
    saintName: '',
    saintTitle: '',
    feastType: '',
    liturgicalColor: 'verde',
    date: '',
    loading: true,
    error: false,
  })

  useEffect(() => {
    // Try to fetch from the Liturgical Calendar API
    async function fetchLiturgical() {
      try {
        const now = new Date()
        const year = now.getFullYear()
        const url = `https://litcal.johnromanodorazio.com/api/dev/calendar?year=${year}&locale=pt_BR&returntype=json`

        const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
        if (!res.ok) throw new Error('API error')

        const json = await res.json()
        const today = now.toISOString().split('T')[0]

        // Find today's celebration in the API response
        const events = json?.LitCal ?? json?.litcal ?? {}
        let bestMatch: { name: string; grade: number; color: string } | null = null

        for (const key of Object.keys(events)) {
          const ev = events[key]
          const evDate = ev.date ? new Date(ev.date * 1000).toISOString().split('T')[0] : null
          if (evDate === today) {
            if (!bestMatch || (ev.grade ?? 0) > bestMatch.grade) {
              bestMatch = {
                name: ev.name ?? key,
                grade: ev.grade ?? 0,
                color: Array.isArray(ev.color) ? ev.color[0] : (ev.color ?? 'green'),
              }
            }
          }
        }

        if (bestMatch) {
          const colorMap: Record<string, string> = { white: 'branco', red: 'vermelho', green: 'verde', purple: 'roxo', pink: 'rosa', gold: 'dourado' }
          const gradeMap: Record<number, string> = { 7: 'solenidade', 6: 'festa', 5: 'festa', 4: 'memorial', 3: 'memorial_facultativo', 2: 'feria', 1: 'feria', 0: 'feria' }

          setData({
            saintName: bestMatch.name,
            saintTitle: FEAST_MAP[gradeMap[bestMatch.grade] ?? 'feria'] ?? 'Féria',
            feastType: gradeMap[bestMatch.grade] ?? 'feria',
            liturgicalColor: colorMap[bestMatch.color] ?? 'verde',
            date: getTodayKey(),
            loading: false,
            error: false,
          })
          return
        }
      } catch {
        // API failed, use fallback
      }

      setData(getFallbackData())
    }

    fetchLiturgical()
  }, [])

  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })

  const colorInfo = COLOR_MAP[data.liturgicalColor] ?? COLOR_MAP.verde

  if (data.loading) {
    return (
      <div className="rounded-2xl p-6 md:p-7"
        style={{ background: 'rgba(16,16,16,0.75)', border: '1px solid rgba(201,168,76,0.12)' }}>
        <div className="flex items-center gap-3">
          <div className="skeleton w-11 h-11 !rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-4 w-48" />
            <div className="skeleton h-3 w-32" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-6 md:p-7 transition-all duration-300"
      style={{
        background: 'rgba(16,16,16,0.75)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colorInfo.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Date + Color */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span className="text-xs tracking-wider uppercase"
            style={{ fontFamily: 'Poppins, sans-serif', color: '#7A7368' }}>
            {hoje}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: colorInfo.text }} />
          <span className="text-[10px] tracking-wider uppercase"
            style={{ fontFamily: 'Poppins, sans-serif', color: colorInfo.text }}>
            {colorInfo.label}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: colorInfo.bg, border: `1px solid ${colorInfo.border}` }}>
          <Crown className="w-5 h-5" style={{ color: colorInfo.text }} />
        </div>
        <div>
          <h3 className="text-xs tracking-[0.15em] uppercase mb-1"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            Calendário Litúrgico
          </h3>
          <h2 className="text-lg font-bold leading-tight"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            {data.saintName}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            {data.saintTitle}
          </p>
        </div>
      </div>

      {/* Feast type badge */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase"
          style={{ background: colorInfo.bg, border: `1px solid ${colorInfo.border}`, color: colorInfo.text, fontFamily: 'Poppins, sans-serif' }}>
          {FEAST_MAP[data.feastType] ?? data.feastType}
        </span>
      </div>
    </div>
  )
}
