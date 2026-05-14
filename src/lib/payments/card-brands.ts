/**
 * Identificação de bandeira + emissor (banco) por BIN.
 *
 * O BIN é só os primeiros dígitos do cartão. Por convenção:
 *  - Banda de bandeira (1-4 dígitos): Visa, Master, Elo…
 *  - Banda do emissor (6 dígitos): identifica banco específico.
 *
 * Bancos brasileiros costumam emitir cartões em cima das bandeiras
 * Visa/Mastercard/Elo. A bandeira é universal; o BANCO usa BINs
 * específicos. Como BINs mudam ao longo do tempo, mantemos os mais
 * conhecidos de fevereiro/2026 — pode dar match parcial.
 *
 * Falha silenciosa: se não identificarmos o banco, mostramos só a
 * bandeira. Se nem isso, "unknown" (cartão genérico cinza).
 */

export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'elo'
  | 'hipercard'
  | 'diners'
  | 'discover'
  | 'unknown'

export type IssuerKey =
  | 'nubank'
  | 'itau'
  | 'bradesco'
  | 'santander'
  | 'caixa'
  | 'bb'
  | 'mercadopago'
  | 'c6'
  | 'inter'
  | 'safra'
  | 'pan'
  | 'will'
  | 'next'
  | 'btg'
  | 'porto'
  | 'sicoob'
  | 'sicredi'

export type CardTheme = {
  bg: string // gradient ou cor sólida pro fundo do preview
  fg: string // cor do texto (geralmente branco, mas alguns usam preto)
  accent: string // cor do logo/badge
  label: string // texto que aparece como "logo" da bandeira
}

const BRAND_THEMES: Record<CardBrand, CardTheme> = {
  visa: {
    bg: 'linear-gradient(135deg, #1A1F71 0%, #2B388F 60%, #436CD0 100%)',
    fg: '#ffffff',
    accent: '#F7B600',
    label: 'VISA',
  },
  mastercard: {
    bg: 'linear-gradient(135deg, #1F2937 0%, #DC2626 60%, #F59E0B 100%)',
    fg: '#ffffff',
    accent: '#F59E0B',
    label: 'mastercard',
  },
  amex: {
    bg: 'linear-gradient(135deg, #006FCF 0%, #0099A8 100%)',
    fg: '#ffffff',
    accent: '#FFFFFF',
    label: 'AMEX',
  },
  elo: {
    bg: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #F8E122 100%)',
    fg: '#ffffff',
    accent: '#F8E122',
    label: 'elo',
  },
  hipercard: {
    bg: 'linear-gradient(135deg, #7B0F1B 0%, #B7141F 100%)',
    fg: '#ffffff',
    accent: '#ffffff',
    label: 'Hipercard',
  },
  diners: {
    bg: 'linear-gradient(135deg, #1B1F2A 0%, #4A5670 100%)',
    fg: '#ffffff',
    accent: '#ffffff',
    label: 'Diners',
  },
  discover: {
    bg: 'linear-gradient(135deg, #1A1A1A 0%, #FF6000 100%)',
    fg: '#ffffff',
    accent: '#FF6000',
    label: 'Discover',
  },
  unknown: {
    bg: 'linear-gradient(135deg, #1F1F1F 0%, #2A2A2A 50%, #383838 100%)',
    fg: '#ffffff',
    accent: '#999',
    label: '',
  },
}

