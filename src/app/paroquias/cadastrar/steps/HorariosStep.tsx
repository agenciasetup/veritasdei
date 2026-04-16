'use client'

import { Clock } from 'lucide-react'
import HorariosSection from '@/components/paroquias/HorariosSection'
import type { ParoquiaFormState } from '../types'

interface Props {
  state: ParoquiaFormState
  setField: <K extends keyof ParoquiaFormState>(key: K, v: ParoquiaFormState[K]) => void
}

export default function HorariosStep({ state, setField }: Props) {
  return (
    <div className="space-y-4">
      <HorariosSection
        label="Horários de missa"
        icon={Clock}
        value={state.horariosMissa}
        onChange={(v) => setField('horariosMissa', v)}
      />
      <HorariosSection
        label="Horários de confissão"
        icon={Clock}
        value={state.horariosConfissao}
        onChange={(v) => setField('horariosConfissao', v)}
        emptyMessage="Adicione os horários em que a igreja atende confissões."
      />
    </div>
  )
}
