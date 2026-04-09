import type { Mandamento } from './types'

export const MANDAMENTOS: Mandamento[] = [
  {
    id: 1,
    title: 'Amar a Deus sobre todas as coisas',
    shortTitle: 'Amar a Deus',
    explanation: 'O primeiro mandamento chama o homem a crer em Deus, esperar nele e amá-lo acima de tudo. Exige que adoremos somente a Deus, pois Ele é o Senhor e Criador de todas as coisas. Proíbe a idolatria — colocar qualquer criatura, riqueza, poder ou prazer no lugar de Deus. A fé, a esperança e a caridade são as virtudes que nos ordenam para Deus. Pecar contra este mandamento é dar a uma criatura a adoração devida somente ao Criador.',
    verses: [
      { reference: 'Dt 6,4-5', text: 'Ouve, ó Israel: o Senhor nosso Deus é o único Senhor. Amarás o Senhor teu Deus com todo o teu coração, com toda a tua alma e com todas as tuas forças.' },
      { reference: 'Mt 22,37-38', text: 'Amarás o Senhor teu Deus de todo o teu coração, de toda a tua alma e de todo o teu entendimento. Este é o maior e o primeiro mandamento.' },
      { reference: 'Ex 20,3', text: 'Não terás outros deuses diante de mim.' },
    ],
  },
  {
    id: 2,
    title: 'Não tomar o Santo Nome de Deus em vão',
    shortTitle: 'Nome de Deus',
    explanation: 'O segundo mandamento prescreve respeitar o nome do Senhor. O nome de Deus é santo e exige ser tratado com reverência. Proíbe todo uso impróprio do nome de Deus, de Jesus Cristo, da Virgem Maria e dos santos. A blasfêmia — usar o nome de Deus, de Jesus, da Virgem ou dos santos de modo injurioso — é um pecado grave. Os juramentos falsos e os perjúrios também violam este mandamento.',
    verses: [
      { reference: 'Ex 20,7', text: 'Não tomarás o nome do Senhor teu Deus em vão, porque o Senhor não deixará impune aquele que tomar o seu nome em vão.' },
      { reference: 'Mt 5,34-37', text: 'Eu vos digo: não jureis de modo algum. Seja o vosso sim, sim; e o vosso não, não. O que passa disso vem do Maligno.' },
    ],
  },
  {
    id: 3,
    title: 'Guardar domingos e festas de guarda',
    shortTitle: 'Dia do Senhor',
    explanation: 'O terceiro mandamento ordena santificar o dia consagrado ao Senhor. No Domingo, a Igreja celebra a Ressurreição de Cristo. Os fiéis devem participar da Santa Missa e abster-se de trabalhos e atividades que impeçam o culto a Deus, a alegria própria do dia e o descanso do corpo e da mente. É um dia de graça e repouso, imagem do descanso eterno em Deus.',
    verses: [
      { reference: 'Ex 20,8-10', text: 'Lembra-te de santificar o dia de sábado. Seis dias trabalharás e farás todas as tuas obras. Mas o sétimo dia é o sábado do Senhor teu Deus.' },
      { reference: 'Mc 2,27', text: 'O sábado foi feito para o homem, e não o homem para o sábado.' },
    ],
  },
  {
    id: 4,
    title: 'Honrar pai e mãe',
    shortTitle: 'Honrar os pais',
    explanation: 'O quarto mandamento ordena honrar e respeitar os pais, pois depois de Deus devemos honrar aqueles que nos deram a vida e nos transmitiram a fé. Estende-se a todos aqueles que exercem autoridade legítima: professores, superiores e governantes. Os filhos devem aos pais respeito, gratidão, obediência justa e assistência. Os pais, por sua vez, devem educar os filhos na fé e provê-los moral e materialmente.',
    verses: [
      { reference: 'Ex 20,12', text: 'Honra teu pai e tua mãe, para que se prolonguem os teus dias na terra que o Senhor teu Deus te dá.' },
      { reference: 'Ef 6,1-3', text: 'Filhos, obedecei a vossos pais no Senhor, porque isto é justo. Honra teu pai e tua mãe — é o primeiro mandamento com promessa.' },
      { reference: 'Cl 3,20', text: 'Filhos, obedecei em tudo a vossos pais, porque isto é agradável ao Senhor.' },
    ],
  },
  {
    id: 5,
    title: 'Não matarás',
    shortTitle: 'Não matar',
    explanation: 'O quinto mandamento proíbe a destruição injusta da vida humana. A vida é sagrada porque é dom de Deus — somente Ele é Senhor da vida, do início ao fim. Proíbe o homicídio, o aborto, a eutanásia, o suicídio e tudo o que atenta contra a dignidade da pessoa humana: tortura, mutilação, violência injusta. Proíbe também o escândalo, que é induzir outros ao pecado. Ordena o cuidado razoável da saúde própria e alheia.',
    verses: [
      { reference: 'Ex 20,13', text: 'Não matarás.' },
      { reference: 'Mt 5,21-22', text: 'Ouvistes o que foi dito aos antigos: Não matarás. Eu, porém, vos digo: todo aquele que se encolerizar contra seu irmão será réu de juízo.' },
      { reference: 'Gn 9,6', text: 'Quem derramar o sangue do homem, pelo homem seu sangue será derramado; porque Deus fez o homem à sua imagem.' },
    ],
  },
  {
    id: 6,
    title: 'Não pecarás contra a castidade',
    shortTitle: 'Castidade',
    explanation: 'O sexto mandamento abrange toda a sexualidade humana. A castidade é a integração positiva da sexualidade na pessoa, segundo o estado de vida de cada um. Proíbe o adultério, a fornicação, a pornografia, a prostituição e os atos contrários à natureza do ato conjugal. A sexualidade é ordenada ao amor conjugal entre homem e mulher, no matrimônio, aberta à vida. A pureza de coração é fonte de dignidade e liberdade.',
    verses: [
      { reference: 'Ex 20,14', text: 'Não cometerás adultério.' },
      { reference: 'Mt 5,27-28', text: 'Ouvistes o que foi dito: Não cometerás adultério. Eu, porém, vos digo: todo aquele que olhar para uma mulher com desejo impuro já cometeu adultério com ela no seu coração.' },
      { reference: '1Cor 6,19-20', text: 'O vosso corpo é templo do Espírito Santo. Glorificai a Deus no vosso corpo.' },
    ],
  },
  {
    id: 7,
    title: 'Não roubarás',
    shortTitle: 'Não roubar',
    explanation: 'O sétimo mandamento proíbe tomar ou reter injustamente o bem alheio e causar dano ao próximo em seus bens. Ordena a justiça e a caridade na gestão dos bens terrenos e dos frutos do trabalho humano. Proíbe o roubo, a fraude, o pagamento de salários injustos, a especulação abusiva e a corrupção. Exige o respeito à propriedade alheia e a restituição dos bens injustamente adquiridos.',
    verses: [
      { reference: 'Ex 20,15', text: 'Não roubarás.' },
      { reference: 'Mt 7,12', text: 'Tudo o que quereis que os homens vos façam, fazei-o vós a eles.' },
      { reference: 'Ef 4,28', text: 'Aquele que roubava, não roube mais; antes, trabalhe, fazendo o bem com as próprias mãos, a fim de ter com que ajudar os necessitados.' },
    ],
  },
  {
    id: 8,
    title: 'Não levantarás falso testemunho',
    shortTitle: 'Não mentir',
    explanation: 'O oitavo mandamento proíbe falsificar a verdade nas relações com o próximo. Proíbe o falso testemunho, o perjúrio, a mentira, a difamação, a calúnia, a maledicência e o juízo temerário. O cristão é chamado a viver na verdade, pois Cristo disse: "Eu sou a Verdade." A verdade é devida ao próximo como expressão de justiça e caridade. Toda falta contra a verdade exige reparação.',
    verses: [
      { reference: 'Ex 20,16', text: 'Não levantarás falso testemunho contra o teu próximo.' },
      { reference: 'Jo 8,32', text: 'Conhecereis a verdade, e a verdade vos libertará.' },
      { reference: 'Ef 4,25', text: 'Deixando a mentira, fale cada um a verdade com o seu próximo, porque somos membros uns dos outros.' },
    ],
  },
  {
    id: 9,
    title: 'Não desejarás a mulher do próximo',
    shortTitle: 'Pureza do coração',
    explanation: 'O nono mandamento proíbe a cobiça ou concupiscência carnal — o desejo desordenado do prazer sensual. Exige a pureza de coração e a temperança. A batalha pela pureza exige a modéstia, que protege o mistério íntimo da pessoa. A oração, a graça sacramental, a mortificação e o exercício das virtudes são os meios para alcançar a pureza de coração que permite ver a Deus.',
    verses: [
      { reference: 'Ex 20,17', text: 'Não cobiçarás a mulher do teu próximo.' },
      { reference: 'Mt 5,8', text: 'Bem-aventurados os puros de coração, porque verão a Deus.' },
      { reference: '1Jo 2,16', text: 'Tudo o que há no mundo — a concupiscência da carne, a concupiscência dos olhos e a soberba da vida — não procede do Pai, mas do mundo.' },
    ],
  },
  {
    id: 10,
    title: 'Não cobiçarás as coisas alheias',
    shortTitle: 'Não cobiçar',
    explanation: 'O décimo mandamento proíbe a avareza e o desejo desordenado dos bens do próximo. Proíbe a inveja — a tristeza diante do bem alheio e o desejo de apropriar-se dele indevidamente. A inveja pode levar aos piores crimes e é um dos pecados capitais. Este mandamento exige o desapego dos bens materiais, a confiança na Providência divina e a pobreza de espírito. "Onde está o vosso tesouro, aí estará o vosso coração."',
    verses: [
      { reference: 'Ex 20,17', text: 'Não cobiçarás a casa do teu próximo, nem coisa alguma que lhe pertença.' },
      { reference: 'Mt 6,21', text: 'Onde está o teu tesouro, aí estará também o teu coração.' },
      { reference: '1Tm 6,10', text: 'O amor ao dinheiro é a raiz de todos os males.' },
    ],
  },
]
