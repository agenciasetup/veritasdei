'use client'

/**
 * Modal visual explicando como instalar no iOS Safari.
 *
 * Safari iOS não expõe `beforeinstallprompt`, então precisamos guiar
 * o usuário pelo fluxo manual:
 *   1. Tocar no botão Compartilhar (ícone central do Safari).
 *   2. Rolar no menu e tocar em "Adicionar à Tela de Início".
 *   3. Confirmar.
 *
 * Só funciona em Safari — outros navegadores no iOS (Chrome, Firefox)
 * não conseguem instalar PWAs em iOS 17.x. Avisamos nesse caso.
 */

import { useEffect } from 'react'
import { Share, Plus, X } from 'lucide-react'

type Props = {
  onClose: () => void
}

export default function IosInstallGuide({ onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const isSafari = (() => {
    if (typeof window === 'undefined') return true
    const ua = window.navigator.userAgent
    // iOS Safari: possui "Safari" e não "CriOS" / "FxiOS" / "EdgiOS"
    return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl"
        style={{
          background: '#0F0E0C',
          border: '1px solid rgba(201,168,76,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              className="text-xl mb-1"
              style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
            >
              Instalar no iPhone
            </h2>
            <p
              className="text-xs"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Para receber lembretes, adicione à Tela de Início.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#7A7368' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isSafari && (
          <div
            className="mb-4 p-3 rounded-xl text-xs"
            style={{
              background: 'rgba(230,126,34,0.12)',
              border: '1px solid rgba(230,126,34,0.3)',
              color: '#E67E22',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Abra no <strong>Safari</strong> para instalar. Outros navegadores
            no iPhone ainda não suportam PWA.
          </div>
        )}

        <ol className="flex flex-col gap-4">
          <li className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
              style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
            >
              1
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm mb-1"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
              >
                Toque no ícone{' '}
                <Share className="inline w-3.5 h-3.5 align-[-2px]" style={{ color: '#C9A84C' }} />{' '}
                Compartilhar
              </p>
              <p
                className="text-[11px]"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Fica na barra inferior do Safari.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
              style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
            >
              2
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm mb-1"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
              >
                Escolha{' '}
                <Plus className="inline w-3.5 h-3.5 align-[-2px]" style={{ color: '#C9A84C' }} />{' '}
                "Adicionar à Tela de Início"
              </p>
              <p
                className="text-[11px]"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Pode ser preciso rolar o menu para encontrá-la.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
              style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
            >
              3
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm mb-1"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
              >
                Toque em "Adicionar"
              </p>
              <p
                className="text-[11px]"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                O ícone do Veritas Dei aparecerá na sua tela inicial.
              </p>
            </div>
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl text-sm"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
            border: '1px solid rgba(201,168,76,0.35)',
            color: '#0F0E0C',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
          }}
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
