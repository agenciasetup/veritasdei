/**
 * ViaCEP — API gratuita (gov.br) pra consulta de CEP brasileiro.
 *
 * Documentação: https://viacep.com.br/
 *
 * Sem chave, sem rate limit declarado. Ideal pra autopreenchimento do
 * endereço no checkout. Não precisa de proxy backend — a API é pública
 * e CORS-friendly.
 */

export type ViaCepResult = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string // cidade
  uf: string
  ddd?: string
  erro?: boolean
}

export async function lookupCep(cep: string): Promise<ViaCepResult | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!res.ok) return null
    const data = (await res.json()) as ViaCepResult
    if (data.erro) return null
    return data
  } catch {
    return null
  }
}
