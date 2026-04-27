# Polish do app empacotado (P1–P6)

> Sprint de polimento depois das Ondas A/B/C. Foco em deixar o app
> Capacitor "parecer nativo" (splash, status bar), corrigir gaps
> funcionais (Google login, push em foreground, deep link, sync de
> assinatura).

Branch: `feature/mobile-polish`. Data: 2026-04-27.

---

## Itens entregues

| # | Item | Onde |
|---|---|---|
| **P1** | Google Sign-In nativo (sem WebView blocker) | `src/contexts/AuthContext.tsx` |
| **P2** | Notificação push em foreground (toast in-app) | `src/contexts/NotificationToastContext.tsx`, `src/components/notifications/NotificationToast.tsx`, `PushBootstrap.tsx` |
| **P3** | Deep link no tap da notificação (background → rota destino) | `PushBootstrap.tsx` (`notificationActionPerformed` listener) |
| **P4** | Splash screen nativa controlada | `capacitor.config.ts` + `NativeAppearanceBootstrap.tsx` |
| **P5** | Status bar nativa estilizada | `NativeAppearanceBootstrap.tsx` |
| **P6** | Sync automático de assinatura após compra | `RevenueCatBootstrap.tsx` (`customerInfoUpdated` listener) + `SubscriptionContext` (event listener) |

## Pacotes instalados

- `@capacitor/browser` — reservado pra Custom Tabs futuras (não usado nesta sprint).
- `@capacitor/splash-screen`
- `@capacitor/status-bar`
- `@capacitor-firebase/authentication`

---

## P1 — Google Sign-In nativo

### Problema
`signInWithOAuth({ provider: 'google' })` faz redirect que o Google
bloqueia em WebViews desde 2021 ("disallowed_useragent"). Login social
não funcionava no app empacotado.

### Solução
- No `signInWithOAuth` do `AuthContext`: detecta `isNativePlatform()` e
  troca o redirect Supabase pelo SDK nativo do Firebase Authentication.
- Fluxo: `FirebaseAuthentication.signInWithGoogle()` abre tela nativa
  do Google → retorna ID token → passa pra
  `supabase.auth.signInWithIdToken({ provider: 'google', token })`.
- Funciona sem deep links nem Custom Tabs.

### Setup necessário no Firebase (você precisa fazer)
1. Console Firebase ▸ projeto Veritas Dei ▸ **Project Settings**.
2. Aba **General** ▸ **Your apps** ▸ app Android.
3. **Add fingerprint** → `SHA-1`.
4. **Como pegar a SHA-1 do debug keystore (Mac):**
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
   ```
   Copia o valor depois de `SHA1:` (formato `XX:XX:XX:...`).
5. Cola no Firebase ▸ **Save**.
6. **Re-baixa o `google-services.json`** atualizado e recopia pro projeto:
   ```bash
   cp ~/Documents/veritasdei-secrets/google-services.json android/app/google-services.json
   npm run cap:sync:android
   ```
7. **Web client ID** — no console.developers.google.com, OAuth 2.0
   Client IDs do projeto Firebase deve ter um "Web client (auto created
   by Google Service)". Copie o Client ID.
8. Supabase Dashboard ▸ **Authentication ▸ Providers ▸ Google** ▸
   marca **Skip nonce check** (Firebase usa nonce próprio que não bate
   com Supabase) **OU** o `signInWithIdToken` vai falhar com erro de
   nonce inválido. Alternativa: passar o nonce que o Firebase devolve
   (já fazemos no código).

### Setup no Google Cloud (já vem do Firebase, mas confirma)
- OAuth consent screen configurado.
- Authorized domains inclui `veritasdei.com.br`.

### Para release (Play Store, Onda D)
- Adicionar **SHA-1 da release keystore** também (não só debug).
- Sem isso, quando o app for instalado da Play Store, Google login dá
  `12500: SIGN_IN_FAILED`.

---

## P2 — Foreground push (toast)

### Problema
FCM em Android não mostra notificação na barra do sistema quando o app
está em primeiro plano. Usuário com app aberto não sabia que chegou push.

### Solução
- `NotificationToastContext`: provider que mantém 1 toast ativo.
- `NotificationToast`: componente que renderiza um banner no topo,
  auto-dismiss em 5s, tap navega pra `data.url`.
- `PushBootstrap`: listener `notificationReceived` (foreground) chama
  `showToast()`.

### Comportamento
- App fechado/background → notificação aparece na barra do sistema (FCM padrão).
- App aberto → toast in-app no topo (~5s).

---

## P3 — Deep link no tap

### Problema
Tocar numa notificação de push não levava o usuário pra rota
correspondente — sempre abria a home.

### Solução
`PushBootstrap` ouve o evento `notificationActionPerformed` (FCM) e
extrai `notification.data.url`, navegando via `useRouter().push(url)`.
O `data.url` já é enviado pelo nosso backend (`src/lib/push/fcm.ts`).

---

## P4 — Splash screen controlada

### Antes
Splash padrão do Android sumia em ~3s, mas o WebView demorava +1-2s
pra hidratar — usuário via splash → tela branca → conteúdo (flash).

### Depois
- `capacitor.config.ts` plugin SplashScreen com fallback de 3s.
- `NativeAppearanceBootstrap` chama `SplashScreen.hide({ fadeOutDuration: 200 })`
  após 600ms (suficiente pra fontes carregarem). Sem flash branco.

### Customizar a imagem do splash
Por padrão, Capacitor usa `android/app/src/main/res/drawable/splash.png`.
Pra trocar:
```bash
npm install @capacitor/assets --save-dev
# colocar uma image 2732x2732 PNG centralizada em resources/splash.png
npx capacitor-assets generate --android
```

---

## P5 — Status bar nativa

`NativeAppearanceBootstrap` chama na inicialização:
- `StatusBar.setStyle({ style: Style.Dark })` — texto/ícones brancos.
- `StatusBar.setBackgroundColor({ color: '#0A0A0A' })` — combina com
  o tema dark do app.

Combina com a meta `themeColor: #0A0A0A` que já existia no `layout.tsx`.

