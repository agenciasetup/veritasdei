-- Seed dos Top 30 santos de devoção — conteúdo curado em pt-BR.
--
-- Inclui: slug limpo, popularidade_rank (4..10, 14..30), nome traduzido,
-- invocação tradicional, patronatos, oração curta e biografia curta.
--
-- Registros manuais (rank 1, 2, 3, 11, 12, 13) já vêm da migration
-- 20260423000003 (marianos + arcanjos + Sagrado Coração).
--
-- Fontes: Vatican.va, Liturgia das Horas, Martirológio Romano,
-- Enciclopédia Católica (domínio público).
--
-- UPDATE via gcatholic_person_id para ser estável contra renames.

begin;

-- Rank 4 — São José
update public.santos set
  slug = 'sao-jose',
  popularidade_rank = 4,
  nome = 'São José',
  invocacao = 'São José, rogai por nós',
  patronatos = array['Igreja Universal', 'pais', 'trabalhadores', 'boa morte', 'Canadá'],
  oracao_curta = E'Ó glorioso São José,\nesposo castíssimo de Maria,\nprotetor amoroso de Jesus,\nalcançai-me a graça de um coração puro\ne uma morte tranquila nos braços de Jesus e Maria.\nAmém.',
  biografia_curta = E'São José, esposo da Virgem Maria e pai adotivo de Jesus, é modelo do trabalhador justo e do homem obediente à vontade de Deus. Os Evangelhos o apresentam como "homem justo" (Mt 1,19) — acolhe Maria, dá nome a Jesus, protege a Sagrada Família na fuga para o Egito.\n\nProclamado Patrono Universal da Igreja por Pio IX em 1870, e Patrono dos Trabalhadores por Pio XII em 1955 (festa em 1º de maio). A festa principal é 19 de março. A devoção josefina foi fortemente difundida por Santa Teresa d''Ávila.'
where gcatholic_person_id = 69212;

-- Rank 5 — Santo Antônio de Pádua
update public.santos set
  slug = 'santo-antonio-de-padua',
  popularidade_rank = 5,
  nome = 'Santo Antônio de Pádua',
  invocacao = 'Santo Antônio, rogai por nós',
  patronatos = array['Portugal', 'coisas perdidas', 'casamentos', 'pobres', 'pregadores'],
  oracao_curta = E'Se milagres desejais,\nrecorrei a Santo Antônio:\nvereis fugir demônios,\na morte e o erro evitar.\nO mar se acalma,\nas cadeias se quebram,\nmembros e coisas perdidas\nAntônio faz encontrar.\nAmém.',
  biografia_curta = E'Fernando de Bulhões nasceu em Lisboa em 1195. Entrou para os Cônegos Regulares de Santo Agostinho e depois se tornou franciscano, atraído pelo martírio dos primeiros mártires de Marrocos. Pregador extraordinário, foi chamado de "Martelo dos Hereges" por sua defesa da fé.\n\nDedicou os últimos anos à pregação na Itália, sobretudo em Pádua, onde morreu em 1231 com apenas 35 anos. Canonizado por Gregório IX em 1232 — uma das canonizações mais rápidas da história. Declarado Doutor da Igreja por Pio XII em 1946. Festa: 13 de junho.'
where gcatholic_person_id = 67021;

-- Rank 6 — São Francisco de Assis
update public.santos set
  slug = 'sao-francisco-de-assis',
  popularidade_rank = 6,
  nome = 'São Francisco de Assis',
  invocacao = 'São Francisco de Assis, rogai por nós',
  patronatos = array['animais', 'ecologia', 'Itália', 'comerciantes', 'ação católica'],
  oracao_curta = E'Senhor, fazei de mim instrumento de vossa paz.\nOnde houver ódio, que eu leve o amor;\nonde houver ofensa, o perdão;\nonde houver discórdia, a união;\nonde houver erro, a verdade;\nonde houver dúvida, a fé;\nonde houver desespero, a esperança;\nonde houver trevas, a luz;\nonde houver tristeza, a alegria.\nAmém.',
  biografia_curta = E'Giovanni di Bernardone, "Francesco", nasceu em Assis (Itália) em 1182, filho de mercador rico. Após conversão radical, renunciou aos bens paternos e abraçou a "Senhora Pobreza". Fundou a Ordem dos Frades Menores em 1209, aprovada por Inocêncio III.\n\nRecebeu os estigmas no monte Alverne em 1224 — primeiro santo documentado com esta graça. Amigo da natureza, compôs o "Cântico das Criaturas". Morreu em 1226 cantando. Canonizado em 1228 por Gregório IX. Festa: 4 de outubro. Padroeiro da Itália e, por extensão papal de 2013, inspiração para o Papa Francisco.'
