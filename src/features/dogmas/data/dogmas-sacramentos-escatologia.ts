import type { DogmaCategory } from './types'

export const dogmasSacramentos: DogmaCategory = {
  id: 'sacramentos',
  number: 7,
  title: 'Dogmas sobre os Sacramentos',
  icon: '🕯',
  description: 'Os sete sinais eficazes da graça, instituídos por Cristo e confiados à Igreja.',
  dogmas: [
    {
      id: 29,
      title: 'O Batismo é Verdadeiro Sacramento Instituído por Cristo',
      explanation: 'O Batismo é o sacramento da regeneração espiritual: apaga o pecado original, confere a graça santificante e incorpora o batizado à Igreja de Cristo. É a porta de entrada para todos os demais sacramentos e necessário para a salvação.',
      verses: [
        { reference: 'Mt 28,19', text: 'Ide, pois, e ensinai a todas as nações, batizando-as em nome do Pai, e do Filho, e do Espírito Santo.' },
        { reference: 'Jo 3,5', text: 'Quem não nascer da água e do Espírito não pode entrar no Reino de Deus.' },
      ],
    },
    {
      id: 30,
      title: 'A Confirmação (Crisma) é Verdadeiro Sacramento',
      explanation: 'A Confirmação confere ao batizado a plenitude do Espírito Santo, fortalecendo-o na fé e tornando-o soldado de Cristo. O fiel recebe a fortaleza para professar, defender e viver a fé com coragem, mesmo diante de perseguições.',
      verses: [
        { reference: 'At 8,15-17', text: 'Pedro e João oraram por eles para que recebessem o Espírito Santo. Então impunham as mãos sobre eles, e recebiam o Espírito Santo.' },
        { reference: 'At 19,6', text: 'Impondo-lhes Paulo as mãos, veio sobre eles o Espírito Santo, e falavam em línguas e profetizavam.' },
      ],
    },
    {
      id: 31,
      title: 'A Igreja Recebeu Poder de Perdoar Pecados',
      explanation: 'Cristo conferiu aos Apóstolos e seus sucessores o poder real de perdoar e reter pecados cometidos após o Batismo. Este poder não é simbólico, mas eficaz: quando o sacerdote absolve, é o próprio Cristo que perdoa por meio dele.',
      verses: [
        { reference: 'Jo 20,22-23', text: 'Soprou sobre eles e disse: Recebei o Espírito Santo. Àqueles a quem perdoardes os pecados, serão perdoados; àqueles a quem os retiverdes, serão retidos.' },
      ],
    },
    {
      id: 32,
      title: 'A Confissão Sacramental é Necessária por Direito Divino',
      explanation: 'A confissão individual e secreta dos pecados graves a um sacerdote ordenado é obrigatória por instituição divina, não por mera disciplina eclesiástica. O penitente deve confessar todos os pecados mortais de que tenha consciência, com suas circunstâncias.',
      verses: [
        { reference: 'Jo 20,23', text: 'Àqueles a quem perdoardes os pecados, serão perdoados; àqueles a quem os retiverdes, serão retidos.' },
        { reference: 'Tg 5,16', text: 'Confessai os vossos pecados uns aos outros e orai uns pelos outros, para serdes curados.' },
      ],
    },
    {
      id: 33,
      title: 'A Eucaristia é Verdadeiro Sacramento Instituído por Cristo',
      explanation: 'A Eucaristia é o sacramento do Corpo e Sangue de Cristo, instituído na Última Ceia. Não é apenas um memorial simbólico, mas a presença real, verdadeira e substancial de Jesus Cristo — Corpo, Sangue, Alma e Divindade — sob as espécies do pão e do vinho.',
      verses: [
        { reference: 'Jo 6,51', text: 'Eu sou o pão vivo descido do céu. Quem comer deste pão viverá eternamente. E o pão que Eu darei é a minha carne para a vida do mundo.' },
        { reference: '1Cor 11,24-25', text: 'Isto é o meu Corpo, que é entregue por vós. Fazei isto em minha memória. Este cálice é a Nova Aliança no meu Sangue.' },
      ],
    },
    {
      id: 34,
      title: 'A Transubstanciação',
      explanation: 'Na consagração eucarística, toda a substância do pão se converte no Corpo de Cristo e toda a substância do vinho se converte no seu Sangue. Permanecem apenas as aparências (acidentes) do pão e do vinho. Cristo está inteiro sob cada espécie e em cada partícula. Definido pelo Concílio de Trento.',
      verses: [
        { reference: 'Mt 26,26-28', text: 'Jesus tomou o pão, benzeu-o, partiu-o e deu-o aos discípulos, dizendo: Tomai e comei, isto é o meu Corpo. Depois, tomou o cálice: Bebei dele todos, porque isto é o meu Sangue da Nova Aliança.' },
        { reference: 'Jo 6,55', text: 'A minha carne é verdadeiramente comida e o meu sangue é verdadeiramente bebida.' },
      ],
    },
    {
      id: 35,
      title: 'A Unção dos Enfermos é Verdadeiro Sacramento',
      explanation: 'A Unção dos Enfermos confere graça especial ao cristão que enfrenta doença grave ou velhice avançada. Fortalece a alma, perdoa pecados e pode restaurar a saúde corporal, se for da vontade de Deus. Administrada pela unção com óleo e oração do sacerdote.',
      verses: [
        { reference: 'Tg 5,14-15', text: 'Está alguém doente? Chame os presbíteros da Igreja, e estes orem sobre ele, ungindo-o com óleo em nome do Senhor. A oração da fé salvará o enfermo.' },
      ],
    },
    {
      id: 36,
      title: 'A Ordem é Verdadeiro Sacramento Instituído por Cristo',
      explanation: 'O Sacramento da Ordem confere o poder sagrado de consagrar a Eucaristia, perdoar pecados e governar o Povo de Deus. Existe hierarquia de direito divino: Bispos, Presbíteros e Diáconos. O sacerdócio ministerial é essencialmente diferente do sacerdócio comum dos fiéis.',
      verses: [
        { reference: '1Tm 4,14', text: 'Não desprezes o dom que há em ti, que te foi dado por profecia, com a imposição das mãos do presbitério.' },
        { reference: '2Tm 1,6', text: 'Admoesto-te a que reavives o dom de Deus que há em ti pela imposição das minhas mãos.' },
      ],
    },
    {
      id: 37,
      title: 'O Matrimônio é Verdadeiro Sacramento',
      explanation: 'Cristo elevou o contrato matrimonial entre batizados à dignidade de sacramento. O matrimônio é uno (entre um homem e uma mulher) e indissolúvel (até a morte). A graça sacramental fortalece os esposos para viverem a fidelidade, a fecundidade e o amor mútuo.',
      verses: [
        { reference: 'Ef 5,31-32', text: 'O homem deixará pai e mãe e se unirá à sua mulher, e os dois formarão uma só carne. Este mistério é grande: refiro-me a Cristo e à Igreja.' },
        { reference: 'Mt 19,6', text: 'Não são mais dois, mas uma só carne. Portanto, o que Deus uniu, o homem não separe.' },
      ],
    },
  ],
}

