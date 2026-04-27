# Setup das Ondas B e C — o que você precisa criar

> Para o Claude conseguir implementar push nativo (Onda B) e
> RevenueCat (Onda C), você precisa criar **3 contas externas** e me
> devolver alguns arquivos/chaves. Este guia é o passo a passo.
>
> **Tempo estimado:** 1–2 horas no total. Pode fazer em paralelo
> enquanto eu trabalho em outras coisas.

Última atualização: 2026-04-27.

---

## Visão geral

| Conta | Para que serve | Custo | Quando criar |
|---|---|---|---|
| **Firebase** | Push notification no Android (FCM) e depois iOS (APNs) | Gratuita | Onda B |
| **RevenueCat** | Receber e validar compras de Play Billing e StoreKit, escrever no Supabase via webhook | Gratuita até US$ 2.5k MTR; depois 1% do MRR | Onda C |
| **Google Play Console** | Publicar o APK/AAB e cadastrar produtos de assinatura | US$ 25 único | Onda D (publicação) |

App Store Connect e Apple Developer Program ficam para a Onda E (iOS).

---

## Tarefa 1 — Criar Firebase (push Android)

**Quando:** antes da Onda B.
**Tempo:** ~15 min.

1. Vá em <https://console.firebase.google.com/> e clique em
   **"Adicionar projeto"**.
2. Nome: `Veritas Dei` (qualquer nome serve, é só pra você).
3. Desabilite Google Analytics (não precisamos).
4. Aguarde o projeto criar.
5. Na tela do projeto, clique no ícone **Android** ("Adicionar app").
6. Preencha:
   - **Nome do pacote Android**: `br.com.veritasdei.app` (exato — é o
     `appId` do `capacitor.config.ts`).
   - **Apelido do app**: `Veritas Dei Android`.
   - **SHA-1 de assinatura**: deixe em branco por enquanto (só
     necessário para login Google nativo, não para push).
7. Clique em **Registrar app**.
8. **Baixe o arquivo `google-services.json`** que aparece.
9. **NÃO precisa** seguir os passos seguintes do tutorial Firebase
   (eles assumem app Android nativo Java/Kotlin; o nosso é
   Capacitor).

### O que me devolver
- O arquivo `google-services.json`.
  Cuidado: **não comite no Git**. Mande pelo canal seguro que a
  gente combinar (1Password compartilhado, Google Drive privado,
  ou cole o conteúdo direto numa mensagem). O `.gitignore` desta
  branch já bloqueia esse arquivo.

---

## Tarefa 2 — Criar RevenueCat

**Quando:** antes da Onda C.
**Tempo:** ~30 min (sem contar conexão com Play/Apple, que vem
depois).

1. Vá em <https://app.revenuecat.com/signup> e crie conta com seu
   email.
2. Crie um novo **Project** chamado `Veritas Dei`.
3. Dentro do projeto, crie 2 **Apps**:
   - **App 1 — Android**: bundle id `br.com.veritasdei.app`,
     plataforma "Google Play". Deixe sem "Service Account
     credentials" por enquanto — preenchemos quando criarmos
     a Play Console.
   - **App 2 — iOS**: bundle id `br.com.veritasdei.app` (mesmo),
     plataforma "App Store". Deixe sem "App-Specific Shared
     Secret" — fica para depois.
4. No menu lateral ▸ **Project Settings ▸ API Keys**, anote:
   - **Public SDK Key (Android)** — começa com `goog_…`
   - **Public SDK Key (iOS)** — começa com `appl_…`
   - **Secret API Key** — começa com `sk_…` (para o webhook)
5. No menu lateral ▸ **Project Settings ▸ Integrations** ▸
   **Webhook**:
   - URL: `https://www.veritasdei.com.br/api/payments/webhooks/revenuecat`
     (o endpoint **ainda não existe** — eu crio na Onda C; configure
     mesmo assim pra eles guardarem).
   - **Authorization Header**: gere um valor secreto longo
     (ex.: `openssl rand -hex 32` no terminal — me devolve o
     valor; vou usar pra autenticar o webhook).

