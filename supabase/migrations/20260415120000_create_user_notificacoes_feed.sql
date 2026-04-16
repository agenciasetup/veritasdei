-- Feed persistente de notificações por usuário
-- Inclui deduplicação por chave lógica (dedupe_key) e suporte a arquivamento

CREATE TABLE IF NOT EXISTS public.user_notificacoes_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_url text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'system',
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_notificacoes_feed_user_created
  ON public.user_notificacoes_feed (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notificacoes_feed_user_unread
  ON public.user_notificacoes_feed (user_id, read_at)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_notificacoes_feed_dedupe
  ON public.user_notificacoes_feed (user_id, dedupe_key);

ALTER TABLE public.user_notificacoes_feed ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notificacoes_feed'
      AND policyname = 'notif_feed_select_own'
  ) THEN
    CREATE POLICY notif_feed_select_own
      ON public.user_notificacoes_feed
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notificacoes_feed'
      AND policyname = 'notif_feed_insert_own'
  ) THEN
    CREATE POLICY notif_feed_insert_own
      ON public.user_notificacoes_feed
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notificacoes_feed'
      AND policyname = 'notif_feed_update_own'
  ) THEN
    CREATE POLICY notif_feed_update_own
      ON public.user_notificacoes_feed
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.user_notificacoes_feed TO authenticated;