---

## P6 — Sync automático após compra

### Problema
Após o usuário comprar via Paywall RC, o webhook bate no nosso backend e
grava em `billing_subscriptions`, mas o cliente não sabia que mudou —
precisava fechar/abrir o app pra `get_user_entitlement` retornar premium.

### Solução
- `RevenueCatBootstrap` registra `addCustomerInfoUpdateListener` (RC
  notifica localmente quando customer info muda).
- Listener emite `CustomEvent('veritasdei:subscription-refresh')` no
  window.
- `SubscriptionContext` ouve esse evento e chama `refresh()` (que puxa
  `get_user_entitlement` de novo).
- Resultado: badge "Premium" aparece em ~2s sem fechar o app.

---

## Validação

### Build
✓ `npm run build` passou (237 páginas, tsc OK).

### Web
Sem regressões: PushBootstrap, NativeAppearanceBootstrap e a parte
nativa de signInWithOAuth são gates por `isNativePlatform()` — nada
roda em browser. NotificationToastProvider está mounted mas sem
emissor → toast nunca aparece. RevenueCatBootstrap idem.

### Native (precisa testar)
- App boot mais rápido (splash some logo).
- Status bar combinando com tema.
- Push em foreground → toast aparece.
- Tap em push (background) → abre rota certa.
- Compra via Paywall → premium aparece sem fechar app.
- Login Google → tela nativa do Google → retorna logado (depende de
  SHA-1 estar no Firebase).

---

## Pendências do usuário

1. **Pegar SHA-1 do debug keystore** e adicionar no Firebase (P1).
2. **Re-baixar `google-services.json`** depois de adicionar SHA-1.
3. **Marcar "Skip nonce check"** em Supabase ▸ Auth ▸ Google (ou
   confirmar que o nonce do Firebase é aceito).
4. **Re-build do app** (`cap sync android` + Run no Android Studio).

---

## Riscos conhecidos

- **Apple/Facebook OAuth nativo:** não foi feito nesta sprint. Só
  Google. Apple precisa de `signInWithApple` análogo (Firebase
  suporta), Facebook idem.
- **Nonce check Supabase:** se a Supabase rejeitar o nonce, login
  falha. Workaround documentado no setup acima.
- **SHA-1 release:** precisa ser adicionado antes de publicar na Play.
- **Splash custom:** atualmente usa o padrão do Capacitor. Splash
  bonita exige design + `@capacitor/assets`.
