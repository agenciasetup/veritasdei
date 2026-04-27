-- Onda B: suporte a Firebase Cloud Messaging (FCM) para push em apps nativos
-- (Capacitor Android/iOS).
--
-- Web Push (VAPID, colunas push_*) continua funcionando para PWA. FCM
-- é canal adicional usado quando o usuário abre o app empacotado.
--
-- Um usuário pode ter os dois ao mesmo tempo (PWA no desktop + app no
-- celular) — send.ts dispara em ambos canais. Se o usuário trocar de
-- celular, o token FCM novo sobrescreve o antigo (1 device FCM por user
-- por enquanto; multi-device pode virar tabela separada se demandar).
--
-- Mudança aditiva: nenhuma linha existente é alterada. Stripe/RevenueCat
-- e Web Push continuam intactos.

ALTER TABLE public.user_notificacoes_prefs
  ADD COLUMN IF NOT EXISTS fcm_token text,
  ADD COLUMN IF NOT EXISTS fcm_platform text,
  ADD COLUMN IF NOT EXISTS fcm_registered_at timestamptz;

ALTER TABLE public.user_notificacoes_prefs
  DROP CONSTRAINT IF EXISTS user_notificacoes_prefs_fcm_platform_check;

ALTER TABLE public.user_notificacoes_prefs
  ADD CONSTRAINT user_notificacoes_prefs_fcm_platform_check
  CHECK (fcm_platform IS NULL OR fcm_platform IN ('android', 'ios'));

COMMENT ON COLUMN public.user_notificacoes_prefs.fcm_token IS
  'Token FCM do device nativo (Android/iOS) — registrado por PushBootstrap quando app abre. Sobrescreve quando usuário troca de aparelho.';
COMMENT ON COLUMN public.user_notificacoes_prefs.fcm_platform IS
  'Plataforma do token: ''android'' (FCM) ou ''ios'' (APNs via FCM proxy).';
