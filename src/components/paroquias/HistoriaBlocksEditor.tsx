'use client'

import { useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BookText,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Minus,
  Quote as QuoteIcon,
  Trash2,
  Type,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { HistoriaBlock, HistoriaBlockType } from '@/types/paroquia'
import HistoriaBlocksView from './HistoriaBlocksView'

interface Props {
  value: HistoriaBlock[]
  onChange: (v: HistoriaBlock[]) => void
  onError?: (msg: string) => void
}

const COLOR_PRESETS = [
  { value: '', label: 'Padrão' },
  { value: '#C9A84C', label: 'Dourado' },
  { value: '#6B1D2A', label: 'Bordô' },
  { value: '#D94F5C', label: 'Rubi' },
  { value: '#F2EDE4', label: 'Marfim' },
  { value: '#7A9B76', label: 'Verde' },
  { value: '#5C7BA8', label: 'Azul' },
]

function newId() {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function newBlock(type: HistoriaBlockType): HistoriaBlock {
  return { id: newId(), type, text: '' }
}

export default function HistoriaBlocksEditor({ value, onChange, onError }: Props) {
  const supabase = createClient()
  const [preview, setPreview] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const targetIdRef = useRef<string | null>(null)

  const add = (type: HistoriaBlockType) => onChange([...value, newBlock(type)])
  const update = (id: string, patch: Partial<HistoriaBlock>) =>
    onChange(value.map(b => (b.id === id ? { ...b, ...patch } : b)))
  const remove = (id: string) => onChange(value.filter(b => b.id !== id))
  const move = (id: string, dir: -1 | 1) => {
    const i = value.findIndex(b => b.id === id)
    if (i < 0) return
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  const pickImage = (blockId: string) => {
    targetIdRef.current = blockId
    fileInputRef.current?.click()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const blockId = targetIdRef.current
    e.target.value = ''
    if (!file || !supabase || !blockId) return

    if (!file.type.startsWith('image/')) {
      onError?.('Apenas imagens são permitidas.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.('A imagem deve ter no máximo 5MB.')
      return
    }

    setUploadingId(blockId)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `historia/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('paroquias').upload(path, file)
    if (error) {
      onError?.(error.message)
      setUploadingId(null)
      return
    }
    const { data } = supabase.storage.from('paroquias').getPublicUrl(path)
    update(blockId, { url: data.publicUrl })
    setUploadingId(null)
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookText className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <h3
            className="text-xs tracking-wider uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            História da Igreja
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{
            fontFamily: 'Poppins, sans-serif',
            background: preview ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: '1px solid rgba(201,168,76,0.2)',
            color: '#C9A84C',
          }}
        >
          {preview ? 'Editar' : 'Preview'}
        </button>
      </div>

      <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        Monte a história com blocos: títulos, parágrafos, citações, imagens e divisores.
      </p>

      {preview ? (
        <div
          className="rounded-xl p-5"
          style={{ background: 'rgba(10,10,10,0.45)', border: '1px solid rgba(201,168,76,0.08)' }}
        >
          <HistoriaBlocksView blocks={value} />
        </div>
      ) : (
        <>
          {value.length === 0 && (
            <p className="text-xs italic" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Nenhum bloco ainda. Comece adicionando um título ou parágrafo abaixo.
            </p>
          )}

          <div className="space-y-3">
            {value.map((block, i) => (
              <BlockRow
                key={block.id}
                block={block}
                index={i}
                total={value.length}
                uploading={uploadingId === block.id}
                onUpdate={patch => update(block.id, patch)}
                onMove={dir => move(block.id, dir)}
                onRemove={() => remove(block.id)}
                onPickImage={() => pickImage(block.id)}
              />
            ))}
          </div>

          <div className="pt-2 border-t" style={{ borderColor: 'rgba(201,168,76,0.12)' }}>
            <p className="text-xs mb-2" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Adicionar bloco
            </p>
            <div className="flex flex-wrap gap-2">
              <AddButton icon={Heading1} label="Título" onClick={() => add('titulo')} />
              <AddButton icon={Heading2} label="Subtítulo" onClick={() => add('subtitulo')} />
              <AddButton icon={Type} label="Parágrafo" onClick={() => add('paragrafo')} />
              <AddButton icon={QuoteIcon} label="Citação" onClick={() => add('citacao')} />
              <AddButton icon={ImageIcon} label="Imagem" onClick={() => add('imagem')} />
              <AddButton icon={Minus} label="Divisor" onClick={() => add('divisor')} />
            </div>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}

function AddButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
      style={{
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.15)',
        color: '#C9A84C',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function BlockRow({
  block,
  index,
  total,
  uploading,
  onUpdate,
  onMove,
  onRemove,
  onPickImage,
}: {
  block: HistoriaBlock
  index: number
  total: number
  uploading: boolean
  onUpdate: (patch: Partial<HistoriaBlock>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onPickImage: () => void
}) {
  const label =
    block.type === 'titulo'
      ? 'Título'
      : block.type === 'subtitulo'
        ? 'Subtítulo'
        : block.type === 'paragrafo'
          ? 'Parágrafo'
          : block.type === 'citacao'
            ? 'Citação'
            : block.type === 'imagem'
              ? 'Imagem'
              : 'Divisor'

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(10,10,10,0.55)', border: '1px solid rgba(201,168,76,0.12)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full"
          style={{
            color: '#C9A84C',
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.15)',
            fontFamily: 'Cinzel, serif',
          }}
        >
          {label}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn disabled={index === 0} onClick={() => onMove(-1)} aria="Mover para cima">
            <ArrowUp className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn disabled={index === total - 1} onClick={() => onMove(1)} aria="Mover para baixo">
            <ArrowDown className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn onClick={onRemove} aria="Remover" danger>
            <Trash2 className="w-3.5 h-3.5" />
          </IconBtn>
        </div>
      </div>

      {(block.type === 'titulo' || block.type === 'subtitulo') && (
        <input
          type="text"
          value={block.text ?? ''}
          onChange={e => onUpdate({ text: e.target.value })}
          placeholder={block.type === 'titulo' ? 'Digite o título' : 'Digite o subtítulo'}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={inputStyle}
        />
      )}

      {block.type === 'paragrafo' && (
        <textarea
          value={block.text ?? ''}
          onChange={e => onUpdate({ text: e.target.value })}
          placeholder="Escreva o parágrafo..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
        />
      )}

      {block.type === 'citacao' && (
        <>
          <textarea
            value={block.text ?? ''}
            onChange={e => onUpdate({ text: e.target.value })}
            placeholder="Texto da citação..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
          />
          <input
            type="text"
            value={block.author ?? ''}
            onChange={e => onUpdate({ author: e.target.value })}
            placeholder="Autor da citação (ex: São Francisco)"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={inputStyle}
          />
        </>
      )}

      {block.type === 'imagem' && (
        <>
          {block.url ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.url} alt={block.caption ?? ''} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={onPickImage}
                className="absolute bottom-2 right-2 text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(0,0,0,0.75)',
                  color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.2)',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Trocar imagem
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onPickImage}
              disabled={uploading}
              className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2"
              style={{ borderColor: 'rgba(201,168,76,0.15)', color: '#7A7368', background: 'transparent' }}
            >
              {uploading ? (
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
                />
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" style={{ color: '#C9A84C' }} />
                  <span className="text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Selecionar imagem
                  </span>
                </>
              )}
            </button>
          )}
          <input
            type="text"
            value={block.caption ?? ''}
            onChange={e => onUpdate({ caption: e.target.value })}
            placeholder="Legenda (opcional)"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={inputStyle}
          />
        </>
      )}

      {block.type !== 'divisor' && block.type !== 'imagem' && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Cor
          </span>
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.value || 'default'}
              type="button"
              onClick={() => onUpdate({ color: preset.value || undefined })}
              aria-label={preset.label}
              className="w-5 h-5 rounded-full transition-all"
              style={{
                background: preset.value || 'transparent',
                border: (block.color || '') === preset.value
                  ? '2px solid #F2EDE4'
                  : '1px solid rgba(201,168,76,0.3)',
                outline: preset.value ? 'none' : '1px dashed rgba(201,168,76,0.3)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(10,10,10,0.6)',
  border: '1px solid rgba(201,168,76,0.12)',
  color: '#F2EDE4',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
}

function IconBtn({
  children,
  onClick,
  disabled,
  aria,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  aria: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
      style={{
        background: 'rgba(10,10,10,0.6)',
        border: '1px solid rgba(201,168,76,0.12)',
        color: danger ? '#D94F5C' : '#C9A84C',
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

