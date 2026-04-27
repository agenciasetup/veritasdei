# Mobile Crashlytics — Veritas Dei

> Captura de crashes nativos (Java/Kotlin) e exceções JS do WebView no
> app Android empacotado via Capacitor. Web (PWA/browser) é no-op.

Branch: `feature/mobile-onda-d-publish`. Data: 2026-04-27.

---

## 1. O que entrega

- **Crashes nativos Android** (Java/Kotlin, NDK) capturados
  automaticamente pelo SDK Firebase Crashlytics, sem código adicional.
- **Erros JS do WebView** que escalam até o boundary do Next
  (`src/app/error.tsx`) reportados via `recordException`.
- **Identidade do usuário** atrelada ao crash: assim que o usuário loga
  no Supabase, o `CrashlyticsBootstrap` chama `setUserId(user.id)`. No
  console Firebase você vê o crash filtrável por user.
- **Web (PWA/browser): nada.** Todos os caminhos passam por
  `isNativePlatform()` e fazem early-return. Nenhum SDK nativo é
  carregado em ambiente web.

## 2. Arquivos novos

| Arquivo | Função |
|---|---|
| `src/components/observability/CrashlyticsBootstrap.tsx` | Monta no `layout.tsx`. `setUserId` no login/logout. Exporta `recordWebError(err)` pro error boundary. |
| `scripts/patch-android-gradle.mjs` | Idempotente: injeta `classpath` do plugin Crashlytics no root `build.gradle` e `apply plugin` no app `build.gradle`. Padrão do `patch-android-manifest.mjs`. |
| `docs/mobile-crashlytics.md` | Este documento. |

## 3. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `package.json` | `+@capacitor-firebase/crashlytics@^8.2.0`. Scripts `cap:sync*` agora encadeiam `patch-android-gradle`. Novo `android:patch-gradle`. Versão bumpada `0.1.0 → 1.0.0`. |
| `android/app/build.gradle` | `versionName "1.0" → "1.0.0"`. `apply plugin: 'com.google.firebase.crashlytics'` (via patch). |
| `android/build.gradle` | `+ classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.2'` (via patch). |
| `src/app/layout.tsx` | Mount de `<CrashlyticsBootstrap />` ao lado dos outros bootstraps native. |
| `src/app/error.tsx` | Chama `recordWebError(error)` no `useEffect`. No-op em web. |

## 4. Ativação no console Firebase (não precisa fazer nada)

**Não existe botão "ativar" no console.** A primeira vez que você
abre `Release & Monitor ▸ Crashlytics` o Firebase mostra um wizard
de setup do SDK — exatamente o que essa sprint entrega no código.

A ativação real **acontece sozinha** quando o primeiro evento do SDK
chega do app. Sequência:
1. App empacotado com esse código (SDK + plugin Gradle + `google-services.json`)
   instalado no celular.
2. App provoca um crash (real ou teste — ver §6).
3. App reabre, envia o relatório.
4. Em 5-10 min o dashboard do Crashlytics no console "materializa"
   com o evento listado e fica ativo dali pra frente.

Se você abriu o link e ele te mandou pra docs do Google
(`firebase.google.com/docs/crashlytics/android/get-started`), é o
mesmo wizard reformatado. Ignora — segue pro §6.

## 5. Como funciona

### 5.1 Crashes nativos
O plugin `@capacitor-firebase/crashlytics` instala um `UncaughtExceptionHandler`
no Java do Android. Qualquer crash do processo nativo (NPE, NDK, plugin
travando) é capturado, salvo em disco, e enviado no próximo boot.

### 5.2 Erros JS
Next.js renderiza `src/app/error.tsx` quando algum componente client
joga. O `useEffect` chama `recordWebError(error)` que:
1. Verifica `isNativePlatform()` — em web, retorna sem fazer nada.
2. Em native, faz dynamic import do plugin e chama
   `recordException({ message })` + `log({ message: stack })`.

Não captura erros silenciosos (rejeição de promise não-tratada, erro
em callback assíncrono fora de React). Pra esses, adicione `setEnabled`
no `CrashlyticsBootstrap` e instale `window.addEventListener('error', ...)`
no futuro — não é necessário pro release inicial.

### 5.3 Identidade
`CrashlyticsBootstrap` ouve `useAuth()`. Quando user loga, chama
`setUserId(user.id)`. Logout chama com string vazia (limpa). O
`user.id` é o UUID Supabase — bate com o `app_user_id` do RevenueCat,
facilita correlacionar crash com assinatura.

## 6. Como testar (precisa Android Studio)

### 6.1 Setup
```bash
# 1. Sync e patch dos gradles (idempotente)
npm run cap:sync:android

# 2. Garante google-services.json no lugar
cp ~/Documents/veritasdei-secrets/google-services.json android/app/

# 3. Abre Android Studio
npm run cap:open:android
```

### 6.2 Provocar crash nativo (release-like)
Adicione **temporariamente** no `MainActivity.java` do Android:
```java
new Handler().postDelayed(() -> {
  throw new RuntimeException("teste crashlytics native");
}, 5000);
```
Build, instala, abre o app, espera 5s. App fecha. Reabre o app —
relatório é enviado. Em ~1-5 min aparece no console Firebase ▸
Crashlytics.

> **Lembre de remover o crash forçado antes de gerar AAB de release.**

### 6.3 Provocar crash JS
No console DevTools do WebView:
```js
throw new Error('teste recordWebError')
```
Aparece no console Firebase como **non-fatal exception** depois de
~1-5 min. (Crashes JS são "non-fatal" pra Crashlytics — não derrubam
o app, só são logados.)

### 6.4 Verificar identidade
Logue no app antes de provocar o crash. No console Firebase ▸
Crashlytics ▸ clique no crash ▸ aba **Keys** → deve mostrar `user.id`.

## 7. O que **não** está nesta entrega

- **iOS:** plugin suporta, mas o setup do Xcode (Run Script Phase pra
  upload de dSYMs) não está documentado aqui. Fazer quando rolar Onda
  E (App Store).
- **Captura de unhandledrejection JS:** não instalado. Erros que não
  passam pelo error boundary do Next ficam invisíveis ao Crashlytics.
- **Custom keys** (página atual, plano premium, etc): API existe
  (`setCustomKey`), mas não usada. Adicionar caso precise filtrar
  crashes por contexto.
- **Sourcemaps JS:** stack trace JS no Crashlytics é minificado.
  Upload de sourcemap pro Firebase não está configurado. Stack do
  Next em prod tem nomes ofuscados — só serve pra "tem crash X aqui",
  não "linha N do arquivo Y".

## 8. Riscos

- **Plugin Gradle 3.0.2 vs Capacitor template.** Versão pinada no
  `patch-android-gradle.mjs`. Se Capacitor bumpar AGP além de 8.13,
  conferir compatibilidade no [release notes do
  firebase-crashlytics-gradle](https://firebase.google.com/support/release-notes/android).
- **Patch quebra se Capacitor mudar template.** O script procura
  ancoras (`classpath 'com.google.gms:google-services:...'` no root,
  `apply plugin: 'com.android.application'` no app). Se Capacitor 9
  reorganizar esses arquivos, o patch loga warn e pula — não quebra
  build, mas Crashlytics fica sem capturar nativo. Conferir e
  atualizar.
- **`/android` não é versionado.** O patch precisa rodar toda vez que
  o usuário fizer `cap add android` numa máquina nova. Já está no
  `cap:sync:android` — só não esquecer de rodar via npm script (não
  rodar `cap sync` direto sem o patch).
