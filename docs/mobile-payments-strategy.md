# Estratégia de pagamento mobile — Veritas Dei

> Diagnóstico e arquitetura recomendada de monetização para web, app
> Android (Google Play) e app iOS (App Store). **Este documento é
> apenas diagnóstico — nenhum código foi alterado.**

Data: 2026-04-27 — branch `feature/mobile-capacitor-readiness`.

---

## 1. O que é vendido hoje (estado atual do código)

- Plano **`premium`** com preços em `billing_prices` (intervalos
  `mensal`, `semestral`, `anual`, `unico`).
- Provedor único: **Stripe** (`src/lib/payments/providers/stripe.ts`,
  `src/app/api/payments/checkout/route.ts`, webhook em
  `src/app/api/payments/webhooks/stripe/route.ts`).
- O entitlement é gravado em Supabase via `get_user_entitlement(uid)`
  e consumido por:
  - `RequirePremium` (`src/components/payments/RequirePremium.tsx`)
  - `SubscriptionContext` no client
  - Layouts/rotas gateadas: `/aprender`, `/catecismo-pio-x`, `/mapa`,
    `/sao-tomas`, `/trilhas` (e `/planos` mostra a oferta).

> **Conteúdo destravado pelo Premium é digital, consumido dentro do
> app, e a maior parte é o motivo principal do app.** Esse é o ponto
> que aciona as regras das lojas — ver Seção 2.

---

## 2. O que as lojas exigem

### 2.1 Google Play — Play Billing

- **Pagamentos por assinatura/conteúdo digital consumido dentro do
  app DEVEM usar Google Play Billing.**
  Ref.: <https://support.google.com/googleplay/android-developer/answer/9858738>
- Em 2024 o Brasil entrou no programa "User Choice Billing" (UCB) em
  expansão, mas **não é geral**: o developer precisa ser aceito no
  programa, e mesmo no UCB o Google Play Billing tem que aparecer
  como **opção lado a lado** com o método alternativo. Não é "Stripe
  livre".
- **Fees:** Play Billing cobra 15% (até US$ 1M/ano de receita por
  developer) ou 30% (acima). UCB reduz a fee em ~4 p.p. quando o
  usuário escolhe o billing alternativo.
- **Regras complementares:**
  - Não dá para **dirigir** o usuário a um link externo de pagamento
    dentro do app (regra "anti-steering"), exceto em categorias
    específicas (a partir de 2024 está mais flexível, mas requer
    declaração na Play Console).
  - Apps de **leitura** (livros, revistas, áudio, vídeo) podem se
    inscrever no programa "Reader" e cobrar fora — não é o caso
    direto da Veritas Dei (que vende acesso a conteúdo educativo
    e ferramentas, não puramente leitura).
  - Conteúdo religioso/educacional **não** tem isenção da regra
    geral; só doação avulsa pode ser cobrada por método externo
    (Stripe, Pix), desde que claramente identificada como doação
    sem retorno de bem digital.

### 2.2 Apple App Store — In-App Purchase / StoreKit

- **Conteúdo digital consumido dentro do app DEVE usar StoreKit
  (IAP).** Não há exceção para apps religiosos.
  Ref.: <https://developer.apple.com/app-store/review/guidelines/#in-app-purchase> (regra 3.1.1)
- **Fees:** 15% para "Small Business Program" (até US$ 1M/ano,
  developer aceito no programa), senão 30%.
- A Apple **bloqueia o anti-steering** mais rigorosamente que o
  Google. Em 2024, com o ajuste judicial nos EUA + DMA na UE,
  ficou possível **mostrar um link externo de compra na web**, mas:
  - Precisa pedir entitlement ao Apple Developer Support;
  - Apple ainda cobra 27% (12% no Small Business) sobre vendas feitas
    pelo link externo originadas pelo app, durante 7 dias;
  - O link só pode aparecer fora do fluxo de IAP, com texto neutro.
- **Apps religiosos**: doação genuína (sem retorno de bem digital)
  pode usar método externo, **desde que** o app não destrave nada em
  troca da doação (ex.: pode mostrar "doe via Pix" como botão; não
  pode mostrar "doe R$ 19/mês e ganhe acesso a X").

### 2.3 Apple Pay e Google Pay (carteiras)

- **Apple Pay** e **Google Pay** são *métodos de pagamento de cartão*.
  Funcionam dentro do **navegador** (web checkout) e em
  **bens físicos/serviços de mundo real**. **Não substituem
  IAP/Play Billing** quando o produto é digital consumido no app.
