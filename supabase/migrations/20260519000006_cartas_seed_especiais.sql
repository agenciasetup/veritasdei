-- ============================================================================
-- Códex Veritas — Seed de cartas especiais (Sprint 4)
-- ============================================================================
-- Demonstra as condições especiais:
--   "Os Doze Apóstolos"  — grupo_estudo_tamanho >= 12
--   "O Verbo Oculto"     — carta-segredo via nota_contem_frase
-- ============================================================================

begin;

insert into public.personagens (slug, nome, subtitulo, descricao, ordem)
values (
  'a-igreja',
  'A Igreja',
  'Corpo Místico de Cristo',
  'A comunhão dos fiéis fundada por Cristo sobre os Apóstolos. Cartas desta coleção celebram a vida em comunidade.',
  1
)
on conflict (slug) do update set
  nome = excluded.nome, subtitulo = excluded.subtitulo,
  descricao = excluded.descricao, ordem = excluded.ordem;

-- Carta especial — grupo de estudo com 12 membros.
insert into public.cartas (
  personagem_id, slug, numero, nome, subtitulo, categoria, raridade, estrelas,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, simbolo, moldura, cor_accent, dica_desbloqueio, regras, status, ordem
)
select
  p.id, 'os-doze-apostolos', 3, 'Os Doze Apóstolos', 'A Coluna da Igreja',
  'Comunhão', 'epica', 4,
  'Vós sois a luz do mundo.', 'Mateus 5,14',
  'Sobre esta pedra edificarei a minha Igreja.',
  'Celebra a vida em comunidade — a fé partilhada cresce.',
  '["Carta de Coleção Épica","Selo: Comunhão"]'::jsonb,
  '✠', 'ornamentada', '#A78BFA',
  'Algo grande acontece quando muitos caminham juntos…',
  jsonb_build_object(
    'operador', 'todas',
    'condicoes', jsonb_build_array(
      jsonb_build_object('tipo','grupo_estudo_tamanho','valor', 12)
    )
  ),
  'publicado', 0
from public.personagens p where p.slug = 'a-igreja'
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade,
  regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;

-- Carta-segredo — frase específica numa anotação de estudo.
insert into public.cartas (
  personagem_id, slug, numero, nome, subtitulo, categoria, raridade, estrelas,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, simbolo, moldura, cor_accent, dica_desbloqueio, regras, status, ordem
)
select
  p.id, 'o-verbo-oculto', 4, 'O Verbo Oculto', 'Carta Secreta',
  'Mistério', 'lendaria', 5,
  'No princípio era o Verbo.', 'João 1,1',
  'Et Verbum caro factum est.',
  'Recompensa para quem medita e registra a Palavra.',
  '["Carta Secreta Lendária"]'::jsonb,
  '☧', 'vitral', '#E8C766',
  null,
  jsonb_build_object(
    'operador', 'todas',
    'condicoes', jsonb_build_array(
      jsonb_build_object('tipo','nota_contem_frase','ref','verbum caro factum est')
    )
  ),
  'publicado', 2
from public.personagens p where p.slug = 'jesus-cristo'
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade,
  regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;

select public.fn_recalc_personagem_total(p.id)
from public.personagens p where p.slug in ('a-igreja','jesus-cristo');

commit;
