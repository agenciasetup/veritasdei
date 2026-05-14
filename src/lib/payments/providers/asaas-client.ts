/**
 * Cliente HTTP do Asaas v3.
 *
 * Asaas (asaas.com) é o gateway brasileiro escolhido como default. A API
 * v3 é REST + JSON, autenticada por header `access_token: <api_key>`.
 *
 * Ambiente:
 *  - sandbox: https://api-sandbox.asaas.com/v3
 *  - production: https://api.asaas.com/v3
 *
 * Selecionamos via ASAAS_ENV ('sandbox' | 'production'). Default = sandbox.
 *
 * Erros: a API retorna 400/401/etc com body `{ errors: [{ description, code }] }`.
 * `request()` lança AsaasApiError preservando o status + erros pra logs.
 *
 * Esta camada é puramente transporte — não conhece nosso schema. Quem orquestra
 * (criar customer, criar payment, casar webhook → user) vive em `asaas.ts`.
 */

const API_BASE_SANDBOX = 'https://api-sandbox.asaas.com/v3'
const API_BASE_PROD = 'https://api.asaas.com/v3'

export type AsaasEnv = 'sandbox' | 'production'

function getEnv(): AsaasEnv {
  const v = (process.env.ASAAS_ENV ?? 'sandbox').toLowerCase()
  return v === 'production' ? 'production' : 'sandbox'
}

function getBaseUrl(): string {
  return getEnv() === 'production' ? API_BASE_PROD : API_BASE_SANDBOX
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) {
    throw new Error('ASAAS_API_KEY ausente no env')
  }
  return key
}

export class AsaasApiError extends Error {
  status: number
  errors: { code?: string; description?: string }[]
  constructor(status: number, errors: { code?: string; description?: string }[]) {
    const msg =
      errors.map(e => e.description ?? e.code).filter(Boolean).join('; ') ||
      `Asaas HTTP ${status}`
    super(msg)
    this.name = 'AsaasApiError'
    this.status = status
    this.errors = errors
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'DELETE' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      access_token: getApiKey(),
      'User-Agent': 'veritasdei/1.0 (+https://veritasdei.com.br)',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const text = await res.text()
  const json = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    const errors =
      (json as { errors?: { code?: string; description?: string }[] } | null)
        ?.errors ?? []
    throw new AsaasApiError(res.status, errors.length ? errors : [{ description: text }])
  }

  return json as T
}

// --------------------------------------------------------------------------
// Tipos do contrato Asaas (subset que usamos)
// --------------------------------------------------------------------------

export type AsaasCustomer = {
  id: string
  name: string
  email?: string
  cpfCnpj?: string
  mobilePhone?: string
  externalReference?: string
}

export type AsaasBillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'

export type AsaasCycle =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUALLY'
  | 'YEARLY'

export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS'

export type AsaasPayment = {
  id: string
  customer: string
  subscription?: string | null
  installment?: string | null
  value: number
  netValue?: number
  billingType: AsaasBillingType
  status: AsaasPaymentStatus
  dueDate: string
  paymentDate?: string | null
  invoiceUrl?: string
  bankSlipUrl?: string
  transactionReceiptUrl?: string | null
  externalReference?: string | null
  // Quando billingType=CREDIT_CARD, a Asaas devolve dados básicos do
  // cartão usado (sem PAN). Usamos pra exibir "Visa final 1234".
  creditCard?: {
    creditCardNumber?: string // últimos 4 dígitos
    creditCardBrand?: string // VISA, MASTERCARD, ELO, etc.
    creditCardToken?: string // token reutilizável em futuras cobranças
  }
}

export type AsaasSubscription = {
  id: string
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string
  cycle: AsaasCycle
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  externalReference?: string | null
}

export type AsaasPixQrCode = {
  encodedImage: string
  payload: string
  expirationDate: string
  success: boolean
}

