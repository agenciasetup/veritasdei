'use client'

import { useRef } from 'react'
import { Shield, Upload, FileText } from 'lucide-react'
import type { ParoquiaFormState } from '../types'
import { TIPOS_IGREJA } from '@/types/paroquia'

interface Props {
  state: ParoquiaFormState
  setField: <K extends keyof ParoquiaFormState>(key: K, v: ParoquiaFormState[K]) => void
  verificacaoFile: File | null
  setVerificacaoFile: (f: File | null) => void
  onError: (msg: string | null) => void
}

export default function VerificacaoStep({
  state,
  setField,
  verificacaoFile,
  setVerificacaoFile,
  onError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tipoLabel = TIPOS_IGREJA.find((t) => t.value === state.tipoIgreja)?.label

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <section
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(20,18,14,0.6)',
          border: '1px solid rgba(201,168,76,0.12)',
        }}
      >
        <h3
          className="text-xs tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}
        >
          Revisão
        </h3>
        <SummaryRow label="Nome" value={state.nome || '—'} />
        <SummaryRow label="Tipo" value={tipoLabel || '—'} />
        {state.diocese && <SummaryRow label="Diocese" value={state.diocese} />}
        <SummaryRow
          label="Endereço"
          value={
            [
              state.rua,
              state.numero,
              state.bairro,
              state.cidade,
              state.estado,
            ]
              .filter(Boolean)
              .join(', ') || '—'
          }
        />
        <SummaryRow
          label="Missas"
          value={
            state.horariosMissa.length > 0
              ? `${state.horariosMissa.length} horário${
                  state.horariosMissa.length === 1 ? '' : 's'
                }`
              : 'Nenhum'
          }
        />
        <SummaryRow
          label="Confissões"
          value={
            state.horariosConfissao.length > 0
              ? `${state.horariosConfissao.length} horário${
                  state.horariosConfissao.length === 1 ? '' : 's'
                }`
              : 'Nenhum'
          }
        />
        <SummaryRow label="Fotos" value={`${state.fotos.length}`} />
      </section>

      {/* Verificação */}
      <section
        className="rounded-2xl p-4 space-y-3"
        style={{
          background: 'rgba(16,16,16,0.7)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          <h3
            className="text-xs tracking-[0.18em] uppercase"
            style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}
          >
            Solicitar verificação (opcional)
          </h3>
        </div>
        <p
          className="text-xs"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Envie um documento que comprove a titularidade da igreja (ex.: cartão CNPJ,
          decreto de criação, carta da diocese). Nosso time analisa e concede o{' '}
          <strong>selo de verificado</strong>, que libera publicação de avisos no feed.
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 active:scale-[0.98] touch-target-lg"
          style={{
            borderColor: 'rgba(201,168,76,0.2)',
            color: verificacaoFile ? 'var(--gold)' : 'var(--text-muted)',
            background: 'transparent',
          }}
        >
          {verificacaoFile ? (
            <>
              <FileText className="w-4 h-4" />
              <span
                className="text-xs truncate max-w-[16rem]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {verificacaoFile.name}
              </span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                Anexar documento (PDF ou imagem, até 10MB)
              </span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            if (f && f.size > 10 * 1024 * 1024) {
              onError('Documento deve ter no máximo 10MB.')
              return
            }
            onError(null)
            setVerificacaoFile(f)
          }}
        />

        <div>
          <label
            className="block text-xs mb-2 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            Observações (opcional)
          </label>
          <textarea
            value={state.verificacaoNotas}
            onChange={(e) => setField('verificacaoNotas', e.target.value)}
            rows={3}
            placeholder="Contexto adicional que ajude nosso time a validar…"
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
      </section>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-1.5 gap-3">
      <span
        className="text-[11px] uppercase tracking-[0.12em] flex-shrink-0"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
      <span
        className="text-xs text-right break-words"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
      >
        {value}
      </span>
    </div>
  )
}