where gcatholic_person_id = 24770;

-- Rank 7 — Santa Teresinha do Menino Jesus
update public.santos set
  slug = 'santa-teresinha',
  popularidade_rank = 7,
  nome = 'Santa Teresinha do Menino Jesus',
  invocacao = 'Santa Teresinha, rogai por nós',
  patronatos = array['missões', 'aviadores', 'floristas', 'doentes de AIDS', 'França'],
  oracao_curta = E'Santa Teresinha do Menino Jesus,\nque prometestes passar o vosso céu fazendo o bem na terra,\nfazei cair sobre mim a chuva de rosas das vossas graças.\nEnsinai-me o caminho da infância espiritual,\no pequeno caminho do amor e da confiança.\nAmém.',
  biografia_curta = E'Marie-Françoise-Thérèse Martin nasceu em Alençon (França) em 1873, a mais nova de cinco filhas. Entrou no Carmelo de Lisieux aos 15 anos. Ali descobriu o "pequeno caminho" da infância espiritual — santidade feita de atos pequenos oferecidos com amor.\n\nMorreu de tuberculose em 1897, aos 24 anos, prometendo "passar o céu fazendo o bem na terra". Sua autobiografia "História de uma Alma" tornou-se um dos livros espirituais mais lidos do século XX. Canonizada por Pio XI em 1925, declarada Padroeira das Missões em 1927 e Doutora da Igreja por João Paulo II em 1997. Festa: 1º de outubro.'
where gcatholic_person_id = 67019;

-- Rank 8 — São Judas Tadeu
update public.santos set
  slug = 'sao-judas-tadeu',
  popularidade_rank = 8,
  nome = 'São Judas Tadeu',
  invocacao = 'São Judas Tadeu, rogai por nós',
  patronatos = array['causas impossíveis', 'causas desesperadas', 'hospitais'],
  oracao_curta = E'São Judas Tadeu,\napóstolo de Cristo e mártir glorioso,\nintercessor das causas difíceis e desesperadas,\nrogai por mim, que me encontro tão necessitado.\nFazei uso do privilégio particular\nque vos foi concedido de socorrer\na quem já não tem mais esperança.\nAmém.',
  biografia_curta = E'São Judas Tadeu, apóstolo de Cristo, é também chamado Judas de Tiago para distingui-lo de Judas Iscariotes. Autor da carta homônima do Novo Testamento, pregou o Evangelho na Mesopotâmia, Síria e Pérsia, onde foi martirizado junto com São Simão (por isso celebrados juntos em 28 de outubro).\n\nSua devoção como "santo das causas impossíveis" nasceu da relutância histórica em invocá-lo — confundido com o traidor, seu nome era evitado, e quando finalmente invocado, a oração sempre era respondida. Pio IX e Leão XIII fortaleceram essa devoção. Padroeiro dos hospitais e da polícia de Chicago.'
where gcatholic_person_id = 69201;

-- Rank 9 — São Jorge
update public.santos set
  slug = 'sao-jorge',
  popularidade_rank = 9,
  nome = 'São Jorge',
  invocacao = 'São Jorge, guerreiro fiel, rogai por nós',
  patronatos = array['Inglaterra', 'Portugal', 'soldados', 'escoteiros', 'cavaleiros'],
  oracao_curta = E'São Jorge, valente cavaleiro de Cristo,\nque enfrentastes o dragão e venceram as forças do mal,\ndefendei-me nas batalhas espirituais,\ndai-me coragem na fé\ne fidelidade até a morte.\nAmém.',
  biografia_curta = E'São Jorge foi oficial romano, cristão, martirizado em Nicomédia (atual Turquia) cerca de 303 d.C., durante a perseguição de Diocleciano. Recusou-se a sacrificar aos deuses pagãos e sofreu tormentos antes da decapitação.\n\nA lenda medieval do cavaleiro que mata o dragão para salvar a princesa — símbolo alegórico da luta contra o mal — difundiu sua devoção no Ocidente a partir das Cruzadas. Padroeiro da Inglaterra, Portugal, Geórgia e Catalunha. Festa: 23 de abril. No Brasil, sua devoção é particularmente forte e o calendário da CNBB mantém memória obrigatória.'
