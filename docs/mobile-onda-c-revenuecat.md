# Onda C — Integração RevenueCat (entregue)

> Esta sprint adiciona suporte a pagamento via RevenueCat para o app
> empacotado (Capacitor Android/iOS), **sem alterar o fluxo Stripe da
> web**.

Branch: `feature/mobile-capacitor-readiness`. Data: 2026-04-27.

Estratégia geral em [`docs/mobile-payments-strategy.md`](mobile-payments-strategy.md).
Setup do painel RevenueCat em [`docs/mobile-onda-b-c-setup.md`](mobile-onda-b-c-setup.md).

---

## 1. O que muda

| Plataforma | Antes | Depois |
|---|---|---|
| Web (browser/PWA) | Stripe Checkout | **Sem mudança** — Stripe continua |
| Android (shell Capacitor) | Stripe Checkout (rejeitaria na Play Store) | **Paywall RevenueCat → Play Billing** |
| iOS (shell Capacitor) | Stripe Checkout (rejeitaria na App Store) | **Paywall RevenueCat → StoreKit** |

A bifurcação acontece no client via `Capacitor.isNativePlatform()`.
Em SSR a UI sempre renderiza como web; o effect pós-mount troca pro
fluxo nativo se o WebView for Capacitor — evita mismatch de hidratação.

## 2. Arquivos novos

| Arquivo | Função |
|---|---|
| `src/lib/platform/is-native.ts` | Helper `isNativePlatform()` + `getPlatform()`. SSR-safe. |
| `src/lib/payments/providers/revenuecat.ts` | `verifyAndParse` do webhook + map de evento RC → `NormalizedEvent`. `createCheckout`/`createPortal` lançam (não se aplicam). |
| `src/app/api/payments/webhooks/revenuecat/route.ts` | POST handler do webhook. Mesmo padrão do Stripe (verify → dispatch → 200/500). |
| `src/components/payments/RevenueCatBootstrap.tsx` | Inicializa SDK uma vez quando native; sincroniza `Purchases.logIn/logOut` com o auth. Web é no-op. |

## 3. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/lib/payments/types.ts` | `ProviderId` ganha `'revenuecat'` (já feito na Onda C-prep). |
| `src/contexts/SubscriptionContext.tsx` | Aditivo: expõe `fonte` (`'stripe' \| 'revenuecat' \| 'admin_role' \| …`). |
| `src/app/planos/PlanosClient.tsx` | Em native, troca o `assinarWeb()` (POST checkout Stripe) por `assinarNative()` (`RevenueCatUI.presentPaywall()`). |
| `src/app/perfil/sections/AssinaturaSection.tsx` | Em native + entitlement `fonte='revenuecat'`, troca o portal Stripe pelo `RevenueCatUI.presentCustomerCenter()`. Esconde botão se `fonte='admin_role'` (nada pra gerenciar). |
| `src/app/layout.tsx` | Mount de `<RevenueCatBootstrap />` dentro do `<AuthProvider>`. |
| `.env.example` | 4 novas ENVs documentadas. |

## 4. ENVs necessárias na Vercel

```bash
NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY_ANDROID=test_…   # depois goog_…
NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY_IOS=test_…       # depois appl_…
REVENUECAT_SECRET_API_KEY=sk_…                     # server only
REVENUECAT_WEBHOOK_SECRET=<hex de 32 bytes>        # mesmo do painel RC
```

> ⚠️ Atenção ao prefixo `NEXT_PUBLIC_` nas duas chaves de SDK — elas
> precisam estar disponíveis no client (o SDK roda no WebView).
> A `SECRET_API_KEY` e o `WEBHOOK_SECRET` **NÃO** levam o prefixo —
> são server-only.

## 5. Fluxos

### 5.1 Web (browser/PWA) — inalterado
1. Usuário em `/planos` → clica "Assinar Mensal".
2. POST `/api/payments/checkout` → URL Stripe.
3. Redirect; Stripe webhook (`/api/payments/webhooks/stripe`) grava em
   `billing_subscriptions`.
4. `get_user_entitlement` retorna `premium`. Acabou.

### 5.2 Android/iOS empacotado
1. Usuário em `/planos` → `useEffect` detectou `isNative=true` → clica
   "Assinar".
2. `assinarNative()` chama `RevenueCatUI.presentPaywall()` (UI nativa).
3. Usuário escolhe package no Paywall; SDK dispara Play Billing
   (Android) ou StoreKit (iOS).
4. Compra confirmada → RevenueCat dispara webhook
   `POST /api/payments/webhooks/revenuecat`.
