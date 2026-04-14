const CNBB_COPYRIGHT_REGEX =
  /\s*Confer[eê]ncia Nacional dos Bispos do Brasil\s*(?:©|&copy;|\(c\))?\s*Todos os direitos reservados\.?\s*/gi

const GENERIC_COPYRIGHT_REGEX = /\s*Todos os direitos reservados\.?\s*/gi

export function sanitizeLiturgicalText(input: string): string {
  if (!input) return ''

  const normalized = input
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')

  const withoutCopyright = normalized
    .replace(CNBB_COPYRIGHT_REGEX, '\n')
    .replace(GENERIC_COPYRIGHT_REGEX, '\n')

  return withoutCopyright
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
