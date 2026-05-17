-- ============================================================================
-- Códex Veritas — Seed H (Liturgia Dominical)
-- ============================================================================
-- Cartas baseadas em contadores `liturgia_<slug>`. O slug é fixo entre anos
-- (advento-1, natal, pascoa, pentecostes…), preenchido pelo calendário em
-- `liturgia_calendario`. Quando o usuário abre /educa/liturgia/hoje numa data
-- coberta, a função fn_liturgia_marcar_abertura incrementa o contador.
--
-- Total: 46 comuns (domingos do ano litúrgico) + 6 raras (festas solenes).
-- ============================================================================

begin;

-- helper: insere uma carta litúrgica comum (cor âmbar, moldura clássica)
do $$
declare
  v_perso uuid := (select id from public.personagens where slug='calendario-liturgico');
  v_data record;
begin
  if v_perso is null then
    raise exception 'personagem calendario-liturgico ausente — rode 20260524001000_cartas_personagens.sql antes';
  end if;

  for v_data in
    select * from (values
      -- (slug, nome, subtitulo, frase_central, frase_referencia, tempo, ordem)
      -- Advento (4)
      ('advento-1', 'Primeiro Advento', 'Vigiai',
       'Vigiai, pois não sabeis em que dia vem o vosso Senhor.', 'Mateus 24,42',
       'advento', 200),
      ('advento-2', 'Segundo Advento', 'Preparai os caminhos',
       'Preparai o caminho do Senhor, endireitai as suas veredas.', 'Marcos 1,3',
       'advento', 201),
      ('advento-3', 'Gaudete', 'Alegrai-vos',
       'Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.', 'Filipenses 4,4',
       'advento', 202),
      ('advento-4', 'Quarto Advento', 'O Verbo se aproxima',
       'Eis a serva do Senhor; faça-se em mim segundo a tua palavra.', 'Lucas 1,38',
       'advento', 203),
      -- Natal (3)
      ('natal', 'Natal do Senhor', 'O Verbo se fez carne',
       'O Verbo se fez carne e habitou entre nós.', 'João 1,14',
       'natal', 204),
      ('sagrada-familia', 'Sagrada Família', 'Jesus, Maria e José',
       'Jesus crescia em sabedoria, idade e graça diante de Deus e dos homens.', 'Lucas 2,52',
       'natal', 205),
      ('maria-mae-de-deus-domingo', 'Maria, Mãe de Deus', 'Solenidade — 1° de janeiro',
       'Maria guardava todas estas coisas, meditando-as em seu coração.', 'Lucas 2,19',
       'natal', 206),
      -- Epifania (1)
      ('epifania', 'Epifania do Senhor', 'Os magos do Oriente',
       'Vimos a sua estrela no Oriente e viemos adorá-lo.', 'Mateus 2,2',
       'natal', 207),
      -- Batismo do Senhor
      ('batismo-do-senhor', 'Batismo do Senhor', 'Fim do Natal',
       'Este é o meu Filho amado, em quem ponho a minha complacência.', 'Mateus 3,17',
       'comum', 208),
      -- Tempo Comum 1ª parte (5 domingos médios)
      ('tc-2', '2° Tempo Comum', 'Bodas de Caná',
       'Façam tudo o que Ele vos disser.', 'João 2,5',
       'comum', 209),
      ('tc-3', '3° Tempo Comum', 'O Reino se aproximou',
       'Convertei-vos, porque o Reino dos Céus está próximo.', 'Mateus 4,17',
       'comum', 210),
      ('tc-4', '4° Tempo Comum', 'Bem-aventuranças',
       'Bem-aventurados os pobres em espírito, porque deles é o Reino dos Céus.', 'Mateus 5,3',
       'comum', 211),
      ('tc-5', '5° Tempo Comum', 'Sal e luz',
       'Vós sois o sal da terra; vós sois a luz do mundo.', 'Mateus 5,13–14',
       'comum', 212),
      ('tc-6', '6° Tempo Comum', 'Lei nova',
       'Não vim abolir, mas dar pleno cumprimento.', 'Mateus 5,17',
       'comum', 213),
      ('tc-7', '7° Tempo Comum', 'Amai os inimigos',
       'Amai os vossos inimigos e orai pelos que vos perseguem.', 'Mateus 5,44',
       'comum', 214),
      ('tc-8', '8° Tempo Comum', 'Buscai primeiro o Reino',
       'Buscai em primeiro lugar o Reino de Deus e a sua justiça.', 'Mateus 6,33',
       'comum', 215),
      -- Quaresma (5)
      ('quaresma-1', '1° Quaresma', 'As tentações no deserto',
       'Não só de pão vive o homem.', 'Mateus 4,4',
       'quaresma', 216),
      ('quaresma-2', '2° Quaresma', 'A Transfiguração',
       'Este é o meu Filho amado; escutai-o.', 'Mateus 17,5',
       'quaresma', 217),
      ('quaresma-3', '3° Quaresma', 'Água viva',
       'Quem beber da água que eu lhe der nunca mais terá sede.', 'João 4,14',
       'quaresma', 218),
      ('quaresma-4', 'Laetare', 'Alegrai-vos, Jerusalém',
       'Alegrai-vos com Jerusalém.', 'Isaías 66,10',
       'quaresma', 219),
      ('quaresma-5', '5° Quaresma', 'Lázaro',
       'Eu sou a Ressurreição e a Vida.', 'João 11,25',
       'quaresma', 220),
      -- Semana Santa (2)
      ('ramos', 'Domingo de Ramos', 'Hosana ao Filho de Davi',
       'Bendito o que vem em nome do Senhor!', 'Mateus 21,9',
       'quaresma', 221),
      ('pascoa', 'Páscoa', 'A Ressurreição do Senhor',
       'Não está aqui; ressuscitou.', 'Lucas 24,6',
       'pascal', 222),
      -- Tempo Pascal (6)
      ('pascoa-2', '2° Páscoa — Misericórdia', 'Festa da Misericórdia',
       'Bem-aventurados os que creram sem ter visto.', 'João 20,29',
       'pascal', 223),
      ('pascoa-3', '3° Páscoa', 'Emaús',
       'Não ardia o nosso coração quando Ele nos falava pelo caminho?', 'Lucas 24,32',
       'pascal', 224),
      ('pascoa-4', '4° Páscoa', 'Bom Pastor',
       'Eu sou o Bom Pastor; o Bom Pastor dá a vida pelas suas ovelhas.', 'João 10,11',
       'pascal', 225),
      ('pascoa-5', '5° Páscoa', 'A videira',
       'Eu sou a videira verdadeira; vós, os ramos.', 'João 15,5',
       'pascal', 226),
      ('pascoa-6', '6° Páscoa', 'O Mandamento Novo',
       'Amai-vos uns aos outros como eu vos amei.', 'João 13,34',
       'pascal', 227),
      ('pascoa-7', '7° Páscoa — Ascensão', 'Ide e ensinai',
       'Ide e fazei discípulos de todas as nações.', 'Mateus 28,19',
       'pascal', 228),
      -- Pentecostes
      ('pentecostes-domingo', 'Pentecostes', 'O Espírito Santo desce',
       'Recebei o Espírito Santo.', 'João 20,22',
       'pascal', 229),
      -- Tempo Comum 2ª parte (até Cristo Rei)
      ('santissima-trindade', 'Santíssima Trindade', 'Pai, Filho e Espírito Santo',
       'Ide, batizando-os em nome do Pai, do Filho e do Espírito Santo.', 'Mateus 28,19',
       'comum', 230),
      ('corpo-de-cristo-domingo', 'Corpo e Sangue de Cristo', 'Corpus Christi',
       'Quem come a minha carne e bebe o meu sangue tem a vida eterna.', 'João 6,54',
       'comum', 231),
      ('tc-12', '12° Tempo Comum', 'Não temais',
       'Não temais aqueles que matam o corpo.', 'Mateus 10,28',
       'comum', 232),
      ('tc-13', '13° Tempo Comum', 'Quem ama mais',
       'Quem ama o pai ou a mãe mais do que a mim não é digno de mim.', 'Mateus 10,37',
       'comum', 233),
      ('tc-14', '14° Tempo Comum', 'Vinde a mim',
       'Vinde a mim todos os que estais cansados.', 'Mateus 11,28',
       'comum', 234),
      ('tc-15', '15° Tempo Comum', 'O semeador',
       'Saiu o semeador a semear.', 'Mateus 13,3',
       'comum', 235),
      ('tc-16', '16° Tempo Comum', 'Joio e trigo',
       'Deixai-os crescer juntos até à colheita.', 'Mateus 13,30',
       'comum', 236),
      ('tc-17', '17° Tempo Comum', 'O tesouro escondido',
       'Vendeu tudo o que tinha e comprou aquele campo.', 'Mateus 13,44',
       'comum', 237),
      ('tc-18', '18° Tempo Comum', 'Multiplicação dos pães',
       'Eles comeram e ficaram saciados.', 'Mateus 14,20',
       'comum', 238),
      ('tc-19', '19° Tempo Comum', 'Pedro caminha sobre as águas',
       'Tem confiança, sou eu, não temais.', 'Mateus 14,27',
       'comum', 239),
      ('tc-20', '20° Tempo Comum', 'A cananeia',
       'Ó mulher, grande é a tua fé!', 'Mateus 15,28',
       'comum', 240),
      ('tc-21', '21° Tempo Comum', 'Sobre esta pedra',
       'Tu és Pedro, e sobre esta pedra edificarei a minha Igreja.', 'Mateus 16,18',
       'comum', 241),
      ('tc-22', '22° Tempo Comum', 'Quem perder a vida por mim',
       'Quem quiser salvar a sua vida há de perdê-la.', 'Mateus 16,25',
       'comum', 242),
      ('tc-23', '23° Tempo Comum', 'Correção fraterna',
       'Onde dois ou três estiverem reunidos em meu nome…', 'Mateus 18,20',
       'comum', 243),
      ('tc-24', '24° Tempo Comum', 'Setenta vezes sete',
       'Setenta vezes sete.', 'Mateus 18,22',
       'comum', 244),
      ('tc-25', '25° Tempo Comum', 'Os primeiros e os últimos',
       'Os últimos serão os primeiros.', 'Mateus 20,16',
       'comum', 245),
      ('tc-26', '26° Tempo Comum', 'Dois filhos enviados',
       'Quem fez a vontade do pai? O primeiro.', 'Mateus 21,31',
       'comum', 246),
      ('tc-30', '30° Tempo Comum', 'O maior mandamento',
       'Amarás o Senhor teu Deus de todo o coração.', 'Mateus 22,37',
       'comum', 247),
      ('tc-32', '32° Tempo Comum', 'As dez virgens',
       'Vigiai, pois não sabeis nem o dia nem a hora.', 'Mateus 25,13',
       'comum', 248),
      ('tc-33', '33° Tempo Comum', 'Os talentos',
       'Servo bom e fiel, entra na alegria do teu Senhor.', 'Mateus 25,21',
       'comum', 249),
      -- Cristo Rei (encerra o ano)
      ('cristo-rei', 'Cristo Rei do Universo', 'Solenidade — fim do ano litúrgico',
       'Tudo o que fizestes a um destes meus irmãos mais pequeninos, a mim o fizestes.',
       'Mateus 25,40', 'comum', 250)
    ) as t(slug, nome, subtitulo, frase_central, frase_referencia, tempo, ordem)
  loop
    insert into public.cartas (
      personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas,
      frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
      recompensa, simbolo, moldura, cor_accent, dica_desbloqueio, regras, status, ordem
    ) values (
      v_perso,
      'liturgia-' || v_data.slug,
      v_data.nome,
      v_data.subtitulo,
      'Liturgia Dominical',
      'comum', 2,
      v_data.frase_central,
      v_data.frase_referencia,
      'Liturgia das Horas / Lecionário Romano',
      'Marca o domingo da liturgia recebida.',
      jsonb_build_array('Carta Comum','Liturgia: ' || v_data.subtitulo),
      '☩',
      'classica',
      '#C2B7A6',
      'Abra a liturgia no domingo correspondente.',
      jsonb_build_object('operador','todas','condicoes',
        jsonb_build_array(
          jsonb_build_object('tipo','contador','ref','liturgia_' || v_data.slug,'valor',1)
        )
      ),
      'publicado',
      v_data.ordem
    )
    on conflict (slug) do update set
      nome = excluded.nome, subtitulo = excluded.subtitulo,
      frase_central = excluded.frase_central, frase_referencia = excluded.frase_referencia,
      regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;
  end loop;
