'use client'

import { AlertTriangle, Loader2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { uploadPrayerAudio, uploadPrayerImage, fmtMB } from './upload'

type Kind = 'audio' | 'image'

/**
 * Campo híbrido: input de URL + botão "Enviar arquivo" que sobe
 * pro bucket `prayer-media` e preenche a URL resultante.
 *
 * Imagens passam por compressImage antes do upload (regra do
 * projeto — ver memory/feedback_image_compress_before_upload.md).
 */
export default function UploadField({
  kind,
  value,
  onChange,
  placeholder,
}: {
  kind: Kind
  value: string
  onChange: (url: string) => void
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const accept =
    kind === 'audio'
      ? 'audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,.mp3,.m4a,.ogg'
      : 'image/jpeg,image/png,image/webp,image/gif'

  const handlePick = () => inputRef.current?.click()

  const handleFile = async (file: File) => {
    setError(null)
    setInfo(null)
    setUploading(true)
    try {
      const result =
        kind === 'audio' ? await uploadPrayerAudio(file) : await uploadPrayerImage(file)
      onChange(result.publicUrl)
      if (kind === 'image' && result.compressed && result.originalBytes) {
        setInfo(
          `Comprimido: ${fmtMB(result.originalBytes)} → ${fmtMB(result.bytes)}`
        )
      } else {
        setInfo(`Enviado: ${fmtMB(result.bytes)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const clear = () => {
    onChange('')
    setInfo(null)
    setError(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-stretch gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'Cole uma URL ou envie abaixo'}
          className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            fontFamily: 'Poppins, sans-serif',
            background: '#0A0A0A',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#F2EDE4',
          }}
        />
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          aria-label={kind === 'audio' ? 'Enviar áudio' : 'Enviar imagem'}
          className="inline-flex items-center justify-center rounded-xl px-3 transition-colors active:scale-95 disabled:opacity-60"
          style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.25)',
            color: '#C9A84C',
          }}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpar"
            className="inline-flex items-center justify-center rounded-xl px-3 transition-colors active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: '#8A8378',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      {error && (
        <p
          className="flex items-center gap-1.5 text-[11px]"
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: '#D94F5C',
          }}
        >
          <AlertTriangle className="w-3 h-3" />
          {error}
        </p>
      )}
      {info && !error && (
        <p
          className="text-[11px]"
          style={{ fontFamily: 'Poppins, sans-serif', color: '#66BB6A' }}
        >
          {info}
        </p>
      )}
    </div>
  )
}
