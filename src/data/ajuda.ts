/**
 * Central de Ajuda — fonte única de verdade.
 *
 * Cada `AjudaFeature` vira uma página em `/ajuda/[categoria]/[slug]`.
 * Atualizar texto aqui propaga pra home, lista de categoria, página
 * individual e busca. Categorias usam verbos (Rezar, Estudar...) pra
 * ficar amigável ao usuário final, não a estrutura técnica.
 */

export type AjudaCategoriaSlug =
  | 'rezar'
  | 'estudar'
  | 'conviver'
  | 'encontrar'
  | 'voce'
  | 'avisos'

export interface AjudaCategoria {
  slug: AjudaCategoriaSlug
  titulo: string
  descricao: string
  icone: AjudaIcone
}

export type AjudaIcone =
  | 'BookOpen'
  | 'Heart'
  | 'Users'
  | 'MapPin'
  | 'User'
  | 'Bell'
  | 'Cross'
  | 'Sparkles'
  | 'Calendar'
  | 'Search'
  | 'Scale'
  | 'Shield'
  | 'HandHeart'
  | 'UserCheck'
  | 'Network'
  | 'GraduationCap'
  | 'Crown'
  | 'MessageCircle'
  | 'Hash'
  | 'Flag'
  | 'HandHelping'
  | 'Award'
  | 'Map'
  | 'Building2'
  | 'PlusCircle'
  | 'Edit3'
  | 'Camera'
  | 'Target'
  | 'Trophy'
  | 'Compass'
  | 'Mail'
  | 'NotebookPen'
  | 'IdCard'
  | 'CreditCard'
  | 'Lock'
  | 'LogOut'
  | 'Sprout'
  | 'BellRing'
  | 'Settings'
  | 'Smartphone'

export interface AjudaFeature {
  slug: string
  categoria: AjudaCategoriaSlug
  titulo: string
  resumo: string
  comoAcessar: string
  passos: string[]
  dicas?: string[]
  rota?: string
  icone: AjudaIcone
}

export const CATEGORIAS: AjudaCategoria[] = [
  {
    slug: 'rezar',
    titulo: 'Rezar',
    descricao: 'Rosário, novenas, orações e devoções diárias.',
    icone: 'Cross',
  },
  {
    slug: 'estudar',
    titulo: 'Estudar',
    descricao: 'Trilhas, formação, biblioteca e mapas conceituais.',
    icone: 'BookOpen',
  },
  {
    slug: 'conviver',
    titulo: 'Conviver',
    descricao: 'Comunidade, posts, pedidos de oração e graças.',
    icone: 'Users',
  },
  {
    slug: 'encontrar',
    titulo: 'Encontrar',
    descricao: 'Paróquias, missas, confissões e mapa.',
    icone: 'MapPin',
  },
  {
    slug: 'voce',
    titulo: 'Você',
    descricao: 'Perfil, conta, conquistas, intenções e assinatura.',
    icone: 'User',
  },
  {
    slug: 'avisos',
    titulo: 'Avisos',
    descricao: 'Notificações, alertas e preferências.',
    icone: 'Bell',
  },
]

