'use client'

import { Plus, X } from 'lucide-react'
import type { ListBlock } from '../../types'

export default function ListEditor({
  block,
  onChange,
}: {
  block: ListBlock
  onChange: (next: ListBlock) => void
}) {
  const updateItem = (idx: number, value: string) => {
    const items = [...block.items]
    items[idx] = value
    onChange({ ...block, items })
  }
  const removeItem = (idx: number) => {
    const items = block.items.filter((_, i) => i !== idx)
    onChange({ ...block, items: items.length > 0 ? items : [''] })
  }
  const addItem = () => onChange({ ...block, items: [...block.items, ''] })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 text-[10px]">
        <button
          type="button"
          onClick={() => onChange({ ...block, ordered: false })}
          className="rounded-md px-2 py-1"
          style={{
            fontFamily: 'Poppins, sans-serif',
            background: !block.ordered ? 'rgba(201,168,76,0.18)' : 'transparent',
            border: `1px solid ${!block.ordered ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.12)'}`,
            color: !block.ordered ? '#C9A84C' : '#8A8378',
          }}
        >
          • Bullets
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...block, ordered: true })}
          className="rounded-md px-2 py-1"
          style={{
            fontFamily: 'Poppins, sans-serif',
            background: block.ordered ? 'rgba(201,168,76,0.18)' : 'transparent',
            border: `1px solid ${block.ordered ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.12)'}`,
            color: block.ordered ? '#C9A84C' : '#8A8378',
          }}
        >
          1. Numerada
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span
              className="shrink-0 text-sm"
              style={{
                fontFamily: 'Poppins, sans-serif',
                color: '#C9A84C',
                width: 24,
                textAlign: 'center',
              }}
            >
              {block.ordered ? `${idx + 1}.` : '•'}
            </span>
            <input
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              placeholder="Item da lista"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{
                fontFamily: 'Poppins, sans-serif',
                color: '#F2EDE4',
              }}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              aria-label="Remover item"
              className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
              style={{ color: '#8A8378' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 text-xs self-start rounded-md px-2 py-1"
        style={{
          fontFamily: 'Poppins, sans-serif',
          color: '#C9A84C',
          background: 'rgba(201,168,76,0.06)',
          border: '1px dashed rgba(201,168,76,0.25)',
        }}
      >
        <Plus className="w-3 h-3" />
        Adicionar item
      </button>
    </div>
  )
}
