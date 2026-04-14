/**
 * Todas as strings da landing em um só lugar.
 * Editar aqui não exige tocar no JSX.
 */

export const HERO_COPY = {
  eyebrow: (dia: string, liturgia: string) => ({ dia, liturgia }),
  titleLine1: 'A fé de sempre,',
  titleLine2: 'no lugar onde você está.',
  lead:
    'Veritas Dei reúne liturgia, oração e vida sacramental em uma experiência silenciosa, elegante e fácil. Para quem está retomando — e para quem nunca parou.',
  ctaPrimary: 'Encontrar minha igreja',
  ctaSecondary: 'Criar conta gratuita',
  alreadyHave: 'Já sou batizado aqui',
  trust: 'Sem spam. Em menos de um minuto.',
  chipsNearbyLabel: 'Perto de você',
  chipsIdle: 'Permita sua localização para ver igrejas próximas.',
  chipsLoading: 'Procurando igrejas perto de você…',
  chipsEmpty: 'Nenhuma igreja cadastrada por perto ainda.',
  scrollCue: 'descer',
  stats: {
    igrejas: 'Igrejas',
    convertidos: 'Convertidos',
    fieis: 'Fiéis',
  },
} as const

export const MANIFESTO_COPY = {
  eyebrow: 'Manifesto',
  title: 'Reverência, clareza e acolhida — em um só lugar.',
  lead:
    'Tudo o que um católico leigo precisa para rezar o dia, encontrar uma paróquia e voltar aos sacramentos, sem ruído e sem acrobacias digitais.',
  pillars: [
    {
      key: 'fidelidade',
      title: 'Fidelidade',
      body:
        'Conteúdo alinhado ao Magistério, liturgia conforme o calendário romano e orações clássicas da tradição.',
    },
    {
      key: 'clareza',
      title: 'Clareza',
      body:
        'Nada de poluição visual. Leitura confortável, tipografia reverente e caminhos curtos para cada devoção.',
    },
    {
      key: 'acolhida',
      title: 'Acolhida',
      body:
        'Para quem está retomando a fé, para quem nunca parou e para quem apenas começa. Sem julgamentos, sem barreiras.',
    },
  ],
} as const

export const FINDER_COPY = {
  eyebrow: 'Encontre sua paróquia',
  title: 'Uma igreja perto de você,',
  titleEm: 'agora.',
  lead:
    'Ativamos sua localização com sua permissão. Se preferir, basta digitar sua cidade — o resultado vem com distância e direção.',
  geoIdle: 'Usar minha localização',
  geoLoading: 'Localizando…',
  geoGranted: (label: string) => `Você está em ${label}`,
  geoClear: 'limpar',
  placeholder: 'Digite sua cidade…',
  searchAria: 'Buscar igreja',
  resultsEyebrow: 'Resultado',
  stateInitial: 'Ative sua localização ou digite uma cidade para começar.',
  stateLoading: 'Consultando paróquias aprovadas…',
  stateEmpty: 'Não encontramos nessa cidade. Tente uma cidade vizinha.',
} as const

export const DEVOTION_COPY = [
  {
    key: 'liturgia',
    eyebrow: 'Liturgia do Dia',
    title: 'A Palavra do dia,',
    titleEm: 'sem atalhos.',
    description:
      'Leituras, salmo responsorial, evangelho e oração do dia. Acompanhe o ano litúrgico sem se perder entre abas ou cliques.',
    href: '/liturgia/hoje',
    features: [
      'Leituras completas do dia',
      'Cor e tempo litúrgico visíveis',
      'Santo do dia em destaque',
    ],
  },
  {
    key: 'oracoes',
    eyebrow: 'Orações',
    title: 'As orações de sempre,',
    titleEm: 'na sua mão.',
    description:
      'Pai-Nosso, Ave-Maria, Credo, Ângelus, Salve-Rainha e muitas outras. Leitura confortável e caminho direto para rezar.',
    href: '/oracoes',
    features: [
      'Orações clássicas reunidas',
      'Tipografia serifada legível',
      'Marque suas favoritas',
    ],
  },
  {
    key: 'terco',
    eyebrow: 'Santo Terço',
    title: 'Reze o Santo Terço',
    titleEm: 'passo a passo.',
    description:
      'Mistérios do dia em destaque, estrutura clara e ritmo contemplativo para ajudar quem está retomando a vida de oração.',
    href: '/rosario',
    features: [
      'Mistérios organizados por dia',
      'Contagem automática das contas',
      'Modo imersivo sem distrações',
    ],
  },
  {
    key: 'exame',
    eyebrow: 'Exame de Consciência',
    title: 'Prepare uma boa confissão',
    titleEm: 'com segurança.',
    description:
      'Um roteiro pastoral e acessível para apoiar quem deseja voltar aos sacramentos. Linguagem simples, fidelidade doutrinária.',
    href: '/exame-consciencia',
    features: [
      'Roteiro pastoral por mandamento',
      'Linguagem acolhedora e clara',
      'Sugere passos até a confissão',
    ],
  },
] as const

export const QUOTE_COPY = {
  eyebrow: 'Voz da Tradição',
  text:
    'Tarde Vos amei, ó Beleza tão antiga e tão nova, tarde Vos amei! Eis que Vós estáveis dentro de mim e eu fora, e era fora que Vos buscava.',
  author: 'Santo Agostinho',
  source: 'Confissões, X, 27',
} as const

export const DONATION_COPY = {
  eyebrow: 'Apoio ao projeto',
  title: 'Esta obra vive',
  titleEm: 'da generosidade dos fiéis.',
  lead:
    'Veritas Dei é mantido por quem acredita que a fé merece um lugar reverente e gratuito na internet. Em breve, abriremos um canal seguro para você apoiar esta missão.',
  soon: 'Em breve',
  methods: ['PIX direto', 'Cartão recorrente', 'Doação única'],
} as const

export const FOOTER_COPY = {
  tagline: 'Ad maiorem Dei gloriam.',
  fidelity: 'Fiel ao Magistério da Igreja Católica.',
  privacy: 'Política de Privacidade',
  terms: 'Termos de Serviço',
} as const
