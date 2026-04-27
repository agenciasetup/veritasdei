# Como gerar o app Android — Veritas Dei

> Tutorial passo a passo para quem nunca abriu o Android Studio.
> Ao final você terá um APK rodando no celular ou um AAB pronto para
> publicar na Google Play.

---

## 0. O que este app faz

O app Android é um "shell" — uma casca nativa que abre dentro de um
WebView e carrega o site de produção da Vercel
(`https://www.veritasdei.com.br`). **Você não precisa rebuildar o app
toda vez que mexer no código web.** Basta dar deploy na Vercel; o
celular puxa a versão nova sozinho na próxima abertura.

Você só precisa rebuildar o APK/AAB quando:
- mudar o `capacitor.config.ts`;
- adicionar/atualizar plugins do Capacitor (push, browser, etc.);
- trocar ícone/splash nativos;
- subir uma nova versão para a Play Store.

---

## 1. Instalar as ferramentas (uma vez só)

### 1.1 Node.js
Já está instalado se você está rodando o projeto. Confira:

```bash
node -v   # deve mostrar v20+ ou v22+
npm -v
```

Se não tiver, baixe em <https://nodejs.org/> (versão LTS).

### 1.2 Java (JDK 21)
Android Studio recente exige **JDK 21**. No Mac:

```bash
brew install --cask temurin@21
```

No Windows: baixe em <https://adoptium.net/> (Temurin 21 LTS,
instalador `.msi`).

### 1.3 Android Studio
Baixe em <https://developer.android.com/studio>.

Durante a instalação, deixe marcado:
- Android SDK
- Android SDK Platform-Tools
- Android Virtual Device (emulador)

Ao abrir pela primeira vez, vá em **More Actions ▸ SDK Manager** e
instale:
- **Android 14 (API 34)** ou superior — em "SDK Platforms";
- **Android SDK Build-Tools** — em "SDK Tools" (já vem marcado).

---

## 2. Preparar o projeto (uma vez só)

Abra o terminal **na raiz do repositório Veritas Dei** e rode:

```bash
npm install                # instala todas as deps, inclusive Capacitor
npm run cap:add:android    # cria a pasta /android com o projeto nativo
npm run cap:sync:android   # copia capacitor.config.ts pra dentro do Android
```

Pronto. A pasta `/android` é o projeto Android Studio.

> ⚠️ Se `cap add android` reclamar dizendo que `/android` já existe,
> apague a pasta e rode de novo — ela será recriada do jeito certo.

---

## 3. Editar o app no Android Studio

```bash
npm run cap:open:android
```

Isso abre o Android Studio com o projeto carregado. Na primeira
abertura ele vai **baixar dependências do Gradle** — pode demorar
5–15 minutos. Tome um café.

Quando terminar, você verá no canto inferior direito a mensagem
"Gradle sync finished". Se aparecer erro, geralmente é JDK errado
(volte ao item 1.2).

---

## 4. Rodar em um emulador

1. No Android Studio, clique no ícone **Device Manager** (lateral
   direita, ícone de celular).
2. Clique em **Create Device**.
3. Escolha **Pixel 6** (ou qualquer dispositivo recente) ▸ **Next**.
4. Em "Recommended", escolha **API 34 — Android 14** ▸ **Next** ▸
   **Finish**. (Pode demorar pra baixar a imagem.)
5. De volta à tela principal, clique no botão **▶ Run** (verde, no
   topo). O emulador abre e o app instala em ~30s.

Se tudo deu certo, você vai ver a home da Veritas Dei dentro de uma
janela de celular emulado.

---

## 5. Rodar no seu celular físico

1. No celular Android: **Configurações ▸ Sobre o telefone**, toque
   7 vezes em **"Número da versão"** até aparecer "Você é
   desenvolvedor".
2. Volte: **Configurações ▸ Sistema ▸ Opções do desenvolvedor**.
   Ative **Depuração USB**.
3. Conecte o cabo USB no Mac/PC. O celular vai pedir autorização —
   aceite.
4. No Android Studio, no seletor de dispositivo (topo, ao lado do
   ▶ Run), seu celular aparece pelo nome.
5. Clique ▶ Run. Em ~20s o app abre no celular.

---

## 6. Gerar APK para distribuir manualmente

> Use APK quando for instalar em poucos celulares de teste sem passar
> pela Play Store.

