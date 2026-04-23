'use client'

import { useState } from 'react'

type Props = {
  token: string
}

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string }

export function ParentalConsentForm({ token }: Props) {
  const [parentName, setParentName] = useState('')
  const [parentRelation, setParentRelation] = useState<'pai' | 'mae' | 'tutor_legal' | 'responsavel_legal' | ''>('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  if (!token) {
    return (
      <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <p style={{ color: '#F2EDE4' }}>
          Token ausente. Solicite um novo link de consentimento pelo perfil do adolescente.
        </p>
      </div>
    )
  }

  if (state.kind === 'ok') {
    return (
      <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <p style={{ color: '#F2EDE4' }}>
          Consentimento registrado com sucesso. A conta do adolescente foi liberada.
        </p>
      </div>
    )
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!parentRelation) return
        setState({ kind: 'submitting' })
        try {
          const res = await fetch('/api/parental-consent/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, parentName, parentRelation }),
          })
          const body = await res.json()
          if (!res.ok) {
            setState({ kind: 'error', message: mapError(body?.error) })
            return
          }
          setState({ kind: 'ok' })
        } catch (err) {
          setState({ kind: 'error', message: 'Falha de rede. Tente novamente em instantes.' })
        }
      }}
    >
      <label className="block">
        <span className="block mb-1 text-sm" style={{ color: '#F2EDE4' }}>
          Seu nome completo
        </span>
        <input
          required
          minLength={3}
          maxLength={120}
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', color: '#F2EDE4' }}
        />
      </label>

      <label className="block">
        <span className="block mb-1 text-sm" style={{ color: '#F2EDE4' }}>
          Relação com o adolescente
        </span>
        <select
          required
          value={parentRelation}
          onChange={(e) => setParentRelation(e.target.value as typeof parentRelation)}
          className="w-full px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', color: '#F2EDE4' }}
        >
          <option value="">Selecione…</option>
          <option value="pai">Pai</option>
          <option value="mae">Mãe</option>
          <option value="tutor_legal">Tutor legal</option>
          <option value="responsavel_legal">Responsável legal</option>
        </select>
      </label>

      <p className="text-xs" style={{ color: '#7A7368' }}>
        Ao clicar em &quot;Confirmar consentimento&quot;, você declara, sob as penas da lei, ser o responsável
        legal do adolescente e consentir com o tratamento dos dados dele nos termos das nossas
        políticas.
      </p>

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className="px-4 py-2 rounded-lg font-semibold uppercase tracking-wider text-sm transition-opacity disabled:opacity-50"
        style={{
          background: '#C9A84C',
          color: '#0A0A0A',
          fontFamily: 'Poppins, sans-serif',
          letterSpacing: '0.08em',
        }}
      >
        {state.kind === 'submitting' ? 'Enviando...' : 'Confirmar consentimento'}
      </button>

      {state.kind === 'error' ? (
        <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-sm" style={{ color: '#F2EDE4' }}>
            {state.message}
          </p>
        </div>
      ) : null}
    </form>
  )
}

function mapError(code: string | undefined): string {
  switch (code) {
    case 'invalid_token':
      return 'Token inválido.'
    case 'not_found':
      return 'Solicitação não encontrada. Peça um novo link.'
    case 'expired':
      return 'Este link expirou. O adolescente deve solicitar um novo no perfil.'
    case 'revoked':
      return 'Consentimento revogado anteriormente.'
    case 'already_confirmed':
      return 'Este consentimento já foi confirmado.'
    case 'invalid_parent_name':
      return 'Informe seu nome completo (mínimo 3 caracteres).'
    case 'invalid_parent_relation':
      return 'Informe sua relação com o adolescente.'
    default:
      return 'Não foi possível confirmar o consentimento. Tente novamente em instantes.'
  }
}
