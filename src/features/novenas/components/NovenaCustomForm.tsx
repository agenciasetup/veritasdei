'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { NovenaDay, NovenaCustomRecord } from '../data/types'

interface Props {
  /** Se preenchido, formulário de edição. */
  existing?: NovenaCustomRecord
}

const EMPTY_DAYS: NovenaDay[] = Array.from({ length: 9 }, (_, i) => ({
  titulo: `${i + 1}.º Dia`,
  texto: '',
}))

export function NovenaCustomForm({ existing }: Props) {
  const router = useRouter()
  const isEditing = !!existing

  const [titulo, setTitulo] = useState(existing?.titulo ?? '')
  const [descricao, setDescricao] = useState(existing?.descricao ?? '')
  const [dias, setDias] = useState<NovenaDay[]>(
    existing?.dias?.length === 9 ? existing.dias : EMPTY_DAYS,
  )
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateDay(index: number, field: 'titulo' | 'texto', value: string) {
    setDias(prev => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validação local
    if (titulo.trim().length === 0) {
      setError('O título é obrigatório.')
      setLoading(false)
      return
    }
    for (let i = 0; i < 9; i++) {
      if (dias[i].texto.trim().length === 0) {
        setError(`O texto do dia ${i + 1} é obrigatório.`)
        setExpandedDay(i)
        setLoading(false)
        return
      }
    }

    try {
      const body = { titulo: titulo.trim(), descricao: descricao.trim() || null, dias }

      const url = isEditing ? `/api/novenas/custom/${existing.id}` : '/api/novenas/custom'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 401) {
        router.push('/login?redirectTo=/novenas/custom/nova')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao salvar novena')
        return
      }

      router.push('/novenas/minhas')
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <Link
            href="/novenas/minhas"
            className="inline-block mb-3 text-xs transition"
            style={{ color: '#7A7368' }}
          >
            &larr; Minhas novenas
          </Link>
          <h1
            className="text-2xl md:text-3xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            {isEditing ? 'Editar Novena' : 'Nova Novena Personalizada'}
          </h1>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Título */}
          <div className="mb-4">
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#7A7368' }}>
              Título da novena
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={200}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
              style={{
                background: 'rgba(20, 18, 14, 0.6)',
                border: '1px solid rgba(201, 168, 76, 0.18)',
                color: '#F2EDE4',
              }}
              placeholder="Ex: Novena pela minha família"
            />
          </div>

          {/* Descrição */}
          <div className="mb-6">
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#7A7368' }}>
              Descrição (opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={2000}
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition resize-none"
              style={{
                background: 'rgba(20, 18, 14, 0.6)',
                border: '1px solid rgba(201, 168, 76, 0.18)',
                color: '#F2EDE4',
              }}
              placeholder="Breve descrição da novena..."
            />
          </div>

          {/* 9 dias */}
          <h2
            className="text-lg mb-4"
            style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
          >
            Os 9 dias
          </h2>

          <div className="grid gap-3 mb-6">
            {dias.map((dia, i) => {
              const isExpanded = expandedDay === i
              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background: 'rgba(20, 18, 14, 0.6)',
                    border: `1px solid ${isExpanded ? 'rgba(201, 168, 76, 0.3)' : 'rgba(201, 168, 76, 0.1)'}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedDay(isExpanded ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm" style={{ color: '#F2EDE4' }}>
                      Dia {i + 1}
                      {dia.texto.trim().length > 0 && (
                        <span style={{ color: '#C9A84C' }}> &#10003;</span>
                      )}
                    </span>
                    <span className="text-xs" style={{ color: '#7A7368' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      <input
                        type="text"
                        value={dia.titulo}
                        onChange={(e) => updateDay(i, 'titulo', e.target.value)}
                        maxLength={200}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{
                          background: 'rgba(15, 14, 12, 0.6)',
                          border: '1px solid rgba(201, 168, 76, 0.1)',
                          color: '#F2EDE4',
                        }}
                        placeholder={`Título do dia ${i + 1}`}
                      />
                      <textarea
                        value={dia.texto}
                        onChange={(e) => updateDay(i, 'texto', e.target.value)}
                        maxLength={5000}
                        rows={6}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                        style={{
                          background: 'rgba(15, 14, 12, 0.6)',
                          border: '1px solid rgba(201, 168, 76, 0.1)',
                          color: '#F2EDE4',
                        }}
                        placeholder="Texto da oração, meditação e preces do dia..."
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Erro */}
          {error && (
            <p className="text-xs text-center mb-4" style={{ color: '#E57373' }}>
              {error}
            </p>
          )}

          {/* Botões */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg px-8 py-3 text-sm font-semibold transition disabled:opacity-50"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar novena'}
            </button>
            <Link
              href="/novenas/minhas"
              className="text-xs transition"
              style={{ color: '#7A7368' }}
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
