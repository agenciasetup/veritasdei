import type { Trail } from './trails1'

export const TRAILS_2: Trail[] = [
  {
    id: 'doutrina',
    title: 'Fundamentos da Doutrina',
    subtitle: 'O que a Igreja acredita e porquê',
    description: 'Estude os dogmas da Igreja organizados por tema.',
    difficulty: 'Intermediário',
    color: '#C9A84C',
    iconName: 'Church',
    steps: [
      {
        label: 'Dogmas sobre Deus',
        description: 'A Santíssima Trindade e seus atributos',
        content: 'A Igreja ensina que existe um só Deus em três Pessoas distintas: Pai, Filho e Espírito Santo. Deus é eterno, onipotente, onisciente e infinitamente bom.\n\nO Pai é a origem sem origem. O Filho é gerado eternamente pelo Pai. O Espírito Santo procede do Pai e do Filho (Filioque).\n\nAs três Pessoas são coiguais, coeternas e consubstanciais — possuem a mesma e única natureza divina.'
      },
      {
        label: 'Dogmas sobre Cristo',
        description: 'Encarnação, Redenção, Ressurreição',
        content: 'Jesus Cristo é verdadeiro Deus e verdadeiro Homem — duas naturezas (divina e humana) unidas numa só Pessoa divina (união hipostática).\n\nNasceu da Virgem Maria por obra do Espírito Santo. Sofreu sob Pôncio Pilatos, foi crucificado, morto e sepultado. Desceu aos infernos e ao terceiro dia ressuscitou.\n\nPor Sua morte na Cruz, redimiu a humanidade do pecado. Sua Ressurreição é o fundamento da nossa fé (1Cor 15,14).'
      },
      {
        label: 'Dogmas sobre Maria',
        description: 'A Virgem Mãe de Deus',
        content: 'A Igreja proclamou quatro dogmas marianos:\n\n1. MATERNIDADE DIVINA — Maria é verdadeiramente Mãe de Deus (Theotókos), definido no Concílio de Éfeso (431).\n\n2. VIRGINDADE PERPÉTUA — Maria foi virgem antes, durante e depois do parto.\n\n3. IMACULADA CONCEIÇÃO — Maria foi preservada do pecado original desde o primeiro instante de sua concepção (Pio IX, 1854).\n\n4. ASSUNÇÃO — Maria foi elevada ao Céu em corpo e alma ao fim de sua vida terrena (Pio XII, 1950).'
      },
      {
        label: 'Dogmas sobre a Igreja',
        description: 'Sacramentos e escatologia',
        content: 'A Igreja é Una, Santa, Católica e Apostólica — as quatro notas que a identificam.\n\nFundada por Cristo sobre Pedro ("Tu és Pedro e sobre esta pedra edificarei a minha Igreja" — Mt 16,18), é assistida pelo Espírito Santo para não errar em matéria de fé e moral (infalibilidade).\n\nA Igreja é o Corpo Místico de Cristo e sacramento universal de salvação. Fora dela não há salvação, entendido no sentido de que toda graça salvífica passa por Cristo e Sua Igreja.'
      },
    ],
  },
  {
    id: 'caridade',
    title: 'Vida de Caridade',
    subtitle: 'A fé em ação',
    description: 'A fé sem obras é morta. Aprenda as virtudes e como vivê-las.',
    difficulty: 'Iniciante',
    color: '#8B3145',
    iconName: 'Heart',
    steps: [
      {
        label: 'Virtudes Cardeais',
        description: 'Prudência, Justiça, Fortaleza, Temperança',
        content: 'As quatro virtudes cardeais são o eixo (cardo) da vida moral:\n\nPRUDÊNCIA — Discernir o verdadeiro bem e escolher os meios adequados. É a "auriga das virtudes".\n\nJUSTIÇA — Dar a cada um o que lhe é devido. Regula as relações com Deus e com o próximo.\n\nFORTALEZA — Firmeza nas dificuldades e constância na busca do bem.\n\nTEMPERANÇA — Moderação no uso dos bens criados e domínio dos instintos.'
      },
      {
        label: 'Virtudes Teologais',
        description: 'Fé, Esperança e Caridade',
        content: 'As virtudes teologais têm Deus como origem, motivo e objeto:\n\nFÉ — Adesão livre do intelecto e da vontade a Deus que se revela. Sem fé é impossível agradar a Deus (Hb 11,6).\n\nESPERANÇA — Desejo confiante da vida eterna e das graças para alcançá-la.\n\nCARIDADE — Amor a Deus acima de tudo e ao próximo como a si mesmo. É o vínculo da perfeição (Cl 3,14). A maior de todas as virtudes (1Cor 13,13).'
      },
      {
        label: 'Obras Corporais de Misericórdia',
        description: '7 ações de caridade para o corpo',
        content: 'Jesus disse: "Tive fome e me destes de comer" (Mt 25,35).\n\n1. Dar de comer a quem tem fome — Doações, sopões, cestas básicas.\n2. Dar de beber a quem tem sede — Acesso à água, acolhida.\n3. Vestir os nus — Campanhas de agasalho, doação de roupas.\n4. Acolher os peregrinos — Hospitalidade, abrigos.\n5. Visitar os doentes — Presença, oração, auxílio prático.\n6. Visitar os presos — Pastoral carcerária, cartas, orações.\n7. Enterrar os mortos — Dignidade aos falecidos, consolo aos enlutados.'
      },
      {
        label: 'Obras Espirituais de Misericórdia',
        description: '7 ações de caridade para a alma',
        content: 'As obras espirituais cuidam da alma do próximo:\n\n1. Dar bons conselhos — Orientar com sabedoria e caridade.\n2. Ensinar os ignorantes — Catequese, evangelização, formação.\n3. Corrigir os que erram — Correção fraterna com amor (Mt 18,15).\n4. Consolar os aflitos — Presença, escuta, palavras de esperança.\n5. Perdoar as injúrias — Misericórdia como recebemos de Deus.\n6. Suportar com paciência — Carregar os fardos uns dos outros (Gl 6,2).\n7. Rezar pelos vivos e mortos — Intercessão, Missas, Rosários.'
      },
    ],
  },
]
