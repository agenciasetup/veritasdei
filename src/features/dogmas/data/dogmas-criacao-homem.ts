import type { DogmaCategory } from './types'

export const dogmasCriacao: DogmaCategory = {
  id: 'criacao',
  number: 3,
  title: 'Dogmas sobre a Criação do Mundo',
  icon: '🌍',
  description: 'A origem divina de todas as coisas visíveis e invisíveis.',
  dogmas: [
    {
      id: 14,
      title: 'Tudo Foi Criado por Deus a Partir do Nada',
      explanation: 'Deus criou todas as coisas — visíveis e invisíveis — do nada (ex nihilo). Nenhuma matéria preexistente foi usada; tudo o que existe teve origem na vontade livre e no poder infinito de Deus. Esta verdade é acessível à razão e confirmada pela Revelação.',
      verses: [
        { reference: 'Gn 1,1', text: 'No princípio, Deus criou o céu e a terra.' },
        { reference: 'Hb 11,3', text: 'Pela fé compreendemos que os mundos foram formados pela Palavra de Deus, de modo que o visível foi feito do invisível.' },
      ],
    },
    {
      id: 15,
      title: 'O Caráter Temporal do Mundo',
      explanation: 'O mundo teve um princípio no tempo. Ele não é eterno nem coexistente com Deus desde sempre. Houve um momento em que nada existia senão Deus, e por ato livre Ele trouxe o mundo à existência.',
      verses: [
        { reference: 'Gn 1,1', text: 'No princípio, Deus criou o céu e a terra.' },
        { reference: 'Pr 8,22-23', text: 'O Senhor me possuiu no início de seus caminhos, antes de suas obras mais antigas. Desde a eternidade fui estabelecida, desde o princípio, antes que a terra existisse.' },
      ],
    },
    {
      id: 16,
      title: 'A Conservação do Mundo',
      explanation: 'Deus não apenas criou o mundo, mas o conserva continuamente na existência. Se Deus retirasse sua ação conservadora, tudo voltaria ao nada. Toda a criação depende a cada instante da vontade sustentadora de Deus.',
      verses: [
        { reference: 'At 17,28', text: 'Pois nele vivemos, nos movemos e existimos.' },
        { reference: 'Cl 1,17', text: 'Ele é antes de todas as coisas, e todas as coisas subsistem nele.' },
      ],
    },
  ],
}

export const dogmasHomem: DogmaCategory = {
  id: 'homem',
  number: 4,
  title: 'Dogmas sobre o Ser Humano',
  icon: '🕊',
  description: 'A natureza do homem, o pecado original e a necessidade da Redenção.',
  dogmas: [
    {
      id: 17,
      title: 'O Homem é Formado de Corpo Material e Alma Espiritual',
      explanation: 'O ser humano é uma unidade de corpo e alma. O corpo é material, parte essencial da natureza humana — não uma prisão da alma. A alma é espiritual, racional e imortal, criada diretamente por Deus para cada pessoa. Corpo e alma juntos constituem a pessoa humana.',
      verses: [
        { reference: 'Gn 2,7', text: 'O Senhor Deus formou o homem do pó da terra e soprou em suas narinas o fôlego da vida, e o homem tornou-se um ser vivente.' },
        { reference: 'Mt 10,28', text: 'Não temais os que matam o corpo e não podem matar a alma.' },
      ],
    },
    {
      id: 18,
      title: 'O Pecado Original se Propaga a Todos os Descendentes',
      explanation: 'O pecado de Adão não afetou apenas a ele: transmite-se a todos os seres humanos por geração, não por imitação. Todo ser humano nasce privado da graça santificante e com a natureza ferida. Somente a Virgem Maria, por privilégio singular, foi preservada do pecado original.',
      verses: [
        { reference: 'Rm 5,12', text: 'Por um só homem o pecado entrou no mundo, e pelo pecado a morte, e assim a morte passou a todos os homens, porque todos pecaram.' },
        { reference: 'Sl 51,7', text: 'Eis que fui concebido na iniquidade, e em pecado me concebeu minha mãe.' },
      ],
    },
    {
      id: 19,
      title: 'O Homem Caído Não Pode Redimir-se a Si Próprio',
      explanation: 'Nenhum ser humano, por suas próprias forças ou méritos, pode restaurar a amizade com Deus perdida pelo pecado. Somente um sacrifício de valor infinito — o de Cristo — poderia satisfazer a justiça divina e reabrir as portas da salvação. A redenção é dom gratuito de Deus.',
      verses: [
        { reference: 'Rm 3,23-24', text: 'Todos pecaram e estão privados da glória de Deus, sendo justificados gratuitamente, por sua graça, mediante a redenção que há em Cristo Jesus.' },
        { reference: 'Ef 2,8-9', text: 'Pela graça fostes salvos, por meio da fé; e isto não vem de vós, é dom de Deus. Não vem das obras, para que ninguém se glorie.' },
      ],
    },
  ],
}