const ISSUER_THEMES: Record<IssuerKey, { name: string; theme: CardTheme }> = {
  nubank: {
    name: 'Nubank',
    theme: {
      bg: 'linear-gradient(135deg, #4A0072 0%, #6E007F 50%, #8A05BE 100%)',
      fg: '#ffffff',
      accent: '#ffffff',
      label: '',
    },
  },
  itau: {
    name: 'Itaú',
    theme: {
      bg: 'linear-gradient(135deg, #00318F 0%, #003DB2 50%, #FF6500 100%)',
      fg: '#ffffff',
      accent: '#FF6500',
      label: '',
    },
  },
  bradesco: {
    name: 'Bradesco',
    theme: {
      bg: 'linear-gradient(135deg, #1B1820 0%, #46105F 50%, #CC092F 100%)',
      fg: '#ffffff',
      accent: '#CC092F',
      label: '',
    },
  },
  santander: {
    name: 'Santander',
    theme: {
      bg: 'linear-gradient(135deg, #2C0405 0%, #8E0103 50%, #EC0000 100%)',
      fg: '#ffffff',
      accent: '#EC0000',
      label: '',
    },
  },
  caixa: {
    name: 'Caixa',
    theme: {
      bg: 'linear-gradient(135deg, #002A5D 0%, #0044A0 50%, #F39200 100%)',
      fg: '#ffffff',
      accent: '#F39200',
      label: '',
    },
  },
  bb: {
    name: 'Banco do Brasil',
    theme: {
      bg: 'linear-gradient(135deg, #003F87 0%, #0061C5 60%, #FFEF38 100%)',
      fg: '#ffffff',
      accent: '#FFEF38',
      label: '',
    },
  },
  mercadopago: {
    name: 'Mercado Pago',
    theme: {
      bg: 'linear-gradient(135deg, #0080C7 0%, #009EE3 50%, #4DBDF4 100%)',
      fg: '#ffffff',
      accent: '#FFE600',
      label: '',
    },
  },
  c6: {
    name: 'C6 Bank',
    theme: {
      bg: 'linear-gradient(135deg, #000000 0%, #1A1A1A 50%, #2A2A2A 100%)',
      fg: '#ffffff',
      accent: '#CFCFCF',
      label: '',
    },
  },
  inter: {
    name: 'Inter',
    theme: {
      bg: 'linear-gradient(135deg, #4A1F00 0%, #B84400 50%, #FF7A00 100%)',
      fg: '#ffffff',
      accent: '#FF7A00',
      label: '',
    },
  },
  safra: {
    name: 'Safra',
    theme: {
      bg: 'linear-gradient(135deg, #0F1F3D 0%, #1B3666 50%, #2A4F8F 100%)',
      fg: '#ffffff',
      accent: '#C5A572',
      label: '',
    },
  },
  pan: {
    name: 'Banco Pan',
    theme: {
      bg: 'linear-gradient(135deg, #00194A 0%, #002B7A 60%, #00A1E0 100%)',
      fg: '#ffffff',
      accent: '#00A1E0',
      label: '',
    },
  },
  will: {
    name: 'Will Bank',
    theme: {
      bg: 'linear-gradient(135deg, #0E1B2C 0%, #002F66 50%, #C7F600 100%)',
      fg: '#ffffff',
      accent: '#C7F600',
      label: '',
    },
  },
  next: {
    name: 'Next',
    theme: {
      bg: 'linear-gradient(135deg, #00342F 0%, #006B5C 50%, #00CC88 100%)',
      fg: '#ffffff',
      accent: '#00CC88',
      label: '',
    },
  },
  btg: {
    name: 'BTG Pactual',
    theme: {
      bg: 'linear-gradient(135deg, #0A1929 0%, #11324F 50%, #1E5285 100%)',
      fg: '#ffffff',
      accent: '#C5A572',
      label: '',
    },
  },
  porto: {
    name: 'Porto Seguro',
    theme: {
      bg: 'linear-gradient(135deg, #001F66 0%, #003BB2 60%, #FFC700 100%)',
      fg: '#ffffff',
      accent: '#FFC700',
      label: '',
    },
  },
  sicoob: {
    name: 'Sicoob',
    theme: {
      bg: 'linear-gradient(135deg, #00321E 0%, #00744A 60%, #00B760 100%)',
      fg: '#ffffff',
      accent: '#00B760',
      label: '',
    },
  },
  sicredi: {
    name: 'Sicredi',
    theme: {
      bg: 'linear-gradient(135deg, #1F3A12 0%, #3D7322 60%, #62A532 100%)',
      fg: '#ffffff',
      accent: '#62A532',
      label: '',
    },
  },
}

/**
 * Tabela de BINs conhecidos. Match feito por prefixo do número do cartão
 * (sem espaços/dashes). Ordem importa: BINs mais específicos antes dos
 * genéricos (ex: Nubank 550209 antes do Mastercard 5500-5599).
 */
