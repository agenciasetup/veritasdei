'use client'

/**
 * <ImageUploader /> — componente unificado de upload de imagem para o admin.
 *
 * Recursos:
 *  - Toggle Web | Mobile (quando `mobile` é fornecido). Cada variante
 *    guarda a sua URL independente.
 *  - Drag & drop + clique. Aceita JPEG/PNG/WebP/AVIF/HEIC/GIF.
 *  - Comprime client-side com `compressImage` (WebP quando suportado)
 *    antes de fazer PUT direto no R2 via `/api/admin/media/presign`.
 *  - Mostra um painel de instruções com formato, peso máx., dimensão
 *    recomendada e aspect ratio (parametrizáveis pelo chamador).
 *  - Preview com aspect ratio fiel à entrega final.
 *  - Reposicionamento (pan) do recorte quando `aspectRatio` é fornecido:
 *    o usuário arrasta a imagem dentro do container pra escolher qual
 *    região será exibida. O reposicionamento é salvo como `object-position`
 *    persistido em URL (`?x=...&y=...`) e respeitado pelo consumidor.
 *  - Botão pra remover/substituir imagem.
 *  - Botão pra abrir o original em outra aba.
 *
 * Não é uma lib externa de crop — é uma implementação leve baseada em
 * canvas + drag de mouse/touch. Pra crops "destrutivos" (recorte real)
 * usamos o canvas para gerar o blob final. Pra reposicionamento "vivo"
 * (sem alterar o arquivo) usamos object-position no consumidor.
 */