export const FEATURES: AjudaFeature[] = [
  // ============================================================
  // REZAR
  // ============================================================
  {
    slug: 'hub-rezar',
    categoria: 'rezar',
    titulo: 'Hub Rezar',
    resumo: 'Sua tela central de oração com tudo do dia.',
    comoAcessar: 'Aba inferior "Rezar" ou abrir o app já te leva pra cá.',
    rota: '/rezar',
    icone: 'Cross',
    passos: [
      'No topo aparecem seus propósitos ativos e a invocação ao seu santo de devoção.',
      'No meio: a liturgia do dia, novenas em curso e o santo do dia.',
      'Embaixo: orações essenciais (Pai-Nosso, Ave-Maria, Glória, Credo).',
      'Em horário noturno (22h–5h) aparece o card de Oração da Noite.',
      'No dia da festa do seu santo, um banner especial substitui a invocação comum.',
    ],
    dicas: [
      'Se mudar seu santo de devoção em /perfil, a invocação aqui muda no mesmo instante.',
    ],
  },
  {
    slug: 'rosario',
    categoria: 'rezar',
    titulo: 'Santo Rosário',
    resumo: 'Reze o terço com mistérios meditados e progresso visual.',
    comoAcessar: 'Hub Rezar → Terço, ou diretamente em /rosario.',
    rota: '/rosario',
    icone: 'Sparkles',
    passos: [
      'Escolha o mistério (Gozosos, Luminosos, Dolorosos, Gloriosos) — o app já sugere o do dia.',
      'Cada conta avança com um toque; segure no centro pra meditar mais tempo.',
      'A oração principal de cada dezena aparece automaticamente.',
      'Ao concluir o terço, ele é registrado no seu progresso e pode liberar selos.',
    ],
    dicas: [
      'Você pode oferecer o terço por uma intenção específica antes de começar.',
    ],
  },
  {
    slug: 'novenas',
    categoria: 'rezar',
    titulo: 'Novenas',
    resumo: 'Rezas de 9 dias, tradicionais ou personalizadas, com lembrete diário.',
    comoAcessar: 'Hub Rezar → Novenas, ou /novenas.',
    rota: '/novenas',
    icone: 'Heart',
    passos: [
      'Em /novenas escolha entre as novenas pré-programadas (Sagrado Coração, Imaculada, etc).',
      'Toque "Começar" e ofereça uma intenção — ela aparece no topo todos os dias.',
      'Em /novenas/custom você cria uma novena 100% sua, com texto próprio e intenção.',
      'Em /novenas/minhas vê quais estão em curso e o dia que está rezando hoje.',
      'Em /novenas/historico vê todas as concluídas — pode revisitar a graça pedida.',
    ],
    dicas: [
      'Ative as notificações de oração pra receber lembrete diário até completar os 9 dias.',
    ],
  },
  {
    slug: 'oracoes',
    categoria: 'rezar',
    titulo: 'Biblioteca de Orações',
    resumo: 'Acervo de orações católicas tradicionais, com áudio e bilíngue.',
    comoAcessar: 'Hub Rezar → Orações, ou /oracoes.',
    rota: '/oracoes',
    icone: 'BookOpen',
    passos: [
      'Filtre por categoria: essenciais, do dia a dia, da Missa, ocasiões especiais.',
      'Toque numa oração pra abrir o texto completo.',
      'Botão de favorito (coração) salva pra acesso rápido na strip do topo.',
      'Algumas têm áudio — toque no play pra rezar acompanhando.',
      'Algumas têm versão em latim — alterne com o seletor de idioma.',
      'Use o botão de compartilhar pra mandar o texto a outra pessoa.',
    ],
  },
  {
    slug: 'exame-consciencia',
    categoria: 'rezar',
    titulo: 'Exame de Consciência',
    resumo: 'Guia passo a passo pra preparar a confissão.',
    comoAcessar: 'Hub Rezar → Exame, ou /exame-consciencia.',
    rota: '/exame-consciencia',
    icone: 'Scale',
    passos: [
      'O exame percorre os Dez Mandamentos, um a um.',
      'Em cada mandamento aparecem perguntas-guia para reflexão.',
      'Marque o que se aplica — fica privado, só você vê.',
      'Ao final, o app monta um resumo pra você levar à confissão.',
      'Após a confissão, toque "Limpar" pra reiniciar pro próximo exame.',
    ],
    dicas: [
      'Os dados ficam só no seu dispositivo — nada é enviado a servidor.',
    ],
  },
  {
    slug: 'liturgia',
    categoria: 'rezar',
    titulo: 'Liturgia do Dia',
    resumo: 'Leituras da Missa, salmo, evangelho e comentário.',
    comoAcessar: 'Biblioteca → Leituras do dia, ou /liturgia.',
    rota: '/liturgia',
    icone: 'BookOpen',
    passos: [
      'A página abre direto nas leituras de hoje.',
      'Você vê primeira leitura, salmo, segunda (quando houver) e evangelho.',
      'Comentários patrísticos e do Magistério aparecem abaixo do evangelho.',
      'No topo aparece o tempo litúrgico atual (Advento, Quaresma, Comum, etc).',
    ],
  },
  {
    slug: 'calendario-liturgico',
    categoria: 'rezar',
    titulo: 'Calendário Litúrgico',
    resumo: 'Veja santos, festas e tempos do ano litúrgico.',
    comoAcessar: 'Biblioteca → Calendário litúrgico, ou /calendario.',
    rota: '/calendario',
    icone: 'Calendar',
    passos: [
      'Navegue pelos meses com as setas do topo.',
      'Cada dia mostra santos do dia, solenidades, festas e memórias.',
      'Toque num dia pra ver os detalhes daquela data.',
      'Cor de fundo indica o tempo litúrgico (verde, roxo, branco, vermelho).',
    ],
  },
  {
    slug: 'santos',
    categoria: 'rezar',
    titulo: 'Santos e Beatos',
    resumo: 'Catálogo de mais de 1.000 santos com biografia e patronato.',
    comoAcessar: 'Biblioteca → Santos, ou /santos.',
    rota: '/santos',
    icone: 'Crown',
    passos: [
      'Use a busca pra encontrar por nome ou patronato (ex: "padroeiro dos estudantes").',
      'Cada santo tem biografia, data da festa, patronatos e uma oração principal.',
      'Toque "Escolher como devoção" pra que ele apareça no seu hub e perfil.',
      'Você pode trocar de santo de devoção quando quiser.',
    ],
  },

  // ============================================================
  // ESTUDAR
  // ============================================================
  {
    slug: 'biblioteca',
    categoria: 'estudar',
    titulo: 'Biblioteca',
    resumo: 'Hub gratuito de consulta: Bíblia, catecismo, dogmas e mais.',
    comoAcessar: 'Aba inferior "Biblioteca" ou /biblioteca.',
    rota: '/biblioteca',
    icone: 'BookOpen',
    passos: [
      'A página é um índice — escolha qual referência você precisa.',
      'Tirar dúvidas → busca por IA com fontes.',
      'Leituras do dia → liturgia da Missa.',
      'Calendário litúrgico → santos e festas.',
      'Catecismo Pio X, Mandamentos, Preceitos, Virtudes, Obras de Misericórdia, Doutores da Igreja.',
    ],
    dicas: [
      'Tudo aqui é gratuito. Trilhas com progresso e quizzes ficam em /formacao (Premium).',
    ],
  },
  {
    slug: 'buscar-ia',
    categoria: 'estudar',
    titulo: 'Tirar dúvidas com IA',
    resumo: 'Pergunte sobre fé católica e receba resposta com fontes.',
    comoAcessar: 'Biblioteca → Tirar dúvidas, ou /buscar.',
    rota: '/buscar',
    icone: 'Search',
    passos: [
      'Digite sua dúvida com naturalidade ("é pecado faltar à missa de domingo?").',
      'A IA responde citando Bíblia, Magistério, Padres da Igreja e doutores.',
      'Sugestões prontas no topo ajudam quando você não sabe por onde começar.',
      'Cada fonte é clicável — você pode aprofundar onde quiser.',
    ],
    dicas: [
      'A IA não substitui um confessor. Para casos pessoais, busque um padre.',
    ],
  },
  {
    slug: 'formacao',
    categoria: 'estudar',
    titulo: 'Formação',
    resumo: 'Hub de estudo estruturado com trilhas, dogmas e doutores.',
    comoAcessar: 'Aba inferior "Estudar" ou /formacao.',
    rota: '/formacao',
    icone: 'GraduationCap',
    passos: [
      'Veja todas as trilhas disponíveis com progresso visual.',
      'Acesse os blocos de Dogmas, Sacramentos e Doutores da Igreja.',
      'Tudo o que você completa fica registrado em /meu-estudo.',
    ],
    dicas: [
      'Trilhas são conteúdo Premium. Material de referência fica em /biblioteca (gratuito).',
    ],
  },
  {
    slug: 'trilhas',
    categoria: 'estudar',
    titulo: 'Trilhas de Aprendizado',
    resumo: 'Cursos sequenciais com aulas, leituras e quiz ao final.',
    comoAcessar: 'Formação → Trilhas, ou /trilhas.',
    rota: '/trilhas',
    icone: 'Compass',
    passos: [
      'Escolha uma trilha pelo tema (introdução à fé, sacramentos, vida moral, etc).',
      'As lições vêm em ordem — só destrava a próxima depois de completar a anterior.',
      'No fim da trilha tem um quiz que valida seu aprendizado.',
      'Completar libera selos em /perfil?tab=reliquias e XP no /mapa.',
    ],
  },
  {
    slug: 'dogmas',
    categoria: 'estudar',
    titulo: 'Dogmas da Igreja',
    resumo: 'As verdades de fé infalíveis, organizadas por tema.',
    comoAcessar: 'Formação → Dogmas, ou /estudo/dogmas.',
    rota: '/estudo/dogmas',
    icone: 'Cross',
    passos: [
      'Os dogmas estão divididos por categorias (trinitários, marianos, sacramentais, etc).',
      'Toque um dogma pra ver definição precisa, contexto histórico e fundamento.',
      'Use isto como referência rápida pra debates ou estudo aprofundado.',
    ],
  },
  {
    slug: 'sacramentos',
    categoria: 'estudar',
    titulo: 'Sacramentos',
    resumo: 'Os sete sacramentos: matéria, forma, ministro, efeitos.',
    comoAcessar: 'Formação → Sacramentos, ou /estudo/sacramentos.',
    rota: '/estudo/sacramentos',
    icone: 'Sparkles',
    passos: [
      'Veja a lista dos sete sacramentos.',
      'Cada um detalha matéria, forma, ministro válido, efeitos e disposições requeridas.',
      'Útil pra preparar Batismo, Crisma, Casamento ou Ordens.',
    ],
  },
  {
    slug: 'mandamentos',
    categoria: 'estudar',
    titulo: 'Dez Mandamentos',
    resumo: 'A lei de Deus mandamento por mandamento, com aplicação.',
    comoAcessar: 'Biblioteca → Dez Mandamentos, ou /estudo/mandamentos.',
    rota: '/estudo/mandamentos',
    icone: 'Scale',
    passos: [
      'Cada mandamento tem texto bíblico, interpretação e exemplos práticos.',
      'Use como base pro Exame de Consciência (também acessível direto pelo Hub Rezar).',
    ],
  },
  {
    slug: 'preceitos',
    categoria: 'estudar',
    titulo: 'Preceitos da Igreja',
    resumo: 'Os 5 preceitos obrigatórios para o fiel católico.',
    comoAcessar: 'Biblioteca → Preceitos da Igreja, ou /estudo/preceitos.',
    rota: '/estudo/preceitos',
    icone: 'Shield',
    passos: [
      'Os 5 preceitos: Missa dominical, confissão anual, comunhão pascal, jejuns/abstinências, sustento da Igreja.',
      'Cada um explica obrigação, exceções e consequências de descumprir.',
    ],
  },
  {
    slug: 'virtudes-pecados',
    categoria: 'estudar',
    titulo: 'Virtudes e Pecados',
    resumo: 'Virtudes teologais, cardeais e os pecados capitais.',
    comoAcessar: 'Biblioteca → Virtudes e pecados, ou /estudo/virtudes-pecados.',
    rota: '/estudo/virtudes-pecados',
    icone: 'Heart',
    passos: [
      'Bloco de virtudes: as 3 teologais (fé, esperança, caridade) e as 4 cardeais.',
      'Bloco de pecados: os 7 capitais com suas raízes e remédios.',
      'Cada item mostra definição, manifestação e a virtude oposta.',
    ],
  },
  {
    slug: 'obras-misericordia',
    categoria: 'estudar',
    titulo: 'Obras de Misericórdia',
    resumo: 'As 14 obras corporais e espirituais.',
    comoAcessar: 'Biblioteca → Obras de Misericórdia, ou /estudo/obras-misericordia.',
    rota: '/estudo/obras-misericordia',
    icone: 'HandHeart',
    passos: [
      '7 obras corporais (dar de comer, vestir, visitar enfermos, etc) e 7 espirituais.',
      'Cada uma tem fundamento bíblico e exemplos contemporâneos.',
    ],
  },
  {
    slug: 'catecismo-pio-x',
    categoria: 'estudar',
    titulo: 'Catecismo de São Pio X',
    resumo: 'O catecismo em pergunta e resposta — direto ao ponto.',
    comoAcessar: 'Biblioteca → Catecismo de São Pio X, ou /catecismo-pio-x.',
    rota: '/catecismo-pio-x',
    icone: 'BookOpen',
    passos: [
      'Conteúdo organizado por seções (fé, mandamentos, sacramentos, oração).',
      'Estilo Q&A — fácil de memorizar.',
      'Útil pra catequese de filhos ou consulta rápida.',
    ],
  },
  {
    slug: 'doutores-igreja',
    categoria: 'estudar',
    titulo: 'Doutores da Igreja',
    resumo: 'Os grandes mestres da teologia: Tomás de Aquino e companhia.',
    comoAcessar: 'Biblioteca → Doutores da Igreja, ou /sao-tomas.',
    rota: '/sao-tomas',
    icone: 'UserCheck',
    passos: [
      'Foco principal em Santo Tomás de Aquino e a Suma Teológica.',
      'Acesso a outros doutores conforme conteúdo é adicionado.',
      'Textos comentados pra facilitar a leitura.',
    ],
  },
  {
    slug: 'verbum',
    categoria: 'estudar',
    titulo: 'VERBUM (Mappa Fidei)',
    resumo: 'Crie mapas conceituais visuais conectando ideias da fé.',
    comoAcessar: 'Aba "Estudar" → Verbum, ou /verbum.',
    rota: '/verbum',
    icone: 'Network',
    passos: [
      'Em /verbum você vê seus fluxos salvos. "Novo fluxo" abre o canvas.',
      'No canvas: arraste conceitos, conecte com setas, agrupe por cor.',
      'Salve, duplique, torne público (compartilha com a comunidade) ou mantenha privado.',
      'Em /verbum/explorar veja mapas públicos de outros usuários — pode duplicar pra adaptar.',
    ],
    dicas: [
      'Ótimo pra preparar uma aula de catequese ou estudar pra prova de teologia.',
    ],
  },
  {
    slug: 'meu-estudo',
    categoria: 'estudar',
    titulo: 'Meu Estudo',
    resumo: 'Dashboard pessoal com tudo o que você está estudando.',
    comoAcessar: 'Diretamente em /meu-estudo.',
    rota: '/meu-estudo',
    icone: 'NotebookPen',
    passos: [
      'Continue de onde parou: último tópico aparece destacado.',
      'Veja trilhas em curso e percentual de conclusão.',
      'Lista de conquistas desbloqueadas pelo estudo.',
    ],
  },
  {
    slug: 'grupos-estudo',
    categoria: 'estudar',
    titulo: 'Grupos de Estudo',
    resumo: 'Estude com amigos, compartilhe anotações e progresso.',
    comoAcessar: 'Diretamente em /estudo/grupos.',
    rota: '/estudo/grupos',
    icone: 'Users',
    passos: [
      'Crie um grupo ou aceite convite por link.',
      'Membros veem o progresso uns dos outros nas trilhas.',
      'Compartilhe anotações dentro do grupo.',
    ],
  },

  // ============================================================
  // CONVIVER
  // ============================================================
  {
    slug: 'comunidade',
    categoria: 'conviver',
    titulo: 'Feed da Comunidade',
    resumo: 'Posts da comunidade católica com curtidas e comentários.',
    comoAcessar: 'Aba inferior "Comunidade" ou /comunidade.',
    rota: '/comunidade',
    icone: 'Users',
    passos: [
      'O feed "Para você" mostra posts do que segue e do que combina com seu perfil.',
      'Curta com o coração, comente, ou guarde com o salvar.',
      'Toque na foto/nome do autor pra ir ao perfil dele.',
      'Botão "Criar post" no canto: escreva texto, marque hashtags e publique.',
    ],
    dicas: [
      'Prefira temas que edifiquem. Conteúdo heterodoxo ou ofensivo pode ser denunciado.',
    ],
  },
  {
    slug: 'criar-post',
    categoria: 'conviver',
    titulo: 'Criar Post',
    resumo: 'Compartilhe reflexões, pedidos ou graças com a comunidade.',
    comoAcessar: 'Botão "+" no feed da Comunidade.',
    rota: '/comunidade',
    icone: 'MessageCircle',
    passos: [
      'Escreva o texto principal — sem limite rígido, mas evite muros gigantes.',
      'Use hashtags (#Eucaristia, #Confissão) pra ser encontrado por interessados.',
      'Pode anexar uma imagem (será comprimida automaticamente).',
      'Publique. Você pode editar ou apagar depois pelo menu do próprio post.',
    ],
  },
  {
    slug: 'seguir-perfis',
    categoria: 'conviver',
    titulo: 'Seguir e Perfis Públicos',
    resumo: 'Acompanhe outros fiéis e tenha seu perfil público.',
    comoAcessar: 'Toque num nome/avatar dentro de qualquer post.',
    rota: '/comunidade',
    icone: 'UserCheck',
    passos: [
      'No perfil de outro usuário, toque "Seguir" — passa a ver os posts dele no feed.',
      'Seu perfil público mostra: avatar, vocação, santo de devoção e seus posts.',
      'Para ver o seu, vá em /comunidade/perfil/[seu-username].',
      'Quem te segue aparece nas suas notificações.',
    ],
  },
  {
    slug: 'hashtags',
    categoria: 'conviver',
    titulo: 'Hashtags',
    resumo: 'Agrupe posts por tema e descubra conversas.',
    comoAcessar: 'Toque numa hashtag dentro de qualquer post.',
    rota: '/comunidade',
    icone: 'Hash',
    passos: [
      'Hashtags são clicáveis em qualquer post.',
      'Te leva pra /comunidade/hashtag/[tag] com todos os posts daquele tema.',
      'Use hashtags ao criar seu próprio post pra ser descoberto.',
    ],
  },
  {
    slug: 'buscar-comunidade',
    categoria: 'conviver',
    titulo: 'Buscar na Comunidade',
    resumo: 'Procure usuários, posts ou hashtags específicas.',
    comoAcessar: 'Ícone de lupa no feed, ou /comunidade/buscar.',
    rota: '/comunidade/buscar',
    icone: 'Search',
    passos: [
      'Digite nome de usuário, palavra-chave ou hashtag.',
      'Resultados separados por tipo (pessoas, posts, tags).',
      'Toque num resultado pra abrir.',
    ],
  },
  {
    slug: 'pedidos-oracao',
    categoria: 'conviver',
    titulo: 'Pedidos de Oração',
    resumo: 'Peça oração da comunidade ou reze pelos pedidos de outros.',
    comoAcessar: 'Diretamente em /pedidos-oracao.',
    rota: '/pedidos-oracao',
    icone: 'HandHelping',
    passos: [
      'Veja a lista de pedidos públicos.',
      'Toque "Vou rezar" pra registrar — o autor é notificado.',
      'Crie seu pedido com botão "+" — pode ser anônimo ou identificado.',
      'Quando receber a graça, atualize o status pra inspirar a comunidade.',
    ],
  },
  {
    slug: 'gracas-recebidas',
    categoria: 'conviver',
    titulo: 'Graças Recebidas',
    resumo: 'Testemunhos de graças concedidas pela intercessão.',
    comoAcessar: 'Diretamente em /gracas.',
    rota: '/gracas',
    icone: 'Sparkles',
    passos: [
      'Veja graças compartilhadas pela comunidade.',
      'Conte sua graça recebida — pode citar o santo ou novena envolvida.',
      'Inspirações servem pra fortalecer a fé de quem está pedindo agora.',
    ],
  },
  {
    slug: 'denuncias',
    categoria: 'conviver',
    titulo: 'Denúncias e Moderação',
    resumo: 'Reporte conteúdo heterodoxo, ofensivo ou spam.',
    comoAcessar: 'Menu (⋯) de qualquer post ou comentário → Denunciar.',
    rota: '/comunidade',
    icone: 'Flag',
    passos: [
      'Toque o menu de três pontos no post/comentário.',
      'Escolha "Denunciar" e selecione o motivo (heterodoxia, ofensa, spam, outro).',
      'Adicione contexto se quiser.',
      'A moderação revisa e age conforme as regras da comunidade.',
    ],
    dicas: [
      'Denúncia é anônima — o autor não sabe quem reportou.',
    ],
  },

  // ============================================================
  // ENCONTRAR
  // ============================================================
  {
    slug: 'igrejas',
    categoria: 'encontrar',
    titulo: 'Catálogo de Igrejas',
    resumo: 'Lista de paróquias com horários de Missa e confissão.',
    comoAcessar: 'Aba inferior "Igrejas" ou /igrejas.',
    rota: '/igrejas',
    icone: 'Building2',
    passos: [
      'Filtre por nome, cidade ou diocese.',
      'Toque numa paróquia pra ver horários, padre responsável e contato.',
      'Veja a foto da fachada e endereço completo.',
    ],
  },
  {
    slug: 'igrejas-perto',
    categoria: 'encontrar',
    titulo: 'Igrejas Perto de Mim',
    resumo: 'Use sua localização pra achar paróquias próximas.',
    comoAcessar: 'Igrejas → "Perto de mim", ou /paroquias/buscar?mode=nearby.',
    rota: '/paroquias/buscar?mode=nearby',
    icone: 'MapPin',
    passos: [
      'Permita o acesso à localização quando o navegador pedir.',
      'O app lista paróquias num raio configurável.',
      'Cada resultado mostra distância em linha reta.',
      'Toque numa paróquia pra abrir detalhes.',
    ],
    dicas: [
      'Sem GPS? Use a busca por cidade — funciona igualmente bem.',
    ],
  },
  {
    slug: 'mapa-igrejas',
    categoria: 'encontrar',
    titulo: 'Mapa Interativo',
    resumo: 'Veja todas as paróquias num mapa.',
    comoAcessar: 'Diretamente em /mapa.',
    rota: '/mapa',
    icone: 'Map',
    passos: [
      'O mapa abre centrado na sua região.',
      'Pinos indicam paróquias — toque pra preview.',
      'Use pinch (mobile) ou scroll (desktop) pra dar zoom.',
    ],
  },
  {
    slug: 'sugerir-paroquia',
    categoria: 'encontrar',
    titulo: 'Cadastrar Nova Paróquia',
    resumo: 'Adicione uma igreja ao catálogo do app.',
    comoAcessar: 'Igrejas → Sugerir, ou /paroquias/sugerir.',
    rota: '/paroquias/sugerir',
    icone: 'PlusCircle',
    passos: [
      'Preencha nome, endereço, diocese, padre responsável.',
      'Adicione horários de Missa e de confissão.',
      'Suba uma foto da fachada (será comprimida automaticamente).',
      'Envie — passa por moderação antes de aparecer pra todos.',
    ],
  },
  {
    slug: 'minhas-igrejas',
    categoria: 'encontrar',
    titulo: 'Minhas Igrejas',
    resumo: 'Paróquias que você cadastrou ou administra.',
    comoAcessar: 'Diretamente em /conta/minhas-igrejas.',
    rota: '/conta/minhas-igrejas',
    icone: 'Building2',
    passos: [
      'Lista paróquias que você criou ou foi adicionado como gestor.',
      'Toque numa pra editar horários, foto e dados.',
      'Atualize sempre que houver mudança — outros usuários veem em tempo real.',
    ],
  },

  // ============================================================
  // VOCÊ
  // ============================================================
  {
    slug: 'perfil',
    categoria: 'voce',
    titulo: 'Perfil',
    resumo: 'Sua área pessoal com 6 abas: conta, propósitos, selos, avisos, plano, carteirinha.',
    comoAcessar: 'Aba inferior "Perfil" ou /perfil.',
    rota: '/perfil',
    icone: 'User',
    passos: [
      'Topo: avatar, nome, vocação. Toque pra editar.',
      'Abas: Conta, Propósitos, Selos, Notificações, Assinatura, Carteirinha.',
      'Cada aba é independente — seu progresso fica em "Selos", lembretes em "Notificações".',
      'No final da página tem o botão Sair.',
    ],
  },
  {
    slug: 'editar-perfil',
    categoria: 'voce',
    titulo: 'Editar Perfil',
    resumo: 'Mude nome, foto, vocação, capa e dados básicos.',
    comoAcessar: '/perfil → toque no avatar ou aba Conta.',
    rota: '/perfil',
    icone: 'Edit3',
    passos: [
      'Toque na foto pra trocar avatar (compressão automática).',
      'Toque na capa pra escolher o santo de devoção como fundo.',
      'Edite nome de exibição, vocação (leigo, religioso, padre, etc) e bio.',
      'Atualize sacramentos recebidos (Batismo, Crisma, Eucaristia, Casamento, Ordens).',
      'Defina paróquia principal pra aparecer na sua carteirinha.',
    ],
  },
  {
    slug: 'santo-devocao',
    categoria: 'voce',
    titulo: 'Santo de Devoção',
    resumo: 'Escolha um santo pra acompanhar sua caminhada.',
    comoAcessar: 'Em /santos toque "Escolher como devoção"; ou via Editar Perfil.',
    rota: '/santos',
    icone: 'Crown',
    passos: [
      'Em /santos abra o santo desejado.',
      'Toque "Escolher como devoção".',
      'A invocação dele aparece no Hub Rezar.',
      'A foto vira capa do seu perfil.',
      'No dia da festa do santo, banner especial aparece no Rezar.',
      'Você pode trocar quando quiser.',
    ],
  },
  {
    slug: 'propositos',
    categoria: 'voce',
    titulo: 'Propósitos',
    resumo: 'Metas pessoais de oração com acompanhamento diário.',
    comoAcessar: '/perfil → aba Propósitos.',
    rota: '/perfil',
    icone: 'Target',
    passos: [
      'Crie um propósito (ex: "rezar terço todo dia", "missa diária na quaresma").',
      'Defina frequência e duração.',
      'Marque concluído cada dia que cumpre.',
      'O propósito aparece no topo do Hub Rezar enquanto está ativo.',
    ],
  },
  {
    slug: 'reliquias',
    categoria: 'voce',
    titulo: 'Selos / Relíquias',
    resumo: 'Conquistas desbloqueadas por estudo, oração e comunidade.',
    comoAcessar: '/perfil → aba Selos.',
    rota: '/perfil',
    icone: 'Award',
    passos: [
      'Selos têm raridade: comum, rara, épica, lendária.',
      'Você desbloqueia ao concluir trilhas, manter streaks, completar novenas, etc.',
      'Toque num selo pra ver os critérios.',
      'Selos bloqueados ficam visíveis em silhueta — sirvem como meta.',
    ],
  },
  {
    slug: 'mapa-jornada',
    categoria: 'voce',
    titulo: 'Mapa da Jornada',
    resumo: 'Visão visual do seu progresso, nível, XP e streak.',
    comoAcessar: 'Aba "Mapa" ou /mapa.',
    rota: '/mapa',
    icone: 'Map',
    passos: [
      'Topo mostra seu nível atual e XP necessário pro próximo.',
      'Streak = dias consecutivos ativo. Quebra se faltar um dia.',
      'Missão do dia aparece destacada — completá-la dá XP.',
      'Botão "Continuar" leva ao último estudo onde parou.',
      'Selos coletados aparecem aqui também.',
    ],
  },
  {
    slug: 'missao-dia',
    categoria: 'voce',
    titulo: 'Missão do Dia',
    resumo: 'Tarefa diária pra manter constância na fé.',
    comoAcessar: 'Card destacado em /mapa.',
    rota: '/mapa',
    icone: 'Trophy',
    passos: [
      'Cada dia o app sugere uma missão (estudar tópico, rezar terço, ler liturgia).',
      'Concluir conta XP e mantém o streak.',
      'A missão muda à meia-noite (horário local).',
    ],
  },
  {
    slug: 'cartas-santo',
    categoria: 'voce',
    titulo: 'Cartas ao Santo',
    resumo: 'Diálogo epistolar privado com seu santo de devoção.',
    comoAcessar: 'Diretamente em /perfil/cartas.',
    rota: '/perfil/cartas',
    icone: 'Mail',
    passos: [
      'Tradição de Santa Teresinha: escreva como quem fala com um amigo.',
      'Cartas são totalmente privadas — só você vê.',
      'Você pode reler depois pra acompanhar o crescimento espiritual.',
      'Sem limite de quantidade.',
    ],
  },
  {
    slug: 'intencoes',
    categoria: 'voce',
    titulo: 'Minhas Intenções',
    resumo: 'Liste intenções pra oferecer ao Senhor.',
    comoAcessar: 'Diretamente em /perfil/intencoes.',
    rota: '/perfil/intencoes',
    icone: 'NotebookPen',
    passos: [
      'Crie uma intenção com título e descrição.',
      'Estados: aberta, graça recebida, arquivada.',
      'Use o botão de oferecer pra registrar momentos onde você ofereceu por essa intenção.',
      'Quando vier a graça, marque como recebida — fica seu registro pessoal.',
    ],
    dicas: [
      'Diferente de Pedidos de Oração (que são públicos), as intenções são privadas.',
    ],
  },
  {
    slug: 'carteirinha',
    categoria: 'voce',
    titulo: 'Carteirinha Católica',
    resumo: 'Sua identidade católica digital pra mostrar na paróquia.',
    comoAcessar: '/perfil → aba Carteirinha, ou /carteirinha.',
    rota: '/carteirinha',
    icone: 'IdCard',
    passos: [
      'Mostra: nome, foto, vocação, sacramentos recebidos, paróquia, santo de devoção.',
      'Tem QR code que outros usuários do app podem escanear.',
      'Útil em pastoral, retiros, paróquia visitante.',
      'Atualize seus dados em /perfil pra a carteirinha refletir.',
    ],
  },
  {
    slug: 'assinatura',
    categoria: 'voce',
    titulo: 'Assinatura Premium',
    resumo: 'Plano que destrava trilhas, formação completa e VERBUM.',
    comoAcessar: '/perfil → aba Assinatura, ou /planos.',
    rota: '/planos',
    icone: 'CreditCard',
    passos: [
      'Veja o plano atual (gratuito ou Premium) e benefícios.',
      'Em /planos compare opções: mensal, semestral, anual.',
      'Pague com cartão; renovação é automática.',
      'Cancele quando quiser pelo aba Assinatura — acesso continua até o fim do período pago.',
    ],
  },
  {
    slug: 'seguranca',
    categoria: 'voce',
    titulo: 'Segurança',
    resumo: 'Senha, autenticação e sessões ativas.',
    comoAcessar: 'Menu do header (avatar) → Configurações.',
    rota: '/perfil/seguranca',
    icone: 'Lock',
    passos: [
      'Trocar senha: digite a atual e a nova duas vezes.',
      'Ativar 2FA (autenticação de dois fatores) por app autenticador.',
      'Veja sessões ativas em outros dispositivos e encerre as suspeitas.',
    ],
  },
  {
    slug: 'sair',
    categoria: 'voce',
    titulo: 'Sair da Conta',
    resumo: 'Encerre sua sessão neste dispositivo.',
    comoAcessar: 'Menu do header (avatar) → Sair, ou no fim do /perfil.',
    rota: '/perfil',
    icone: 'LogOut',
    passos: [
      'Clique em Sair.',
      'Você é levado pra tela de login.',
      'Outros dispositivos continuam logados — pra deslogar todos use Segurança → Sessões.',
    ],
  },
  {
    slug: 'onboarding',
    categoria: 'voce',
    titulo: 'Onboarding Inicial',
    resumo: 'Configuração em 6 passos quando você cria conta.',
    comoAcessar: 'Automático no primeiro login.',
    rota: '/onboarding',
    icone: 'Sprout',
    passos: [
      'Passo 1: tipo de conta (fiel, religioso, padre, paróquia).',
      'Passo 2: foto de perfil (compressão automática).',
      'Passo 3: vocação detalhada.',
      'Passo 4: santo de devoção.',
      'Passo 5: sacramentos recebidos.',
      'Passo 6: localização (cidade e paróquia preferida).',
    ],
    dicas: [
      'Pode pular qualquer passo e completar depois pelo /perfil.',
    ],
  },

  // ============================================================
  // AVISOS
  // ============================================================
  {
    slug: 'central-notificacoes',
    categoria: 'avisos',
    titulo: 'Central de Notificações',
    resumo: 'Veja, marque como lida e organize suas notificações.',
    comoAcessar: 'Sino no canto superior direito, ou /notificacoes.',
    rota: '/notificacoes',
    icone: 'Bell',
    passos: [
      'Lista cronológica — mais recente no topo.',
      'Não lidas têm marca à esquerda.',
      'Deslize uma notificação pra direita pra marcar como lida.',
      'Deslize pra esquerda pra arquivar/apagar.',
      'Toque pra abrir o conteúdo (post, perfil, novena, etc).',
    ],
  },
  {
    slug: 'configurar-notificacoes',
    categoria: 'avisos',
    titulo: 'Configurar Notificações',
    resumo: 'Escolha quais avisos você quer receber.',
    comoAcessar: '/perfil → aba Notificações.',
    rota: '/perfil',
    icone: 'Settings',
    passos: [
      'Liga/desliga por categoria: comentários, seguidores, pedidos, graças, lembretes.',
      'Configurações granulares — você pode receber comentários mas não seguidores, por exemplo.',
      'Mudanças aplicam imediatamente.',
    ],
  },
  {
    slug: 'push-pwa',
    categoria: 'avisos',
    titulo: 'Notificações Push (Instalar app)',
    resumo: 'Receba avisos mesmo com o app fechado.',
    comoAcessar: 'Banner no topo do feed ou em /perfil.',
    rota: '/perfil',
    icone: 'Smartphone',
    passos: [
      'iOS: abra no Safari → compartilhar → "Adicionar à Tela de Início". Abra pela tela de início e ative push em /perfil.',
      'Android: aparecerá um banner "Instalar app" — toque e siga.',
      'Permita notificações quando solicitado.',
      'Você recebe alertas mesmo com o app fechado.',
      'Ajuste tipos em /perfil → aba Notificações.',
    ],
    dicas: [
      'No iOS, push só funciona em PWA instalado — não funciona no navegador comum.',
    ],
  },
]

export function getCategoria(slug: string): AjudaCategoria | undefined {
  return CATEGORIAS.find((c) => c.slug === slug)
}

export function getFeature(categoriaSlug: string, slug: string): AjudaFeature | undefined {
  return FEATURES.find((f) => f.categoria === categoriaSlug && f.slug === slug)
}

export function getFeaturesByCategoria(slug: AjudaCategoriaSlug): AjudaFeature[] {
  return FEATURES.filter((f) => f.categoria === slug)
}

export function searchFeatures(query: string): AjudaFeature[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return FEATURES.filter((f) => {
    const haystack = [f.titulo, f.resumo, f.comoAcessar, ...f.passos, ...(f.dicas ?? [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  }).slice(0, 20)
}
