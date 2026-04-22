-- Preferências de notificações por usuário (push subscription + toggles finos).
--
-- Mestre:   push_enabled — o usuário optou por receber push.
-- Finos:    pref_<categoria> — liga/desliga tipo específico (liturgia, ângelus,
--           novena, exame, comunidade). Default true para quem já ativou o
--           mestre receber tudo por padrão.
-- Horários: pref_*_hora — quando a categoria tem hora ajustável (liturgia, exame).
-- Assinatura: push_endpoint + keys (p256dh/auth) usados pelo servidor para
--           enviar push criptografado via VAPID.

CREATE TABLE IF NOT EXISTS public.user_notificacoes_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  push_enabled boolean NOT NULL DEFAULT false,
  push_endpoint text,
  push_p256dh text,
  push_auth text,
  push_user_agent text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',

  pref_liturgia boolean NOT NULL DEFAULT true,
  pref_liturgia_hora smallint NOT NULL DEFAULT 7 CHECK (pref_liturgia_hora BETWEEN 0 AND 23),

  pref_angelus boolean NOT NULL DEFAULT true,

  pref_novenas boolean NOT NULL DEFAULT true,

  pref_exame boolean NOT NULL DEFAULT true,
  pref_exame_hora smallint NOT NULL DEFAULT 21 CHECK (pref_exame_hora BETWEEN 0 AND 23),

  pref_comunidade boolean NOT NULL DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notificacoes_prefs_push_enabled
  ON public.user_notificacoes_prefs (push_enabled)
  WHERE push_enabled = true;

ALTER TABLE public.user_notificacoes_prefs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notificacoes_prefs'
      AND policyname = 'notif_prefs_select_own'
  ) THEN
    CREATE POLICY notif_prefs_select_own
      ON public.user_notificacoes_prefs
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notificacoes_prefs'
      AND policyname = 'notif_prefs_insert_own'
  ) THEN
    CREATE POLICY notif_prefs_insert_own
      ON public.user_notificacoes_prefs
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notificacoes_prefs'
      AND policyname = 'notif_prefs_update_own'
  ) THEN
    CREATE POLICY notif_prefs_update_own
      ON public.user_notificacoes_prefs
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notificacoes_prefs'
      AND policyname = 'notif_prefs_delete_own'
  ) THEN
    CREATE POLICY notif_prefs_delete_own
      ON public.user_notificacoes_prefs
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notificacoes_prefs TO authenticated;
