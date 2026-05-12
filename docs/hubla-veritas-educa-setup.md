# Setup Hubla — Veritas Educa

Este documento descreve como configurar a integração com a Hubla para o
subproduto Veritas Educa: criar o produto/oferta na Hubla, registrar o
webhook no nosso app, e validar o fluxo ponta a ponta.

## Visão geral do fluxo

1. Usuário entra em `https://educa.veritasdei.com.br/assine` (ou
   `/educa/assine` no domínio principal).
2. Preenche email (ou já vem logado e o email vem pré-preenchido).
3. É redirecionado pra `https://pay.hubla.com.br/<offer-id>?email=...&name=...`.
4. Paga na Hubla. Hubla dispara webhook para
   `POST https://veritasdei.com.br/api/payments/webhooks/hubla` (mesmo
   domínio do app principal — o subdomínio educa serve só a UI).
5. Nosso webhook valida `x-hubla-token`, deduplica via `x-hubla-idempotency`,
   resolve o usuário pelo email (`profiles.email`) e ativa a assinatura
   em `billing_subscriptions`.
6. Usuário loga (ou já está logado) e o `has_active_premium()` retorna
   true — features premium liberadas.

---

## Passo 1 — Criar o produto na Hubla

1. Acesse o painel Hubla.
2. Crie um produto **Veritas Educa** (assinatura recorrente).
3. Configure as ofertas (ciclos):
   - Mensal: R$ X,XX/mês
   - Anual: R$ XX,XX/ano (com desconto sugerido)
4. **Copie o ID do produto** (UUID que aparece na URL).
5. **Copie a URL da oferta principal** (ex.: `https://pay.hubla.com.br/abc123`).
   Essa é a URL pra onde redirecionamos o usuário.

---

## Passo 2 — Configurar o webhook na Hubla

1. No painel Hubla, vá em **Configurações → Webhooks**.
2. Adicione novo webhook:
   - **URL**: `https://veritasdei.com.br/api/payments/webhooks/hubla`
   - **Token**: gere uma string aleatória com `openssl rand -hex 32` e
     cole aqui. Será o valor enviado no header `x-hubla-token`.
3. Selecione os eventos a notificar (v2):
   - `subscription.created`
   - `subscription.activated`
   - `subscription.deactivated`
   - `subscription.renewal_enabled`
   - `subscription.renewal_disabled`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.refunded`
4. Salve e teste com o evento de teste do painel Hubla — deve responder 200.

---

## Passo 3 — Configurar env vars

No Vercel (Production + Preview):

```
HUBLA_WEBHOOK_TOKEN=<o mesmo token gerado no passo 2>
HUBLA_PRODUCT_ID_VERITAS_EDUCA=<UUID do produto>
HUBLA_CHECKOUT_URL_VERITAS_EDUCA=https://pay.hubla.com.br/<offer-id>
NEXT_PUBLIC_HUBLA_CHECKOUT_URL_VERITAS_EDUCA=https://pay.hubla.com.br/<offer-id>
```

Em desenvolvimento local: replique no `.env.local`.

---

## Passo 4 — Rodar a migration

```bash
supabase db push
```

Migration `20260512100000_billing_hubla_provider_and_educa_plan.sql`:
- Permite `provider = 'hubla'` em `billing_subscriptions`.
- Cria o plano `veritas-educa` em `billing_plans`.

Os preços em `billing_prices` para esse plano podem ser cadastrados via
Studio se você quiser exibi-los em algum lugar; o webhook NÃO depende
dessa tabela (Hubla é a fonte da verdade sobre valores e ciclos).

---

## Passo 5 — Validar fluxo ponta a ponta

1. Em produção, crie uma conta de teste com email `qa@veritasdei.com.br`.
2. Vá em `/educa/assine`.
3. O email deve vir pré-preenchido (com aviso laranja "use o mesmo email").
4. Clique em "Continuar pra assinatura" → redireciona pra Hubla com
   `?email=qa@veritasdei.com.br`.
5. Conclua um pagamento de teste (ou use o botão "Marcar como pago" do
   painel Hubla, se disponível).
6. Aguarde o webhook (1-3s). Confira:
   - Tabela `billing_webhook_events` tem nova linha com `tipo` igual
     ao evento da Hubla e `processado_em` preenchido.
   - Tabela `billing_subscriptions` tem nova linha com `provider='hubla'`,
     `status='active'`, `user_id` correto.
   - `select public.has_active_premium('<user-uuid>')` retorna `true`.

---

## Troubleshooting

### `x-hubla-token inválido` (HTTP 400)
- O token configurado no painel Hubla é diferente de `HUBLA_WEBHOOK_TOKEN`.
- Re-cole o token nos dois lugares (sem espaços/quebras de linha).

### `produto Hubla <id> não mapeado` (status: ignored)
- O `event.product.id` recebido não bate com `HUBLA_PRODUCT_ID_VERITAS_EDUCA`.
- Confira se o UUID está correto (cópia exata, sem `-` ou prefixo extra).

### Webhook processou mas usuário não fica premium
- O email da conta Veritas e o email do payer na Hubla são diferentes.
- A linha em `billing_webhook_events` terá `erro: 'subscription.upserted sem userId — metadata ausente'`.
- Soluções:
  1. Peça pro cliente refazer com o email correto (refund + nova compra).
  2. Atualize manualmente `profiles.email` (mantenha aderência LGPD).
  3. Reenvie o evento via painel Hubla depois de corrigir.

### Webhook chega duplicado
- A Hubla pode reenviar se nossa resposta demorar >5s.
- A dedup via `(provider, provider_event_id)` UNIQUE pega isso —
  segunda chamada retorna `{duplicated: true}` em 200.

---

## Notas de segurança

- **Não use IP allow-list** — a Hubla não publica range fixo, e o token
  por header é suficiente.
- **Não loga payload em produção** sem mascarar email/CPF — risco LGPD.
  Hoje o payload completo vai em `billing_webhook_events.payload` (JSONB).
  Considere uma rotina de mascaramento periódica se for ficar no banco
  mais que 30 dias.
- **Refunds**: o evento `invoice.refunded` cancela a assinatura
  imediatamente. Se quiser dar tolerância (ex.: manter até fim do
  período), ajuste em `src/lib/payments/providers/hubla.ts`.