const BIN_TABLE: Array<{ prefix: string; issuer: IssuerKey }> = [
  // Nubank — emite em Mastercard, Elo e Visa
  { prefix: '550209', issuer: 'nubank' },
  { prefix: '516292', issuer: 'nubank' },
  { prefix: '533032', issuer: 'nubank' },
  { prefix: '519219', issuer: 'nubank' },
  { prefix: '536518', issuer: 'nubank' },
  { prefix: '5391', issuer: 'nubank' },
  { prefix: '5067', issuer: 'nubank' },

  // Itaú
  { prefix: '4538', issuer: 'itau' },
  { prefix: '4539', issuer: 'itau' },
  { prefix: '4576', issuer: 'itau' },
  { prefix: '5266', issuer: 'itau' },
  { prefix: '5536', issuer: 'itau' },
  { prefix: '5172', issuer: 'itau' },
  { prefix: '4537', issuer: 'itau' },

  // Bradesco
  { prefix: '4356', issuer: 'bradesco' },
  { prefix: '4596', issuer: 'bradesco' },
  { prefix: '5481', issuer: 'bradesco' },
  { prefix: '5419', issuer: 'bradesco' },
  { prefix: '5165', issuer: 'bradesco' },
  { prefix: '4220', issuer: 'bradesco' },

  // Santander
  { prefix: '4146', issuer: 'santander' },
  { prefix: '5276', issuer: 'santander' },
  { prefix: '5564', issuer: 'santander' },
  { prefix: '5403', issuer: 'santander' },
  { prefix: '4767', issuer: 'santander' },

  // Caixa
  { prefix: '4358', issuer: 'caixa' },
  { prefix: '5404', issuer: 'caixa' },
  { prefix: '4214', issuer: 'caixa' },
  { prefix: '5078', issuer: 'caixa' },
  { prefix: '5184', issuer: 'caixa' },

  // Banco do Brasil
  { prefix: '4549', issuer: 'bb' },
  { prefix: '4855', issuer: 'bb' },
  { prefix: '5067', issuer: 'bb' },
  { prefix: '6504', issuer: 'bb' },
  { prefix: '4566', issuer: 'bb' },

  // Mercado Pago
  { prefix: '5031', issuer: 'mercadopago' },
  { prefix: '5067', issuer: 'mercadopago' },
  { prefix: '4509', issuer: 'mercadopago' },

  // C6 Bank
  { prefix: '5232', issuer: 'c6' },
  { prefix: '4256', issuer: 'c6' },
  { prefix: '4014', issuer: 'c6' },

  // Inter
  { prefix: '4031', issuer: 'inter' },
  { prefix: '4146', issuer: 'inter' },
  { prefix: '5184', issuer: 'inter' },

  // Safra
  { prefix: '5193', issuer: 'safra' },
  { prefix: '4127', issuer: 'safra' },

  // Pan
  { prefix: '4259', issuer: 'pan' },
  { prefix: '5454', issuer: 'pan' },

  // Will Bank
  { prefix: '5466', issuer: 'will' },

  // Next (banco digital do Bradesco)
  { prefix: '4456', issuer: 'next' },

  // BTG Pactual
  { prefix: '4099', issuer: 'btg' },

  // Porto Seguro
  { prefix: '4023', issuer: 'porto' },

  // Sicoob
  { prefix: '4399', issuer: 'sicoob' },
  { prefix: '5061', issuer: 'sicoob' },

  // Sicredi
  { prefix: '5170', issuer: 'sicredi' },
]

export function detectBrand(number: string): CardBrand {
  const n = number.replace(/\D/g, '')
  if (!n) return 'unknown'
  // Elo (alguns BINs específicos) — antes de Visa/Master
  if (
    /^(4011|4312|4389|4514|4576|5041|5066|5067|509[0-9]|6362|6363|6504|6505|6508|6509|6516|6550|6551|6553|6555|627780)/.test(
      n,
    )
  ) {
    return 'elo'
  }
  if (/^(606282|3841)/.test(n) || /^(38|60)/.test(n)) return 'hipercard'
  if (/^4/.test(n)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^3(?:0[0-5]|[68])/.test(n)) return 'diners'
  if (/^6(?:011|5)/.test(n)) return 'discover'
  return 'unknown'
}

export function detectIssuer(number: string): {
  key: IssuerKey
  name: string
} | null {
  const n = number.replace(/\D/g, '')
  if (n.length < 4) return null
  // BIN_TABLE ordenado por especificidade (6 dígitos antes de 4)
  const sorted = BIN_TABLE.slice().sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )
  for (const entry of sorted) {
    if (n.startsWith(entry.prefix)) {
      return { key: entry.issuer, name: ISSUER_THEMES[entry.issuer].name }
    }
  }
  return null
}

/**
 * Tema visual do cartão. Prioriza o emissor sobre a bandeira — Nubank
 * roxo aparece como roxo mesmo sendo Mastercard.
 */
export function getCardTheme(number: string): CardTheme {
  const issuer = detectIssuer(number)
  if (issuer) return ISSUER_THEMES[issuer.key].theme
  const brand = detectBrand(number)
  return BRAND_THEMES[brand]
}

export function getBrandLabel(number: string): string {
  const brand = detectBrand(number)
  return BRAND_THEMES[brand].label
}

export function getIssuerName(number: string): string | null {
  const issuer = detectIssuer(number)
  return issuer?.name ?? null
}
