# Mobile App Readiness — Veritas Dei

> Diagnóstico e preparação do projeto Next.js para empacotamento em
> Android/iOS via Capacitor, mantendo o deploy SSR na Vercel intacto.

Última atualização: 2026-04-27 — branch `feature/mobile-capacitor-readiness`.

---

## 1. Diagnóstico inicial

### Estado da PWA
- Manifest dinâmico: `src/app/manifest.ts` (rota `/manifest.webmanifest`).
- Service worker: `public/sw.js`, registrado por
  `src/components/layout/PwaRegister.tsx` **apenas em produção**.
- Ícones físicos em `public/icons/`: 192, 512, maskable-512, apple-touch
  (180×180), badge-72.
- Metadata `appleWebApp` configurada em `src/app/layout.tsx`
  (`statusBarStyle: black-translucent`, `themeColor: #0A0A0A`).

### Problemas encontrados (e corrigidos nesta branch)
1. **Pre-cache de rotas redirecionadas.** `next.config.ts` faz 301 de
   `/orar → /rezar` e `/aprender → /formacao`, mas o SW pré-cacheava as
   antigas. SW agora pré-cacheia as rotas finais.
2. **Páginas pessoais em `network-first`.** `/perfil` estava em
   `NETWORK_FIRST_PATTERNS` — em offline o SW devolveria a versão
   cacheada de outro usuário. Movido para `NO_CACHE_PATTERNS`.
3. **`NO_CACHE_PATTERNS` incompleto.** Adicionados: `/conta`, `/planos`,
   `/checkout`, `/carteirinha`, `/cadastro`, `/onboarding`.
4. **Cache version bumpada `v5 → v6`** para invalidar caches antigos no
   primeiro `activate` em produção.

### Pontos que continuam OK (não mexer sem motivo)
- `src/app/manifest.ts` (App Router gera o webmanifest).
- `src/middleware.ts` (matcher exclui `_next/static`, ícones e SW).
- Headers de segurança em `next.config.ts` (CSP em report-only).
- Supabase auth no callback `src/app/auth/callback/route.ts`.

---

## 2. O que foi alterado nesta sprint

| Arquivo | Mudança |
|---|---|
| `public/sw.js` | Pre-cache só de rotas finais; `NO_CACHE` expandido para todas as páginas autenticadas/transacionais; cache version `v5→v6`. |
| `docs/mobile-app-readiness.md` | Novo — este documento. |
| `docs/android-build.md` | Novo — passo a passo para gerar APK/AAB. |
| `package.json` | Scripts `cap:*` para Capacitor. |
| `capacitor.config.ts` | Configuração inicial apontando para `https://www.veritasdei.com.br`. |
| `.gitignore` | Ignora artefatos do Android Studio (build/, .gradle/, local.properties, etc). |

---

## 3. Como testar no Android (resumido)

Passo a passo completo em `docs/android-build.md`. Sequência mínima:

```bash
npm install
npm run build           # garante que o site da Vercel está saudável
npx cap add android     # uma única vez
npx cap sync android    # depois de mudar capacitor.config.ts ou plugins
npx cap open android    # abre Android Studio
```

No Android Studio:
1. **Run** ▸ selecionar emulador ou dispositivo USB.
2. App abrirá com o conteúdo da Vercel (`server.url`).
3. Para gerar APK/AAB: **Build ▸ Generate Signed Bundle / APK**.

> ⚠️ Toda mudança feita em `capacitor.config.ts` ou em plugins exige
> `npx cap sync android` antes de abrir o Android Studio. Mudanças
> apenas no código web da Vercel não exigem rebuild — o WebView puxa
> a URL nova automaticamente.

---

## 4. Riscos conhecidos

### Bloqueios reais (precisam de ação antes da publicação)
- **Push notifications** Web Push **não funciona em WebView** (Android
  nem iOS). Para push no app empacotado é preciso migrar para
  `@capacitor/push-notifications` + Firebase Cloud Messaging (Android)
  e APNs (iOS). PWA continua usando o Web Push atual.
- **OAuth Google** dentro de WebView é bloqueado pelo Google desde
  2021 (`disallowed_useragent`). Precisa de Chrome Custom Tabs via
  `@capacitor/browser` ou `@capacitor/google-auth`. Login com email +
  senha e magic link continuam funcionando.
- **NEXT_PUBLIC_APP_URL deve estar setada na Vercel** como
  `https://www.veritasdei.com.br`. O callback de auth (`src/app/auth/callback/route.ts`)
  e o checkout do Stripe usam esse valor para montar o `successUrl`.
  Se vier vazia, o redirect cai em `localhost:3000` e quebra dentro
  do app.

### Bloqueios potenciais (avaliar caso a caso)
- **Stripe Checkout** dentro do WebView funciona, mas pode ser
  reprovado por Apple (regra de in-app purchases). No Android é
  tolerado para serviços assinados em browser. Recomendação: abrir
  checkout em browser externo via `Browser.open()` antes de submeter
  para a App Store.
- **CSP em report-only** hoje. Quando virar enforced, adicionar à
  `connect-src` qualquer domínio que o Capacitor use (ex.: APIs do
  FCM se push for adicionado), e considerar `capacitor://localhost`
  caso eventualmente decida empacotar HTML local.
- **Headers `X-Frame-Options: SAMEORIGIN` e `frame-ancestors 'self'`**
  não quebram Capacitor porque o WebView não usa iframe; navega
  direto via `server.url`.

### Pequenos cuidados
- Cache do SW pode reter versão antiga do app por 1 ciclo de visita.
  O bump de `CACHE_VERSION` força limpeza no próximo `activate`.
- Service worker **não roda em modo dev**. Toda validação de cache
  precisa ser feita em build de produção (Vercel preview ou
  `npm run build && npm run start`).

---

## 5. Próximos passos para Capacitor

### Fase 2 — Android shell (esta branch)
- [x] Documentação de readiness.
- [ ] Instalar dependências `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`.
- [ ] Criar `capacitor.config.ts`.
- [ ] Adicionar scripts `cap:*` no `package.json`.
- [ ] Atualizar `.gitignore` para artefatos do Android.
- [ ] `docs/android-build.md` com passo a passo para leigo.

### Fase 3 — Push e auth nativos (próxima sprint)
- [ ] Instalar `@capacitor/push-notifications` + setup FCM.
- [ ] Adaptar `src/app/api/push/*` para aceitar tokens FCM além de
      endpoints Web Push.
- [ ] Trocar OAuth Google por `@capacitor/google-auth` ou Custom Tabs.
- [ ] Migrar Stripe Checkout para `Browser.open()` (Custom Tabs).

### Fase 4 — iOS
- [ ] `npx cap add ios` (precisa de macOS + Xcode).
- [ ] Configurar APNs (precisa Apple Developer Program — US$ 99/ano).
- [ ] Splash + ícones nativos via `@capacitor/assets`.
- [ ] Conformidade com regras da App Store sobre in-app purchase
      (Stripe Checkout pode precisar virar IAP nativo).

### Fase 5 — Polimento
- [ ] CSP enforced (sair do report-only).
- [ ] Splash screen nativa (`@capacitor/splash-screen`).
- [ ] Status bar nativa (`@capacitor/status-bar`).
- [ ] Deep links (Universal Links iOS / App Links Android) para
      magic link e checkout.
- [ ] Verificar loja: GooglePlay (Android) e App Store (iOS).
