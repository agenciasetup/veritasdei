import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Veritas Dei — Capacitor (Android shell apontando para a Vercel).
 *
 * Estratégia "server URL": o WebView nativo carrega diretamente
 * https://www.veritasdei.com.br. Não há build estático aqui — o app
 * delega tudo (SSR, API routes, auth, push web etc.) para a Vercel.
 *
 * Consequências:
 *   - `webDir` aponta para `public` por exigência da CLI, mas nada é
 *     servido localmente; o WebView ignora esse diretório enquanto
 *     `server.url` estiver definido.
 *   - Não rodar `next export`, não tentar empacotar `.next/`.
 *   - Mudanças no código web só exigem deploy na Vercel; não precisa
 *     rebuildar o APK. `cap sync` só é necessário ao mexer em plugins
 *     ou nesta config.
 *   - `cleartext: false` proíbe HTTP em texto limpo dentro do app.
 *   - `androidScheme: 'https'` faz o WebView tratar o site como
 *     contexto seguro (necessário para crypto/PWA APIs).
 */
const config: CapacitorConfig = {
  appId: 'br.com.veritasdei.app',
  appName: 'Veritas Dei',
  webDir: 'public',
  server: {
    url: 'https://www.veritasdei.com.br',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    // Splash: NativeAppearanceBootstrap chama hide() depois de ~600ms;
    // o launchShowDuration aqui é só fallback caso o bootstrap falhe
    // (sem ele o splash ficaria pra sempre por padrão).
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#0A0A0A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Permissões de push (FCM): plugin do Firebase já lida com a
    // requisição; aqui só mantém a config explícita.
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
