export const LEGAL_DOCUMENTS = ['terms', 'privacy', 'guidelines', 'cookies', 'dmca', 'account-deletion'] as const
export type LegalDocumentKey = (typeof LEGAL_DOCUMENTS)[number]

export const LEGAL_VERSIONS: Record<LegalDocumentKey, string> = {
  terms: '2.0.0',
  privacy: '2.0.0',
  guidelines: '1.0.0',
  cookies: '1.0.0',
  dmca: '1.0.0',
  'account-deletion': '1.0.0',
}

export const LEGAL_DATES: Record<LegalDocumentKey, string> = {
  terms: '2026-04-23',
  privacy: '2026-04-23',
  guidelines: '2026-04-23',
  cookies: '2026-04-23',
  dmca: '2026-04-23',
  'account-deletion': '2026-04-28',
}

export const LEGAL_ROUTES: Record<LegalDocumentKey, string> = {
  terms: '/termos',
  privacy: '/privacidade',
  guidelines: '/diretrizes',
  cookies: '/cookies',
  dmca: '/dmca',
  'account-deletion': '/excluir-conta',
}

export const LEGAL_LABELS: Record<LegalDocumentKey, string> = {
  terms: 'Termos de Uso',
  privacy: 'Política de Privacidade',
  guidelines: 'Diretrizes da Comunidade',
  cookies: 'Política de Cookies',
  dmca: 'Política de Direitos Autorais',
  'account-deletion': 'Excluir conta',
}

export const REQUIRED_ACCEPTANCE: ReadonlyArray<LegalDocumentKey> = ['terms', 'privacy', 'guidelines']

export const LEGAL_OPERATOR = {
  displayName: 'Veritas Dei',
  legalStatus: 'Em processo de constituição jurídica',
  contactEmail: 'contato@veritasdei.com.br',
  privacyEmail: 'privacidade@veritasdei.com.br',
  dmcaEmail: 'dmca@veritasdei.com.br',
  address: 'Endereço para notificações: enviar solicitação por e-mail para contato@veritasdei.com.br',
} as const

export function formatBrDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}
