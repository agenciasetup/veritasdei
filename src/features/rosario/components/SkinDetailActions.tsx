'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, AlertCircle, Sparkles, Play } from 'lucide-react'
import type { RosarySkinCatalogItem } from '@/features/rosario/data/skinTypes'

/**
 * Botões de ação na página de detalhe da skin.
 *
 *   - owned + equipped → "Rezar agora" (vai pro terço)
 *   - owned + !equipped → "Equipar" → POST /api/rosario/skins/equipar
 *   - unlocked (free, ainda não obtida) → "Adquirir" (concede via equipar
 *     direto — o trigger de profile já libera o free no signup, mas user
 *     antigo pode ter ficado fora do backfill)
 *   - locked → mostra "Como destravar" (já renderizado fora)
 *   - coming_soon → desabilitado
 */
export function SkinDetailActions({
  skin,
  status,
}: {
  skin: RosarySkinCatalogItem
  status: 'owned' | 'unlocked' | 'locked' | 'coming_soon'
}) {
  const router = useRouter()
  const [pending, setPending] = useState<null | 'equipar' | 'rezar'>(null)
  const [error, setError] = useState<string | null>(null)

  async function equipar(): Promise<boolean> {
    setPending('equipar')
    setError(null)
    try {
      const res = await fetch('/api/rosario/skins/equipar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skin_id: skin.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const map: Record<string, string> = {
          unauthenticated: 'Faça login pra equipar.',
          skin_not_owned: 'Você ainda não tem esta skin.',
          skin_unavailable: 'Skin indisponível.',
        }
        setError(map[data.error as string] ?? data.error ?? 'Erro ao equipar.')
        return false
      }
      router.refresh()
      return true
    } catch {
      setError('Erro de conexão.')
      return false
    } finally {
      setPending(null)
    }
  }

  function rezarAgora() {
    // Hard reload em vez de router.push: o Next Router Cache pode servir
    // payload velho de /rosario (que foi visitada antes do equipar),
    // mostrando o tema antigo. window.location força fetch fresco do
    // server component, que carrega a skin recém-equipada.
    if (!skin.equipped) {
      void (async () => {
        setPending('rezar')
        const ok = await equipar()
        if (ok) window.location.href = '/rosario'
      })()
      return
    }
    window.location.href = '/rosario'
  }

  if (status === 'coming_soon') {
    return (
      <button
        type="button"
        disabled
        className="rounded-xl px-6 py-3 text-sm font-semibold opacity-50"
        style={{
          background: skin.theme.cardBg,
          color: skin.theme.textMuted,
          border: `1px solid ${skin.theme.border}`,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'not-allowed',
        }}
      >
        Em breve
      </button>
    )
  }

  if (status === 'locked') {
    // Locked: o card "Como destravar" já está acima. Botão volta pra loja.
    return (
      <button
        type="button"
        onClick={() => router.push('/rosario/loja')}
        className="rounded-xl border px-6 py-3 text-sm transition active:scale-[0.97]"
        style={{
          borderColor: skin.theme.borderStrong,
          color: skin.theme.accent,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Ver outros
      </button>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={rezarAgora}
        disabled={pending !== null}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60"
        style={{
          background: `linear-gradient(180deg, ${skin.theme.buttonGradient[0]}, ${skin.theme.buttonGradient[1]})`,
          color: skin.theme.buttonText,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          boxShadow: `0 8px 28px -10px ${skin.theme.accent}80`,
        }}
      >
        {pending === 'rezar' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" strokeWidth={2.4} />
        )}
        Rezar agora
      </button>

      {!skin.equipped && skin.owned && (
        <button
          type="button"
          onClick={equipar}
          disabled={pending !== null}
          className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm transition active:scale-[0.97] disabled:opacity-60"
          style={{
            borderColor: skin.theme.borderStrong,
            color: skin.theme.accent,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {pending === 'equipar' && <Loader2 className="h-4 w-4 animate-spin" />}
          <Sparkles className="h-4 w-4" />
          Equipar
        </button>
      )}

      {error && (
        <div
          className="mt-2 flex w-full items-start gap-2 rounded-md border px-3 py-2 text-xs"
          role="alert"
          style={{
            borderColor: 'color-mix(in srgb, var(--danger) 45%, transparent)',
            color: skin.theme.textPrimary,
            backgroundColor: 'rgba(70, 20, 20, 0.35)',
          }}
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