No Android Studio:
1. **Build ▸ Build App Bundle(s) / APK(s) ▸ Build APK(s)**.
2. Espere terminar (~1–3 min).
3. Aparece notificação no canto inferior direito com o link
   "**locate**" — clique. Seu APK está em
   `/android/app/build/outputs/apk/debug/app-debug.apk`.
4. Mande o arquivo para o celular e abra. O Android vai pedir
   permissão para instalar de "fontes desconhecidas".

**APK debug não pode ir pra Play Store.** Para isso use o item 7.

---

## 7. Gerar AAB assinado para a Google Play

> AAB (Android App Bundle) é o formato exigido pela Play Store.

### 7.1 Criar uma keystore (uma vez só)

Esta é a chave que prova que **só você** pode publicar atualizações
do app. **Guarde em local seguro e nunca comite no Git.**

No terminal:

```bash
keytool -genkey -v \
  -keystore veritasdei-release.keystore \
  -alias veritasdei \
  -keyalg RSA -keysize 2048 -validity 10000
```

Ele pede:
- senha da keystore (anote)
- nome, organização, cidade…
- senha do alias (pode ser igual à da keystore)

Você acaba com um arquivo `veritasdei-release.keystore`. **Salve em
um lugar fora do projeto** (ex.: 1Password, Google Drive privado).

### 7.2 Gerar o AAB

No Android Studio:
1. **Build ▸ Generate Signed App Bundle / APK** ▸ escolha
   **Android App Bundle** ▸ Next.
2. Selecione a keystore criada acima e digite as senhas.
3. Em "Build Variants", escolha **release** ▸ Finish.
4. Em ~3 min aparece o AAB em
   `/android/app/release/app-release.aab`.

Esse arquivo `.aab` é o que você sobe na Google Play Console.

---

## 8. Variáveis de ambiente

O app shell **não usa nenhuma variável de ambiente diretamente**. Ele
só carrega a URL da Vercel. As variáveis que importam são as da
**Vercel em produção**:

- `NEXT_PUBLIC_APP_URL` — **deve ser** `https://www.veritasdei.com.br`.
  Se vier vazia, o callback do Supabase Auth tenta redirecionar pra
  `localhost:3000` e o login quebra dentro do app.
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
  precisam estar setadas; o middleware verifica.
- Stripe, R2, OpenAI etc. — todas continuam só na Vercel.

Confira em **Vercel ▸ Project ▸ Settings ▸ Environment Variables**
antes de testar o APK.

---

## 9. Atualizar o app sem rebuildar

Como o WebView aponta direto pra Vercel:

- **Mudou texto, layout, página, API?** → `git push` na main, Vercel
  faz deploy, próxima abertura do app já mostra a versão nova. Nada
  a fazer no Android Studio.
- **Mudou `capacitor.config.ts`?** → `npm run cap:sync:android` e
  rebuilde o APK/AAB.
- **Adicionou plugin Capacitor (ex.: push)?** → mesma coisa: instalar
  o pacote npm, `cap sync android`, rebuildar.

---

## 10. Erros comuns

| Erro | Causa provável | O que fazer |
|---|---|---|
| `cap add android` falha com "command not found" | Não rodou `npm install` antes | Rode `npm install` na raiz |
| Gradle sync errors no Android Studio | JDK errado | Instale Temurin 21 (item 1.2) e em **Settings ▸ Build Tools ▸ Gradle** aponte pra ele |
| App abre branco / "no internet" | Celular sem internet ou URL errada em `capacitor.config.ts` | Confira que `server.url` aponta pra `https://www.veritasdei.com.br` |
| App abre mas login não funciona | `NEXT_PUBLIC_APP_URL` faltando na Vercel | Setar variável (item 8) e fazer redeploy |
| "Cleartext HTTP traffic not permitted" | Algum recurso do site servido em HTTP puro | Forçar HTTPS no recurso. Não baixar `cleartext: true` no config |
| Push notification não chega no app | Web Push não funciona em WebView | Esperado — Fase 3 vai migrar para Firebase Cloud Messaging |

---

## 11. Próximas etapas (não fazer agora)

Quando o Android shell estiver no ar e validado:
1. Adicionar `@capacitor/push-notifications` + Firebase para push real.
2. Adicionar `@capacitor/browser` e abrir Stripe Checkout em Custom Tabs.
3. Repetir tudo isso para iOS (`npx cap add ios` — precisa Mac + Xcode + conta Apple Developer US$99/ano).

Detalhes em [`docs/mobile-app-readiness.md`](mobile-app-readiness.md).