export const dogmasEscatologia: DogmaCategory = {
  id: 'escatologia',
  number: 8,
  title: 'Dogmas sobre as Últimas Coisas',
  icon: '⚖',
  description: 'Morte, juízo, céu, inferno, purgatório e a vida eterna.',
  dogmas: [
    {
      id: 38,
      title: 'A Morte e Sua Origem',
      explanation: 'A morte corporal é consequência do pecado original. Deus não criou o homem para morrer: a morte entrou no mundo como castigo pelo pecado de Adão. Todo ser humano está sujeito à morte como resultado dessa queda originária.',
      verses: [
        { reference: 'Rm 6,23', text: 'O salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna em Cristo Jesus, nosso Senhor.' },
        { reference: 'Gn 3,19', text: 'Tu és pó, e ao pó hás de voltar.' },
      ],
    },
    {
      id: 39,
      title: 'O Céu (Paraíso)',
      explanation: 'As almas dos justos que morrem em estado de graça e livres de toda culpa e pena temporal entram imediatamente na visão beatífica — a contemplação direta de Deus face a face. O céu é a comunhão plena e eterna com a Santíssima Trindade, a felicidade suprema que supera todo desejo humano.',
      verses: [
        { reference: 'Jo 14,2-3', text: 'Na casa de meu Pai há muitas moradas. Vou preparar-vos um lugar, para que onde Eu estiver, estejais vós também.' },
        { reference: '1Cor 2,9', text: 'O que os olhos não viram, os ouvidos não ouviram e o coração do homem não imaginou: isso Deus preparou para aqueles que O amam.' },
      ],
    },
    {
      id: 40,
      title: 'O Inferno',
      explanation: 'As almas dos que morrem em estado de pecado mortal, sem arrependimento, vão ao inferno — estado de separação eterna de Deus. O inferno é real e eterno: a pena principal é a privação perpétua da visão de Deus, além do sofrimento. A Igreja afirma a existência do inferno, embora não declare que alguém em particular esteja nele.',
      verses: [
        { reference: 'Mt 25,41', text: 'Apartai-vos de mim, malditos, para o fogo eterno, preparado para o diabo e seus anjos.' },
        { reference: 'Mt 25,46', text: 'Estes irão para o suplício eterno, e os justos para a vida eterna.' },
      ],
    },
    {
      id: 41,
      title: 'O Purgatório',
      explanation: 'As almas dos justos que morrem com pecados veniais ou penas temporais devidas por pecados já perdoados passam por uma purificação após a morte — o Purgatório. Não é um lugar de condenação, mas de purificação final antes de entrar no céu. Os fiéis vivos podem ajudar essas almas com orações, sacrifícios e Missas.',
      verses: [
        { reference: '2Mac 12,46', text: 'É um pensamento santo e salutar rezar pelos defuntos, para que sejam livres dos seus pecados.' },
        { reference: '1Cor 3,15', text: 'Se a obra de alguém se queimar, sofrerá perda; o próprio, porém, será salvo, todavia como que através do fogo.' },
      ],
    },
    {
      id: 42,
      title: 'O Fim do Mundo e a Segunda Vinda de Cristo',
      explanation: 'No fim dos tempos, Cristo voltará visivelmente em glória e majestade para julgar os vivos e os mortos. A sua segunda vinda (Parusia) encerrará a história humana e inaugurará os novos céus e a nova terra. Ninguém conhece o dia nem a hora.',
      verses: [
        { reference: 'Mt 24,30', text: 'Então aparecerá no céu o sinal do Filho do Homem, e verão o Filho do Homem vindo sobre as nuvens do céu, com poder e grande glória.' },
        { reference: 'At 1,11', text: 'Este Jesus, que foi elevado ao céu, virá do mesmo modo como o vistes subir.' },
      ],
    },
    {
      id: 43,
      title: 'A Ressurreição dos Mortos no Último Dia',
      explanation: 'No fim dos tempos, todos os mortos ressuscitarão — justos e pecadores — com seus próprios corpos, agora transformados. Os corpos dos justos serão glorificados à semelhança do corpo ressuscitado de Cristo. A ressurreição da carne é artigo fundamental do Credo.',
      verses: [
        { reference: 'Jo 6,54', text: 'Quem come a minha carne e bebe o meu sangue tem a vida eterna, e Eu o ressuscitarei no último dia.' },
        { reference: '1Cor 15,52', text: 'A trombeta soará, e os mortos ressuscitarão incorruptíveis, e nós seremos transformados.' },
      ],
    },
    {
      id: 44,
      title: 'O Juízo Universal',
      explanation: 'Além do juízo particular que ocorre no momento da morte, haverá um Juízo Final e universal quando Cristo voltar. Nele, todos os seres humanos — de todos os tempos — comparecerão diante de Cristo Juiz, e toda a verdade de cada vida será revelada. Os justos receberão a recompensa eterna; os ímpios, a condenação.',
      verses: [
        { reference: 'Mt 25,31-32', text: 'Quando o Filho do Homem vier em sua glória, todos os povos se reunirão diante dele, e Ele separará uns dos outros, como o pastor separa as ovelhas dos cabritos.' },
        { reference: '2Cor 5,10', text: 'Todos nós devemos comparecer diante do tribunal de Cristo, para que cada um receba conforme o que tiver feito por meio do corpo, o bem ou o mal.' },
      ],
    },
  ],
}
