# Onda B — Push notifications via FCM (entregue)

> Esta sprint adiciona suporte a push notifications no app empacotado
> (Capacitor Android/iOS) usando Firebase Cloud Messaging, **sem alterar
> o fluxo Web Push (VAPID) existente**.

Branch: `feature/mobile-push-fcm`. Data: 2026-04-27.

---

## 1. O que muda

| Onde | Antes | Depois |
|---|---|---|
| Browser/PWA | Web Push (VAPID) | **Sem mudança** — Web Push continua |
| App Android (Capacitor) | "Notificação não suportada" | **Push nativo via FCM** |
| App iOS (Capacitor) | "Notificação não suportada" | **Push nativo via APNs (proxied por FCM)** |

`lib/push/send.ts` agora dispara em **dois canais** quando o usuário tem ambos
registrados (PWA no desktop + app no celular). Mesma notificação, dois envios.

## 2. Arquivos novos

| Arquivo | Função |
|---|---|
| `src/lib/push/fcm.ts` | Init lazy do firebase-admin + `sendFcmToTokens()` (batch via `messaging.sendEach`, detecta tokens inválidos pra limpar). |
| `src/components/notifications/PushBootstrap.tsx` | Em native: pede permissão, pega token, registra no servidor, ouve rotação. Em web: no-op. |
| `src/app/api/push/register-token/route.ts` | POST/DELETE pra registrar/remover token FCM em `user_notificacoes_prefs`. |

## 3. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/lib/push/send.ts` | Query agora pega `fcm_token` também; envio dispara Web Push e FCM em paralelo; só desliga `push_enabled` quando ambos canais expiram. |
| `src/app/layout.tsx` | Mount de `<PushBootstrap />` dentro do `<AuthProvider>`. |
| `.env.example` | `FIREBASE_SERVICE_ACCOUNT` documentada. |

## 4. Migration (já aplicada em prod via Management API)

`supabase/migrations/20260427120000_user_notificacoes_prefs_add_fcm.sql`:
- `fcm_token` (text, nullable)
- `fcm_platform` (text, check 'android' | 'ios')
- `fcm_registered_at` (timestamptz)

Aditivo. Web Push (`push_endpoint`, `push_p256dh`, `push_auth`) intacto.

## 5. ENV necessária na Vercel

```
FIREBASE_SERVICE_ACCOUNT=<JSON inteira da service account, em uma linha>
```

Como gerar:
1. Console Firebase ▸ **Project Settings** (engrenagem) ▸ aba **Service Accounts**.
2. **Generate new private key** ▸ Generate Key ▸ baixa um JSON.
3. Abre o JSON num editor, copia **todo o conteúdo** (chaves `{}` inclusive).
4. Vercel ▸ Settings ▸ Environment Variables ▸ **+ Add**.
5. Name: `FIREBASE_SERVICE_ACCOUNT`. Value: cola o JSON inteiro.
6. Marca **Production + Preview + Development**. Save.
7. **Redeploy** pra ENV entrar em vigor.

> ⚠️ Esse JSON é equivalente a uma senha mestra do Firebase. **Não commit**.
> Em código a gente lê via `process.env.FIREBASE_SERVICE_ACCOUNT` e
> parse com try/catch — se faltar, FCM vira no-op (Web Push continua).

## 6. Setup do app Android (depois do deploy)

1. **Copiar o google-services.json** novo pro projeto:
   ```bash
   cp ~/Documents/veritasdei-secrets/google-services.json android/app/google-services.json
   ```
2. **Sync Capacitor:**
   ```bash
   npm run cap:sync:android
   ```
3. No Android Studio: **Build ▸ Clean Project**, depois **▶ Run** no POCO.
4. App abre, faz login, sistema pede permissão de notificação → **Allow**.
5. Token registrado automaticamente.

## 7. Como testar

### 7.1 Disparo de teste

Endpoint que já existe: `POST /api/push/test` (logado). Envia uma notif para o
próprio usuário em todos canais ativos. Em produção, o cron de novenas e
liturgia também passa pelo `sendPushToUsers()` agora.

### 7.2 Verificação no Supabase

```sql
SELECT user_id, push_enabled,
  (push_endpoint IS NOT NULL) AS has_web,
  (fcm_token IS NOT NULL)     AS has_fcm,
  fcm_platform, fcm_registered_at
FROM user_notificacoes_prefs
WHERE user_id = '<seu_uuid>';
```

Após abrir o app no celular + permitir, `has_fcm` vira `true` com
`fcm_platform='android'`.

### 7.3 Verificação no Firebase

Console Firebase ▸ **Cloud Messaging** ▸ **Send test message**:
1. Cola um token FCM (você pode logar no app via Logcat ou query no
   Supabase).
2. **Test** → notificação chega no celular em ~3s.
3. Se chegar, FCM está OK; o resto é só nossa orquestração.

## 8. O que NÃO está nesta sprint

- **Tela de configuração** "Ativar notificações no app" — Bootstrap pede
  permissão automaticamente na 1ª abertura logada. Se usuário negar,
  fica negado. Tela dedicada com opt-in/out e categorias fica para
  polish posterior.
- **iOS APNs key separada** — FCM faz o proxy. Quando publicarmos no iOS
  precisaremos da APNs Auth Key da conta Apple Developer (sobe no
  Firebase ▸ Project Settings ▸ Cloud Messaging ▸ APNs Authentication
  Key).
- **Notificação foreground** — quando o app está aberto, FCM por padrão
  não mostra notificação na barra (precisa código de display manual).
  Background/closed funciona.
- **Deep link via tap em notificação** — `data.url` está sendo enviado.
  Falta wire-up no client pra navegar quando o usuário toca
  (`@capacitor-firebase/messaging` tem listener `notificationActionPerformed`).
  Próximo polish.

## 9. Riscos e gotchas

- **FIREBASE_SERVICE_ACCOUNT ausente:** módulo vira no-op silencioso. Web
  Push continua. Não quebra nada — só não envia FCM.
- **Token FCM rotaciona:** Firebase pode trocar token periodicamente.
  Bootstrap escuta `tokenReceived` e re-registra. Não precisa ação.
- **Usuário desinstala o app:** próximo envio FCM retorna
  `registration-token-not-registered` → marcamos como expirado e
  limpamos do banco. Sem desativar `push_enabled` se ainda tem Web Push.
- **Mesmo user em 2 celulares:** apenas o token mais recente fica
  (sobrescreve). Multi-device exige tabela separada (futuro).
- **iOS sandbox vs production:** APNs tem dois ambientes. Em dev (TestFlight)
  o token é diferente da App Store. Quando formos publicar, monitorar.
