'use client'

import { useMemo, useState } from 'react'
import {
  Loader2,
  Save,
  X,
  Eye,
  FlaskConical,
  Image as ImageIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import ImageUploader, { type ImageSpec } from '@/components/admin/ImageUploader'
import CartaView from '@/components/colecao/CartaView'
import RuleBuilder from './RuleBuilder'
import {
  REGRAS_VAZIA,
  RARIDADE_META,
  type Carta,
  type CartaMoldura,
  type CartaRaridade,
  type CartaRegras,
  type CartaStatus,
} from '@/types/colecao'
import type { CodexCatalogo } from '@/lib/colecao/useCodexCatalog'

const ILUSTRACAO_WEB_SPEC: ImageSpec = {
  recommendedWidth: 1024,
  recommendedHeight: 1434,
  aspectRatio: '5 / 7',
  maxMb: 4,
  formats: 'JPG, PNG, WebP',
  hint: 'Retrato do personagem. O topo da imagem aparece sempre — deixe o rosto/foco na metade superior.',
}
const ILUSTRACAO_MOBILE_SPEC: ImageSpec = {
  recommendedWidth: 768,
  recommendedHeight: 1076,
  aspectRatio: '5 / 7',
  maxMb: 3,
  formats: 'JPG, PNG, WebP',
  hint: 'Variante opcional para telas estreitas. Se vazia, usa a versão web.',
}

const RARIDADES: CartaRaridade[] = [
  'comum',
  'rara',
  'epica',
  'lendaria',
  'suprema',
]
const MOLDURAS: CartaMoldura[] = [
  'classica',
  'ornamentada',
  'vitral',
  'minimalista',
]
const STATUS: CartaStatus[] = ['rascunho', 'revisao', 'publicado', 'arquivado']

interface FormState {
  slug: string
  numero: string
  nome: string
  subtitulo: string
  categoria: string
  raridade: CartaRaridade
  estrelas: number
  frase_central: string
  frase_referencia: string
  autoridade_doutrinaria: string
  efeito_simbolico: string
  recompensa: string // uma linha por item
  concilio: string
  virtude: string
  simbolo: string
  lore: string
  ilustracao_url: string
  ilustracao_mobile_url: string
  moldura: CartaMoldura
  cor_accent: string
  escala_fonte: number
  dica_desbloqueio: string
  regras: CartaRegras
  status: CartaStatus
  visivel: boolean
  ordem: number
  landing_featured: boolean
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fromCarta(c: Carta): FormState {
  return {
    slug: c.slug,
    numero: c.numero != null ? String(c.numero) : '',
    nome: c.nome,
    subtitulo: c.subtitulo ?? '',
    categoria: c.categoria ?? '',
    raridade: c.raridade,
    estrelas: c.estrelas,
    frase_central: c.frase_central ?? '',
    frase_referencia: c.frase_referencia ?? '',
    autoridade_doutrinaria: c.autoridade_doutrinaria ?? '',
    efeito_simbolico: c.efeito_simbolico ?? '',
    recompensa: c.recompensa.join('\n'),
    concilio: c.concilio ?? '',
    virtude: c.virtude ?? '',
    simbolo: c.simbolo ?? '',
    lore: c.lore ?? '',
    ilustracao_url: c.ilustracao_url ?? '',
    ilustracao_mobile_url: c.ilustracao_mobile_url ?? '',
    moldura: c.moldura,
    cor_accent: c.cor_accent ?? '',
    escala_fonte: c.escala_fonte ?? 1,
    dica_desbloqueio: c.dica_desbloqueio ?? '',
    regras: c.regras ?? REGRAS_VAZIA,
    status: c.status,
    visivel: c.visivel,
    ordem: c.ordem,
    landing_featured: c.landing_featured ?? false,
  }
}

const EMPTY: FormState = {
  slug: '',
  numero: '',
  nome: '',
  subtitulo: '',
  categoria: '',
  raridade: 'comum',
  estrelas: 1,
  frase_central: '',
  frase_referencia: '',
  autoridade_doutrinaria: '',
  efeito_simbolico: '',
  recompensa: '',
  concilio: '',
  virtude: '',
  simbolo: '',
  lore: '',
  ilustracao_url: '',
  ilustracao_mobile_url: '',
  moldura: 'classica',
  cor_accent: '',
  escala_fonte: 1,
  dica_desbloqueio: '',
  regras: REGRAS_VAZIA,
  status: 'rascunho',
  visivel: true,
  ordem: 0,
  landing_featured: false,
}

interface Props {
  personagemId: string
  carta: Carta | null
  catalogo: CodexCatalogo
  proximaOrdem: number
  onSaved: () => void
  onCancel: () => void
}

type Aba = 'conteudo' | 'visual' | 'regra'

export default function CartaEditor({
  personagemId,
  carta,
  catalogo,
  proximaOrdem,
  onSaved,
  onCancel,
}: Props) {
  const { user } = useAuth()
  const [form, setForm] = useState<FormState>(
    carta ? fromCarta(carta) : { ...EMPTY, ordem: proximaOrdem },
  )
  const [aba, setAba] = useState<Aba>('conteudo')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  // Carta sintética para o preview ao vivo.
  const preview: Carta = useMemo(
    () => ({
      id: carta?.id ?? 'preview',
      personagem_id: personagemId,
      slug: form.slug || 'preview',
      numero: form.numero ? Number(form.numero) : null,
      nome: form.nome || 'Nome da carta',
      subtitulo: form.subtitulo || null,
      categoria: form.categoria || null,
      raridade: form.raridade,
      estrelas: form.estrelas,
      frase_central: form.frase_central || null,
      frase_referencia: form.frase_referencia || null,
      autoridade_doutrinaria: form.autoridade_doutrinaria || null,
      efeito_simbolico: form.efeito_simbolico || null,
      recompensa: form.recompensa
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      concilio: form.concilio || null,
      virtude: form.virtude || null,
      simbolo: form.simbolo || null,
      lore: form.lore || null,
      ilustracao_url: form.ilustracao_url || null,
      ilustracao_mobile_url: form.ilustracao_mobile_url || null,
      moldura: form.moldura,
      cor_accent: form.cor_accent || null,
      escala_fonte: form.escala_fonte,
      dica_desbloqueio: form.dica_desbloqueio || null,
      regras: form.regras,
      status: form.status,
      visivel: form.visivel,
      ordem: form.ordem,
      landing_featured: form.landing_featured,
      landing_featured_order: carta?.landing_featured_order ?? null,
      created_by: carta?.created_by ?? null,
      created_at: carta?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [form, carta, personagemId],
  )

  async function save() {
    const supabase = createClient()
    if (!supabase) return
    if (!form.nome.trim()) {
      setError('Dê um nome à carta.')
      setAba('conteudo')
      return
    }
    setSaving(true)
    setError(null)
    setAviso(null)

    const slug = form.slug.trim() || slugify(form.nome)
    const payload = {
      personagem_id: personagemId,
      slug,
      numero: form.numero ? Number(form.numero) : null,
      nome: form.nome.trim(),
      subtitulo: form.subtitulo.trim() || null,
      categoria: form.categoria.trim() || null,
      raridade: form.raridade,
      estrelas: form.estrelas,
      frase_central: form.frase_central.trim() || null,
      frase_referencia: form.frase_referencia.trim() || null,
      autoridade_doutrinaria: form.autoridade_doutrinaria.trim() || null,
      efeito_simbolico: form.efeito_simbolico.trim() || null,
      recompensa: form.recompensa
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      concilio: form.concilio.trim() || null,
      virtude: form.virtude.trim() || null,
      simbolo: form.simbolo.trim() || null,
      lore: form.lore.trim() || null,
      ilustracao_url: form.ilustracao_url.trim() || null,
      ilustracao_mobile_url: form.ilustracao_mobile_url.trim() || null,
      moldura: form.moldura,
      cor_accent: form.cor_accent.trim() || null,
      escala_fonte: form.escala_fonte,
      dica_desbloqueio: form.dica_desbloqueio.trim() || null,
      regras: form.regras,
      status: form.status,
      visivel: form.visivel,
      ordem: form.ordem,
    }

    const op = carta
      ? supabase.from('cartas').update(payload).eq('id', carta.id)
      : supabase
          .from('cartas')
          .insert({ ...payload, created_by: user?.id ?? null })
    const { error: dbError } = await op
    if (dbError) {
      setSaving(false)
      setError(dbError.message)
      return
    }

    // Carta publicada: reavalia todos para que quem já cumpriu a regra receba.
    if (form.status === 'publicado') {
      try {
        await fetch('/api/admin/colecao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reevaluate-all' }),
        })
      } catch {
        /* não bloqueia o salvamento */
      }
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(201,168,76,0.18)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-sm tracking-[0.15em] uppercase"
          style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
        >
          {carta ? `Editar · ${carta.nome}` : 'Nova carta'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#8A8378' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm"
          style={{
            background: 'rgba(214,79,92,0.12)',
            border: '1px solid rgba(214,79,92,0.3)',
            color: '#D64F5C',
          }}
        >
          {error}
        </div>
      )}
      {aviso && (
        <div
          className="mb-4 p-3 rounded-xl text-sm"
          style={{
            background: 'rgba(102,187,106,0.12)',
            border: '1px solid rgba(102,187,106,0.3)',
            color: '#66BB6A',
          }}
        >
          {aviso}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Coluna esquerda: formulário em abas */}
        <div>
          <div className="flex gap-1 mb-4">
            {(['conteudo', 'visual', 'regra'] as Aba[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAba(a)}
                className="px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  background:
                    aba === a ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: aba === a ? '#C9A84C' : '#8A8378',
                  border:
                    aba === a
                      ? '1px solid rgba(201,168,76,0.3)'
                      : '1px solid transparent',
                }}
              >
                {a === 'conteudo'
                  ? 'Conteúdo'
                  : a === 'visual'
                    ? 'Visual'
                    : 'Regra'}
              </button>
            ))}
          </div>

          {aba === 'conteudo' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <Campo label="Nome">
                  <input
                    className="input"
                    value={form.nome}
                    onChange={(e) => set('nome', e.target.value)}
                    placeholder="Cristo Pantocrator"
                  />
                </Campo>
                <Campo label="Número">
                  <input
                    className="input"
                    type="number"
                    style={{ width: 90 }}
                    value={form.numero}
                    onChange={(e) => set('numero', e.target.value)}
                    placeholder="001"
                  />
                </Campo>
              </div>
              <Campo label="Slug (vazio = gerado do nome)">
                <input
                  className="input"
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="cristo-pantocrator"
                />
              </Campo>
              <Campo label="Subtítulo">
                <input
                  className="input"
                  value={form.subtitulo}
                  onChange={(e) => set('subtitulo', e.target.value)}
                  placeholder="O Verbo Eterno Encarnado"
                />
              </Campo>
              <Campo label="Categoria">
                <input
                  className="input"
                  value={form.categoria}
                  onChange={(e) => set('categoria', e.target.value)}
                  placeholder="Dogma Central"
                />
              </Campo>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Campo label="Frase central">
                  <input
                    className="input"
                    value={form.frase_central}
                    onChange={(e) => set('frase_central', e.target.value)}
                    placeholder="Eu sou o Caminho, a Verdade e a Vida."
                  />
                </Campo>
                <Campo label="Referência da frase">
                  <input
                    className="input"
                    value={form.frase_referencia}
                    onChange={(e) => set('frase_referencia', e.target.value)}
                    placeholder="João 14,6"
                  />
                </Campo>
              </div>
              <Campo label="Autoridade doutrinária">
                <input
                  className="input"
                  value={form.autoridade_doutrinaria}
                  onChange={(e) =>
                    set('autoridade_doutrinaria', e.target.value)
                  }
                  placeholder="O Verbo se fez carne. (Jo 1,14)"
                />
              </Campo>
              <Campo label="Efeito simbólico">
                <textarea
                  className="input"
                  rows={2}
                  value={form.efeito_simbolico}
                  onChange={(e) => set('efeito_simbolico', e.target.value)}
                  placeholder="Fortalece argumentos contra heresias cristológicas."
                />
              </Campo>
              <Campo label="Recompensa (uma por linha)">
                <textarea
                  className="input"
                  rows={3}
                  value={form.recompensa}
                  onChange={(e) => set('recompensa', e.target.value)}
                  placeholder={'Selo: Defensor da Fé\nAcesso ao Modo Debate Avançado'}
                />
              </Campo>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Campo label="Concílio">
                  <input
                    className="input"
                    value={form.concilio}
                    onChange={(e) => set('concilio', e.target.value)}
                    placeholder="Niceia (325 d.C.)"
                  />
                </Campo>
                <Campo label="Virtude">
                  <input
                    className="input"
                    value={form.virtude}
                    onChange={(e) => set('virtude', e.target.value)}
                    placeholder="Verdade Absoluta"
                  />
                </Campo>
                <Campo label="Símbolo">
                  <input
                    className="input"
                    value={form.simbolo}
                    onChange={(e) => set('simbolo', e.target.value)}
                    placeholder="☩"
                  />
                </Campo>
              </div>
              <Campo label="Lore (texto longo, opcional)">
                <textarea
                  className="input"
                  rows={3}
                  value={form.lore}
                  onChange={(e) => set('lore', e.target.value)}
                />
              </Campo>
              <Campo label="Dica de desbloqueio (vazio = surpresa total)">
                <input
                  className="input"
                  value={form.dica_desbloqueio}
                  onChange={(e) => set('dica_desbloqueio', e.target.value)}
                  placeholder="Aprofunde-se nos dogmas sobre a pessoa de Cristo."
                />
              </Campo>
            </div>
          )}

          {aba === 'visual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Campo label="Raridade">
                  <select
                    className="input"
                    value={form.raridade}
                    onChange={(e) =>
                      set('raridade', e.target.value as CartaRaridade)
                    }
                  >
                    {RARIDADES.map((r) => (
                      <option key={r} value={r}>
                        {RARIDADE_META[r].label}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Estrelas (dificuldade)">
                  <select
                    className="input"
                    value={form.estrelas}
                    onChange={(e) => set('estrelas', Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {'★'.repeat(n)}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Moldura">
                  <select
                    className="input"
                    value={form.moldura}
                    onChange={(e) =>
                      set('moldura', e.target.value as CartaMoldura)
                    }
                  >
                    {MOLDURAS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
              <Campo label="Cor de destaque (vazio = padrão da raridade)">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.cor_accent || RARIDADE_META[form.raridade].cor}
                    onChange={(e) => set('cor_accent', e.target.value)}
                    style={{
                      width: 44,
                      height: 36,
                      borderRadius: 8,
                      background: 'transparent',
                      border: '1px solid rgba(201,168,76,0.25)',
                    }}
                  />
                  <input
                    className="input"
                    value={form.cor_accent}
                    onChange={(e) => set('cor_accent', e.target.value)}
                    placeholder={RARIDADE_META[form.raridade].cor}
                  />
                  {form.cor_accent && (
                    <button
                      type="button"
                      onClick={() => set('cor_accent', '')}
                      className="text-xs"
                      style={{ color: '#8A8378' }}
                    >
                      limpar
                    </button>
                  )}
                </div>
              </Campo>
              <ImageUploader
                label="Ilustração da carta"
                description="Arte do personagem. Suba a versão web; a mobile é opcional."
                web={{
                  url: form.ilustracao_url,
                  spec: ILUSTRACAO_WEB_SPEC,
                  prefix: 'codex/cartas/web',
                }}
                mobile={{
                  url: form.ilustracao_mobile_url,
                  spec: ILUSTRACAO_MOBILE_SPEC,
                  prefix: 'codex/cartas/mobile',
                }}
                onWebChange={(v) => set('ilustracao_url', v.url)}
                onMobileChange={(v) => set('ilustracao_mobile_url', v.url)}
              />

              <Campo label="Escala da fonte (diagramação dos textos)">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'escala_fonte',
                        Math.max(0.5, Math.round((form.escala_fonte - 0.05) * 100) / 100),
                      )
                    }
                    className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.25)',
                      color: '#C9A84C',
                    }}
                    aria-label="Diminuir fonte"
                  >
                    A−
                  </button>
                  <span
                    className="text-sm tabular-nums"
                    style={{ color: '#C9C2B4', fontFamily: 'Poppins, sans-serif', minWidth: 48, textAlign: 'center' }}
                  >
                    {Math.round(form.escala_fonte * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'escala_fonte',
                        Math.min(2, Math.round((form.escala_fonte + 0.05) * 100) / 100),
                      )
                    }
                    className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.25)',
                      color: '#C9A84C',
                    }}
                    aria-label="Aumentar fonte"
                  >
                    A+
                  </button>
                  {form.escala_fonte !== 1 && (
                    <button
                      type="button"
                      onClick={() => set('escala_fonte', 1)}
                      className="text-xs"
                      style={{ color: '#8A8378' }}
                    >
                      resetar
                    </button>
                  )}
                </div>
              </Campo>
            </div>
          )}

          {aba === 'regra' && (
            <RuleBuilder
              value={form.regras}
              onChange={(r) => set('regras', r)}
              catalogo={catalogo}
            />
          )}

          {/* Rodapé: status / visibilidade / ordem */}
          <div
            className="mt-5 pt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
            style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}
          >
            <Campo label="Status">
              <select
                className="input"
                value={form.status}
                onChange={(e) => set('status', e.target.value as CartaStatus)}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Ordem">
              <input
                className="input"
                type="number"
                value={form.ordem}
                onChange={(e) => set('ordem', Number(e.target.value) || 0)}
              />
            </Campo>
            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={form.visivel}
                onChange={(e) => set('visivel', e.target.checked)}
              />
              <span
                className="text-xs"
                style={{ color: '#C9C2B4', fontFamily: 'Poppins, sans-serif' }}
              >
                Visível
              </span>
            </label>
            <label className="flex items-center gap-2 pt-6 col-span-2 md:col-span-1">
              <input
                type="checkbox"
                checked={form.landing_featured}
                onChange={(e) => set('landing_featured', e.target.checked)}
              />
              <span
                className="text-xs"
                style={{ color: '#C9C2B4', fontFamily: 'Poppins, sans-serif' }}
              >
                Destaque na landing
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{
                background: '#C9A84C',
                color: '#0F0E0C',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar carta
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#8A8378',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Cancelar
            </button>
            {carta && (
              <a
                href={`/api/colecao/carta/${carta.id}/imagem`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: '#C9A84C',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <ImageIcon className="w-4 h-4" />
                Salvar como imagem
              </a>
            )}
          </div>

          {/* Ferramenta de teste — só para cartas já salvas */}
          {carta && (
            <TestUnlock
              cartaId={carta.id}
              onAviso={setAviso}
              onError={setError}
            />
          )}
        </div>

        {/* Coluna direita: preview ao vivo */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-3.5 h-3.5" style={{ color: '#8A8378' }} />
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Preview ao vivo
            </span>
          </div>
          <CartaView carta={preview} width={280} />
        </div>
      </div>
    </div>
  )
}

function TestUnlock({
  cartaId,
  onAviso,
  onError,
}: {
  cartaId: string
  onAviso: (s: string) => void
  onError: (s: string) => void
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function testar() {
    if (!email.trim()) return
    setLoading(true)
    onError('')
    try {
      const res = await fetch('/api/admin/colecao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-unlock',
          email: email.trim(),
          carta_id: cartaId,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        onError(
          json.error === 'user_not_found'
            ? 'Usuário não encontrado com esse e-mail.'
            : `Falha: ${json.error}`,
        )
      } else {
        onAviso(`Carta desbloqueada para ${json.user} (teste).`)
      }
    } catch {
      onError('Erro de rede ao testar desbloqueio.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="mt-5 rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(201,168,76,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
        <span
          className="text-[10px] uppercase tracking-[0.16em]"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          Testar desbloqueio
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e-mail do usuário de teste"
        />
        <button
          type="button"
          onClick={testar}
          disabled={loading}
          className="px-3 py-2 rounded-lg text-xs flex-shrink-0"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.25)',
            color: '#C9A84C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {loading ? '...' : 'Forçar'}
        </button>
      </div>
    </div>
  )
}

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-[10px] uppercase tracking-wide"
        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}