where gcatholic_person_id = 69135;

-- Rank 10 — Santa Rita de Cássia
update public.santos set
  slug = 'santa-rita-de-cassia',
  popularidade_rank = 10,
  nome = 'Santa Rita de Cássia',
  invocacao = 'Santa Rita de Cássia, rogai por nós',
  patronatos = array['causas impossíveis', 'mães', 'esposas sofredoras', 'mulheres'],
  oracao_curta = E'Santa Rita,\nadvogada das causas impossíveis,\nvós que tanto sofrestes em silêncio,\nalcançai-me a graça que humildemente vos peço.\nEnsinai-me a paciência no sofrimento\ne a confiança na Divina Providência.\nAmém.',
  biografia_curta = E'Margarita Lotti nasceu em Roccaporena, Itália, em 1381. Casada por obediência aos pais com um homem violento, suportou o matrimônio com paciência por 18 anos, convertendo o marido antes que ele fosse assassinado. Após perder também os dois filhos, entrou no mosteiro agostiniano de Cássia, onde viveu 40 anos.\n\nRecebeu um estigma na testa — espinho da coroa de Cristo, oferecido por ela. Morreu em 1457. Canonizada por Leão XIII em 1900. É invocada para causas impossíveis, especialmente por mulheres em situações de matrimônio difícil ou doença grave. Festa: 22 de maio.'
where gcatholic_person_id = 68222;

-- Rank 14 — São Padre Pio
update public.santos set
  slug = 'padre-pio',
  popularidade_rank = 14,
  nome = 'São Padre Pio de Pietrelcina',
  invocacao = 'São Padre Pio, rogai por nós',
  patronatos = array['alívio em sofrimento', 'jovens', 'adolescentes', 'voluntários civis'],
  oracao_curta = E'São Padre Pio,\nque carregastes no corpo as chagas de Cristo\ne no coração o peso de tantas almas,\nintercedei por mim junto ao Senhor.\nObtende-me a graça do arrependimento sincero\ne a força para perseverar no amor de Deus.\nAmém.',
  biografia_curta = E'Francesco Forgione nasceu em Pietrelcina (Itália) em 1887. Entrou para os Capuchinhos aos 15 anos e foi ordenado sacerdote em 1910. Viveu no convento de San Giovanni Rotondo, onde exerceu o ministério da confissão por mais de 50 anos — muitas vezes passando 12 horas no confessionário.\n\nRecebeu os estigmas visíveis em 1918, que conservou até dois dias antes de sua morte em 1968. Fundou em San Giovanni Rotondo a "Casa Alívio do Sofrimento", um dos maiores hospitais da Itália. Canonizado por João Paulo II em 2002. Festa: 23 de setembro.'
where gcatholic_person_id = 67248;

-- Rank 15 — São João Paulo II (registro sem gcatholic_person_id)
update public.santos set
  slug = 'sao-joao-paulo-ii',
  popularidade_rank = 15,
  nome = 'São João Paulo II',
  invocacao = 'São João Paulo II, rogai por nós',
  patronatos = array['jovens', 'famílias', 'Jornada Mundial da Juventude', 'Polônia'],
  oracao_curta = E'São João Paulo II,\ndo céu abençoai-nos.\nDai à Igreja pastores santos,\nàs famílias fidelidade,\naos jovens coragem para seguir Cristo.\nEnsinai-nos a não ter medo\ne a abrir as portas ao Redentor.\nAmém.',
  biografia_curta = E'Karol Józef Wojtyła nasceu em Wadowice (Polônia) em 1920. Viveu a ocupação nazista e comunista da Polônia. Ordenado sacerdote em 1946, tornou-se arcebispo de Cracóvia em 1964 e cardeal em 1967. Participou do Concílio Vaticano II.\n\nEleito Papa em 1978 — o primeiro não-italiano em 455 anos —, guiou a Igreja por 27 anos, o segundo pontificado mais longo da história. Sofreu atentado em 1981 e perdoou seu algoz. Instituiu a Jornada Mundial da Juventude e o Dia da Divina Misericórdia. Morreu em 2 de abril de 2005. Canonizado por Francisco em 2014. Festa: 22 de outubro.'
