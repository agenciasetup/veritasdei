'use client'

import type { ParoquiaFormState } from '../types'
import { Field } from '../components/Field'

interface Props {
  state: ParoquiaFormState
  setField: <K extends keyof ParoquiaFormState>(key: K, v: ParoquiaFormState[K]) => void
}

export default function ContatosStep({ state, setField }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Telefone"
          value={state.telefone}
          onChange={(v) => setField('telefone', v)}
          placeholder="(00) 0000-0000"
          inputMode="tel"
          type="tel"
        />
        <Field
          label="E-mail"
          value={state.email}
          onChange={(v) => setField('email', v)}
          placeholder="paroquia@email.com"
          inputMode="email"
          type="email"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Instagram"
          value={state.instagramHandle}
          onChange={(v) => setField('instagramHandle', v)}
          placeholder="@paroquia"
        />
        <Field
          label="Site"
          value={state.site}
          onChange={(v) => setField('site', v)}
          placeholder="https://…"
          inputMode="url"
          type="url"
        />
      </div>

      <Field
        label="Facebook"
        value={state.facebookHandle}
        onChange={(v) => setField('facebookHandle', v)}
        placeholder="facebook.com/paroquia"
      />

      <div>
        <label
          className="block text-xs mb-2 tracking-wider uppercase"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Informações extras
        </label>
        <textarea
          value={state.informacoesExtras}
          onChange={(e) => setField('informacoesExtras', e.target.value)}
          placeholder="Grupos, pastorais, horários especiais…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl text-sm resize-none"
          style={{
            background: 'rgba(10,10,10,0.6)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            outline: 'none',
          }}
        />
      </div>
    </div>
  )
}
