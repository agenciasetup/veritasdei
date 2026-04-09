import type { Preceito } from './types'

export const PRECEITOS: Preceito[] = [
  {
    id: 1,
    title: 'Participar da Missa aos domingos e festas de guarda',
    explanation: 'O primeiro preceito exige que os fiéis santifiquem o Dia do Senhor e as principais festas litúrgicas, participando da celebração eucarística. A Missa dominical é o coração da vida cristã, pois nela celebramos a Ressurreição de Cristo. O fiel deve participar com atenção, devoção e presença integral, abstendo-se de trabalhos e atividades que impeçam o culto a Deus e a alegria do dia.',
    catechismRef: 'CIC §2042',
    verses: [
      { reference: 'Ex 20,8', text: 'Lembra-te de santificar o dia de sábado.' },
      { reference: 'At 20,7', text: 'No primeiro dia da semana, estando nós reunidos para a fração do pão, Paulo falava aos discípulos.' },
      { reference: 'Hb 10,25', text: 'Não abandonemos as nossas assembleias, como é costume de alguns; antes, exortemo-nos mutuamente.' },
    ],
  },
  {
    id: 2,
    title: 'Confessar-se ao menos uma vez por ano',
    explanation: 'Todo fiel que tenha atingido a idade da razão é obrigado a confessar fielmente os seus pecados graves pelo menos uma vez ao ano. Este preceito garante a preparação mínima para receber a Eucaristia e assegura a reconciliação periódica com Deus e a Igreja. A confissão frequente é altamente recomendada, mas a anual é o mínimo obrigatório.',
    catechismRef: 'CIC §2042',
    verses: [
      { reference: 'Jo 20,22-23', text: 'Recebei o Espírito Santo. Àqueles a quem perdoardes os pecados, serão perdoados.' },
      { reference: 'Tg 5,16', text: 'Confessai os vossos pecados uns aos outros e orai uns pelos outros, para serdes curados.' },
    ],
  },
  {
    id: 3,
    title: 'Comungar ao menos pela Páscoa',
    explanation: 'Todo fiel batizado deve receber a Sagrada Eucaristia ao menos uma vez por ano, preferencialmente no Tempo Pascal (entre o Domingo de Ramos e o Domingo de Pentecostes). A Comunhão pascal é o mínimo necessário para manter a ligação sacramental com Cristo. A Igreja encoraja a comunhão frequente e até diária, desde que o fiel esteja em estado de graça.',
    catechismRef: 'CIC §2042',
    verses: [
      { reference: 'Jo 6,53', text: 'Se não comerdes a carne do Filho do Homem e não beberdes o seu sangue, não tereis a vida em vós.' },
      { reference: '1Cor 11,26', text: 'Todas as vezes que comerdes este pão e beberdes este cálice, anunciais a morte do Senhor, até que Ele venha.' },
    ],
  },
  {
    id: 4,
    title: 'Jejuar e abster-se de carne nos dias determinados',
    explanation: 'A Igreja prescreve dias de penitência para que os fiéis se preparem para as festas litúrgicas e adquiram domínio sobre os instintos pela prática da mortificação voluntária. A Quarta-feira de Cinzas e a Sexta-feira Santa são dias de jejum e abstinência obrigatórios. Todas as sextas-feiras do ano são dias de penitência, em memória da Paixão de Cristo. O jejum consiste em uma refeição plena e a abstinência é de carne.',
    catechismRef: 'CIC §2043',
    verses: [
      { reference: 'Mt 6,16-18', text: 'Quando jejuardes, não vos mostreis tristonhos como os hipócritas. Unge a tua cabeça e lava o teu rosto, para que o teu jejum não seja percebido pelos homens, mas pelo teu Pai.' },
      { reference: 'Mt 4,2', text: 'Depois de jejuar quarenta dias e quarenta noites, teve fome.' },
      { reference: 'Jl 2,12', text: 'Convertei-vos a Mim de todo o coração, com jejuns, com lágrimas e com gemidos.' },
    ],
  },
  {
    id: 5,
    title: 'Contribuir para as necessidades materiais da Igreja',
    explanation: 'Os fiéis têm o dever de prover as necessidades materiais da Igreja, cada um segundo as suas possibilidades. Essa contribuição sustenta o culto divino, as obras de apostolado e de caridade, e a manutenção dos ministros sagrados. Não se trata apenas de dinheiro, mas também de tempo, talentos e serviço. O dízimo e as ofertas são expressões concretas da corresponsabilidade do fiel pela missão da Igreja.',
    catechismRef: 'CIC §2043',
    verses: [
      { reference: '1Cor 9,14', text: 'O Senhor ordenou que os que pregam o Evangelho vivam do Evangelho.' },
      { reference: 'Gl 6,6', text: 'Aquele que é instruído na Palavra reparta todos os seus bens com aquele que o instrui.' },
      { reference: 'Ml 3,10', text: 'Trazei todos os dízimos à casa do tesouro, para que haja alimento na minha casa. Provai-me nisto, diz o Senhor.' },
    ],
  },
]
