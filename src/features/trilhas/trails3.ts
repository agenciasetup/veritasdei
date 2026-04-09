import type { Trail } from './trails1'

export const TRAILS_3: Trail[] = [
  {
    id: 'defesa',
    title: 'Defesa da Fé',
    subtitle: 'Apologética católica',
    description: 'Fundamentos bíblicos e doutrinários para responder objeções contra a fé.',
    difficulty: 'Avançado',
    color: '#C9A84C',
    iconName: 'Shield',
    steps: [
      {
        label: 'O que são Dogmas',
        description: 'As verdades inegociáveis da fé',
        content: 'Dogma é uma verdade revelada por Deus e proposta pela Igreja como de fé obrigatória. Negar um dogma é heresia.\n\nOs dogmas se dividem em categorias: sobre Deus (Trindade, atributos divinos), sobre Cristo (Encarnação, Redenção), sobre Maria (4 dogmas marianos), sobre a Igreja (infalibilidade, necessidade para salvação) e sobre os Sacramentos.\n\nA Igreja não inventa dogmas — ela reconhece e define formalmente o que já está contido na Revelação (Escritura e Tradição).'
      },
      {
        label: 'Fundamentação Bíblica',
        description: 'Base escriturística da fé católica',
        content: 'A fé católica tem sólida base bíblica:\n\nEUCARISTIA — "Isto é o meu corpo" (Mt 26,26). "Quem come a minha carne tem a vida eterna" (Jo 6,54).\n\nCONFISSÃO — "A quem perdoardes os pecados, ser-lhes-ão perdoados" (Jo 20,23).\n\nPAPADO — "Tu és Pedro e sobre esta pedra edificarei a minha Igreja" (Mt 16,18).\n\nMARIA — "Todas as gerações me chamarão bem-aventurada" (Lc 1,48).\n\nTRADIÇÃO — "Guardai as tradições que vos ensinamos de viva voz ou por carta" (2Ts 2,15).'
      },
      {
        label: 'Lei Moral e Natural',
        description: 'A lei moral e sua fundamentação',
        content: 'A lei moral natural é inscrita por Deus no coração de todo homem (Rm 2,15). É universal, imutável e acessível à razão.\n\nOs Dez Mandamentos são a expressão privilegiada da lei natural. Jesus não os aboliu, mas os aprofundou: "Não vim abolir a Lei, mas dar-lhe pleno cumprimento" (Mt 5,17).\n\nA lei moral se resume no duplo mandamento do amor: amar a Deus e ao próximo (Mt 22,37-39).'
      },
      {
        label: 'Escritura e Tradição',
        description: 'As duas fontes da Revelação',
        content: 'A Revelação divina nos chega por dois canais:\n\nESCRITURA SAGRADA — A Palavra de Deus escrita sob inspiração do Espírito Santo. A Bíblia católica tem 73 livros (46 AT + 27 NT).\n\nTRADIÇÃO SAGRADA — O ensinamento oral dos Apóstolos, transmitido e guardado pela Igreja. "Nem tudo foi escrito" (Jo 21,25).\n\nAmbas formam um só depósito da fé, interpretado autenticamente pelo Magistério da Igreja (Papa e Bispos em comunhão com ele).'
      },
    ],
  },
  {
    id: 'oracao',
    title: 'Vida de Oração',
    subtitle: 'Conversar com Deus',
    description: 'Aprenda as orações essenciais da Igreja e construa uma vida de oração.',
    difficulty: 'Iniciante',
    color: '#8B3145',
    iconName: 'Flame',
    steps: [
      {
        label: 'Orações Principais',
        description: 'Pai Nosso, Ave Maria e mais',
        content: 'PAI NOSSO — Pai nosso que estais nos céus, santificado seja o vosso nome, venha a nós o vosso reino, seja feita a vossa vontade assim na terra como no céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.\n\nAVE MARIA — Ave Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora da nossa morte. Amém.\n\nATO DE CONTRIÇÃO — Meu Deus, eu me arrependo de todo o coração de Vos ter ofendido, porque sois infinitamente bom e o pecado Vos desagrada. Proponho firmemente, com o auxílio da Vossa graça, não mais pecar e fugir das ocasiões de pecado. Amém.'
      },
      {
        label: 'Credo Apostólico',
        description: 'O que professamos',
        content: 'Creio em Deus Pai todo-poderoso, Criador do céu e da terra.\n\nE em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo, nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado. Desceu à mansão dos mortos, ressuscitou ao terceiro dia, subiu aos céus, está sentado à direita de Deus Pai todo-poderoso, de onde há de vir a julgar os vivos e os mortos.\n\nCreio no Espírito Santo, na Santa Igreja Católica, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.'
      },
      {
        label: 'Atos de Virtude',
        description: 'Atos de Fé, Esperança e Caridade',
        content: 'ATO DE FÉ — Meu Deus, eu creio firmemente em todas as verdades que a Santa Igreja Católica propõe, porque Vós, que sois a Verdade, as revelastes. Amém.\n\nATO DE ESPERANÇA — Meu Deus, eu espero de Vossa bondade, pelas Vossas promessas e pelos merecimentos de Jesus Cristo, a vida eterna e as graças necessárias para alcançá-la. Amém.\n\nATO DE CARIDADE — Meu Deus, eu Vos amo sobre todas as coisas e ao próximo como a mim mesmo, por amor de Vós, porque sois infinitamente bom e digno de ser amado. Amém.'
      },
      {
        label: 'O Santo Rosário',
        description: 'A devoção mariana por excelência',
        content: 'O Rosário consiste em meditar os mistérios da vida de Cristo e de Maria enquanto se rezam Pai Nossos e Ave Marias.\n\nMISTÉRIOS GOZOSOS (segunda e sábado): Anunciação, Visitação, Nascimento, Apresentação, Menino perdido no Templo.\n\nMISTÉRIOS LUMINOSOS (quinta): Batismo de Jesus, Bodas de Caná, Anúncio do Reino, Transfiguração, Instituição da Eucaristia.\n\nMISTÉRIOS DOLOROSOS (terça e sexta): Agonia, Flagelação, Coroação de espinhos, Caminho da Cruz, Crucifixão.\n\nMISTÉRIOS GLORIOSOS (quarta e domingo): Ressurreição, Ascensão, Pentecostes, Assunção de Maria, Coroação de Maria.\n\nCada mistério: 1 Pai Nosso + 10 Ave Marias + 1 Glória ao Pai.'
      },
    ],
  },
]
