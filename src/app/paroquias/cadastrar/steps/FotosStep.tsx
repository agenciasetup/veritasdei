'use client'

import FotosGallery from '@/components/paroquias/FotosGallery'
import type { ParoquiaFormState } from '../types'

interface Props {
  state: ParoquiaFormState
  setField: <K extends keyof ParoquiaFormState>(key: K, v: ParoquiaFormState[K]) => void
  onError: (msg: string | null) => void
}

export default function FotosStep({ state, setField, onError }: Props) {
  return (
    <div>
      <p
        className="text-xs mb-4"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
      >
        Adicione fotos da fachada e do interior. A primeira foto será a capa.
      </p>
      <FotosGallery
        value={state.fotos}
        onChange={(v) => setField('fotos', v)}
        onError={onError}
      />
    </div>
  )
}
