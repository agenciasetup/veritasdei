'use client'

import { Clock, Plus, Trash2, type LucideIcon } from 'lucide-react'
import type { HorarioMissa } from '@/types/paroquia'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface Props {
  label: string
  value: HorarioMissa[]
  onChange: (v: HorarioMissa[]) => void
  icon?: LucideIcon
  emptyMessage?: string
}

/**
 * Editor for a list of recurring schedule slots (day + time).
 * Used for both horários de missa and horários de confissão.
 */
export default function HorariosSection({
  label,
  value,
  onChange,
  icon: Icon = Clock,
  emptyMessage,
}: Props) {
  const add = () => onChange([...value, { dia: 'Domingo', horario: '08:00' }])
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof HorarioMissa, v: string) =>
    onChange(value.map((h, idx) => (idx === i ? { ...h, [field]: v } : h)))

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: '#C9A84C' }} />
        <h3
          className="text-xs tracking-wider uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          {label}
        </h3>
      </div>

      {value.length === 0 && emptyMessage && (
        <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          {emptyMessage}
        </p>
      )}

      {value.map((h, i) => (
        <div key={i} className="flex items-center gap-3">
          <select
            value={h.dia}
            onChange={e => update(i, 'dia', e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm appearance-none"
            style={{
              background: 'rgba(10,10,10,0.6)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
            }}
          >
            {DIAS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="time"
            value={h.horario}
            onChange={e => update(i, 'horario', e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm"
            style={{
              background: 'rgba(10,10,10,0.6)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remover horário"
            style={{ color: '#D94F5C', background: 'none', border: 'none' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 text-xs"
        style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif', background: 'none', border: 'none' }}
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar horário
      </button>
    </div>
  )
}
