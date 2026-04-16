'use client'

import { Calendar, MapPin, Users, HandHeart } from 'lucide-react'
import HubHeader from '@/components/hubs/HubHeader'
import HubTile from '@/components/hubs/HubTile'
import AuthGuard from '@/components/auth/AuthGuard'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'

const COLOR_DOTS: Record<string, string> = {
  branco: '#F2EDE4',
  vermelho: '#D94F5C',
  verde: '#66BB6A',
  roxo: '#BA68C8',
  rosa: '#F48FB1',
}

export default function LiturgiaPage() {
  const day = getLiturgicalDay(new Date())
  const dotColor = COLOR_DOTS[day.color] ?? '#66BB6A'
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <HubHeader
          title="Liturgia"
          subtitle="Calendário, leituras e sacramentos"
        />

        {/* Card destaque: dia litúrgico atual */}
        <div className="px-4 max-w-2xl mx-auto mb-3">
          <div
            className="p-5 rounded-2xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))',
              border: '1px solid rgba(201,168,76,0.18)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: dotColor }}
              />
              <span
                className="text-[11px] uppercase tracking-[0.15em]"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Hoje — {hoje}
              </span>
            </div>
            <p
              className="text-xl mb-1"
              style={{ color: '#F2EDE4', fontFamily: 'Cormorant Garamond, serif' }}
            >
              {day.title || day.name}
            </p>
            <p
              className="text-sm"
              style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
            >
              {day.season}
            </p>
          </div>
        </div>

        <div className="px-4 flex flex-col gap-3 max-w-2xl mx-auto stagger-in">
          <HubTile
            href="/calendario"
            icon={<Calendar className="w-6 h-6" />}
            title="Calendário Litúrgico"
            subtitle="Santos, festas e tempos do ano"
            featured
          />
          <HubTile
            href="/paroquias/buscar"
            icon={<MapPin className="w-6 h-6" />}
            title="Igrejas perto de mim"
            subtitle="Mostra igrejas próximas e horários de Missa/Confissão"
          />
          <HubTile
            href="/exame-consciencia"
            icon={<HandHeart className="w-6 h-6" />}
            title="Preparar Confissão"
            subtitle="Exame de consciência antes do sacramento"
          />
          <HubTile
            href="/comunidade"
            icon={<Users className="w-6 h-6" />}
            title="Comunidade"
            subtitle="Grupos de oração e pastoral"
          />
        </div>
      </main>
    </AuthGuard>
  )
}