5. Webhook valida `Authorization: <REVENUECAT_WEBHOOK_SECRET>` em
   tempo constante (`safeEqual`).
6. `verifyAndParse` traduz event RC → `NormalizedEvent`.
7. `dispatchEvent` (compartilhado com Stripe) faz upsert em
   `billing_subscriptions` com `provider='revenuecat'`.
8. `refresh()` no client recarrega `get_user_entitlement` →
   `isPremium=true`.

### 5.3 Login sync
- Login no app: `RevenueCatBootstrap` chama `Purchases.logIn(user.id)`.
  Daí em diante, qualquer evento RC tem `app_user_id = user.id` (UUID
  Supabase) — webhook não precisa fazer lookup de mapping.
- Logout: `Purchases.logOut()` → SDK volta a anônimo.

## 6. Mapas de equivalência

### Eventos RevenueCat → tipos do dispatcher
| Event RevenueCat | NormalizedEvent.type | Status |
|---|---|---|
| `INITIAL_PURCHASE` | `subscription.upserted` | `active` (ou `trialing`) |
| `RENEWAL` | `subscription.upserted` | `active` |
| `PRODUCT_CHANGE` | `subscription.upserted` | `active` |
| `UNCANCELLATION` | `subscription.upserted` | `active` |
| `NON_RENEWING_PURCHASE` | `subscription.upserted` | `active` (lifetime) |
| `CANCELLATION` | `subscription.upserted` | `active` (com `cancel_at_period_end=true`) |
| `EXPIRATION` | `subscription.canceled` | `canceled` |
| `BILLING_ISSUE` | `subscription.upserted` | `past_due` |
| `SUBSCRIPTION_PAUSED` | `subscription.upserted` | `paused` |
| `TEST`, `SUBSCRIBER_ALIAS`, `TRANSFER`, `INVOICE_ISSUANCE`, `TEMPORARY_ENTITLEMENT_GRANT` | `ignore` | – |

### Product ID RevenueCat → `billing_prices.intervalo`
| Product ID | Intervalo |
|---|---|
| `premium_mensal` | `mensal` |
| `premium_semestral` | `semestral` |
| `premium_anual` | `anual` |
| `premium_vitalicio` | `unico` |

## 7. Como testar localmente

**Web:** nada muda. `npm run dev` → `/planos` continua disparando
Stripe. Ignore esta sprint pra fluxo web.

**Native (precisa Onda A — Android Studio rodando):** ver
[`docs/android-build.md`](android-build.md). Sequência mínima após
deploy desta branch na Vercel:

1. `npm run cap:add:android` (1ª vez).
2. Copiar `~/Documents/veritasdei-secrets/google-services.json` para
   `android/app/google-services.json`.
3. `npm run cap:sync:android`.
4. `npm run cap:open:android` → run no emulador.
5. Logar com email/senha no app.
6. Ir em `/planos`; deve ver botão "Assinar".
7. Clicar → Paywall do RevenueCat aparece (Test Store).
8. Comprar (sandbox — Test Store não cobra de verdade).
9. Voltar pra `/planos` ou `/perfil` — em alguns segundos deve aparecer
   premium ativo.
10. Painel RC ▸ Customers → ver evento `INITIAL_PURCHASE`.
11. Painel RC ▸ Integrations → ver delivery do webhook (200 OK).
12. Supabase ▸ Table editor ▸ `billing_subscriptions` → 1 row nova com
    `provider='revenuecat'`.

## 8. O que **não** está nesta sprint

- Geração do projeto Android (`cap add android`) — Onda A, manual.
- Push notifications nativas (FCM/APNs) — Onda B, depois.
- Conexão real com Play Console / App Store Connect — Ondas D/E.
- Migração de assinaturas Stripe existentes para RevenueCat — não é
  necessário; o usuário pode ter ambos enquanto testamos. O entitlement
  ativo mais recente vence (lógica em `get_user_entitlement`).

## 9. Riscos conhecidos

- **Webhook 404 enquanto não fizer deploy.** Configuramos o webhook no
  RevenueCat antes do código existir. RevenueCat retenta automaticamente
  por 72h, então as 1as compras de teste (antes do deploy) podem ficar
  pendentes. Resolva fazendo deploy da branch.
- **`RevenueCatBootstrap` depende de `useAuth`** → tem que estar
  dentro do `AuthProvider`. Se mover de lugar, app crasha em native
  com "useAuth must be used within an AuthProvider".
- **Test Store keys têm comportamento limitado** — algumas APIs do
  Customer Center podem não funcionar em sandbox. Validação completa
  só com `goog_…` real (Onda D).
