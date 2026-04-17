-- Sprint 6 — Storage hardening.
--
-- Auditoria encontrou:
--   • Os 4 buckets (avatars, paroquias, paroquia-documentos, verificacoes)
--     estavam com file_size_limit = NULL e allowed_mime_types = NULL →
--     qualquer tamanho, qualquer tipo.
--   • Bucket `paroquias` tinha DUAS policies de upload idênticas
--     ("paroquias_upload" + "Allow authenticated upload paroquias photos").
--
-- Mudanças:
--   1. Set file_size_limit + allowed_mime_types em cada bucket.
--   2. SVG proibido em buckets públicos — SVG pode carregar JavaScript
--      inline e dispara XSS quando servido como `image/svg+xml` e embedado
--      via <object>, <embed> ou exposto no mesmo origin.
--   3. Dropa policy duplicada em `paroquias`.
--
-- Observação sobre buckets públicos (avatars, paroquias):
--   O Supabase CDN serve os arquivos com o Content-Type do upload. Nossa
--   validação client-side (src/app/onboarding/page.tsx etc.) checa
--   file.type — mas atacante pode bypass trivialmente. A validação real
--   precisa ser server-side nos metadados do bucket, o que essas policies
--   e flags fazem.

-- =============================================================================
-- avatars — fotos de perfil. Público, pequeno, só imagens rasterizadas.
-- =============================================================================
UPDATE storage.buckets
SET
  file_size_limit = 2 * 1024 * 1024,                       -- 2 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
WHERE id = 'avatars';

-- =============================================================================
-- paroquias — fotos da igreja + galeria + imagens de posts. Público.
-- =============================================================================
UPDATE storage.buckets
SET
  file_size_limit = 5 * 1024 * 1024,                       -- 5 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
WHERE id = 'paroquias';

-- =============================================================================
-- verificacoes — documentos de verificação de catequista. Privado.
-- Permite PDF + imagens (compatível com whitelist client-side em
-- src/app/perfil/verificacao/page.tsx:76).
-- =============================================================================
UPDATE storage.buckets
SET
  file_size_limit = 10 * 1024 * 1024,                      -- 10 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
WHERE id = 'verificacoes';

-- =============================================================================
-- paroquia-documentos — docs de verificação de paróquia. Privado.
-- =============================================================================
UPDATE storage.buckets
SET
  file_size_limit = 10 * 1024 * 1024,                      -- 10 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
WHERE id = 'paroquia-documentos';

-- =============================================================================
-- Limpa policy duplicada em paroquias.
-- Mantemos "paroquias_upload" (nome consistente com as outras) e
-- removemos "Allow authenticated upload paroquias photos".
-- =============================================================================
DROP POLICY IF EXISTS "Allow authenticated upload paroquias photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read paroquias photos"          ON storage.objects;
