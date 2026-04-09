-- ═══════════════════════════════════════════════════════════
-- VERITAS DEI — Sistema de Autenticação e Perfis
-- Migration: 20260409
-- ═══════════════════════════════════════════════════════════

-- ─── ENUM: Vocações Católicas ────────────────────────────
DO $$ BEGIN
  CREATE TYPE vocacao_tipo AS ENUM (
    'leigo',
    'diacono',
    'padre',
    'bispo',
    'cardeal',
    'papa',
    'catequista'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: Planos ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE plano_tipo AS ENUM (
    'free',
    'estudos'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: Role do Usuário ───────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'user',
    'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: Status da Conta ───────────────────────────────
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM (
    'active',
    'pending_verification',
    'suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABELA: profiles ────────────────────────────────────
-- Estende auth.users do Supabase com dados do perfil católico
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Dados Básicos ──
  name TEXT,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  status account_status NOT NULL DEFAULT 'active',
  plan plano_tipo NOT NULL DEFAULT 'free',
  vocacao vocacao_tipo NOT NULL DEFAULT 'leigo',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  has_password_set BOOLEAN NOT NULL DEFAULT FALSE,

  -- ── Perfil Pessoal ──
  profile_image_url TEXT,
  instagram TEXT,
  whatsapp TEXT,
  data_nascimento DATE,
  genero TEXT CHECK (genero IN ('masculino', 'feminino')),

  -- ── Endereço ──
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT DEFAULT 'Brasil',
  cep TEXT,

  -- ── Vida Católica ──
  paroquia TEXT,
  diocese TEXT,
  tempo_catolico TEXT,             -- ex: "Desde nascimento", "5 anos", etc.
  sacramentos JSONB DEFAULT '[]',  -- ["batismo", "eucaristia", "crisma", ...]
  pastoral TEXT,                   -- ex: "Pastoral da Juventude"
  veio_de_outra_religiao BOOLEAN DEFAULT FALSE,
  religiao_anterior TEXT,
  comunidade TEXT,                 -- comunidade/movimento (ex: "Opus Dei", "Canção Nova")

  -- ── Metadados ──
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEX ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_vocacao ON profiles(vocacao);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_cidade ON profiles(cidade);
CREATE INDEX IF NOT EXISTS idx_profiles_paroquia ON profiles(paroquia);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ─── RLS (Row Level Security) ────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler seu próprio perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Usuários podem inserir seu próprio perfil (no signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin pode ver todos os perfis
CREATE POLICY "profiles_admin_select_all" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin pode atualizar todos os perfis
CREATE POLICY "profiles_admin_update_all" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Perfis públicos básicos (nome, vocação, cidade) para comunidade
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (TRUE);

-- ─── TRIGGER: Criar perfil ao registrar ─────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── TRIGGER: Atualizar updated_at ──────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── TABELA: Referência de Sacramentos ──────────────────
-- Tabela auxiliar para listar os 7 sacramentos (read-only)
CREATE TABLE IF NOT EXISTS sacramentos_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  nome_latin TEXT,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0
);

INSERT INTO sacramentos_ref (nome, nome_latin, descricao, ordem) VALUES
  ('Batismo', 'Baptismus', 'Sacramento da iniciação cristã que apaga o pecado original', 1),
  ('Eucaristia', 'Eucharistia', 'Corpo e Sangue de Cristo sob as espécies do pão e do vinho', 2),
  ('Crisma', 'Confirmatio', 'Sacramento que confirma e fortalece a graça batismal', 3),
  ('Reconciliação', 'Paenitentia', 'Sacramento da confissão e perdão dos pecados', 4),
  ('Unção dos Enfermos', 'Unctio Infirmorum', 'Sacramento de conforto e cura para os doentes', 5),
  ('Ordem', 'Ordo', 'Sacramento que confere o ministério sagrado (diácono, padre, bispo)', 6),
  ('Matrimônio', 'Matrimonium', 'Sacramento da união conjugal entre homem e mulher', 7)
ON CONFLICT (nome) DO NOTHING;

-- ─── TABELA: Verificações (para padres, diáconos, etc.) ─
CREATE TABLE IF NOT EXISTS verificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('vocacao', 'paroquia')),
  documento_url TEXT,                -- link para documento comprobatório
  notas TEXT,                        -- notas do admin
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  revisado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE verificacoes ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver suas próprias verificações
CREATE POLICY "verificacoes_select_own" ON verificacoes
  FOR SELECT USING (auth.uid() = user_id);

-- Usuário pode criar pedido de verificação
CREATE POLICY "verificacoes_insert_own" ON verificacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin pode ver e atualizar todas as verificações
CREATE POLICY "verificacoes_admin_all" ON verificacoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ─── STORAGE: Bucket para fotos de perfil ───────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Qualquer usuário autenticado pode fazer upload da sua foto
CREATE POLICY "avatars_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Qualquer pessoa pode ver avatares (público)
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Usuário pode deletar sua própria foto
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