where slug = 'papa-joao-paulo-ii' or gcatholic_uid = 'https://gcatholic.org/saints/data/papa-joao-paulo-ii';

-- Rank 16 — Madre Teresa de Calcutá
update public.santos set
  slug = 'madre-teresa-de-calcuta',
  popularidade_rank = 16,
  nome = 'Santa Madre Teresa de Calcutá',
  invocacao = 'Santa Madre Teresa, rogai por nós',
  patronatos = array['pobres', 'moribundos', 'missionárias da caridade', 'Índia'],
  oracao_curta = E'Santa Madre Teresa de Calcutá,\namiga dos pobres e moribundos,\nensinai-me a ver o rosto de Cristo\nem cada pessoa que sofre.\nDai-me um coração disponível,\nmãos que servem\ne fé para amar até doer.\nAmém.',
  biografia_curta = E'Agnes Gonxha Bojaxhiu nasceu em Skopje (hoje Macedônia do Norte) em 1910, de família albanesa. Entrou para as Irmãs de Loreto e foi enviada a Calcutá (Índia) em 1929, onde ensinou por 20 anos em um colégio.\n\nEm 1946 recebeu "chamada dentro da chamada" para servir os mais pobres dos pobres nas ruas de Calcutá. Fundou em 1950 as Missionárias da Caridade, que hoje atuam em mais de 130 países. Nobel da Paz em 1979. Morreu em 1997. Canonizada por Francisco em 2016. Festa: 5 de setembro — data do seu nascimento para o céu.'
where gcatholic_person_id = 59824;

-- Rank 17 — Santa Teresa d'Ávila
update public.santos set
  slug = 'santa-teresa-davila',
  popularidade_rank = 17,
  nome = 'Santa Teresa d''Ávila',
  invocacao = 'Santa Teresa de Jesus, rogai por nós',
  patronatos = array['Espanha', 'doentes', 'orantes', 'escritores católicos', 'carmelitas'],
  oracao_curta = E'Nada te perturbe,\nnada te espante,\ntudo passa,\nDeus não muda.\nA paciência tudo alcança;\nquem a Deus tem,\nnada lhe falta:\nsó Deus basta.\nAmém.',
  biografia_curta = E'Teresa de Cepeda y Ahumada nasceu em Ávila (Espanha) em 1515. Entrou para o Carmelo aos 20 anos. Após 18 anos de vida religiosa mediana, teve uma conversão profunda diante de uma imagem de Cristo chagado. Iniciou a reforma carmelita — o Carmelo Descalço — junto com São João da Cruz.\n\nFundou 17 conventos reformados. Escreveu obras místicas fundamentais: "O Livro da Vida", "Caminho de Perfeição" e "As Moradas". Canonizada em 1622. Primeira mulher declarada Doutora da Igreja — por Paulo VI em 1970. Festa: 15 de outubro.'
where gcatholic_person_id = 25753;

-- Rank 18 — São Pedro Apóstolo
update public.santos set
  slug = 'sao-pedro-apostolo',
  popularidade_rank = 18,
  nome = 'São Pedro Apóstolo',
  invocacao = 'São Pedro, rogai por nós',
  patronatos = array['pescadores', 'papas', 'pedreiros', 'redes de pesca', 'Roma'],
  oracao_curta = E'São Pedro,\npedra sobre a qual Cristo edificou sua Igreja,\npastor do rebanho que chorou o seu pecado\ne amou o Senhor até o martírio,\nalcançai para nós\nfé firme, arrependimento sincero\ne fidelidade ao Papa, sucessor vosso.\nAmém.',
  biografia_curta = E'Simão, filho de Jonas, pescador de Betsaida, foi chamado por Jesus para ser "pescador de homens". Recebeu o novo nome de Pedro — "pedra" — e a primazia entre os Doze (Mt 16,18-19). Negou o Mestre três vezes na Paixão, chorou amargamente e foi confirmado no amor três vezes após a Ressurreição.\n\nPregou em Antioquia e Roma, onde presidiu a comunidade cristã e foi martirizado crucificado de cabeça para baixo sob Nero, por volta do ano 64 ou 67. Primeiro papa da história. Festa em conjunto com São Paulo: 29 de junho.'
