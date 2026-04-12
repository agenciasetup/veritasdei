'use client'

import { useRef, useState } from 'react'
import { Camera, Trash2, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type FotoParoquia, LABELS_FOTO_SUGERIDOS, MAX_FOTOS } from '@/types/paroquia'

interface Props {
  value: FotoParoquia[]
  onChange: (v: FotoParoquia[]) => void
  onError?: (msg: string) => void
}

/**
 * Gallery uploader (up to 5 photos) with editable labels.
 * Uploads to the public `paroquias` bucket.
 */
export default function FotosGallery({ value, onChange, onError }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return
    // reset input so selecting the same file again re-triggers onChange
    e.target.value = ''

    if (value.length >= MAX_FOTOS) {
      onError?.(`Máximo de ${MAX_FOTOS} fotos.`)
      return
    }
    if (!file.type.startsWith('image/')) {
      onError?.('Apenas imagens são permitidas.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.('A imagem deve ter no máximo 5MB.')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('paroquias').upload(path, file)
    if (error) {
      onError?.(error.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('paroquias').getPublicUrl(path)
    const nextLabel = LABELS_FOTO_SUGERIDOS[value.length] ?? ''
    onChange([...value, { url: data.publicUrl, label: nextLabel }])
    setUploading(false)
  }

  const updateLabel = (i: number, label: string) => {
    onChange(value.map((f, idx) => (idx === i ? { ...f, label } : f)))
  }

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i))
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <h3
            className="text-xs tracking-wider uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Galeria de Fotos
          </h3>
        </div>
        <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          {value.length}/{MAX_FOTOS}
        </span>
      </div>

      <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        Sugestões: frontal, interno, lateral, missa, escritório.
      </p>

      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {value.map((foto, i) => (
            <div
              key={`${foto.url}-${i}`}
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.1)' }}
            >
              <div className="relative w-full h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.url} alt={foto.label || 'Foto da paróquia'} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.75)', color: '#D94F5C', border: 'none' }}
                  aria-label="Remover foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(0,0,0,0.75)',
                      color: i === 0 ? '#7A7368' : '#C9A84C',
                      border: 'none',
                      opacity: i === 0 ? 0.4 : 1,
                    }}
                    aria-label="Mover para cima"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <input
                  type="text"
                  value={foto.label}
                  onChange={e => updateLabel(i, e.target.value)}
                  placeholder="Legenda da foto"
                  className="w-full px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: 'rgba(10,10,10,0.6)',
                    border: '1px solid rgba(201,168,76,0.12)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length < MAX_FOTOS && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all"
          style={{ borderColor: 'rgba(201,168,76,0.15)', color: '#7A7368', background: 'transparent' }}
        >
          {uploading ? (
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
            />
          ) : (
            <>
              <Camera className="w-5 h-5" style={{ color: '#C9A84C' }} />
              <span className="text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Adicionar foto
              </span>
            </>
          )}
        </button>
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
