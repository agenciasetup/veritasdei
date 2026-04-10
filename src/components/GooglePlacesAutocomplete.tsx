'use client'

import { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { Search } from 'lucide-react'

export interface AddressData {
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  pais: string
  cep: string
  latitude: number | null
  longitude: number | null
  enderecoFormatado: string
}

interface Props {
  onSelect: (data: AddressData) => void
  defaultValue?: string
}

let optionsSet = false

function extractComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  useShort = false,
): string {
  const comp = components.find(c => c.types.includes(type))
  return useShort ? (comp?.short_name ?? '') : (comp?.long_name ?? '')
}

export default function GooglePlacesAutocomplete({ onSelect, defaultValue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [error, setError] = useState<string | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let autocomplete: google.maps.places.Autocomplete | null = null

    async function init() {
      try {
        const res = await fetch('/api/places/key')
        if (!res.ok) {
          setError('Não foi possível carregar o autocomplete de endereço.')
          return
        }
        const { key } = await res.json()
        if (!key || !inputRef.current) return

        if (!optionsSet) {
          setOptions({ key, v: 'weekly' })
          optionsSet = true
        }

        const { Autocomplete } = await importLibrary('places')

        if (!inputRef.current) return

        autocomplete = new Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['address_components', 'geometry', 'formatted_address'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete!.getPlace()
          if (!place.address_components) return

          const comps = place.address_components

          onSelectRef.current({
            rua: extractComponent(comps, 'route'),
            numero: extractComponent(comps, 'street_number'),
            bairro:
              extractComponent(comps, 'sublocality_level_1') ||
              extractComponent(comps, 'sublocality') ||
              extractComponent(comps, 'neighborhood'),
            cidade:
              extractComponent(comps, 'administrative_area_level_2') ||
              extractComponent(comps, 'locality'),
            estado: extractComponent(comps, 'administrative_area_level_1', true),
            pais: extractComponent(comps, 'country'),
            cep: extractComponent(comps, 'postal_code'),
            latitude: place.geometry?.location?.lat() ?? null,
            longitude: place.geometry?.location?.lng() ?? null,
            enderecoFormatado: place.formatted_address ?? '',
          })
        })
      } catch (err) {
        console.error('Google Places Autocomplete error:', err)
        setError('Erro ao carregar autocomplete.')
      }
    }

    init()

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete)
      }
    }
  }, [])

  return (
    <div>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: '#C9A84C' }}
        />
        <input
          ref={inputRef}
          type="text"
          defaultValue={defaultValue}
          placeholder="Digite o endereço para buscar..."
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(10,10,10,0.6)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
            outline: 'none',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(201,168,76,0.4)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(201,168,76,0.12)'
          }}
        />
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
          {error}
        </p>
      )}
    </div>
  )
}