### O que me devolver
- **Public SDK Key Android** (`goog_…`)
- **Public SDK Key iOS** (`appl_…`)
- **Secret API Key** (`sk_…`)
- **Webhook Authorization secret** que você gerou

> Eu vou colocar tudo isso em variáveis de ambiente da Vercel
> (`REVENUECAT_PUBLIC_KEY_ANDROID`, etc.) — nada vai pro código.

---

## Tarefa 3 — Diagnóstico de schema (1 min, urgente)

**Por que:** as tabelas `billing_subscriptions`, `billing_prices` e
`billing_webhook_events` **não estão versionadas em
`supabase/migrations/`** — provavelmente foram criadas direto no
Supabase Studio. Antes de eu mexer em qualquer webhook, preciso
confirmar:
1. Que constraints existem na coluna `provider`.
2. Como a função `get_user_entitlement(uid)` agrega os providers.

**Faça assim:** abra o Supabase Studio do projeto de produção, vá em
**SQL Editor** e rode:

```sql
-- 1. Constraints da coluna provider em billing_subscriptions
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class cls ON cls.oid = con.conrelid
WHERE cls.relname = 'billing_subscriptions';

-- 2. Schema das 3 tabelas billing
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('billing_subscriptions', 'billing_prices', 'billing_webhook_events')
ORDER BY table_name, ordinal_position;

-- 3. Definição da função get_user_entitlement
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'get_user_entitlement';
```

### O que me devolver
- Cole o resultado dos 3 SELECTs aqui no chat.

A partir daí eu sei se preciso (a) ampliar uma check constraint, (b)
alterar a função RPC, ou (c) só plugar o webhook sem mudar nada no
banco.

---

## Tarefa 4 — Validar Onda A (você consegue fazer agora)

**Quando:** já pode.
**Tempo:** ~1h na primeira vez (instalação Android Studio + Java).

Siga o passo a passo de [`docs/android-build.md`](android-build.md) e
me confirma:
- [ ] App abre no emulador mostrando a home da Veritas Dei.
- [ ] Login com email/senha funciona dentro do app.
- [ ] Navegação entre páginas funciona.
- [ ] (Esperado) Push não chega — porque ainda é Onda B.

Se algo der errado, copia o erro do Android Studio (aba **Run** ou
**Logcat**) e cola aqui.

---

## Tarefa 5 — Google Play Console (NÃO agora)

Só faça quando eu te avisar (Onda D, depois das ondas B e C estarem
prontas e testadas).

Quando chegar a hora:
1. Criar conta de developer em <https://play.google.com/console>
   (US$ 25, paga uma vez).
2. Criar o app na console.
3. Vincular ao RevenueCat (Service Account com permissão de
   leitura/escrita de assinaturas).
4. Cadastrar produtos de assinatura: `premium_mensal`,
   `premium_semestral`, `premium_anual` com preços = web × 1.30.

Eu te guio em detalhe quando chegarmos lá.

---

## Resumo do que me devolver

Por ordem de urgência:

1. **Resultado dos 3 SELECTs da Tarefa 3** — destrava o diagnóstico
   do banco.
2. **`google-services.json` da Tarefa 1** — destrava Onda B.
3. **4 chaves do RevenueCat da Tarefa 2** — destrava Onda C.
4. **Confirmação que o app shell abre na sua mão (Tarefa 4)** —
   destrava a publicação.

Sem urgência:
- Google Play Console (Tarefa 5) só quando eu pedir.

---

## O que eu posso fazer enquanto isso (sem te bloquear)

- ✅ Adicionar helper `Capacitor.isNativePlatform()` em
  `src/lib/platform/`.
- ✅ Esqueleto do provider RevenueCat em
  `src/lib/payments/providers/revenuecat.ts` (sem keys; só shape).
- ✅ Esqueleto do route handler do webhook (retornando 501 enquanto
  não tem keys).
- ⏳ **Não vou** fazer migration de `entitlements` ou tocar `provider`
  até receber o resultado da Tarefa 3.
- ⏳ **Não vou** instalar `@revenuecat/purchases-capacitor` enquanto
  você não confirmar o RevenueCat criado (evita pacote sem uso).

Me diz se quer que eu já comece esses esqueletos ou se prefere
esperar tudo estar planejado antes de qualquer código novo.
