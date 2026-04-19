'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Church } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useHaptic } from '@/hooks/useHaptic'
import { stripCnpj, isValidCnpj } from '@/lib/utils/cnpj'
import {
  INITIAL_STATE,
  STEPS,
  type ParoquiaFormState,
} from './types'
import { clearDraft, loadDraft, saveDraft } from './draftStorage'

import IdentidadeStep from './steps/IdentidadeStep'
import EnderecoStep from './steps/EnderecoStep'
import HorariosStep from './steps/HorariosStep'
import FotosStep from './steps/FotosStep'
import ContatosStep from './steps/ContatosStep'
import VerificacaoStep from './steps/VerificacaoStep'

/**
 * Wizard de 6 steps para cadastro de paróquia.
 *
 * - Persistência local: rascunho salvo em localStorage por user a cada
 *   mudança (debounce 400ms). Ao abrir, oferece "continuar rascunho".
 * - Validação por step: campos obrigatórios são checados antes de avançar;
 *   inválidos recebem highlight vermelho e a tela dá um shake.
 * - Step indicator no topo é tappable para steps já completados.
 * - Transição entre steps com Framer Motion (forward/back direcional).
 */
export default function CadastrarWizard() {
  const router = useRouter()
  const { user } = useAuth()
  const haptic = useHaptic()
  const supabase = createClient()

  const [state, setState] = useState<ParoquiaFormState>(INITIAL_STATE)
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set())
  const [shake, setShake] = useState(0)
  const [maxStepReached, setMaxStepReached] = useState(0)
  const [draftPromptOpen, setDraftPromptOpen] = useState(false)
  const [verificacaoFile, setVerificacaoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const draftCheckedRef = useRef(false)

  // Detecta rascunho ao montar (apenas uma vez, e só se houver user).
  if (!draftCheckedRef.current && user?.id) {
    draftCheckedRef.current = true
    const draft = loadDraft(user.id)
    if (draft && Object.values(draft.state).some(isMeaningful)) {
      setDraftPromptOpen(true)
    }
  }

  // Salva rascunho com debounce.
  useEffect(() => {
    if (!user?.id) return
    if (draftPromptOpen) return // não salva enquanto o usuário decide
    const t = setTimeout(() => saveDraft(user.id, state, stepIndex), 400)
    return () => clearTimeout(t)
  }, [state, stepIndex, user?.id, draftPromptOpen])

  function setField<K extends keyof ParoquiaFormState>(k: K, v: ParoquiaFormState[K]) {
    setState((prev) => ({ ...prev, [k]: v }))
    if (invalidFields.size > 0) {
      const k2 = k as string
      if (invalidFields.has(k2) || invalidFields.has(`${k2}`)) {
        const next = new Set(invalidFields)
        next.delete(k2)
        setInvalidFields(next)
      }
    }
  }

  function validateStep(idx: number): Set<string> {
    const errors = new Set<string>()
    const id = STEPS[idx].id
    if (id === 'identidade') {
      if (!state.nome.trim()) errors.add('nome')
      if (!state.tipoIgreja) errors.add('tipoIgreja')
      const cnpjDigits = stripCnpj(state.cnpjMasked)
      if (cnpjDigits && !isValidCnpj(cnpjDigits)) errors.add('cnpj')
    } else if (id === 'endereco') {
      if (!state.cidade.trim()) errors.add('cidade')
      if (!state.estado) errors.add('estado')
    }
    return errors
  }

  function goNext() {
    const errs = validateStep(stepIndex)
    if (errs.size > 0) {
      setInvalidFields(errs)
      setShake((s) => s + 1)
      haptic.pulse('warning')
      return
    }
    setInvalidFields(new Set())
    if (stepIndex < STEPS.length - 1) {
      haptic.pulse('selection')
      setDirection('forward')
      const next = stepIndex + 1
      setStepIndex(next)
      setMaxStepReached((m) => Math.max(m, next))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goBack() {
    if (stepIndex === 0) return
    haptic.pulse('selection')
    setDirection('back')
    setStepIndex((i) => i - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function gotoStep(idx: number) {
    if (idx > maxStepReached) return // bloqueia ir para steps não atingidos
    if (idx === stepIndex) return
    haptic.pulse('selection')
    setDirection(idx > stepIndex ? 'forward' : 'back')
    setStepIndex(idx)
    setInvalidFields(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = useCallback(async () => {
    if (!supabase || !user) return
    // re-valida tudo
    for (let i = 0; i < STEPS.length; i++) {
      const errs = validateStep(i)
      if (errs.size > 0) {
        setStepIndex(i)
        setInvalidFields(errs)
        setShake((s) => s + 1)
        haptic.pulse('warning')
        return
      }
    }

    setSaving(true)
    setError(null)
    try {
      const enderecoFormatado = [state.rua, state.numero, state.bairro]
        .filter(Boolean)
        .join(', ')
      const cnpjDigits = stripCnpj(state.cnpjMasked)

      const { data: inserted, error: insertError } = await supabase
        .from('paroquias')
        .insert({
          nome: state.nome.trim(),
          cnpj: cnpjDigits || null,
          tipo_igreja: state.tipoIgreja,
          diocese: state.diocese.trim() || null,
          endereco: enderecoFormatado || null,
          rua: state.rua.trim() || null,
          numero: state.numero.trim() || null,
          bairro: state.bairro.trim() || null,
          complemento: state.complemento.trim() || null,
          cidade: state.cidade.trim(),
          estado: state.estado,
          pais: state.pais.trim() || null,
          cep: state.cep.trim() || null,
          latitude: state.latitude,
          longitude: state.longitude,
          padre_responsavel: state.padreResponsavel.trim() || null,
          telefone: state.telefone.trim() || null,
          email: state.email.trim() || null,
          foto_url: state.fotos[0]?.url ?? null,
          fotos: state.fotos,
          instagram: state.instagramHandle.trim() || null,
          facebook: state.facebookHandle.trim() || null,
          site: state.site.trim() || null,
          informacoes_extras: state.informacoesExtras.trim() || null,
          horarios_missa: state.horariosMissa,
          horarios_confissao: state.horariosConfissao,
          status: 'pendente',
          criado_por: user.id,
          owner_user_id: user.id,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        setError(insertError?.message ?? 'Erro ao cadastrar.')
        setSaving(false)
        return
      }

      if (verificacaoFile) {
        const ext = verificacaoFile.name.split('.').pop() ?? 'pdf'
        const path = `${user.id}/${inserted.id}/doc-${Date.now()}.${ext}`
        const up = await supabase.storage
          .from('paroquia-documentos')
          .upload(path, verificacaoFile, { upsert: true })
        if (!up.error) {
          await supabase
            .from('paroquias')
            .update({
              verificacao_documento_path: path,
              verificacao_solicitada_em: new Date().toISOString(),
              verificacao_notas: state.verificacaoNotas.trim() || null,
            })
            .eq('id', inserted.id)
        }
      }

      clearDraft(user.id)
      haptic.pulse('complete')
      router.push(`/paroquias/${inserted.id}`)
    } catch {
      setError('Erro inesperado ao salvar. Tente novamente.')
      setSaving(false)
    }
  }, [supabase, user, state, verificacaoFile, router, haptic])

  function continueDraft() {
    if (!user?.id) return
    const draft = loadDraft(user.id)
    if (draft) {
      setState(draft.state)
      setStepIndex(draft.step)
      setMaxStepReached(draft.step)
    }
    setDraftPromptOpen(false)
  }

  function discardDraft() {
    if (user?.id) clearDraft(user.id)
    setDraftPromptOpen(false)
  }

  const currentStep = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  return (
    <div className="min-h-screen relative pb-32">
      <div className="bg-glow" aria-hidden />

      <div className="max-w-2xl mx-auto relative z-10 px-4 md:px-8 pt-6">
        <Link
          href="/paroquias"
          className="inline-flex items-center gap-2 text-sm mb-4 active:opacity-70"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <h1
          className="text-2xl md:text-3xl font-semibold mb-2"
          style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-primary)' }}
        >
          Cadastrar igreja
        </h1>
        <p
          className="text-sm mb-5"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Passo {stepIndex + 1} de {STEPS.length} — {currentStep.label}
        </p>

        {/* Step indicator (tappable) */}
        <nav
          aria-label="Etapas"
          className="flex items-center gap-1.5 mb-6"
          role="tablist"
        >
          {STEPS.map((s, i) => {
            const reached = i <= maxStepReached
            const active = i === stepIndex
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${s.short} (${i + 1} de ${STEPS.length})`}
                disabled={!reached}
                onClick={() => gotoStep(i)}
                className="flex-1 h-1.5 rounded-full transition-all touch-target flex items-center justify-center"
                style={{ padding: 0 }}
              >
                <span
                  className="block w-full h-1.5 rounded-full transition-all"
                  style={{
                    background: active
                      ? 'var(--gold)'
                      : reached
                        ? 'rgba(201,168,76,0.45)'
                        : 'rgba(201,168,76,0.12)',
                  }}
                />
              </button>
            )
          })}
        </nav>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(107,29,42,0.15)',
              border: '1px solid rgba(107,29,42,0.3)',
              color: '#D94F5C',
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </div>
        )}

        {/* Step content with shake-on-error */}
        <motion.div
          key={shake}
          animate={
            shake > 0
              ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{
                opacity: 0,
                x: direction === 'forward' ? 24 : -24,
              }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                opacity: 0,
                x: direction === 'forward' ? -24 : 24,
              }}
              transition={{ duration: 0.2 }}
            >
              {currentStep.id === 'identidade' && (
                <IdentidadeStep
                  state={state}
                  setField={setField}
                  invalidFields={invalidFields}
                />
              )}
              {currentStep.id === 'endereco' && (
                <EnderecoStep
                  state={state}
                  setField={setField}
                  invalidFields={invalidFields}
                />
              )}
              {currentStep.id === 'horarios' && (
                <HorariosStep state={state} setField={setField} />
              )}
              {currentStep.id === 'fotos' && (
                <FotosStep state={state} setField={setField} onError={setError} />
              )}
              {currentStep.id === 'contatos' && (
                <ContatosStep state={state} setField={setField} />
              )}
              {currentStep.id === 'verificacao' && (
                <VerificacaoStep
                  state={state}
                  setField={setField}
                  verificacaoFile={verificacaoFile}
                  setVerificacaoFile={setVerificacaoFile}
                  onError={setError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom action bar — fixa no mobile */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 safe-bottom md:px-8"
        style={{
          background: 'rgba(15,14,12,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(201,168,76,0.12)',
        }}
      >
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm touch-target-lg active:scale-95 disabled:opacity-30"
            style={{
              border: '1px solid rgba(201,168,76,0.25)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={isLast ? submit : goNext}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold touch-target-lg active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
              fontFamily: 'var(--font-body)',
            }}
          >
            {saving ? (
              <span
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(15,14,12,0.3)', borderTopColor: '#0F0E0C' }}
              />
            ) : isLast ? (
              <>
                <Church className="w-4 h-4" />
                Cadastrar igreja
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prompt: continuar rascunho? */}
      <AnimatePresence>
        {draftPromptOpen && (
          <motion.div
            className="fixed inset-0 z-[150] flex items-end md:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
              onClick={discardDraft}
              aria-hidden
            />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 m-4 safe-bottom"
              style={{
                background: 'rgba(15,14,12,0.98)',
                border: '1px solid rgba(201,168,76,0.18)',
              }}
            >
              <h2
                className="text-lg font-semibold mb-2"
                style={{
                  fontFamily: 'var(--font-elegant)',
                  color: 'var(--text-primary)',
                }}
              >
                Continuar rascunho?
              </h2>
              <p
                className="text-sm mb-5"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
              >
                Encontramos um cadastro em andamento. Quer continuar de onde parou ou
                começar do zero?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={discardDraft}
                  className="flex-1 py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(201,168,76,0.12)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Começar do zero
                </button>
                <button
                  type="button"
                  onClick={continueDraft}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold touch-target-lg active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                    color: '#0F0E0C',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function isMeaningful(v: unknown): boolean {
  if (typeof v === 'string') return v.trim() !== '' && v !== 'Brasil' && v !== 'Domingo' && v !== '08:00'
  if (Array.isArray(v)) {
    if (v.length === 0) return false
    if (v.length === 1 && typeof v[0] === 'object' && v[0] !== null) {
      const obj = v[0] as Record<string, unknown>
      if (obj.dia === 'Domingo' && obj.horario === '08:00') return false
    }
    return true
  }
  if (v === null) return false
  if (typeof v === 'number') return true
  return false
}