where gcatholic_person_id = 69142;

-- Rank 19 — São Paulo Apóstolo
update public.santos set
  slug = 'sao-paulo-apostolo',
  popularidade_rank = 19,
  nome = 'São Paulo Apóstolo',
  invocacao = 'São Paulo, rogai por nós',
  patronatos = array['evangelização', 'imprensa católica', 'missões', 'teólogos'],
  oracao_curta = E'São Paulo Apóstolo,\nconvertido de perseguidor em pregador,\nvaso de eleição e coluna da Igreja,\nobtende para nós\no zelo ardente pela salvação das almas,\na coragem da verdade\ne a caridade que tudo suporta.\nAmém.',
  biografia_curta = E'Saulo de Tarso, fariseu zeloso, perseguiu os primeiros cristãos. Convertido no caminho de Damasco pela visão do Cristo Ressuscitado (Atos 9), tornou-se o maior missionário da história da Igreja. Fez três grandes viagens missionárias levando o Evangelho a gentios da Ásia Menor, Grécia e até Roma.\n\nEscreveu 13 cartas do Novo Testamento — fundamento teológico do cristianismo primitivo. Martirizado em Roma por decapitação por volta do ano 67, sob Nero. Festa conjunta com São Pedro: 29 de junho. Festa da Conversão: 25 de janeiro.'
where gcatholic_person_id = 69193;

-- Rank 20 — Santo Agostinho
update public.santos set
  slug = 'santo-agostinho',
  popularidade_rank = 20,
  nome = 'Santo Agostinho de Hipona',
  invocacao = 'Santo Agostinho, rogai por nós',
  patronatos = array['teólogos', 'cervejeiros', 'graphics designers', 'filósofos'],
  oracao_curta = E'Tarde vos amei,\nó Beleza tão antiga e tão nova,\ntarde vos amei!\nEstáveis dentro de mim\ne eu fora vos buscava.\nVós me chamastes,\nclamastes e rompestes minha surdez.\nOuso agora dizer: ó Deus, eu vos amo.\nAmém.',
  biografia_curta = E'Aurélio Agostinho nasceu em Tagaste (Norte da África) em 354, filho da cristã Santa Mônica e de pai pagão. Levou vida dissoluta na juventude, aderiu ao maniqueísmo por nove anos. Após longa busca intelectual e espiritual — narrada nas "Confissões" —, converteu-se em Milão aos 32 anos, sob influência de Santo Ambrósio.\n\nOrdenado sacerdote e depois bispo de Hipona, combateu o maniqueísmo, o donatismo e o pelagianismo. Escreveu mais de 100 obras — "A Cidade de Deus", "De Trinitate", as "Confissões". Morreu em 430, durante o cerco vândalo. Doutor da Igreja. Festa: 28 de agosto.'
where gcatholic_person_id = 49738;

-- Rank 21 — São Tomás de Aquino
update public.santos set
  slug = 'sao-tomas-de-aquino',
  popularidade_rank = 21,
  nome = 'São Tomás de Aquino',
  invocacao = 'São Tomás de Aquino, rogai por nós',
  patronatos = array['estudantes', 'universidades católicas', 'teólogos', 'escolas católicas'],
  oracao_curta = E'Concedei-me, ó Deus misericordioso,\ndesejar ardentemente o que vos agrada,\nbuscá-lo com prudência,\nconhecê-lo com verdade\ne cumpri-lo com perfeição,\npara louvor e glória do vosso Nome.\nAmém.',
  biografia_curta = E'Tomás nasceu no castelo de Roccasecca (Itália) em 1225, de família nobre. Contra a oposição da família, entrou na Ordem dos Pregadores (Dominicanos) em 1244. Estudou em Paris e Colônia sob Santo Alberto Magno. Ensinou em Paris, Roma e Nápoles.\n\nSua obra "Suma Teológica" é síntese máxima da teologia católica — integra Aristóteles à revelação cristã. Autor também de hinos litúrgicos para o Corpus Christi (Pange Lingua, Tantum Ergo, Adoro Te Devote). Canonizado em 1323. Declarado "Doutor Angélico" e padroeiro das escolas católicas por Leão XIII (1880). Festa: 28 de janeiro.'
where gcatholic_person_id = 67099;

