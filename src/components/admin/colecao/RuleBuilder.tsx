'use client'

import { Plus, Trash2, GitBranch } from 'lucide-react'
import {
  CONDICAO_LABEL,
  type CartaCondicao,
  type CartaCondicaoTipo,
  type CartaRegras,
} from '@/types/colecao'
import type { CodexCatalogo } from '@/lib/colecao/useCodexCatalog'

// Construtor visual da regra de desbloqueio. O admin nunca toca em JSON cru —
// escolhe "Todas / Qualquer" e compõe condições de um catálogo fechado. O shape
// resultante é exatamente o que fn_avaliar_cartas interpreta no banco.

interface Props {
  value: CartaRegras
  onChange: (regras: CartaRegras) => void
  catalogo: CodexCatalogo
}

const TIPOS: CartaCondicaoTipo[] = [
  'subtopico_concluido',
  'topico_concluido',
  'grupo_concluido',
  'quiz_gabaritado',
  'nivel',
  'streak',
  'nota_contem_frase',
  'grupo_estudo_tamanho',
  'contador',
]

export default function RuleBuilder({ value, onChange, catalogo }: Props) {
  const condicoes = value.condicoes ?? []

  function updateCondicao(idx: number, patch: Partial<CartaCondicao>) {
    const next = condicoes.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    onChange({ ...value, condicoes: next })
  }

  function addCondicao() {
    onChange({
      ...value,
      condicoes: [...condicoes, { tipo: 'subtopico_concluido' }],
    })
  }

  function removeCondicao(idx: number) {
    onChange({ ...value, condicoes: condicoes.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4" style={{ color: '#C9A84C' }} />
        <span
          className="text-xs uppercase tracking-[0.15em]"
          style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
        >
          Regra de desbloqueio
        </span>
      </div>

      {/* Operador */}
      <div
        className="flex items-center gap-3 rounded-xl p-3"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <span
          className="text-xs"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          Desbloquear quando
        </span>
        <select
          value={value.operador}
          onChange={(e) =>
            onChange({
              ...value,
              operador: e.target.value as CartaRegras['operador'],
            })
          }
          className="input"
          style={{ width: 'auto', minWidth: 200 }}
        >
          <option value="todas">TODAS as condições forem cumpridas</option>
          <option value="qualquer">QUALQUER condição for cumprida</option>
        </select>
      </div>

      {/* Condições */}
      {condicoes.length === 0 && (
        <p
          className="text-xs italic"
          style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
        >
          Sem condições — a carta nunca desbloqueia automaticamente. Adicione ao
          menos uma.
        </p>
      )}

      {condicoes.map((cond, idx) => (
        <div
          key={idx}
          className="rounded-xl p-3 space-y-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          <div className="flex items-center gap-2">
            <select
              value={cond.tipo}
              onChange={(e) =>
                updateCondicao(idx, {
                  tipo: e.target.value as CartaCondicaoTipo,
                  ref: undefined,
                  valor: undefined,
                })
              }
              className="input"
              style={{ flex: 1 }}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {CONDICAO_LABEL[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeCondicao(idx)}
              aria-label="Remover condição"
              className="p-2 rounded-lg flex-shrink-0"
              style={{
                background: 'rgba(214,79,92,0.1)',
                color: '#D64F5C',
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <CondicaoCampos
            cond={cond}
            catalogo={catalogo}
            onChange={(patch) => updateCondicao(idx, patch)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addCondicao}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
        style={{
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.25)',
          color: '#C9A84C',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar condição
      </button>
    </div>
  )
}

function CondicaoCampos({
  cond,
  catalogo,
  onChange,
}: {
  cond: CartaCondicao
  catalogo: CodexCatalogo
  onChange: (patch: Partial<CartaCondicao>) => void
}) {
  switch (cond.tipo) {
    case 'subtopico_concluido':
      return (
        <select
          value={cond.ref ?? ''}
          onChange={(e) => onChange({ ref: e.target.value })}
          className="input"
        >
          <option value="">— escolha o subtópico —</option>
          {catalogo.grupos.map((g) => (
            <optgroup key={g.id} label={g.title}>
              {g.topicos.flatMap((t) =>
                t.subtopicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t.title} · {s.title}
                  </option>
                )),
              )}
            </optgroup>
          ))}
        </select>
      )

    case 'topico_concluido':
      return (
        <select
          value={cond.ref ?? ''}
          onChange={(e) => onChange({ ref: e.target.value })}
          className="input"
        >
          <option value="">— escolha o tópico —</option>
          {catalogo.grupos.map((g) => (
            <optgroup key={g.id} label={g.title}>
              {g.topicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )

    case 'grupo_concluido':
      return (
        <select
          value={cond.ref ?? ''}
          onChange={(e) => onChange({ ref: e.target.value })}
          className="input"
        >
          <option value="">— escolha o pilar —</option>
          {catalogo.grupos.map((g) => (
            <option key={g.id} value={g.slug}>
              {g.title}
            </option>
          ))}
        </select>
      )

    case 'quiz_gabaritado':
      return (
        <select
          value={cond.ref ?? ''}
          onChange={(e) => onChange({ ref: e.target.value })}
          className="input"
        >
          <option value="">— escolha o quiz —</option>
          {catalogo.quizzes.map((q) => (
            <option key={q.content_ref} value={q.content_ref}>
              {q.title}
            </option>
          ))}
        </select>
      )

    case 'nivel':
    case 'streak':
    case 'grupo_estudo_tamanho':
      return (
        <label className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            {cond.tipo === 'nivel'
              ? 'Nível mínimo'
              : cond.tipo === 'streak'
                ? 'Dias consecutivos'
                : 'Membros no grupo'}
          </span>
          <input
            type="number"
            min={1}
            value={cond.valor ?? ''}
            onChange={(e) =>
              onChange({ valor: Number(e.target.value) || undefined })
            }
            className="input"
            style={{ width: 100 }}
          />
        </label>
      )

    case 'nota_contem_frase':
      return (
        <label className="flex flex-col gap-1">
          <span
            className="text-[10px] uppercase tracking-wide"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Frase a procurar nas anotações (sem diferenciar maiúsculas)
          </span>
          <input
            type="text"
            value={cond.ref ?? ''}
            onChange={(e) => onChange({ ref: e.target.value })}
            placeholder="ex.: Verbum caro factum est"
            className="input"
          />
        </label>
      )

    case 'contador':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Chave do evento
            </span>
            <input
              type="text"
              value={cond.ref ?? ''}
              onChange={(e) => onChange({ ref: e.target.value })}
              placeholder="ex.: grupo_estudo_tamanho"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Valor mínimo
            </span>
            <input
              type="number"
              min={1}
              value={cond.valor ?? ''}
              onChange={(e) =>
                onChange({ valor: Number(e.target.value) || undefined })
              }
              className="input"
            />
          </label>
        </div>
      )

    default:
      return null
  }
}
