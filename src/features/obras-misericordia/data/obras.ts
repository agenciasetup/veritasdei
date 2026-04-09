import type { ObraGroup } from './types'

export const OBRA_GROUPS: ObraGroup[] = [
  {
    id: 'corporais',
    title: 'Obras de Misericórdia Corporais',
    description: 'Ações concretas de caridade que atendem às necessidades físicas do próximo, conforme ensinado por Jesus no Juízo Final (Mt 25,31-46).',
    icon: '🤲',
    obras: [
      {
        id: 1,
        name: 'Dar de comer a quem tem fome',
        explanation: 'A primeira obra de misericórdia corporal é alimentar quem passa fome. Não se trata apenas de dar comida, mas de reconhecer no faminto a presença de Cristo. A fome continua sendo uma das maiores tragédias da humanidade, e o cristão é chamado a combatê-la com ações concretas: doação de alimentos, apoio a programas sociais e partilha fraterna.',
        verses: [
          { reference: 'Mt 25,35', text: 'Tive fome e me destes de comer.' },
          { reference: 'Is 58,7', text: 'Reparte o teu pão com o faminto, acolhe em tua casa os pobres e desabrigados.' },
        ],
      },
      {
        id: 2,
        name: 'Dar de beber a quem tem sede',
        explanation: 'Saciar a sede do próximo é servir a Cristo. A água é dom fundamental de Deus e direito de toda pessoa. Esta obra nos lembra que devemos cuidar das necessidades mais básicas de quem sofre, sem esperar que peçam. A sede no deserto levou o povo a murmurar — dar de beber é ato de compaixão e confiança na Providência.',
        verses: [
          { reference: 'Mt 25,35', text: 'Tive sede e me destes de beber.' },
          { reference: 'Mt 10,42', text: 'Quem der a beber, ainda que seja apenas um copo de água fresca, a um destes pequenos, não perderá a sua recompensa.' },
        ],
      },
      {
        id: 3,
        name: 'Vestir os nus',
        explanation: 'Dar roupa a quem não tem é proteger a dignidade da pessoa humana. A nudez é símbolo de vulnerabilidade e vergonha desde a queda de Adão. Cobrir o nu é restaurar parte dessa dignidade. Inclui doar roupas, cobertores e garantir que ninguém passe frio.',
        verses: [
          { reference: 'Mt 25,36', text: 'Estava nu e me vestistes.' },
          { reference: 'Is 58,7', text: 'Ao veres um nu, cobre-o, e não te escondas daquele que é da tua carne.' },
        ],
      },
      {
        id: 4,
        name: 'Acolher os peregrinos',
        explanation: 'Dar hospitalidade a estrangeiros, viajantes e desabrigados. A hospitalidade é uma das virtudes mais valorizadas na Escritura — Abraão acolheu três anjos sem saber. Acolher o peregrino é acolher Cristo que disse: "Eu era forasteiro e me acolhestes." Inclui abrigar refugiados, imigrantes e quem não tem lar.',
        verses: [
          { reference: 'Mt 25,35', text: 'Era forasteiro e me acolhestes.' },
          { reference: 'Hb 13,2', text: 'Não vos esqueçais da hospitalidade, pois por ela alguns, sem o saber, acolheram anjos.' },
        ],
      },
      {
        id: 5,
        name: 'Visitar os enfermos',
        explanation: 'Visitar e cuidar dos doentes é uma das obras mais exigentes e mais preciosas. O doente vive a solidão e o medo — a presença fraterna é bálsamo para o corpo e para a alma. Jesus curou os enfermos e tocou os leprosos. Visitar doentes inclui também acompanhá-los espiritualmente, levando-lhes o conforto da fé.',
        verses: [
          { reference: 'Mt 25,36', text: 'Estava doente e me visitastes.' },
          { reference: 'Tg 5,14', text: 'Está alguém doente? Chame os presbíteros da Igreja, e estes orem sobre ele.' },
        ],
      },
      {
        id: 6,
        name: 'Visitar os presos',
        explanation: 'Visitar os encarcerados é reconhecer que nenhum ser humano, por mais grave que seja seu crime, perde a dignidade de filho de Deus. Jesus se identificou com o preso. Esta obra inclui o apoio material e espiritual aos prisioneiros, o trabalho pela justiça e pela reintegração social.',
        verses: [
          { reference: 'Mt 25,36', text: 'Estava preso e viestes me visitar.' },
          { reference: 'Hb 13,3', text: 'Lembrai-vos dos presos, como se estivésseis presos com eles.' },
        ],
      },
      {
        id: 7,
        name: 'Enterrar os mortos',
        explanation: 'Dar sepultura digna aos mortos é obra de respeito ao corpo humano, que é templo do Espírito Santo e destinado à ressurreição. Na tradição bíblica, Tobias arriscou a vida para enterrar os mortos. Inclui também consolar os enlutados, participar dos ritos fúnebres e rezar pelos defuntos.',
        verses: [
          { reference: 'Tb 1,17-18', text: 'Eu dava os meus pães aos famintos e as minhas vestes aos nus. Se via algum morto do meu povo, eu o enterrava.' },
          { reference: 'Eclo 38,16', text: 'Filho, derrama lágrimas sobre um morto e entoa um canto fúnebre. Dá ao corpo a sepultura que lhe é devida.' },
        ],
      },
    ],
  },
  {
    id: 'espirituais',
    title: 'Obras de Misericórdia Espirituais',
    description: 'Ações de caridade que atendem às necessidades da alma do próximo. São tão necessárias quanto as corporais, pois a maior miséria é a ignorância de Deus.',
    icon: '🕊',
    obras: [
      {
        id: 8,
        name: 'Dar bom conselho',
        explanation: 'Orientar quem está em dúvida ou aflição com sabedoria e caridade. O bom conselho nasce da prudência iluminada pela fé. Não se trata de impor nossa opinião, mas de ajudar o outro a discernir a vontade de Deus. Exige escuta, oração e respeito pela liberdade do outro.',
        verses: [
          { reference: 'Pr 12,15', text: 'O caminho do insensato é reto aos seus olhos, mas o sábio escuta os conselhos.' },
          { reference: 'Cl 3,16', text: 'Admoestai-vos uns aos outros com toda a sabedoria.' },
        ],
      },
      {
        id: 9,
        name: 'Ensinar os ignorantes',
        explanation: 'Instruir quem não conhece a verdade, especialmente as verdades da fé. A maior ignorância é não conhecer a Deus. O cristão tem o dever de ensinar — com paciência e clareza — as verdades necessárias à salvação. Inclui a catequese, a educação cristã dos filhos e o apostolado.',
        verses: [
          { reference: 'Mt 28,19-20', text: 'Ide e ensinai a todas as nações. Ensinai-as a cumprir tudo quanto vos tenho mandado.' },
          { reference: 'Dn 12,3', text: 'Os que tiverem ensinado a muitos os caminhos da justiça brilharão como as estrelas, por toda a eternidade.' },
        ],
      },
      {
        id: 10,
        name: 'Corrigir os que erram',
        explanation: 'A correção fraterna é dever de caridade: advertir com respeito e delicadeza quem está em erro ou em pecado. Não é julgar, mas amar o bastante para não deixar o irmão se perder. Jesus ensinou o método: primeiro em particular, depois com testemunhas, depois à comunidade.',
        verses: [
          { reference: 'Mt 18,15', text: 'Se o teu irmão pecar, vai e corrige-o a sós. Se te escutar, terás ganho o teu irmão.' },
          { reference: 'Gl 6,1', text: 'Se alguém for surpreendido em alguma falta, vós que sois espirituais corrigi-o com espírito de mansidão.' },
        ],
      },
      {
        id: 11,
        name: 'Consolar os aflitos',
        explanation: 'Estar presente junto a quem sofre, oferecer palavras de conforto e esperança. O cristão não foge da dor do outro, mas a assume. Consolar é um dos nomes do Espírito Santo (Paráclito = Consolador). A presença silenciosa, a escuta atenta e a oração são formas poderosas de consolo.',
        verses: [
          { reference: '2Cor 1,3-4', text: 'Deus de toda consolação, que nos consola em todas as nossas tribulações, para que possamos consolar os que estão em qualquer angústia.' },
          { reference: 'Mt 5,4', text: 'Bem-aventurados os que choram, porque serão consolados.' },
        ],
      },
      {
        id: 12,
        name: 'Perdoar as injúrias',
        explanation: 'Perdoar quem nos ofendeu é mandamento de Cristo e condição para recebermos o perdão de Deus. O perdão não é sentimento, mas decisão da vontade: renunciar à vingança e desejar o bem de quem nos fez mal. É o ato mais difícil e mais libertador da vida cristã.',
        verses: [
          { reference: 'Mt 6,14-15', text: 'Se perdoardes aos homens as suas ofensas, vosso Pai celeste também vos perdoará.' },
          { reference: 'Cl 3,13', text: 'Suportai-vos uns aos outros e perdoai-vos mutuamente, sempre que alguém tiver queixa contra outrem. Como o Senhor vos perdoou, assim também perdoai.' },
        ],
      },
      {
        id: 13,
        name: 'Suportar com paciência as fraquezas do próximo',
        explanation: 'Tolerar com paciência os defeitos, manias e limitações dos outros. Ninguém é perfeito — suportar as fraquezas alheias é exercício diário de humildade e caridade. Lembrar que também nós temos defeitos que os outros suportam. A paciência é fruto do Espírito Santo.',
        verses: [
          { reference: 'Rm 15,1', text: 'Nós que somos fortes devemos suportar as fraquezas dos fracos e não agradar a nós mesmos.' },
          { reference: 'Ef 4,2', text: 'Com toda a humildade e mansidão, com paciência, suportando-vos uns aos outros em caridade.' },
        ],
      },
      {
        id: 14,
        name: 'Rezar a Deus pelos vivos e pelos mortos',
        explanation: 'A oração de intercessão é a forma mais elevada de caridade, pois confia a Deus aquilo que ultrapassa nossa capacidade. Rezar pelos vivos — pelos doentes, pecadores, perseguidos e pela Igreja — é dever cristão. Rezar pelos mortos — especialmente pelas almas do Purgatório — é expressão da comunhão dos santos.',
        verses: [
          { reference: '1Tm 2,1', text: 'Exorto que se façam súplicas, orações, intercessões e ações de graças por todos os homens.' },
          { reference: '2Mac 12,46', text: 'É um pensamento santo e salutar rezar pelos defuntos, para que sejam livres dos seus pecados.' },
        ],
      },
    ],
  },
]
