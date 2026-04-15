/**
 * Todas as strings da landing em um só lugar.
 * Editar aqui não exige tocar no JSX.
 */

export const HERO_COPY = {
  eyebrow: (dia: string, liturgia: string) => ({ dia, liturgia }),
  titleLine1: 'Liturgia, terço,',
  titleLine2: 'e missa perto de você.',
  lead:
    'Um app católico pra rezar o dia, encontrar sua paróquia e voltar à confissão. Gratuito, sem anúncios.',
  ctaPrimary: 'Encontrar missa perto',
  ctaSecondary: 'Criar conta gratuita',
  alreadyHave: 'Já tenho conta',
  trust: '',
  chipsNearbyLabel: 'Igrejas perto de você',
  chipsIdle: 'Toque pra ver as paróquias mais próximas.',
  chipsLoading: 'Procurando…',
  chipsEmpty: 'Ainda não temos paróquias cadastradas por aqui.',
  scrollCue: 'descer',
  stats: {
    igrejas: 'Igrejas',
    convertidos: 'Convertidos',
    fieis: 'Fiéis',
  },
} as const

export const MANIFESTO_COPY = {
  eyebrow: 'Por que existimos',
  title: 'Feito por católicos, pra católicos.',
  lead:
    'Um lugar simples pra rezar, aprender a fé e viver os sacramentos. Sem propaganda, sem distração, fiel à Igreja.',
  pillars: [
    {
      key: 'fidelidade',
      title: 'Fiel à Igreja',
      body:
        'Seguimos o Magistério, o calendário litúrgico romano e as orações da tradição católica.',
    },
    {
      key: 'clareza',
      title: 'Simples de usar',
      body:
        'Tudo à mão: liturgia, terço, orações, santo do dia. Sem menus confusos.',
    },
    {
      key: 'acolhida',
      title: 'Pra todo mundo',
      body:
        'Pra quem está voltando à fé, pra quem nunca parou e pra quem está começando agora. Este lugar é seu.',
    },
  ],
} as const

export const FINDER_COPY = {
  eyebrow: 'Igrejas',
  title: 'Encontre uma missa',
  titleEm: 'perto de você.',
  lead:
    'Use sua localização ou digite o nome da sua cidade. Mostramos a paróquia, a distância e como chegar.',
  geoIdle: 'Usar minha localização',
  geoLoading: 'Localizando…',
  geoGranted: (label: string) => `Você está em ${label}`,
  geoClear: 'limpar',
  placeholder: 'Digite sua cidade…',
  searchAria: 'Buscar igreja',
  resultsEyebrow: 'Resultado',
  stateInitial: "Toque em \u2018Usar minha localização\u2019 ou digite uma cidade.",
  stateLoading: 'Buscando paróquias…',
  stateEmpty: 'Nada encontrado nessa cidade. Tente uma cidade vizinha.',
} as const

export const DEVOTION_COPY = [
  {
    key: 'liturgia',
    eyebrow: 'Liturgia do Dia',
    title: 'A liturgia de hoje,',
    titleEm: 'de domingo a domingo.',
    description:
      'Leitura, salmo, evangelho e santo do dia. Atualiza todos os dias seguindo o calendário litúrgico romano.',
    href: '/liturgia/hoje',
    features: [
      'Leituras do dia completas',
      'Cor litúrgica do dia',
      'Santo do dia em destaque',
    ],
  },
  {
    key: 'oracoes',
    eyebrow: 'Orações',
    title: 'Orações católicas,',
    titleEm: 'num lugar só.',
    description:
      'Pai-Nosso, Ave-Maria, Credo, Salve-Rainha, Ângelus, Magnificat e muitas outras. Em português, com letra grande e fácil de ler.',
    href: '/oracoes',
    features: [
      'Mais de 30 orações clássicas',
      'Texto grande, fácil de ler',
      'Marque suas favoritas',
    ],
  },
  {
    key: 'terco',
    eyebrow: 'Santo Terço',
    title: 'Reze o terço,',
    titleEm: 'mistério por mistério.',
    description:
      'Os mistérios do dia já vêm escolhidos pra você. O app conta as Ave-Marias automaticamente — você só precisa rezar.',
    href: '/rosario',
    features: [
      'Mistérios do dia automáticos',
      'Conta as Ave-Marias pra você',
      'Modo silencioso, sem distração',
    ],
  },
  {
    key: 'exame',
    eyebrow: 'Exame de Consciência',
    title: 'Prepare sua confissão',
    titleEm: 'com calma.',
    description:
      'Um roteiro pelos 10 mandamentos pra ajudar quem está voltando à confissão depois de um tempo. Sem julgamento, sem pressa.',
    href: '/exame-consciencia',
    features: [
      'Guia pelos 10 mandamentos',
      'Linguagem simples e acolhedora',
      'Dicas do que dizer ao padre',
    ],
  },
] as const

export const QUOTE_COPY = {
  eyebrow: 'Dos santos',
  text:
    'Tarde Vos amei, ó Beleza tão antiga e tão nova, tarde Vos amei! Eis que Vós estáveis dentro de mim e eu fora, e era fora que Vos buscava.',
  author: 'Santo Agostinho',
  source: 'Confissões, X, 27',
} as const

export const DONATION_COPY = {
  eyebrow: 'Apoie o projeto',
  title: 'Este app é de graça',
  titleEm: 'e quer continuar assim.',
  lead:
    'Veritas Dei não tem anúncios nem cobra mensalidade. Quem sustenta esta obra é você. Em breve, abrimos um canal seguro pra apoiar por Pix, cartão ou doação única.',
  soon: 'Em breve',
  methods: ['Pix', 'Cartão recorrente', 'Doação única'],
} as const

export const FOOTER_COPY = {
  tagline: 'Ad maiorem Dei gloriam.',
  fidelity: 'Fiel ao Magistério da Igreja Católica.',
  privacy: 'Política de Privacidade',
  terms: 'Termos de Serviço',
} as const
