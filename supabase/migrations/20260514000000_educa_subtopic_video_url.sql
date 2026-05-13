-- Permite anexar um vídeo do YouTube/Vimeo a cada lição (content_subtopic).
-- O StudyReader renderiza um embed acima do conteúdo quando há video_url.
-- RLS já existente ("Admin manage content_subtopics") cobre escrita.
-- Aplicada via MCP no projeto remoto em 2026-05-14.

ALTER TABLE public.content_subtopics
  ADD COLUMN IF NOT EXISTS video_url text;
