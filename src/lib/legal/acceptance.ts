import type { SupabaseClient } from '@supabase/supabase-js'
import { LEGAL_VERSIONS, REQUIRED_ACCEPTANCE, type LegalDocumentKey } from './versions'

export type LegalAcceptanceProfile = {
  accepted_terms_version: string | null
  accepted_privacy_version: string | null
  accepted_guidelines_version: string | null
  accepted_cookies_version: string | null
  accepted_dmca_version: string | null
  last_acceptance_at: string | null
}

const PROFILE_COLUMNS: Record<LegalDocumentKey, keyof LegalAcceptanceProfile> = {
  terms: 'accepted_terms_version',
  privacy: 'accepted_privacy_version',
  guidelines: 'accepted_guidelines_version',
  cookies: 'accepted_cookies_version',
  dmca: 'accepted_dmca_version',
}

export function pendingAcceptances(profile: Partial<LegalAcceptanceProfile> | null | undefined): LegalDocumentKey[] {
  if (!profile) return [...REQUIRED_ACCEPTANCE]
  return REQUIRED_ACCEPTANCE.filter((key) => {
    const column = PROFILE_COLUMNS[key]
    const current = profile[column]
    return current !== LEGAL_VERSIONS[key]
  })
}

export function needsReacceptance(profile: Partial<LegalAcceptanceProfile> | null | undefined): boolean {
  return pendingAcceptances(profile).length > 0
}

export async function recordAcceptance(params: {
  supabase: SupabaseClient
  userId: string
  documentKey: LegalDocumentKey
  ip: string | null
  userAgent: string | null
  locale: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId, documentKey, ip, userAgent, locale } = params
  const version = LEGAL_VERSIONS[documentKey]

  const { error: insertError } = await supabase.from('user_legal_acceptances').insert({
    user_id: userId,
    document_key: documentKey,
    version,
    ip,
    user_agent: userAgent?.slice(0, 400) ?? null,
    locale,
  })
  if (insertError) return { ok: false, error: insertError.message }

  const column = PROFILE_COLUMNS[documentKey]
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ [column]: version, last_acceptance_at: new Date().toISOString() })
    .eq('id', userId)
  if (updateError) return { ok: false, error: updateError.message }

  return { ok: true }
}