import { useCallback, useRef, useState } from 'react'
import {
  AlertTriangle,
  Crop,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Monitor,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react'
import { compressImage } from '@/lib/image/compress'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ImageVariantKey = 'web' | 'mobile'

export interface ImageSpec {
  /** Largura recomendada (px). */
  recommendedWidth: number
  /** Altura recomendada (px). */
  recommendedHeight: number
  /** Aspect ratio (ex.: "21 / 9"). Se omitido, usa width/height. */
  aspectRatio?: string
  /** Tamanho máx. em MB (display). */
  maxMb?: number
  /** Formatos textuais para exibir ao usuário. */
  formats?: string
  /** Texto livre adicional. */
  hint?: string
}

export interface ImageUploaderValue {
  url: string
  /** Posição de recorte expressa como "x% y%" (object-position). */
  position?: string
}

interface VariantConfig {
  url: string
  position?: string
  spec: ImageSpec
  /** Onde armazenar no bucket. Ex.: `educa/banners/web`. */
  prefix: string
}

export interface ImageUploaderProps {
  label: string
  /** Variante web (sempre obrigatória). */
  web: VariantConfig
  /** Variante mobile (opcional). Quando presente, ativa o toggle. */
  mobile?: VariantConfig
  /** Callback ao alterar a versão web. */
  onWebChange: (next: ImageUploaderValue) => void
  /** Callback ao alterar a versão mobile (se aplicável). */
  onMobileChange?: (next: ImageUploaderValue) => void
  /** Texto pequeno acima do título. */
  description?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSpecLine(spec: ImageSpec): string {
  const parts: string[] = []
  parts.push(`${spec.recommendedWidth} × ${spec.recommendedHeight}px`)
  if (spec.aspectRatio) parts.push(`(${spec.aspectRatio.replace('/', ':')})`)
  if (spec.maxMb) parts.push(`até ${spec.maxMb}MB`)
  if (spec.formats) parts.push(spec.formats)
  return parts.join(' · ')
}

async function uploadToR2(file: File, prefix: string, variant: ImageVariantKey): Promise<string> {
  const presignRes = await fetch('/api/admin/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prefix,
      variant,
      files: [{ filename: file.name, mime_type: file.type, bytes: file.size }],
    }),
  })
  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error(err?.detail || err?.error || 'Falha ao preparar upload.')
  }
  const data = (await presignRes.json()) as {
    items: Array<{
      upload_url: string
      public_url?: string
      variants: { thumb?: string; feed?: string; detail?: string }
    }>
  }
  const item = data.items[0]
  if (!item) throw new Error('Resposta vazia do servidor.')

  const putRes = await fetch(item.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!putRes.ok) throw new Error('Falha no upload para o R2.')

  // Preferimos a URL crua do R2 (sem cdn-cgi). Capas/banners não precisam
  // do redimensiona-mento da Cloudflare e o transform endpoint só responde
  // quando o domínio público está atrás do CF Image Resizing — caso
  // contrário a imagem aparece quebrada.
  return (
    item.public_url
    ?? item.variants?.detail
    ?? item.variants?.feed
    ?? item.upload_url.split('?')[0]
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function ImageUploader({
  label,
  description,
  web,
  mobile,
  onWebChange,
  onMobileChange,
}: ImageUploaderProps) {
  const [active, setActive] = useState<ImageVariantKey>('web')
  const variant = active === 'mobile' && mobile ? mobile : web
  const onChange = active === 'mobile' && mobile ? onMobileChange! : onWebChange

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [reposMode, setReposMode] = useState(false)

  const aspect = variant.spec.aspectRatio
    ?? `${variant.spec.recommendedWidth} / ${variant.spec.recommendedHeight}`

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = Array.from(files)[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setError('Apenas imagens são aceitas neste campo.')
        return
      }
      setError(null)
      setUploading(true)
      try {
        const { file: compressed } = await compressImage(file)
        const url = await uploadToR2(compressed, variant.prefix, active)
        onChange({ url, position: variant.position })
      } catch (e) {
        setError((e as Error).message || 'Falha no upload.')
      } finally {
        setUploading(false)
      }
    },
    [variant.prefix, variant.position, active, onChange],
  )

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) {
      void handleFiles(e.dataTransfer.files)
    }
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }
  function onDragLeave() {
    setDragOver(false)
  }

  function clear() {
    onChange({ url: '', position: undefined })
    setReposMode(false)
  }

  function openOriginal() {
    if (variant.url) window.open(variant.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(201,168,76,0.18)',
      }}
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3
            className="text-xs tracking-[0.18em] uppercase"
            style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
          >
            {label}
          </h3>
          {description && (
            <p
              className="text-[11px] mt-1"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              {description}
            </p>
          )}
        </div>

        {mobile && (
          <div
            className="inline-flex rounded-full p-1 text-[11px]"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(201,168,76,0.18)',
            }}
            role="tablist"
          >
            <ToggleBtn
              active={active === 'web'}
              onClick={() => {
                setActive('web')
                setReposMode(false)
              }}
              icon={<Monitor className="w-3.5 h-3.5" />}
              label="Web"
            />
            <ToggleBtn
              active={active === 'mobile'}
              onClick={() => {
                setActive('mobile')
                setReposMode(false)
              }}
              icon={<Smartphone className="w-3.5 h-3.5" />}
              label="Mobile"
            />
          </div>
        )}
      </header>

      {/* Instruções */}
      <SpecPanel spec={variant.spec} />

      {/* Drop zone / Preview */}
      <div
        className="relative mt-3 rounded-xl overflow-hidden transition-colors"
        style={{
          background: '#0F0E0C',
          border: dragOver
            ? '1px dashed #C9A84C'
            : variant.url
              ? '1px solid rgba(201,168,76,0.18)'
              : '1px dashed rgba(201,168,76,0.25)',
          aspectRatio: aspect,
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {variant.url ? (
          <PreviewArea
            url={variant.url}
            position={variant.position}
            reposMode={reposMode}
            onPositionChange={(pos) => onChange({ url: variant.url, position: pos })}
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 active:opacity-80"
          >
            {uploading ? (
              <Loader2
                className="w-7 h-7 animate-spin"
                style={{ color: '#C9A84C' }}
              />
            ) : (
              <>
                <Upload className="w-7 h-7" style={{ color: '#C9A84C' }} />
                <p
                  className="text-sm"
                  style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif' }}
                >
                  Clique ou arraste a imagem aqui
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  {formatSpecLine(variant.spec)}
                </p>
              </>
            )}
          </button>
        )}

        {/* Loader sobre o preview quando substituindo */}
        {variant.url && uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: '#C9A84C' }}
            />
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionBtn
          icon={<Upload className="w-3.5 h-3.5" />}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {variant.url ? 'Substituir' : 'Enviar imagem'}
        </ActionBtn>

        {variant.url && (
          <>
            <ActionBtn
              icon={<Crop className="w-3.5 h-3.5" />}
              onClick={() => setReposMode((v) => !v)}
              active={reposMode}
            >
              {reposMode ? 'Pronto' : 'Reposicionar'}
            </ActionBtn>
            <ActionBtn
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={openOriginal}
            >
              Abrir original
            </ActionBtn>
            <ActionBtn
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={clear}
              danger
            >
              Remover
            </ActionBtn>
          </>
        )}
      </div>

      {error && (
        <div
          className="mt-3 p-2.5 rounded-lg text-xs flex items-start gap-2"
          style={{
            background: 'rgba(214,79,92,0.12)',
            border: '1px solid rgba(214,79,92,0.3)',
            color: '#D64F5C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/gif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files)
          // permite re-selecionar o mesmo arquivo
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function SpecPanel({ spec }: { spec: ImageSpec }) {
  return (
    <div
      className="rounded-lg px-3 py-2 text-[11px] flex items-start gap-2"
      style={{
        background: 'rgba(201,168,76,0.06)',
        border: '1px solid rgba(201,168,76,0.18)',
        color: '#C9A84C',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <ImageIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <div className="leading-snug">
        <strong className="tracking-wide">Especificações:</strong>{' '}
        <span style={{ color: '#E8E2D8' }}>{formatSpecLine(spec)}</span>
        {spec.hint && (
          <p className="mt-0.5" style={{ color: '#8A8378' }}>
            {spec.hint}
          </p>
        )}
      </div>
    </div>
  )
}

function PreviewArea({
  url,
  position,
  reposMode,
  onPositionChange,
}: {
  url: string
  position?: string
  reposMode: boolean
  onPositionChange: (pos: string) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  // Estado derivado da prop `position`: o React 19 permite reconciliar
  // sem useEffect quando o input mudou — mais rápido e sem render extra.
  const [lastPositionProp, setLastPositionProp] = useState(position)
  const [current, setCurrent] = useState(position ?? '50% 50%')
  if (position !== lastPositionProp) {
    setLastPositionProp(position)
    setCurrent(position ?? '50% 50%')
  }

  // Drag de mouse/touch para reposicionar (object-position).
  // 0% 0% = canto superior esquerdo da imagem ancorado no canto sup-esq
  // do container. 50% 50% = centralizado. Arrastar pra direita aumenta x.
  function pointerDown(e: React.PointerEvent) {
    if (!reposMode) return
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function pointerMove(e: React.PointerEvent) {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = (e.movementX / rect.width) * 100
    const dy = (e.movementY / rect.height) * 100
    setCurrent((prev) => {
      const [px, py] = parsePos(prev)
      const nx = clamp(px - dx, 0, 100)
      const ny = clamp(py - dy, 0, 100)
      const next = `${nx.toFixed(1)}% ${ny.toFixed(1)}%`
      onPositionChange(next)
      return next
    })
  }
  function pointerUp(e: React.PointerEvent) {
    setDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ touchAction: reposMode ? 'none' : 'auto' }}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="w-full h-full"
        style={{
          objectFit: 'cover',
          objectPosition: current,
          cursor: reposMode ? (dragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
        }}
        draggable={false}
      />
      {reposMode && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(0deg, rgba(0,0,0,0.0), rgba(0,0,0,0.0)), repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 33%), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 33%)',
            }}
          />
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1 pointer-events-none"
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Crop className="w-3 h-3" />
            Arraste pra reposicionar
          </div>
        </>
      )}
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors"
      style={{
        background: active ? '#C9A84C' : 'transparent',
        color: active ? '#0F0E0C' : '#8A8378',
        fontFamily: 'Poppins, sans-serif',
        fontWeight: active ? 600 : 500,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function ActionBtn({
  icon,
  children,
  onClick,
  active,
  danger,
  disabled,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] disabled:opacity-50 active:scale-95 transition-transform"
      style={{
        background: active
          ? 'rgba(201,168,76,0.18)'
          : danger
            ? 'rgba(214,79,92,0.1)'
            : 'rgba(255,255,255,0.04)',
        border: `1px solid ${
          active
            ? 'rgba(201,168,76,0.5)'
            : danger
              ? 'rgba(214,79,92,0.3)'
              : 'rgba(255,255,255,0.08)'
        }`,
        color: danger ? '#D64F5C' : active ? '#C9A84C' : '#E8E2D8',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function parsePos(s: string): [number, number] {
  const m = s.match(/(-?\d+(\.\d+)?)\s*%\s+(-?\d+(\.\d+)?)\s*%/)
  if (!m) return [50, 50]
  return [parseFloat(m[1]), parseFloat(m[3])]
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