-- Rank 22 — Santa Clara de Assis
update public.santos set
  slug = 'santa-clara-de-assis',
  popularidade_rank = 22,
  nome = 'Santa Clara de Assis',
  invocacao = 'Santa Clara de Assis, rogai por nós',
  patronatos = array['televisão', 'bordadeiras', 'olhos doentes', 'ourives'],
  oracao_curta = E'Santa Clara,\nluz que seguiste São Francisco na pobreza e na alegria,\nobtende-nos um coração puro,\nos olhos fixos em Cristo,\na humildade no trabalho\ne a perseverança na contemplação.\nAmém.',
  biografia_curta = E'Chiara Offreduccio nasceu em Assis em 1194. Aos 18 anos fugiu do palácio paterno e recebeu de São Francisco o hábito religioso em São Damião, na Páscoa de 1212. Fundou a Segunda Ordem Franciscana — as Clarissas — vivendo em extrema pobreza e contemplação.\n\nDefendeu o "Privilégio da Pobreza" contra as resistências de sucessivos papas, conseguindo finalmente sua aprovação dois dias antes de morrer, em 1253. Canonizada em 1255. Declarada padroeira da televisão por Pio XII em 1958 (episódio místico em que via de longe a Missa da Basílica). Festa: 11 de agosto.'
where gcatholic_person_id = 68712;

-- Rank 23 — Santa Joana d'Arc
update public.santos set
  slug = 'santa-joana-darc',
  popularidade_rank = 23,
  nome = 'Santa Joana d''Arc',
  invocacao = 'Santa Joana d''Arc, rogai por nós',
  patronatos = array['França', 'soldados', 'prisioneiros', 'vítimas de estupro', 'mulheres guerreiras'],
  oracao_curta = E'Santa Joana d''Arc,\nvirgem corajosa,\nque ouviste a voz de Deus e obedeceste até o fim,\nalcançai-me a graça de cumprir a vontade do Pai\ncom fidelidade,\nmesmo quando o mundo me condenar.\nAmém.',
  biografia_curta = E'Jeanne d''Arc nasceu em Domrémy (França) em 1412, filha de camponeses. Aos 13 anos começou a ouvir vozes — que identificou como São Miguel, Santa Catarina e Santa Margarida — pedindo que libertasse a França dos ingleses na Guerra dos Cem Anos.\n\nAos 17 anos liderou o exército francês, libertou Orleans e fez coroar o rei Carlos VII em Reims. Capturada pelos borgonheses, vendida aos ingleses, julgada por um tribunal eclesiástico corrupto e queimada viva em Ruão em 1431, aos 19 anos. Reabilitada 25 anos depois. Canonizada por Bento XV em 1920. Festa: 30 de maio.'
where gcatholic_person_id = 68118;

-- Rank 24 — São Bento
update public.santos set
  slug = 'sao-bento',
  popularidade_rank = 24,
  nome = 'São Bento de Núrsia',
  invocacao = 'São Bento, rogai por nós',
  patronatos = array['Europa', 'monges', 'engenheiros', 'estudantes', 'contra o mal'],
  oracao_curta = E'A Cruz Sagrada seja minha luz,\nnão seja o demônio meu guia.\nAfasta-te, Satanás,\nnunca me aconselhes coisas vãs.\nÉ mau o que me ofereces,\nbebe tu mesmo o teu veneno.\nAmém.',
  biografia_curta = E'Bento nasceu em Núrsia (Itália) cerca de 480. Estudou em Roma, mas horrorizado com o relaxamento moral da cidade, retirou-se para a vida eremítica em Subiaco. Fundou doze mosteiros e, em 529, o célebre mosteiro de Monte Cassino, onde compôs a Regra de São Bento — base do monasticismo ocidental.\n\nSua fórmula "Ora et Labora" (reza e trabalha) formou a Europa cristã durante mil anos. Morreu por volta de 547. Declarado Padroeiro da Europa por Paulo VI em 1964. A Medalha de São Bento é usada como sacramental de proteção contra o mal. Festa: 11 de julho.'
where gcatholic_person_id = 25751;

