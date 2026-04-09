import type { DogmaCategory } from './types'

export const dogmasMarianos: DogmaCategory = {
  id: 'maria',
  number: 5,
  title: 'Dogmas Marianos',
  icon: '🌹',
  description: 'Os privilégios singulares da Bem-Aventurada Virgem Maria.',
  dogmas: [
    {
      id: 20,
      title: 'A Imaculada Conceição de Maria',
      explanation: 'No primeiro instante de sua conceição, por singular graça e privilégio de Deus, em vista dos méritos de Jesus Cristo, Maria foi preservada imune de toda mancha do pecado original. Ela é a única criatura humana concebida sem pecado, preparada por Deus para ser a Mãe do Salvador. Dogma definido por Pio IX em 1854.',
      verses: [
        { reference: 'Lc 1,28', text: 'Ave, cheia de graça! O Senhor é contigo.' },
        { reference: 'Gn 3,15', text: 'Porei inimizade entre ti e a mulher, entre a tua descendência e a dela. Esta te esmagará a cabeça, e tu lhe ferirás o calcanhar.' },
      ],
    },
    {
      id: 21,
      title: 'A Virgindade Perpétua de Maria',
      explanation: 'Maria foi virgem antes, durante e depois do parto. Concebeu Jesus por obra do Espírito Santo, sem intervenção de varão, e permaneceu virgem por toda a sua vida. Este dogma proclama que a consagração total de Maria a Deus foi integral e permanente.',
      verses: [
        { reference: 'Is 7,14', text: 'Eis que a virgem conceberá e dará à luz um filho, e lhe porá o nome de Emanuel.' },
        { reference: 'Lc 1,34-35', text: 'Maria disse ao anjo: Como será isso, pois não conheço homem? O Espírito Santo virá sobre ti, e o poder do Altíssimo te cobrirá com a sua sombra.' },
      ],
    },
    {
      id: 22,
      title: 'Maria, Mãe de Deus (Theotokos)',
      explanation: 'Maria é verdadeiramente Mãe de Deus, pois gerou segundo a natureza humana a Pessoa divina do Filho de Deus. Ela não é mãe apenas da natureza humana de Cristo, mas da Pessoa — e essa Pessoa é Deus. Dogma definido pelo Concílio de Éfeso em 431.',
      verses: [
        { reference: 'Lc 1,43', text: 'Donde me vem esta honra de vir a mim a mãe do meu Senhor?' },
        { reference: 'Gl 4,4', text: 'Quando chegou a plenitude dos tempos, Deus enviou o seu Filho, nascido de uma mulher.' },
      ],
    },
    {
      id: 23,
      title: 'A Assunção de Maria',
      explanation: 'Terminado o curso de sua vida terrena, Maria foi elevada em corpo e alma à glória celestial. Seu corpo não conheceu a corrupção do sepulcro. A Assunção é o coroamento dos privilégios de Maria e antecipação da ressurreição prometida a todos os fiéis. Dogma definido por Pio XII em 1950.',
      verses: [
        { reference: 'Ap 12,1', text: 'Apareceu no céu um grande sinal: uma Mulher vestida de sol, com a lua debaixo dos pés e uma coroa de doze estrelas sobre a cabeça.' },
        { reference: 'Sl 132,8', text: 'Levantai-vos, Senhor, para o lugar do vosso repouso, Vós e a Arca da vossa santificação.' },
      ],
    },
  ],
}

export const dogmasIgreja: DogmaCategory = {
  id: 'igreja',
  number: 6,
  title: 'Dogmas sobre o Papa e a Igreja',
  icon: '⛪',
  description: 'A fundação divina, autoridade e infalibilidade da Igreja de Cristo.',
  dogmas: [
    {
      id: 24,
      title: 'A Igreja Foi Fundada por Jesus Cristo',
      explanation: 'A Igreja Católica não é uma instituição meramente humana: foi fundada pelo próprio Jesus Cristo, que estabeleceu seus fundamentos substanciais — doutrina, culto sacrificial e constituição hierárquica. Cristo é a cabeça invisível da Igreja, que é seu Corpo Místico.',
      verses: [
        { reference: 'Mt 16,18', text: 'Tu és Pedro, e sobre esta pedra edificarei a minha Igreja, e as portas do inferno não prevalecerão contra ela.' },
        { reference: 'Ef 5,25', text: 'Cristo amou a Igreja e entregou-se a si mesmo por ela.' },
      ],
    },
    {
      id: 25,
      title: 'Cristo Constituiu São Pedro como Cabeça Visível da Igreja',
      explanation: 'Jesus conferiu a São Pedro, de modo imediato e pessoal, o primado de jurisdição sobre toda a Igreja. Pedro é a rocha sobre a qual Cristo edificou a sua Igreja. O Papa, Bispo de Roma, é o legítimo sucessor de Pedro e herdeiro desse primado.',
      verses: [
        { reference: 'Mt 16,18-19', text: 'Tu és Pedro, e sobre esta pedra edificarei a minha Igreja. Eu te darei as chaves do Reino dos Céus.' },
        { reference: 'Jo 21,15-17', text: 'Jesus disse a Pedro: Apascenta os meus cordeiros. Apascenta as minhas ovelhas.' },
      ],
    },
    {
      id: 26,
      title: 'O Papa Possui Pleno e Supremo Poder de Jurisdição',
      explanation: 'O poder do Papa sobre toda a Igreja é universal (estende-se a todos os fiéis), supremo (não há poder eclesiástico acima dele), pleno (abrange todas as matérias de fé, moral e disciplina) e imediato (pode exercê-lo diretamente sobre qualquer fiel). Definido pelo Concílio Vaticano I.',
      verses: [
        { reference: 'Mt 16,19', text: 'Tudo o que ligares na terra será ligado nos céus, e tudo o que desligares na terra será desligado nos céus.' },
        { reference: 'Lc 22,32', text: 'Eu roguei por ti, para que a tua fé não desfaleça. E tu, uma vez convertido, confirma os teus irmãos.' },
      ],
    },
    {
      id: 27,
      title: 'O Papa é Infalível ao Pronunciar-se Ex Cathedra',
      explanation: 'Quando o Papa fala ex cathedra — isto é, como pastor e mestre supremo de todos os fiéis, com a intenção de definir uma doutrina de fé ou costumes —, goza de infalibilidade. Essa infalibilidade não é pessoal, mas um carisma do Espírito Santo para preservar a Igreja do erro. Definido pelo Concílio Vaticano I em 1870.',
      verses: [
        { reference: 'Lc 22,32', text: 'Eu roguei por ti, para que a tua fé não desfaleça.' },
        { reference: 'Jo 16,13', text: 'Quando vier o Espírito da Verdade, Ele vos guiará em toda a verdade.' },
      ],
    },
    {
      id: 28,
      title: 'A Igreja é Infalível em Matéria de Fé e Costumes',
      explanation: 'A Igreja como um todo, quando unida ao Papa, não pode errar ao definir doutrinas de fé e costumes. Essa infalibilidade se manifesta tanto no magistério extraordinário (definições dogmáticas) quanto no magistério ordinário e universal (ensino constante e unânime dos bispos unidos ao Papa).',
      verses: [
        { reference: 'Mt 28,20', text: 'Eis que Eu estou convosco todos os dias, até a consumação dos séculos.' },
        { reference: '1Tm 3,15', text: 'A Igreja do Deus vivo é coluna e sustentáculo da verdade.' },
      ],
    },
  ],
}
