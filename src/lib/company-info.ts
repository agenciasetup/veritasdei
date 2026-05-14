/**
 * Dados da pessoa jurídica responsável pelo Veritas Dei.
 *
 * Usado no rodapé do checkout (transparência / confiança) e em páginas
 * legais (Termos, Privacidade). Telefone NÃO aparece no checkout por
 * decisão do produto.
 *
 * Se mudar de CNPJ/endereço, ajuste aqui — único ponto de verdade.
 */

export const COMPANY_INFO = {
  legalName: 'AGENCIA SETUP LTDA',
  cnpj: '38.444.240/0001-58',
  email: 'contato@agenciasetup.com.br',
  // Endereço completo para legal; checkout exibe forma resumida.
  address: {
    street: 'Rua Nicola Citrangulo, 74',
    neighborhood: 'Centro',
    postalCode: '08970-000',
    city: 'Salesópolis',
    state: 'SP',
  },
  /** Forma curta usada no rodapé do checkout (sem telefone). */
  shortAddress: 'Rua Nicola Citrangulo, 74 — Centro, Salesópolis/SP · 08970-000',
} as const