-- Rank 25 — São Maximiliano Kolbe
update public.santos set
  slug = 'sao-maximiliano-kolbe',
  popularidade_rank = 25,
  nome = 'São Maximiliano Maria Kolbe',
  invocacao = 'São Maximiliano Kolbe, rogai por nós',
  patronatos = array['prisioneiros', 'famílias', 'jornalistas', 'viciados em drogas', 'pro-vida'],
  oracao_curta = E'São Maximiliano Kolbe,\nmártir do amor,\nque destes a vida por um irmão desconhecido,\nalcançai para mim a coragem de amar até o fim,\na devoção filial à Virgem Imaculada\ne o zelo pela salvação das almas.\nAmém.',
  biografia_curta = E'Rajmund Kolbe nasceu em Zduńska Wola (Polônia) em 1894. Entrou para os Franciscanos Conventuais aos 16 anos e recebeu o nome religioso de Maximiliano Maria. Fundou a Milícia da Imaculada em 1917 e o jornal "O Cavaleiro da Imaculada" (milhões de exemplares).\n\nPreso pelos nazistas e enviado a Auschwitz em 1941. Quando um pai de família foi condenado à morte no bunker da fome, Maximiliano ofereceu-se em seu lugar. Morreu com injeção de ácido fenólico em 14 de agosto de 1941. Canonizado como mártir por João Paulo II em 1982 (o pai de família salvo, Franciszek Gajowniczek, estava presente). Festa: 14 de agosto.'
where gcatholic_person_id = 67214;

-- Rank 26 — Santa Faustina Kowalska
update public.santos set
  slug = 'santa-faustina',
  popularidade_rank = 26,
  nome = 'Santa Faustina Kowalska',
  invocacao = 'Jesus, eu confio em vós',
  patronatos = array['Divina Misericórdia', 'pecadores arrependidos'],
  oracao_curta = E'Eterno Pai,\neu vos ofereço o Corpo e o Sangue,\na Alma e a Divindade de vosso diletíssimo Filho,\nnosso Senhor Jesus Cristo,\nem expiação dos nossos pecados e dos do mundo inteiro.\nPela Sua dolorosa Paixão,\ntende misericórdia de nós e do mundo inteiro.\nAmém.',
  biografia_curta = E'Helena Kowalska nasceu em Głogowiec (Polônia) em 1905, terceira de dez filhos de família camponesa. Entrou para a Congregação das Irmãs da Mãe de Deus da Misericórdia aos 20 anos, recebendo o nome de Maria Faustina.\n\nA partir de 1931, teve revelações místicas de Jesus, que lhe pediu para divulgar a devoção à Divina Misericórdia — a imagem "Jesus, eu confio em vós", o Terço da Divina Misericórdia, a Festa da Divina Misericórdia (primeiro domingo após a Páscoa). Registrou tudo em seu "Diário". Morreu em 1938. Canonizada por João Paulo II em 2000 — primeira canonização do terceiro milênio. Festa: 5 de outubro.'
where gcatholic_person_id = 67238;

-- Rank 27 — Santa Dulce dos Pobres
update public.santos set
  slug = 'santa-dulce-dos-pobres',
  popularidade_rank = 27,
  nome = 'Santa Dulce dos Pobres',
  invocacao = 'Santa Dulce, rogai por nós',
  patronatos = array['pobres do Brasil', 'doentes', 'Bahia', 'obras sociais'],
  oracao_curta = E'Santa Dulce dos Pobres,\nanjo bom da Bahia,\nvós que abraçastes os mais abandonados\ne neles reconhecestes o Cristo sofredor,\nalcançai-me um coração compassivo,\nmãos que servem\ne fé que tudo crê e espera.\nAmém.',
  biografia_curta = E'Maria Rita de Sousa Brito Lopes Pontes nasceu em Salvador (BA) em 1914. Aos 13 anos já atendia pobres e doentes na porta de casa. Entrou para as Missionárias da Imaculada Conceição em 1933 e tornou-se Irmã Dulce.\n\nEm 1939 ocupou galinheiros abandonados para acolher doentes pobres — embrião das Obras Sociais Irmã Dulce, que hoje atendem milhares de pessoas. Indicada ao Nobel da Paz em 1988. Morreu em Salvador em 1992. Beatificada em 2011 e canonizada por Francisco em 2019 — primeira mulher santa nascida no Brasil. Festa: 13 de agosto.'
where gcatholic_person_id = 67211;

