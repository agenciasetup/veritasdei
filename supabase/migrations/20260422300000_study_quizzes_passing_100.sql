-- ============================================================================
-- Provas: aprovação passa a exigir 100%
-- ============================================================================
-- Decisão de produto: prova só vale (XP + relíquia + "aprovado" no perfil)
-- com 100%. Abaixo disso, o aluno tenta de novo. Antes eram 70%.
--
-- 1) Default da tabela passa de 70 → 100.
-- 2) Bulk-update de todas as provas existentes publicadas (e rascunhos).
-- 3) Recalcula user_quiz_attempts.passed com a nova régua —
--    tentativas que passavam com 70% mas não gabaritaram deixam de
--    contar como aprovadas. O trigger de gamificação não reverte XP já
--    creditado (histórico); a função fn_recalc_gamification só adiciona
--    em tentativas passed=true, então deixar passed=false em tentativas
--    não-100% congela XP novo, mas não retira o já dado. Tradeoff
--    aceitável pra não punir retroativamente.
-- ============================================================================

alter table public.study_quizzes
  alter column passing_score set default 100;

update public.study_quizzes
   set passing_score = 100
 where passing_score <> 100;

-- Recalcula `passed` em tentativas existentes sob a régua nova.
update public.user_quiz_attempts
   set passed = (score = 100)
 where passed <> (score = 100);
