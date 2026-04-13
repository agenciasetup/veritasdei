/**
 * Topics where the user is likely in pastoral distress and the answer
 * needs extra care: doctrinally firm, pastorally compassionate, always
 * pointing toward a concrete next step (sacerdote, confissão, direção
 * espiritual). Used by the RAG prompt to inject the CUIDADO PASTORAL
 * block and by the UI to show a "sensitive topic" banner.
 *
 * Matching is substring-based and diacritic-insensitive — the query is
 * normalized before the check so "divórcio", "divorcio", "DIVÓRCIO" all
 * trigger the same way.
 */
const SENSITIVE_KEYWORDS = [
  // Matrimônio / família
  'nulidade',
  'nulidade matrimonial',
  'divorcio',
  'recasamento',
  'segundas nupcias',
  'separacao conjugal',
  'traicao',
  'adulterio',
  'uniao estavel',
  'casamento misto',

  // Vida
  'aborto',
  'pilula do dia seguinte',
  'anticoncepcao',
  'contracepcao',
  'esterilizacao',
  'laqueadura',
  'vasectomia',
  'eutanasia',
  'suicidio',
  'autolesao',
  'fertilizacao in vitro',
  'reproducao assistida',

  // Sexualidade / identidade
  'homossexualidade',
  'uniao homoafetiva',
  'transgenero',
  'ideologia de genero',
  'pornografia',
  'masturbacao',
  'castidade',

  // Pecado grave / penitência
  'pecado grave',
  'pecado mortal',
  'confissao pessoal',
  'excomunhao',
  'caso de consciencia',
  'crise de fe',
  'perda da fe',
  'apostasia pessoal',

  // Saúde mental / sofrimento
  'depressao',
  'vontade de morrer',
  'luto',
  'perdao de si mesmo',
  'abuso',
  'violencia domestica',
]

/**
 * Normalize a string for diacritic-insensitive matching.
 * "Divórcio é pecado?" → "divorcio e pecado?"
 */
function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function isSensitiveTopic(query: string): boolean {
  const normalized = normalize(query)
  return SENSITIVE_KEYWORDS.some(keyword => normalized.includes(keyword))
}