- Implementar Apple Pay/Google Pay via Stripe dentro do app **não
  resolve a obrigação** das lojas. É uma alternativa de UX para
  cobranças de bens físicos, doações sem contrapartida ou serviços
  do mundo real.
- **Não implementar** sem antes confirmar que o produto cobrado é
  elegível.

---

## 3. Arquitetura recomendada

### 3.1 Web (browser desktop/mobile + PWA instalada)
- **Pode continuar com Stripe.** Web não está sob jurisdição das
  lojas. Mantém checkout atual (`/api/payments/checkout`).
- PWA instalada via "Adicionar à tela" no Android usa o motor do
  Chrome → também é navegador → continua liberada para Stripe.
- Apple Pay/Google Pay como botão extra do Stripe é OK na web.

### 3.2 Android publicado na Google Play
- **Obrigatório**: Google Play Billing para a assinatura premium.
- **Caminho recomendado:**
  1. Criar produto de assinatura na **Google Play Console**
     (intervalos mensal/semestral/anual replicando os preços
     da `billing_prices`). Cobrar **convertendo o preço atual**
     levando em conta a fee de 15%/30%.
  2. Adicionar plugin Capacitor:
     [`@capacitor-community/in-app-purchases`](https://github.com/capacitor-community/in-app-purchases)
     ou [`cordova-plugin-purchase`](https://github.com/j3k0/cordova-plugin-purchase)
     (mais maduro). Compra acontece no nativo, não no WebView.
  3. **Webhook server-side**: Play envia notificação RTDN
     (Real-Time Developer Notifications) → endpoint novo
     `/api/payments/webhooks/google-play/route.ts` valida a assinatura
     com a Google Play Developer API e grava em `entitlements`,
     reaproveitando `get_user_entitlement`.
  4. Vincular `purchase_token` ao `user_id` do Supabase no momento da
     compra (passar via `accountIdentifiers.obfuscatedAccountId`).
- **Fluxo dentro do app Android:**
  - `/planos`: detectar via user agent ou flag `Capacitor.isNativePlatform()`
    se está dentro do app empacotado. Se estiver, **substituir o CTA
    de Stripe pelo trigger do Play Billing**.
  - O componente Web Stripe continua existindo, mas **não é renderizado**
    nem chamado nesse contexto.

### 3.3 iOS publicado na App Store
- **Obrigatório**: StoreKit para a assinatura premium.
- **Caminho recomendado:**
  1. Criar produto na **App Store Connect** (subscription group
     "Veritas Dei Premium" com 3 níveis ou 1 produto com tiers).
  2. Plugin Capacitor: mesmo
     [`@capacitor-community/in-app-purchases`](https://github.com/capacitor-community/in-app-purchases)
     suporta StoreKit; alternativa: [RevenueCat](https://www.revenuecat.com/)
     unifica iOS+Android com SDK próprio (recomendado para reduzir
     complexidade — RevenueCat cobra ~1% do MRR pago).
  3. Webhook server-side do **App Store Server Notifications V2** →
     endpoint novo `/api/payments/webhooks/apple/route.ts` → grava em
     `entitlements`.
  4. Vincular `originalTransactionId` ao `user_id` Supabase via
     `appAccountToken` no momento da compra.
- **Mesmo princípio de UX:** dentro do app iOS, esconder Stripe e
  mostrar IAP nativo.

### 3.4 Camada server unificada (recomendação)

Hoje há `webhook-dispatcher.ts`. Estendê-lo para suportar três
provedores:

```
provider: 'stripe' | 'google_play' | 'apple_iap'
```

Tabela `entitlements` (já existe) ganha colunas:
- `provider` — qual loja
- `external_id` — purchase_token (Play) / original_transaction_id
  (Apple) / subscription_id (Stripe)
- `expires_at` — vinda do webhook do provedor

Função `get_user_entitlement` continua a mesma — quem chega primeiro
e está ativo, vence. Isso garante que **um usuário não pague em duas
lojas ao mesmo tempo** (ou pelo menos que veja só um entitlement
ativo).

---

## 4. Riscos de rejeição nas lojas

### Google Play
- **Risco alto se publicar com Stripe.** A revisão automatizada
  detecta o link de checkout externo (`checkout.stripe.com`) e
  reprova com motivo "Payments — UMA-2".
- **Risco médio:** Esquecer de declarar o app como "subscription" no
  Play Console quando habilita Play Billing → reprovação por
  metadata.
- **Risco baixo:** Doação avulsa via Pix/Stripe (sem desbloqueio de
  conteúdo) pode passar, **se claramente rotulada** como doação.

### Apple App Store
- **Risco altíssimo se publicar com Stripe.** Apple bloqueia
  imediatamente (regra 3.1.1). Pode até suspender conta de developer
  em casos repetidos.
- **Risco médio:** Mostrar dentro do app uma menção a "assine no site
  com desconto" → bloqueio anti-steering, mesmo que não tenha link.
  Fora do app (web, email) é livre.
- **Risco baixo:** App não funcionar offline para usuário não logado
  → reprovação por "design 4.0".

### Em todas as lojas
- **Conteúdo religioso é categoria sensível** (Apple "Religion/
  Reference", Google "Books & Reference"). Política de moderação,
  termos, e classificação etária precisam estar claros. Não é risco
  de billing, mas é risco de aprovação geral.

---

## 5. Telas e CTAs que precisam mudar no app mobile

### 5.1 `/planos` (entrada principal de checkout)
- **Hoje:** botão "Assinar" → POST `/api/payments/checkout` → redirect
  para `checkout.stripe.com`.
- **No app empacotado:** detectar `Capacitor.isNativePlatform()` e
  trocar o botão por um trigger de IAP nativo via plugin. Mostrar
  preço da loja (que já vem com fee embutida + conversão local)
  em vez do preço do Supabase.

### 5.2 `/perfil?tab=assinatura` (gerenciar assinatura)
- **Hoje:** "Gerenciar pagamento" abre `/api/payments/portal` (Stripe
  Customer Portal).
- **No app empacotado:**
  - Se entitlement veio do Play → botão "Gerenciar no Google Play"
    deep link `https://play.google.com/store/account/subscriptions`.
  - Se entitlement veio da Apple → botão "Gerenciar na App Store"
    deep link `itms-apps://apps.apple.com/account/subscriptions`.
  - Se entitlement veio de Stripe (assinou na web e abriu o app) →
    "Gerenciar no site" abre browser externo via `Browser.open()`.

### 5.3 Banners/CTAs em rotas gateadas
- Componente `RequirePremium`: hoje empurra para `/planos`. Continua
  funcionando, **mas o `/planos` no app precisa estar adaptado**
  (item 5.1).

### 5.4 Doações avulsas (se existirem ou forem criadas)
- **Devem ficar 100% fora do app empacotado nas lojas**, ou ser
  totalmente "sem retorno" (sem desbloquear nada, sem badge, sem
  tier). Forma segura: doação só via web; no app mostrar CTA "doar
  pela web" abrindo browser externo.

---

## 6. Decisões pendentes (precisa de decisão do usuário)

Antes de qualquer implementação:

1. **Aceita pagar 15–30% de fee** das lojas para o conteúdo
   premium? Se não, opções são:
   - Não publicar nas lojas (PWA only).
   - Publicar versão "free read" (só mostra conteúdo grátis e leva
     usuário pra web — modelo "Reader" do Google, mas Apple não tem
     equivalente claro para conteúdo educacional).
2. **Quer unificar via RevenueCat** (~1% MRR adicional, mas reduz
   ~70% do trabalho de webhook/validação)?
3. **Vai diferenciar preços por plataforma**? Padrão recomendado:
   web = preço base; mobile = preço base × 1.30 (repassando fee).
4. **Doações vão existir** no app, ou só assinatura?
5. **Versão Android primeiro**: aceita lançar o Android antes de
   ter IAP completo (publicando como "assinatura via web" e
   correndo o risco de reprovação na Play Store)? Ou esperar IAP
   integrado para a primeira submissão?

---

## 7. Próximos passos sugeridos (em ordem)

1. **Decisão executiva** dos pontos da Seção 6.
2. Criar produtos de assinatura na **Google Play Console**.
3. Criar produtos na **App Store Connect** (paralelo).
4. Decidir: RevenueCat vs `@capacitor-community/in-app-purchases`.
5. Implementar `provider` + `external_id` em `entitlements` (migration).
6. Implementar webhook `/api/payments/webhooks/google-play`.
7. Implementar webhook `/api/payments/webhooks/apple`.
8. Adaptar `/planos` e `/perfil?tab=assinatura` para detectar
   `Capacitor.isNativePlatform()`.
9. Publicar na Play (após aprovação interna do app shell + IAP).
10. Publicar na App Store (após Apple Developer Program ativo).

> Stripe **continua existindo na web** durante todas essas etapas.
> Não tem deprecação — só ganha co-existência com IAP nas duas
> lojas.