export type AsaasCreditCard = {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export type AsaasCreditCardHolderInfo = {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  addressComplement?: string
  phone?: string
  mobilePhone?: string
}

// --------------------------------------------------------------------------
// Customers
// --------------------------------------------------------------------------

export async function createCustomer(input: {
  name: string
  email: string
  cpfCnpj?: string
  mobilePhone?: string
  externalReference?: string
  notificationDisabled?: boolean
}): Promise<AsaasCustomer> {
  return request<AsaasCustomer>('POST', '/customers', input)
}

export async function findCustomerByExternalReference(
  externalReference: string,
): Promise<AsaasCustomer | null> {
  const res = await request<{ data: AsaasCustomer[] }>(
    'GET',
    `/customers?externalReference=${encodeURIComponent(externalReference)}&limit=1`,
  )
  return res.data[0] ?? null
}

/**
 * Atualiza dados do customer. Asaas exige `cpfCnpj` no customer para
 * gerar qualquer cobrança (PIX/Boleto/Cartão), e benefíciamos de ter
 * email + telefone para os e-mails transacionais que ela manda. Por
 * isso atualizamos o customer logo antes de cada criação de subscription.
 *
 * Endpoint: POST /v3/customers/:id (a Asaas trata POST como upsert
 * parcial — apenas os campos enviados são alterados).
 */
export async function updateCustomer(
  id: string,
  input: {
    name?: string
    email?: string
    cpfCnpj?: string
    mobilePhone?: string
    phone?: string
    postalCode?: string
    addressNumber?: string
    addressComplement?: string
    province?: string
  },
): Promise<AsaasCustomer> {
  return request<AsaasCustomer>('POST', `/customers/${id}`, input)
}

// --------------------------------------------------------------------------
// Payments (single payment ou parcelado)
// --------------------------------------------------------------------------

export type CreatePaymentInput = {
  customer: string
  billingType: AsaasBillingType
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  // Parcelamento
  installmentCount?: number
  totalValue?: number
  // Cartão (quando billingType=CREDIT_CARD)
  creditCard?: AsaasCreditCard
  creditCardHolderInfo?: AsaasCreditCardHolderInfo
  remoteIp?: string
  // Callback (redireciona após pagamento)
  callback?: {
    successUrl: string
    autoRedirect?: boolean
  }
}

export async function createPayment(
  input: CreatePaymentInput,
): Promise<AsaasPayment> {
  return request<AsaasPayment>('POST', '/payments', input)
}

export async function getPayment(id: string): Promise<AsaasPayment> {
  return request<AsaasPayment>('GET', `/payments/${id}`)
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return request<AsaasPixQrCode>('GET', `/payments/${paymentId}/pixQrCode`)
}

// --------------------------------------------------------------------------
// Subscriptions (recorrente)
// --------------------------------------------------------------------------

export type CreateSubscriptionInput = {
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string
  cycle: AsaasCycle
  description?: string
  externalReference?: string
  // Cartão (quando billingType=CREDIT_CARD pra cobrar recorrente)
  creditCard?: AsaasCreditCard
  creditCardHolderInfo?: AsaasCreditCardHolderInfo
  creditCardToken?: string
  remoteIp?: string
}

export async function createSubscription(
  input: CreateSubscriptionInput,
): Promise<AsaasSubscription> {
  return request<AsaasSubscription>('POST', '/subscriptions', input)
}

/**
 * Lista as cobranças (payments) geradas por uma subscription. Útil pra
 * pegar o primeiro invoice (PIX) recém-criado e exibir o QR.
 */
export async function listSubscriptionPayments(
  subscriptionId: string,
  limit = 5,
): Promise<{ data: AsaasPayment[] }> {
  return request<{ data: AsaasPayment[] }>(
    'GET',
    `/subscriptions/${subscriptionId}/payments?limit=${limit}`,
  )
}

export async function cancelSubscription(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>('DELETE', `/subscriptions/${id}`)
}

export async function getSubscription(id: string): Promise<AsaasSubscription> {
  return request<AsaasSubscription>('GET', `/subscriptions/${id}`)
}

/**
 * Atualiza dados da subscription. Campos não enviados ficam como estão.
 *
 * Use pra:
 *  - trocar data de cobrança: `{ nextDueDate: 'YYYY-MM-DD' }`
 *  - trocar método: `{ billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' }`
 *    (CREDIT_CARD exige também `creditCard` + `creditCardHolderInfo` ou
 *    `creditCardToken` — Asaas rejeita PUT sem cartão se billingType=CREDIT_CARD
 *    e a sub ainda não tem cartão tokenizado)
 *  - trocar valor: `{ value: number }` (pouco usado; preço aqui é nosso)
 */
export type UpdateSubscriptionInput = {
  billingType?: AsaasBillingType
  value?: number
  nextDueDate?: string
  cycle?: AsaasCycle
  description?: string
  creditCard?: AsaasCreditCard
  creditCardHolderInfo?: AsaasCreditCardHolderInfo
  creditCardToken?: string
  remoteIp?: string
  updatePendingPayments?: boolean
}

export async function updateSubscription(
  id: string,
  input: UpdateSubscriptionInput,
): Promise<AsaasSubscription> {
  return request<AsaasSubscription>('PUT', `/subscriptions/${id}`, input)
}

/**
 * Lista cobranças de um customer. Usado pra histórico no painel
 * "Minha assinatura". Retorna paginado (limit/offset).
 */
export async function listCustomerPayments(
  customerId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ data: AsaasPayment[]; hasMore: boolean; totalCount: number }> {
  const limit = opts.limit ?? 20
  const offset = opts.offset ?? 0
  return request<{ data: AsaasPayment[]; hasMore: boolean; totalCount: number }>(
    'GET',
    `/payments?customer=${encodeURIComponent(customerId)}&limit=${limit}&offset=${offset}`,
  )
}

// --------------------------------------------------------------------------
// Helpers (cycle ↔ intervalo do nosso enum)
// --------------------------------------------------------------------------

import type { Intervalo } from '../types'

export function intervaloToCycle(i: Intervalo): AsaasCycle | null {
  if (i === 'mensal') return 'MONTHLY'
  if (i === 'semestral') return 'SEMIANNUALLY'
  if (i === 'anual') return 'YEARLY'
  return null // 'unico' não é assinatura recorrente
}

export function cycleToIntervalo(c: AsaasCycle): Intervalo | null {
  if (c === 'MONTHLY') return 'mensal'
  if (c === 'SEMIANNUALLY') return 'semestral'
  if (c === 'YEARLY') return 'anual'
  return null
}
