# Setup Asaas — Guia operacional

Asaas (https://asaas.com) é o gateway brasileiro do Veritas Dei. Cobra
PIX, boleto e cartão de crédito; é o **default** tanto do Veritas Dei
Premium quanto do Veritas Educa.

---

## TL;DR — Você NÃO cria produto/plano dentro da Asaas

> Esta é a confusão mais comum. **Não há "criar produto" no painel
> Asaas.** A Asaas é só um gateway: ela tokeniza cartão, gera PIX/boleto,
> cobra na hora certa e nos avisa por webhook. O catálogo de planos e
> preços vive **no nosso banco** (`billing_plans` + `billing_prices`),
> editável em **/admin/planos**.

O fluxo é:

```
[Cliente em /planos] → escolhe Premium mensal
        ↓
[Nosso checkout custom em /checkout/<sessionId>]
   - carrega R$29,90 do nosso banco
   - cria customer na Asaas se ainda não existir
   - mostra PIX + cartão
        ↓
[Asaas API]
   POST /v3/subscriptions com value=2990, cycle=MONTHLY, customer=<id>
        ↓
[Webhook PAYMENT_RECEIVED]
   → grava billing_subscriptions.status='active' → has_active_premium=true
```

Resumindo: a Asaas recebe `value`, `cycle`, `customer` e `nextDueDate`
toda vez que um cliente faz checkout. Ela não precisa saber que existe
um "Plano Premium" ou um "Veritas Educa" — quem coordena isso somos nós.

---

## Passo 1 — Criar conta + API key

1. Crie conta em https://asaas.com (sandbox em https://sandbox.asaas.com).
2. Painel → **Configurações → Integrações → API → "Gerar nova chave"**.
3. Copie a chave: `$aact_YTU5...` (sandbox) ou `$aact_PROD...` (prod).
4. Cole em `ASAAS_API_KEY` no Vercel (e em `.env.local` no dev).

---

## Passo 2 — Configurar webhook

1. Painel → **Integrações → Webhooks → "Novo webhook"**.
2. **URL**: `https://veritasdei.com.br/api/payments/webhooks/asaas`
   (mesmo URL para sandbox e prod — quem decide o ambiente é a env
   `ASAAS_ENV`).
3. **Authentication Token**: gere com `openssl rand -hex 32` (qualquer
   string opaca de 32+ bytes) e cole no painel. O mesmo valor vai em
   `ASAAS_WEBHOOK_TOKEN` no Vercel.
4. **Eventos**: marque todos de **Cobranças** (PAYMENT_*) e **Assinaturas**
   (SUBSCRIPTION_*). Se não tiver certeza, marque tudo — nosso dispatcher
   ignora silenciosamente os que não nos interessam.
5. Salve. Use o botão **"Testar webhook"** do painel — deve responder 200.

---

## Passo 3 — Env vars (Vercel + `.env.local`)

```
ASAAS_API_KEY=$aact_YTU5...            # do passo 1
ASAAS_ENV=sandbox                      # ou "production"
ASAAS_WEBHOOK_TOKEN=<mesmo do painel>  # do passo 2
NEXT_PUBLIC_APP_URL=https://veritasdei.com.br
```

> Em produção, troque `ASAAS_ENV=production` E `ASAAS_API_KEY` pela chave
> de prod. Token do webhook não precisa ser o mesmo entre sandbox e prod —
> mas o painel de prod precisa ter seu próprio webhook configurado.

---

## Passo 4 — Criar planos e preços (no nosso admin)

Acesse **/admin/planos** (precisa de `profile.role = 'admin'`).

### Editar plano existente

Para os planos que já existem (`premium` e `veritas-educa`):

- **Nome / Descrição / Benefícios**: textão livre, vira o que aparece em
  /planos e /educa/assine.
- **Provedor de pagamento padrão**: deixe `asaas`. Stripe e Hubla são
  legado — só use se um plano específico precisar.
- **Preços** (cards abaixo do plano):
  - **Mensal / Semestral / Anual / Único** — qualquer intervalo.
  - **Preço (R$)**: edite livre. Vira `amount_cents` no banco.
  - **Stripe Price ID**: só preencha se `default_provider=stripe`.

### Adicionar um novo preço

No card do plano, vá até o fim da lista de preços. Há um bloco tracejado
"Novo intervalo" — escolha (mensal/semestral/anual/único), digite o
valor e clique em **"Adicionar preço"**. Pronto, vira disponível na hora
em /planos.

### Excluir um preço

Botão "Excluir" ao lado de "Salvar" em cada card de preço. **Se houver
assinatura ativa usando aquele preço, o backend bloqueia com 409** — neste
caso, marque `Ativo = false` (desativa sem apagar histórico).

### Criar um novo plano (subproduto)

Botão **"Criar novo plano (subproduto)"** no rodapé de /admin/planos.
Você fornece `codigo` (slug único, ex: `veritas-confessor`), `nome` e
descrição. O plano nasce vazio — depois adicione preços nele.

> Importante: o código (`codigo`) é o identificador usado pelo backend
> (ex: `planCodigo=veritas-educa` no /api/payments/checkout). Não mude
> depois de cadastrado — quebra deep links.

---

## Passo 5 — Validar fim-a-fim

1. **Sandbox**: garanta `ASAAS_ENV=sandbox` e chave de sandbox.
2. Em `/planos`, escolha um plano + intervalo. Você cai em
   `/checkout/<sessionId>`.
3. Escolha **PIX**. Deve aparecer QR + copia-e-cola.
4. No painel Asaas sandbox → **Cobranças** → ache a cobrança recém-criada
   → menu **"Marcar como recebida"** (simula pagamento).
5. O webhook `PAYMENT_RECEIVED` chega. Em até 5s, `useSubscription`
   atualiza e o usuário vira premium. Olhe a tabela
   `billing_webhook_events` se algo não bater — todo webhook tem trilha.
6. Em `/perfil → Assinatura`, confira que aparecem: próximo vencimento,
   forma de pagamento, histórico, botão "Cancelar".

---

## Self-service do assinante

O painel `/perfil → Minha assinatura` permite ao próprio usuário:

| Ação | API |
|------|-----|
| Trocar data de vencimento | `PATCH /api/payments/subscription { nextDueDate }` |
| Trocar forma para PIX/Boleto | `PATCH /api/payments/subscription { billingType }` |
| Trocar / cadastrar cartão | `PUT /api/payments/subscription/credit-card` |
| Ver histórico de cobranças | `GET /api/payments/subscription` |
| Cancelar | `POST /api/payments/cancel` |

Tudo isso fica disponível só quando a `fonte = 'asaas'`. Para `stripe`,
o painel cai no botão "Gerenciar pagamento" (Stripe Customer Portal);
para `revenuecat`, abre o Customer Center nativo do SDK.

---

## Troubleshooting

### `asaas-access-token inválido` (HTTP 400 do webhook)
- O token configurado no painel Asaas difere de `ASAAS_WEBHOOK_TOKEN`.
  Recopie e teste o webhook pelo painel.

### `ASAAS_API_KEY ausente no env`
- Env var não foi propagada — force redeploy no Vercel. Lembre que envs
  novas só entram em build novo.

### `Asaas HTTP 401` na criação de cobrança
- Chave errada pro ambiente (chave de prod no sandbox ou vice-versa).
  Confira `ASAAS_ENV` E `ASAAS_API_KEY` juntos.

### Cliente paga mas não vira premium
- Olhe `billing_webhook_events` no Studio:
  - `processado_em` vazio → webhook chegou mas falhou; veja `erro`.
  - `userId ausente` → o `externalReference` da cobrança não tem o
    user_id. Toda cobrança feita pelo nosso checkout já tem isso, mas
    cobranças criadas manualmente pelo painel Asaas **não** terão. Para
    casos manuais, preencha `externalReference` com o UUID do user.

### Cliente cancela mas continua premium
- Webhook `SUBSCRIPTION_DELETED` é assíncrono. O endpoint
  `/api/payments/cancel` já marca `status='canceled'` localmente, mas
  `has_active_premium` só vira false quando `current_period_end < now()`.
  Comportamento esperado: o usuário paga, mantém acesso até o fim do
  período pago (sem renovar).

### Google OAuth volta pro domínio errado
- Não é problema do Asaas, mas afeta o login antes do checkout. O cliente
  agora prioriza `window.location.origin`, então funciona em qualquer
  subdomínio — mas o subdomínio precisa estar listado em **Supabase
  Dashboard → Authentication → URL Configuration → Redirect URLs**.

---

## Notas de segurança

- **Token via header** (`asaas-access-token`) é comparado em tempo
  constante (`safeEqual`). Sem IP allow-list porque a Asaas não publica
  range fixo.
- **Sem dados de cartão no nosso banco**. Os dados vão direto pro
  endpoint da Asaas (PCI Level 1). Nosso server faz proxy mas não
  persiste PAN/CCV.
- **Payload completo do webhook** vai em `billing_webhook_events.payload`
  (JSONB). Considere mascarar email/CPF se mantiver mais de 30 dias.
