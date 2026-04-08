const SENSITIVE_KEYWORDS = [
  'nulidade', 'divórcio', 'separação conjugal', 'aborto',
  'anticoncepção', 'homossexualidade', 'suicídio', 'pecado grave',
  'confissão pessoal', 'excomunhão', 'caso de consciência',
]

export function isSensitiveTopic(query: string): boolean {
  const lower = query.toLowerCase()
  return SENSITIVE_KEYWORDS.some(keyword => lower.includes(keyword))
}
