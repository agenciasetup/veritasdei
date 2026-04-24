/**
 * Filtro de texto para rejeitar conteúdo explicitamente sexual antes mesmo
 * de chegar na moderação por denúncia. Heurística deliberadamente
 * conservadora — prefere falso-positivo a deixar passar. Não é o único
 * filtro: imagens passam pelo classificador NSFW, e links pornográficos
 * são barrados pela blocklist de domínios.
 *
 * Observação: os padrões aqui são fragmentos comuns de ofertas e
 * aliciamento sexual. Mantê-los em um único lugar ajuda a auditar e
 * corrigir falsos positivos via denúncia/apelação.
 */

type Severity = 'hard' | 'soft'

type Rule = {
  label: string
  severity: Severity
  pattern: RegExp
}

// Regex em PT-BR + EN. Usamos \b quando possível; para abreviações e gírias
// que quebram em \b, recorremos a lookaround para delimitar contexto.
const RULES: Rule[] = [
  // Ofertas e aliciamento explícitos
  { label: 'oferta_sexual', severity: 'hard', pattern: /\b(programa|programinha)\s+(a|com)\s+(partir\s+de|partir\s+R?\$)/i },
  { label: 'oferta_sexual_preco', severity: 'hard', pattern: /\b(sexo|transa)\s+(por|a)\s+R?\$?\s?\d+/i },
  { label: 'aluguel_acompanhante', severity: 'hard', pattern: /\b(acompanhante|garota\s+de\s+programa|michê|travesti)\s+(disponível|disponivel|a?\s*domic[ií]lio|atende)/i },
  { label: 'onlyfans_cta', severity: 'hard', pattern: /\b(meu|minha|assina(?:\s+o)?)\s+only\s*fans?\b/i },
  { label: 'privacy_cta', severity: 'hard', pattern: /\b(meu|minha)\s+privacy\b/i },
  { label: 'conteudo_adulto_cta', severity: 'hard', pattern: /\b(conteúdo|conteudo)\s+adulto\s+(no|aqui|na\s+bio)/i },
  { label: 'link_no_bio_adulto', severity: 'hard', pattern: /\b(pack|nudes?)\s+(?:na|no|via|pelo)\s+(link|bio|dm|direct)\b/i },
  { label: 'packs', severity: 'hard', pattern: /\bvendo\s+(meus?|minhas?)\s+pack(s)?\b/i },
  { label: 'pack_precificado', severity: 'hard', pattern: /\bpack\s+(por|a)\s+R?\$?\s?\d+/i },
  { label: 'nudes', severity: 'hard', pattern: /\b(mando|envio|vendo)\s+nudes?\b/i },

  // Descrição explícita de ato
  { label: 'explicito_ato', severity: 'hard', pattern: /\b(chupar|gozar|foder|transar|punheta)\b/i },
  { label: 'explicito_anatomia_cta', severity: 'hard', pattern: /\b(p[aã]u|piroca|rola|buceta|xoxota)\s+(grande|gostoso|gostosa|dispon[ií]vel)/i },
  { label: 'incitar_sexo', severity: 'hard', pattern: /\bquer\s+(ver|sentir)\s+(meu|minha)\s+(p[aã]u|rola|xoxota|buceta|bunda)/i },

  // Aliciamento de menor (zero tolerância absoluta — hard sempre)
  { label: 'aliciamento_menor', severity: 'hard', pattern: /\b(novinh[ao]|menor\s+de\s+idade|criança|adolescente)\s+(?:gostos[ao]|safad[ao]|quer(?:endo)?\s+sexo|pelada?|nua?|pelad[ao])/i },
  { label: 'troca_nudes_menor', severity: 'hard', pattern: /\btroca\s+(de\s+)?nudes?\s+com\s+(novinh[ao]|menor|menina|menino)/i },

  // Spam grosseiro
  { label: 'clique_aqui_ganhe', severity: 'soft', pattern: /\bclique\s+aqui\s+(e\s+)?(ganh[ae]|receba)\s+/i },
  { label: 'renda_rapida', severity: 'soft', pattern: /\b(renda\s+r[áa]pida|ganhe\s+R?\$?\s?\d+\s+por\s+dia)/i },
]

export type TextFilterHit = {
  label: string
  severity: Severity
  sample: string
}

export function scanText(text: string): TextFilterHit | null {
  if (!text) return null
  for (const rule of RULES) {
    const match = text.match(rule.pattern)
    if (match) {
      return {
        label: rule.label,
        severity: rule.severity,
        sample: match[0].slice(0, 80),
      }
    }
  }
  return null
}

export function isHardReject(hit: TextFilterHit | null): boolean {
  return hit?.severity === 'hard'
}
