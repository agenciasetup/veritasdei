import type { ItemGroup } from './types'

export const GROUPS: ItemGroup[] = [
  {
    id: 'teologais',
    title: 'Virtudes Teologais',
    description: 'Infundidas por Deus na alma, têm como objeto o próprio Deus. São o fundamento da vida moral cristã.',
    icon: '✝',
    items: [
      {
        id: 1,
        name: 'Fé',
        explanation: 'A virtude pela qual cremos em Deus e em tudo o que Ele nos revelou e que a Igreja nos propõe para crer, porque Ele é a própria Verdade. Pela fé, o homem se entrega livremente a Deus, oferecendo-lhe a plena adesão da inteligência e da vontade. A fé é o início da vida eterna.',
        verses: [
          { reference: 'Hb 11,1', text: 'A fé é o fundamento da esperança, é uma certeza a respeito do que não se vê.' },
          { reference: 'Rm 10,17', text: 'A fé vem pela pregação, e a pregação pela Palavra de Cristo.' },
        ],
      },
      {
        id: 2,
        name: 'Esperança',
        explanation: 'A virtude pela qual desejamos e esperamos de Deus a vida eterna como nossa felicidade, confiando nas promessas de Cristo e apoiando-nos na graça do Espírito Santo. A esperança preserva do desânimo, sustenta nos momentos de abandono e dilata o coração na expectativa da bem-aventurança.',
        verses: [
          { reference: 'Rm 8,24-25', text: 'Na esperança fomos salvos. Ora, esperar o que se vê não é esperança. Se esperamos o que não vemos, é com paciência que o aguardamos.' },
          { reference: 'Hb 6,19', text: 'Temos esta esperança como âncora da alma, segura e firme.' },
        ],
      },
      {
        id: 3,
        name: 'Caridade',
        explanation: 'A virtude pela qual amamos a Deus sobre todas as coisas por Ele mesmo e ao próximo como a nós mesmos por amor de Deus. É a maior de todas as virtudes e a "forma" de todas elas — sem caridade, nenhuma virtude é perfeita. A caridade é o vínculo da perfeição e o resumo de toda a Lei.',
        verses: [
          { reference: '1Cor 13,13', text: 'Agora permanecem a fé, a esperança e a caridade — estas três. Porém, a maior delas é a caridade.' },
          { reference: '1Jo 4,8', text: 'Quem não ama não conhece a Deus, porque Deus é amor.' },
        ],
      },
    ],
  },
  {
    id: 'cardeais',
    title: 'Virtudes Cardeais',
    description: 'Virtudes humanas adquiridas pelo esforço, aperfeiçoadas pela graça. São "cardeal" (do latim cardo, gonzo) porque todas as outras se agrupam em torno delas.',
    icon: '⚖',
    items: [
      {
        id: 4,
        name: 'Prudência',
        explanation: 'A virtude que dispõe a razão prática a discernir em cada circunstância o verdadeiro bem e a escolher os meios adequados para alcançá-lo. É a "auriga das virtudes" — guia e dirige todas as outras. O prudente não age por impulso, mas delibera, julga e decide retamente.',
        verses: [
          { reference: 'Pr 14,15', text: 'O ingênuo acredita em tudo, mas o prudente observa bem os seus passos.' },
          { reference: 'Mt 10,16', text: 'Sede prudentes como as serpentes e simples como as pombas.' },
        ],
      },
      {
        id: 5,
        name: 'Justiça',
        explanation: 'A virtude moral que consiste na firme e constante vontade de dar a Deus e ao próximo o que lhes é devido. A justiça para com Deus chama-se "virtude da religião." Para com os homens, dispõe a respeitar os direitos de cada um e a estabelecer a harmonia nas relações humanas.',
        verses: [
          { reference: 'Mt 7,12', text: 'Tudo o que quereis que os homens vos façam, fazei-o vós a eles. Esta é a Lei e os Profetas.' },
          { reference: 'Mq 6,8', text: 'O que o Senhor pede de ti: praticar a justiça, amar a misericórdia e andar humildemente com o teu Deus.' },
        ],
      },
      {
        id: 6,
        name: 'Fortaleza',
        explanation: 'A virtude moral que assegura a firmeza e a constância na busca do bem nas dificuldades. Fortalece a resolução de resistir às tentações e de superar os obstáculos na vida moral. Permite vencer o medo, até o medo da morte, enfrentar provas e perseguições.',
        verses: [
          { reference: 'Jo 16,33', text: 'No mundo tereis tribulações. Mas tende coragem: Eu venci o mundo.' },
          { reference: 'Fl 4,13', text: 'Tudo posso naquele que me fortalece.' },
        ],
      },
      {
        id: 7,
        name: 'Temperança',
        explanation: 'A virtude moral que modera a atração dos prazeres e procura o equilíbrio no uso dos bens criados. Assegura o domínio da vontade sobre os instintos e mantém os desejos dentro dos limites da honestidade. O homem temperante orienta seus apetites sensíveis para o bem.',
        verses: [
          { reference: 'Tt 2,12', text: 'A graça de Deus nos ensina a renunciar à impiedade e aos desejos mundanos, e a viver com temperança, justiça e piedade.' },
          { reference: '1Cor 9,25', text: 'Todo aquele que luta, abstém-se de tudo. Eles o fazem para obter uma coroa corruptível; nós, porém, para uma incorruptível.' },
        ],
      },
    ],
  },
  {
    id: 'pecados',
    title: 'Sete Pecados Capitais',
    description: 'Chamados "capitais" porque são cabeça (caput) de outros pecados. São inclinações desordenadas que geram vícios e outros pecados.',
    icon: '🔥',
    items: [
      {
        id: 8,
        name: 'Soberba',
        opposite: 'Humildade',
        explanation: 'Apetite desordenado da própria excelência. O soberbo deseja ser superior aos outros, recusa submeter-se a Deus e atribui a si mesmo o que vem de Deus. Foi o pecado de Lúcifer e a raiz do pecado original. A soberba é considerada o mais grave dos pecados capitais, pois afasta o homem de Deus.',
        verses: [
          { reference: 'Pr 16,18', text: 'A soberba precede a ruína, e a altivez do espírito precede a queda.' },
          { reference: 'Tg 4,6', text: 'Deus resiste aos soberbos, mas dá graça aos humildes.' },
        ],
      },
      {
        id: 9,
        name: 'Avareza',
        opposite: 'Generosidade',
        explanation: 'Apego desordenado aos bens materiais. O avarento acumula riquezas como fim em si mesmo, recusando partilhar com os necessitados. A avareza endurece o coração, fecha-o à misericórdia e faz do dinheiro um ídolo que substitui Deus.',
        verses: [
          { reference: '1Tm 6,10', text: 'O amor ao dinheiro é a raiz de todos os males. Alguns, por se entregarem a ele, afastaram-se da fé.' },
          { reference: 'Mt 6,24', text: 'Ninguém pode servir a dois senhores. Não podeis servir a Deus e ao dinheiro.' },
        ],
      },
      {
        id: 10,
        name: 'Luxúria',
        opposite: 'Castidade',
        explanation: 'Desejo desordenado do prazer sexual. A luxúria reduz a pessoa a objeto de prazer, perverte a sexualidade humana e a desvincula do amor conjugal e da abertura à vida. Contrária à castidade, degrada a dignidade do corpo, que é templo do Espírito Santo.',
        verses: [
          { reference: '1Cor 6,18-19', text: 'Fugi da impureza. O vosso corpo é templo do Espírito Santo, que habita em vós.' },
          { reference: 'Gl 5,19', text: 'As obras da carne são manifestas: impureza, libertinagem...' },
        ],
      },
      {
        id: 11,
        name: 'Ira',
        opposite: 'Paciência',
        explanation: 'Movimento desordenado da alma que leva ao desejo de vingança. Embora exista uma ira justa (indignação contra o mal), a ira pecaminosa é desproporcionada, rancorosa e busca fazer mal ao próximo. Pode levar à violência, ao ódio e até ao homicídio.',
        verses: [
          { reference: 'Ef 4,26', text: 'Irai-vos, mas não pequeis; não se ponha o sol sobre a vossa ira.' },
          { reference: 'Tg 1,20', text: 'A ira do homem não realiza a justiça de Deus.' },
        ],
      },
      {
        id: 12,
        name: 'Gula',
        opposite: 'Temperança',
        explanation: 'Apetite desordenado pela comida e pela bebida. A gula não se limita ao excesso alimentar, mas inclui toda busca desmedida por prazeres do paladar. Opõe-se à temperança e faz do prazer sensível um fim em si mesmo, escravizando a vontade ao corpo.',
        verses: [
          { reference: 'Fl 3,19', text: 'O deus deles é o ventre, e a glória deles está naquilo de que deviam envergonhar-se.' },
          { reference: '1Cor 10,31', text: 'Quer comais, quer bebais, fazei tudo para a glória de Deus.' },
        ],
      },
      {
        id: 13,
        name: 'Inveja',
        opposite: 'Caridade',
        explanation: 'Tristeza diante do bem alheio e desejo de apropriá-lo. O invejoso não suporta ver o próximo prosperar e se alegra com seu infortúnio. A inveja é filha da soberba e contrária à caridade. Pode levar à calúnia, à detração, ao ódio e até ao crime.',
        verses: [
          { reference: 'Gl 5,26', text: 'Não sejamos cobiçosos de vanglória, provocando-nos uns aos outros, invejando-nos mutuamente.' },
          { reference: 'Pr 14,30', text: 'Um coração pacífico é a vida do corpo, mas a inveja é a podridão dos ossos.' },
        ],
      },
      {
        id: 14,
        name: 'Preguiça (Acídia)',
        opposite: 'Diligência',
        explanation: 'Negligência e tibieza na prática do bem e no cumprimento dos deveres, especialmente espirituais. A acídia é o tédio ou aversão pelas coisas de Deus. O preguiçoso espiritual evita a oração, os sacramentos e toda exigência da vida cristã. É uma forma de rejeitar a alegria que vem de Deus.',
        verses: [
          { reference: 'Ap 3,16', text: 'Porque és morno, e não és quente nem frio, estou para te vomitar da minha boca.' },
          { reference: 'Pr 6,6', text: 'Vai ter com a formiga, ó preguiçoso, observa os seus caminhos e sê sábio.' },
        ],
      },
    ],
  },
]