end $$;

-- Festas solenes — RARAS (âmbar)
insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, simbolo, moldura, cor_accent, dica_desbloqueio, regras, status, ordem
) values
  ((select id from public.personagens where slug='maria-mae-de-deus'),
   'liturgia-imaculada-conceicao', 'Imaculada Conceição',
   'Solenidade — 8 de dezembro', 'Festa Solene', 'rara', 3,
   'Cheia de graça, o Senhor é contigo.', 'Lucas 1,28',
   'Ineffabilis Deus (Pio IX, 1854).',
   'Selo da Imaculada sobre o ano de quem a celebrou.',
   '["Carta Rara","Selo: Imaculada"]'::jsonb,
   '✿', 'ornamentada', '#D4A574',
   'Abra a liturgia em 8 de dezembro.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','liturgia_imaculada-conceicao','valor',1))),
   'publicado', 280),

  ((select id from public.personagens where slug='jesus-cristo'),
   'liturgia-sagrado-coracao', 'Sagrado Coração de Jesus',
   'Solenidade móvel — sexta após Corpus Christi', 'Festa Solene', 'rara', 3,
   'Aprendei de mim, que sou manso e humilde de coração.', 'Mateus 11,29',
   'Haurietis Aquas (Pio XII, 1956); revelações a Santa Margarida Maria Alacoque (1673).',
   'Une o portador ao Coração que ama os homens.',
   '["Carta Rara","Selo: Sagrado Coração"]'::jsonb,
   '♥', 'ornamentada', '#D4A574',
   'Abra a liturgia na solenidade do Sagrado Coração.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','liturgia_sagrado-coracao','valor',1))),
   'publicado', 281),

  ((select id from public.personagens where slug='maria-mae-de-deus'),
   'liturgia-assuncao', 'Assunção de Maria',
   'Solenidade — 15 de agosto', 'Festa Solene', 'rara', 3,
   'A minha alma engrandece o Senhor.', 'Lucas 1,46',
   'Munificentissimus Deus (Pio XII, 1950).',
   'Marca o portador como devoto da Assunta.',
   '["Carta Rara","Selo: Assunção"]'::jsonb,
   '☁', 'ornamentada', '#D4A574',
   'Abra a liturgia em 15 de agosto.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','liturgia_assuncao','valor',1))),
   'publicado', 282),

  ((select id from public.personagens where slug='a-igreja'),
   'liturgia-todos-os-santos', 'Todos os Santos',
   'Solenidade — 1° de novembro', 'Festa Solene', 'rara', 3,
   'Vi uma multidão imensa que ninguém podia contar.', 'Apocalipse 7,9',
   'Festa universal estabelecida por Gregório IV (835); CIC 957.',
   'Une o portador à comunhão dos santos.',
   '["Carta Rara","Selo: Todos os Santos"]'::jsonb,
   '✦', 'ornamentada', '#D4A574',
   'Abra a liturgia em 1° de novembro.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','liturgia_todos-os-santos','valor',1))),
   'publicado', 283),

  ((select id from public.personagens where slug='os-doze'),
   'liturgia-pedro-e-paulo', 'São Pedro e São Paulo',
   'Solenidade — 29 de junho', 'Festa Solene', 'rara', 3,
   'Tu és Pedro… / O bom combate combati.', 'Mateus 16,18 / 2 Timóteo 4,7',
   'Cefas e Paulo — as duas colunas romanas, mártires na Cidade Eterna.',
   'Sela o portador como filho da Sé de Pedro.',
   '["Carta Rara","Selo: Petrus et Paulus"]'::jsonb,
   '☩', 'ornamentada', '#D4A574',
   'Abra a liturgia em 29 de junho.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','liturgia_pedro-e-paulo','valor',1))),
   'publicado', 284),

  ((select id from public.personagens where slug='a-igreja'),
   'liturgia-pentecostes-solene', 'Solenidade de Pentecostes',
   'Solenidade móvel — encerramento do Tempo Pascal', 'Festa Solene', 'rara', 3,
   'Encheram-se todos do Espírito Santo.', 'Atos 2,4',
   'CIC 731–732 — o Dia de Pentecostes.',
   'Línguas de fogo descem simbolicamente sobre o portador.',
   '["Carta Rara","Selo: Pentecostes Solene"]'::jsonb,
   '🔥', 'ornamentada', '#D4A574',
   'Abra a liturgia no domingo de Pentecostes.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','liturgia_pentecostes-domingo','valor',1))),
   'publicado', 285)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade,
  frase_central = excluded.frase_central, regras = excluded.regras,
  status = excluded.status, ordem = excluded.ordem;

select public.fn_recalc_personagem_total(p.id)
  from public.personagens p
 where p.slug in ('calendario-liturgico','jesus-cristo','maria-mae-de-deus','a-igreja','os-doze');

commit;
