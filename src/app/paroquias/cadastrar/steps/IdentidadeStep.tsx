'use client'

import type { TipoIgreja } from '@/types/paroquia'
import { TIPOS_IGREJA } from '@/types/paroquia'
import { maskCnpj } from '@/lib/utils/cnpj'
import type { ParoquiaFormState } from '../types'
import { Field } from '../components/Field'

interface Props {
  state: ParoquiaFormState
  setField: <K extends keyof ParoquiaFormState>(key: K, v: ParoquiaFormState[K]) => void
  invalidFields: Set<string>
}

export default function IdentidadeStep({ state, setField, invalidFields }: Props) {
  return (
    <div className="space-y-4">
      <Field
        label="Nome da igreja *"
        value={state.nome}
        onChange={(v) => setField('nome', v)}
        placeholder="Ex: Paróquia São José"
        invalid={invalidFields.has('nome')}
        autoFocus
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            className="block text-xs mb-2 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            Tipo *
          </label>
          <select
            value={state.tipoIgreja}
            onChange={(e) => setField('tipoIgreja', e.target.value as TipoIgreja | '')}
            className="w-full px-4 py-3 rounded-xl text-sm appearance-none touch-target-lg"
            style={{
              background: 'rgba(10,10,10,0.6)',
              border: invalidFields.has('tipoIgreja')
                ? '1px solid rgba(217,79,92,0.6)'
                : '1px solid rgba(201,168,76,0.12)',
              color: state.tipoIgreja ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          >
            <option value="">Selecione</option>
            {TIPOS_IGREJA.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="CNPJ"
          value={state.cnpjMasked}
          onChange={(v) => setField('cnpjMasked', maskCnpj(v))}
          placeholder="00.000.000/0000-00"
          invalid={invalidFields.has('cnpj')}
          inputMode="numeric"
        />
      </div>

      <Field
        label="Diocese"
        value={state.diocese}
        onChange={(v) => setField('diocese', v)}
        placeholder="Ex: Arquidiocese de São Paulo"
      />

      <Field
        label="Padre responsável"
        value={state.padreResponsavel}
        onChange={(v) => setField('padreResponsavel', v)}
        placeholder="Nome do padre"
      />
    </div>
  )
}
