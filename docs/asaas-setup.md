# Setup Asaas — Default global

Asaas (asaas.com) é o gateway de pagamentos brasileiro escolhido como
**default** tanto para o Veritas Dei quanto para o Veritas Educa. Stripe
e Hubla continuam no código como alternativas que o admin pode ativar
por plano via `billing_plans.default_provider`.

> **Status**: Sprint 1 entregue (infra + provider + webhook + roteador
> de checkout). O checkout customizado em `/checkout/[sessionId]` será
> entregue no Sprint 2. Por enquanto a sessão é criada com sucesso mas
> a tela ainda não renderiza — não habilite Asaas em produção até o
> Sprint 2 estar deployado.

---

## Roadmap (sprints)

| Sprint | Conteúdo | Status |
|--------|----------|--------|
| 1 | Migration + provider Asaas + cliente HTTP + webhook + roteador `/api/payments/checkout` | ✅ |
| 2 | UI `/checkout/[sessionId]` com PIX + cartão (parcelamento) + polling | ⏳ |
| 3 | Admin `/admin/checkout` (logo, cores, copy, métodos habilitados) | ⏳ |
| 4 | `/educa/assine` usando Asaas + endpoint `/api/payments/cancel` | ⏳ |
| 5 | Order bump / upsell + docs operacionais | ⏳ |

---

## Visão geral do fluxo (alvo final)

1. Usuário em `/planos` (ou `/educa/assine`) escolhe intervalo.
2. POST `/api/payments/checkout` resolve `billing_plans.default_provider`
   → 'asaas' → `asaasProvider.createCheckout`.
3. Provider cria/reusa customer no Asaas (via `externalReference=user_id`),
   cria uma row em `billing_checkout_sessions` e retorna URL interna
   `/checkout/<sessionId>`.
4. `/checkout/<sessionId>` renderiza o checkout custom Veritas (logo,
   cores e copy vindos de `billing_checkout_settings`).
5. Usuário escolhe PIX ou cartão → POST `/api/payments/asaas/charge`
   chama `POST /v3/payments` ou `POST /v3/subscriptions`.
6. PIX: mostra QR code + copia-e-cola, polling a cada 3s no status do
   pagamento. Cartão: confirma capturada.
7. Asaas dispara webhook `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` em
   `/api/payments/webhooks/asaas` → dispatcher upserta em
   `billing_subscriptions` → `has_active_premium` vira true.

---

## Passo 1 — Conta + API key

1. Crie conta em <https://asaas.com> (a versão sandbox fica em
   <https://sandbox.asaas.com>).
2. Painel ▸ Configurações ▸ Integrações ▸ API ▸ "Gerar nova chave".
3. Copie a chave (`$aact_YTU5...` em sandbox, `$aact_PROD...` em prod).

---

## Passo 2 — Webhook

1. Painel ▸ Integrações ▸ Webhooks ▸ "Novo webhook".
2. URL: `https://veritasdei.com.br/api/payments/webhooks/asaas`
3. **Authentication Token**: gere com `openssl rand -hex 32` e cole.
   Mesmo valor vai em `ASAAS_WEBHOOK_TOKEN` no Vercel.
4. Eventos: marque todos de **Cobrança** (PAYMENT_*) e **Assinatura**
   (SUBSCRIPTION_*).
5. Salve e teste com o botão de teste do painel → deve responder 200.

---

## Passo 3 — Env vars (Vercel + `.env.local`)

```
ASAAS_API_KEY=$aact_YTU5...
ASAAS_ENV=sandbox          # ou production
ASAAS_WEBHOOK_TOKEN=<mesmo do painel Asaas>
```

---

## Passo 4 — Migration

```bash
supabase db push
```

`20260513120000_billing_asaas_provider_and_checkout_settings.sql`:
- Permite `provider = 'asaas'` em `billing_subscriptions`.
- Adiciona `asaas_value_cents`, `asaas_cycle` em `billing_prices`.
- Adiciona `default_provider` em `billing_plans` (default 'asaas').
- Cria `billing_checkout_settings` (singleton id='global').
- Cria `billing_checkout_sessions` (sessões efêmeras do checkout custom).

> Planos existentes ficam com `default_provider='asaas'` automaticamente.
> Quando o Sprint 2 estiver fora, todo /planos passa a usar Asaas.
> Pra manter Stripe num plano específico, edite via `/admin/planos`
> após o Sprint 3.

---

## Troubleshooting

### `asaas-access-token inválido` (HTTP 400)
- Token configurado no painel difere de `ASAAS_WEBHOOK_TOKEN`. Recopie.

### `ASAAS_API_KEY ausente no env`
- Env var não foi propagada (redeploy necessário no Vercel).

### `Asaas HTTP 401`
- Chave errada pro ambiente (chave de prod no sandbox ou vice-versa).
  Confira `ASAAS_ENV`.

### Webhook chega mas usuário não vira premium
- A row em `billing_webhook_events` terá `erro: 'subscription.upserted sem userId — metadata ausente'`.
- Aconteceu porque o `externalReference` do payment não tem o user_id.
- Garanta que `createPayment` / `createSubscription` sempre é chamado
  com `externalReference: userId` (já está no `createCheckout` do provider).

---

## Notas de segurança

- **Token via header** (`asaas-access-token`) comparado em tempo
  constante (`safeEqual`). Sem IP allow-list porque a Asaas não publica
  range fixo.
- **Sem dados de cartão no nosso banco** — quando o Sprint 2 entregar
  o checkout com cartão, os dados vão direto pro Asaas (PCI Level 1).
  Não armazenamos PAN, ccv ou tokens internamente.
- **Payload completo do webhook** vai em `billing_webhook_events.payload`
  (JSONB). Considere mascarar email/CPF se ficar mais de 30 dias.
