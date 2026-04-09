import type { DogmaCategory } from './types'

export const dogmasDeus: DogmaCategory = {
  id: 'deus',
  number: 1,
  title: 'Dogmas sobre Deus',
  icon: '☀',
  description: 'A natureza, existência e atributos do Deus Uno e Trino.',
  dogmas: [
    {
      id: 1,
      title: 'A Existência de Deus',
      explanation: 'A razão humana pode conhecer a existência de Deus com certeza, pela luz natural, observando a ordem e a beleza da criação. A existência de Deus não é apenas uma opinião, mas uma verdade acessível à inteligência humana, conforme definido pelo Concílio Vaticano I.',
      verses: [
        { reference: 'Rm 1,20', text: 'Porque as suas perfeições invisíveis, desde a criação do mundo, se veem claramente, consideradas por meio das obras que foram feitas: o seu eterno poder e a sua divindade.' },
        { reference: 'Sl 19,2', text: 'Os céus proclamam a glória de Deus, e o firmamento anuncia a obra das suas mãos.' },
      ],
    },
    {
      id: 2,
      title: 'A Existência de Deus como Objeto de Fé',
      explanation: 'Embora a razão natural possa alcançar o conhecimento de Deus, a sua existência é também um objeto da fé sobrenatural. Crer em Deus é um ato de fé que vai além da razão, sustentado pela graça divina. Sem a fé, é impossível agradar a Deus.',
      verses: [
        { reference: 'Hb 11,6', text: 'Sem fé é impossível agradar a Deus, pois é necessário que aquele que se aproxima de Deus creia que Ele existe e que recompensa os que O buscam.' },
      ],
    },
    {
      id: 3,
      title: 'A Unidade de Deus',
      explanation: 'Existe um só Deus, único e verdadeiro. Não há múltiplos deuses, mas um só Criador de todas as coisas, conforme professado no Credo e ensinado ao longo de toda a Escritura. O monoteísmo é o fundamento da fé cristã.',
      verses: [
        { reference: 'Dt 6,4', text: 'Ouve, ó Israel: o Senhor nosso Deus é o único Senhor.' },
        { reference: '1Tm 2,5', text: 'Porque há um só Deus, e um só Mediador entre Deus e os homens: Jesus Cristo homem.' },
      ],
    },
    {
      id: 4,
      title: 'Deus é Eterno',
      explanation: 'Deus não tem princípio nem fim. Ele existe fora do tempo, transcendendo toda medida temporal. Antes que o mundo fosse criado, Deus já era — e será para sempre. A eternidade de Deus significa que Ele é imutável em sua essência.',
      verses: [
        { reference: 'Sl 90,2', text: 'Antes que os montes nascessem e se formassem a terra e o mundo, de eternidade a eternidade, Vós sois Deus.' },
        { reference: 'Ap 1,8', text: 'Eu sou o Alfa e o Ômega, diz o Senhor Deus, Aquele que é, que era e que há de vir, o Todo-Poderoso.' },
      ],
    },
    {
      id: 5,
      title: 'A Santíssima Trindade',
      explanation: 'No Deus Uno subsistem três Pessoas distintas: o Pai, o Filho e o Espírito Santo. Cada Pessoa é verdadeiramente Deus, possuindo a mesma e indivisível essência divina. O Pai não é o Filho, o Filho não é o Espírito Santo, mas os três são um só Deus. Este é o mistério central da fé cristã.',
      verses: [
        { reference: 'Mt 28,19', text: 'Ide, pois, e ensinai a todas as nações, batizando-as em nome do Pai, e do Filho, e do Espírito Santo.' },
        { reference: '2Cor 13,13', text: 'A graça do Senhor Jesus Cristo, o amor de Deus e a comunhão do Espírito Santo estejam com todos vós.' },
      ],
    },
  ],
}