-- Rank 28 — São Frei Galvão
update public.santos set
  slug = 'sao-frei-galvao',
  popularidade_rank = 28,
  nome = 'São Frei Galvão',
  invocacao = 'São Frei Galvão, rogai por nós',
  patronatos = array['Brasil', 'gestantes', 'pacientes difíceis', 'São Paulo'],
  oracao_curta = E'Ó Deus, que destes a São Frei Galvão\nabundantes graças de oração e caridade,\nconcedei-me, por sua intercessão,\nafastar de mim todos os males,\nsaúde do corpo e da alma\ne o dom de confiar em vossa Providência.\nAmém.',
  biografia_curta = E'Antônio de Sant''Ana Galvão nasceu em Guaratinguetá (SP) em 1739. Entrou para os Franciscanos aos 21 anos e foi ordenado sacerdote em 1762. Conselheiro espiritual de religiosas e leigos em São Paulo, fundou o Recolhimento de Santa Teresa (hoje Mosteiro da Luz).\n\nFicou célebre pelas "pílulas de Frei Galvão" — pequenos papéis enrolados com o nome de Maria, distribuídos a gestantes com complicações e doentes, com inúmeros relatos de cura. Morreu em 1822 em São Paulo. Beatificado em 1998, foi canonizado por Bento XVI em 2007 — primeiro santo nascido no Brasil. Festa: 25 de outubro (conforme CNBB).'
where gcatholic_person_id = 67260;

-- Rank 29 — Santa Paulina
update public.santos set
  slug = 'santa-paulina',
  popularidade_rank = 29,
  nome = 'Santa Paulina do Coração Agonizante de Jesus',
  invocacao = 'Santa Paulina, rogai por nós',
  patronatos = array['Brasil', 'doentes de diabetes', 'imigrantes italianos', 'Santa Catarina'],
  oracao_curta = E'Santa Paulina,\nque tanto amastes os doentes e abandonados,\nensinai-me a servir os pobres com ternura\ne a oferecer o sofrimento com o olhar fixo\nno Coração Agonizante de Jesus.\nAlcançai-me a graça que vos peço.\nAmém.',
  biografia_curta = E'Amabile Lucia Visintainer nasceu em Vigolo Vattaro (Império Austríaco, hoje Itália) em 1865. Aos 10 anos emigrou com a família para Vigolo (SC), no Brasil. Aos 20 anos, com Virgínia Rosa Nicolodi, fundou em Nova Trento a Congregação das Pequenas Irmãs da Imaculada Conceição — primeira congregação religiosa fundada no Brasil.\n\nSofreu longos anos de doença (diabetes). Morreu em São Paulo em 1942. Beatificada por João Paulo II no Rio Grande do Sul em 1991 e canonizada por ele em 2002 — primeira santa nascida em solo brasileiro. Festa: 9 de julho.'
where gcatholic_person_id = 73560;

-- Rank 30 — Santa Luzia
update public.santos set
  slug = 'santa-luzia',
  popularidade_rank = 30,
  nome = 'Santa Luzia',
  invocacao = 'Santa Luzia, rogai por nós',
  patronatos = array['cegos', 'doentes dos olhos', 'oculistas', 'eletricistas', 'Siracusa'],
  oracao_curta = E'Santa Luzia,\nvirgem e mártir,\nque oferecestes os olhos antes de renegar a fé,\nalcançai-me a luz do corpo e do espírito:\nos olhos da fé para ver a Cristo,\nos olhos da alma para discernir a vontade de Deus.\nAmém.',
  biografia_curta = E'Luzia nasceu em Siracusa (Sicília) cerca de 283, de família nobre cristã. Consagrou virgindade a Deus secretamente. Denunciada como cristã por um pretendente rejeitado, foi levada ao tribunal de Diocleciano e torturada. A tradição diz que arrancou os próprios olhos para entregar ao pretendente — daí o patronato da visão.\n\nFoi martirizada por volta de 304. Seu nome está no Cânon Romano da Missa. Festa: 13 de dezembro — data em que, pelo calendário juliano antigo, era o solstício de inverno (daí a associação "Luzia/luz" e as festividades escandinavas de Santa Lucia).'
where gcatholic_person_id = 69123;

-- Log final
do $$
declare
  total int;
begin
  select count(*) into total from public.santos where popularidade_rank is not null;
  raise notice 'Top santos com popularidade_rank: %', total;
end $$;

commit;
