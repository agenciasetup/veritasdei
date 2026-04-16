'use client'

import { Locate } from 'lucide-react'
import GooglePlacesAutocomplete, {
  type AddressData,
} from '@/components/GooglePlacesAutocomplete'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { ParoquiaFormState } from '../types'
import { Field } from '../components/Field'

const ESTADOS_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

interface Props {
  state: ParoquiaFormState
  setField: <K extends keyof ParoquiaFormState>(key: K, v: ParoquiaFormState[K]) => void
  invalidFields: Set<string>
}

export default function EnderecoStep({ state, setField, invalidFields }: Props) {
  const geo = useGeolocation()

  const handlePlaceSelect = (data: AddressData) => {
    setField('rua', data.rua)
    setField('numero', data.numero)
    setField('bairro', data.bairro)
    setField('cidade', data.cidade)
    setField('estado', data.estado)
    setField('pais', data.pais || 'Brasil')
    setField('cep', data.cep)
    setField('latitude', data.latitude)
    setField('longitude', data.longitude)
  }

  function applyGeolocation() {
    geo.request()
  }

  // Aplicação dos dados de geo é feita após `granted` via o botão "Aplicar"
  // que aparece quando coords disponíveis e ainda não foram inseridos.
  const hasGeoApplied =
    geo.coords &&
    state.latitude === geo.coords.latitude &&
    state.longitude === geo.coords.longitude

  function applyCoordsToForm() {
    if (!geo.coords) return
    setField('latitude', geo.coords.latitude)
    setField('longitude', geo.coords.longitude)
    if (!state.cidade && geo.coords.cidade) setField('cidade', geo.coords.cidade)
    if (!state.estado && geo.coords.estado) setField('estado', geo.coords.estado)
  }

  const hasCoords = state.latitude !== null && state.longitude !== null

  return (
    <div className="space-y-4">
      <div>
        <label
          className="block text-xs mb-2 tracking-wider uppercase"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Buscar endereço
        </label>
        <GooglePlacesAutocomplete onSelect={handlePlaceSelect} />
        <p
          className="text-xs mt-1.5"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Selecione uma sugestão para preencher os campos automaticamente.
        </p>
      </div>

      <button
        type="button"
        onClick={applyGeolocation}
        disabled={geo.status === 'prompting' || geo.status === 'loading'}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
        style={{
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.2)',
          color: 'var(--gold)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <Locate className="w-4 h-4" />
        {geo.status === 'prompting' || geo.status === 'loading'
          ? 'Localizando…'
          : 'Usar minha localização'}
      </button>
      {geo.coords && !hasGeoApplied && (
        <button
          type="button"
          onClick={applyCoordsToForm}
          className="w-full text-xs underline py-2"
          style={{ color: 'var(--gold)' }}
        >
          Aplicar coordenadas {geo.coords.label ? `(${geo.coords.label})` : ''}
        </button>
      )}
      {geo.error && (
        <p className="text-xs" style={{ color: '#D94F5C', fontFamily: 'var(--font-body)' }}>
          {geo.error}
        </p>
      )}

      {/* Mini mapa via OpenStreetMap (sem API key necessária) */}
      {hasCoords && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: '1px solid rgba(201,168,76,0.18)',
            background: 'rgba(15,14,12,0.5)',
          }}
        >
          <iframe
            title="Mapa do endereço"
            width="100%"
            height="200"
            loading="lazy"
            style={{ border: 0, display: 'block' }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              (state.longitude as number) - 0.01
            }%2C${(state.latitude as number) - 0.005}%2C${
              (state.longitude as number) + 0.01
            }%2C${(state.latitude as number) + 0.005}&layer=mapnik&marker=${
              state.latitude
            }%2C${state.longitude}`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
        <Field
          label="Rua"
          value={state.rua}
          onChange={(v) => setField('rua', v)}
          placeholder="Nome da rua"
        />
        <Field
          label="Número"
          value={state.numero}
          onChange={(v) => setField('numero', v)}
          placeholder="Nº"
          inputMode="numeric"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Bairro"
          value={state.bairro}
          onChange={(v) => setField('bairro', v)}
          placeholder="Bairro"
        />
        <Field
          label="Complemento"
          value={state.complemento}
          onChange={(v) => setField('complemento', v)}
          placeholder="Apto, sala, bloco…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Cidade *"
          value={state.cidade}
          onChange={(v) => setField('cidade', v)}
          placeholder="Cidade"
          invalid={invalidFields.has('cidade')}
        />
        <div>
          <label
            className="block text-xs mb-2 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            Estado *
          </label>
          <select
            value={state.estado}
            onChange={(e) => setField('estado', e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm appearance-none touch-target-lg"
            style={{
              background: 'rgba(10,10,10,0.6)',
              border: invalidFields.has('estado')
                ? '1px solid rgba(217,79,92,0.6)'
                : '1px solid rgba(201,168,76,0.12)',
              color: state.estado ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          >
            <option value="">UF</option>
            {ESTADOS_BR.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="País"
          value={state.pais}
          onChange={(v) => setField('pais', v)}
          placeholder="País"
        />
        <Field
          label="CEP"
          value={state.cep}
          onChange={(v) => setField('cep', v)}
          placeholder="00000-000"
          inputMode="numeric"
        />
      </div>
    </div>
  )
}
