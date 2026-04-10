import type { MysteryGroup } from './types'

export const MYSTERY_GROUPS: MysteryGroup[] = [
  {
    id: 'gozosos',
    name: 'Mistérios Gozosos',
    days: 'Segunda e Sábado',
    mysteries: [
      {
        number: 1,
        title: 'A Anunciação do Anjo a Nossa Senhora',
        fruit: 'Humildade',
        scripture: 'Lc 1,26-38',
        reflection: 'O Anjo Gabriel anuncia à Virgem Maria que ela será a Mãe do Salvador. Maria, com profunda humildade, aceita a vontade de Deus: "Eis a escrava do Senhor, faça-se em mim segundo a vossa palavra."',
      },
      {
        number: 2,
        title: 'A Visitação de Nossa Senhora a Santa Isabel',
        fruit: 'Caridade para com o próximo',
        scripture: 'Lc 1,39-56',
        reflection: 'Maria, levando Jesus em seu ventre, visita sua prima Isabel nas montanhas da Judeia. Isabel exclama: "Bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre!"',
      },
      {
        number: 3,
        title: 'O Nascimento de Jesus em Belém',
        fruit: 'Pobreza de espírito, desprendimento',
        scripture: 'Lc 2,1-20',
        reflection: 'O Filho de Deus nasce numa pobre gruta em Belém, envolto em panos e deitado numa manjedoura. Os anjos anunciam a boa-nova aos pastores: "Nasceu-vos hoje um Salvador."',
      },
      {
        number: 4,
        title: 'A Apresentação do Menino Jesus no Templo',
        fruit: 'Obediência e pureza',
        scripture: 'Lc 2,22-40',
        reflection: 'Maria e José apresentam o Menino Jesus no Templo conforme a Lei. O velho Simeão profetiza: "Uma espada transpassará a vossa alma", anunciando as dores que Maria sofreria.',
      },
      {
        number: 5,
        title: 'A Perda e o Encontro de Jesus no Templo',
        fruit: 'Busca de Deus em todas as coisas',
        scripture: 'Lc 2,41-52',
        reflection: 'Jesus, aos doze anos, é encontrado no Templo entre os doutores. Às palavras angustiadas de Maria, responde: "Não sabíeis que devo estar na casa de meu Pai?"',
      },
    ],
  },
  {
    id: 'luminosos',
    name: 'Mistérios Luminosos',
    days: 'Quinta-feira',
    mysteries: [
      {
        number: 1,
        title: 'O Batismo de Jesus no Rio Jordão',
        fruit: 'Fidelidade às promessas do Batismo',
        scripture: 'Mt 3,13-17',
        reflection: 'Jesus é batizado por João no rio Jordão. Os céus se abrem e a voz do Pai declara: "Este é o meu Filho amado, no qual pus toda a minha complacência."',
      },
      {
        number: 2,
        title: 'A Auto-revelação de Jesus nas Bodas de Caná',
        fruit: 'Confiança na intercessão de Maria',
        scripture: 'Jo 2,1-12',
        reflection: 'Nas bodas de Caná, por intercessão de Maria, Jesus realiza seu primeiro milagre, transformando a água em vinho. Maria diz aos servos: "Fazei tudo o que Ele vos disser."',
      },
      {
        number: 3,
        title: 'O Anúncio do Reino de Deus com o convite à conversão',
        fruit: 'Conversão e confiança em Deus',
        scripture: 'Mc 1,14-15',
        reflection: 'Jesus percorre a Galileia pregando: "O tempo está cumprido e o Reino de Deus está próximo. Convertei-vos e crede no Evangelho." Ele chama todos à conversão.',
      },
      {
        number: 4,
        title: 'A Transfiguração de Jesus no Monte Tabor',
        fruit: 'Desejo da santidade',
        scripture: 'Mt 17,1-8',
        reflection: 'Jesus sobe ao Monte Tabor com Pedro, Tiago e João. Seu rosto brilha como o sol e suas vestes tornam-se brancas como a luz. O Pai declara: "Ouvi-O!"',
      },
      {
        number: 5,
        title: 'A Instituição da Eucaristia',
        fruit: 'Amor à Eucaristia',
        scripture: 'Mt 26,26-29',
        reflection: 'Na Última Ceia, Jesus toma o pão e o vinho e os transforma em seu Corpo e Sangue: "Isto é o meu Corpo, que é dado por vós. Fazei isto em memória de Mim."',
      },
    ],
  },
  {
    id: 'dolorosos',
    name: 'Mistérios Dolorosos',
    days: 'Terça e Sexta-feira',
    mysteries: [
      {
        number: 1,
        title: 'A Agonia de Jesus no Horto das Oliveiras',
        fruit: 'Arrependimento dos pecados',
        scripture: 'Lc 22,39-46',
        reflection: 'No Getsêmani, Jesus sua sangue em agonia, prevendo toda a Paixão. Reza ao Pai: "Pai, se é possível, afasta de mim este cálice; contudo, não se faça a minha vontade, mas a Vossa."',
      },
      {
        number: 2,
        title: 'A Flagelação de Jesus',
        fruit: 'Mortificação dos sentidos',
        scripture: 'Jo 19,1',
        reflection: 'Pilatos manda flagelar Jesus. Nosso Senhor sofre os açoites com paciência divina, oferecendo cada golpe pela redenção dos nossos pecados.',
      },
      {
        number: 3,
        title: 'A Coroação de Espinhos',
        fruit: 'Desprezo do mundo e das suas vaidades',
        scripture: 'Mt 27,27-31',
        reflection: 'Os soldados tecem uma coroa de espinhos e a cravejam na cabeça de Jesus, zombando: "Salve, Rei dos Judeus!" Jesus aceita a humilhação em silêncio.',
      },
      {
        number: 4,
        title: 'Jesus carrega a Cruz até o Calvário',
        fruit: 'Paciência nas adversidades',
        scripture: 'Lc 23,26-32',
        reflection: 'Jesus, exausto, carrega a pesada Cruz pelo caminho do Calvário. Cai várias vezes, mas se levanta, movido pelo amor que nos tem, para completar a obra da salvação.',
      },
      {
        number: 5,
        title: 'A Crucificação e Morte de Jesus',
        fruit: 'Amor a Deus e salvação das almas',
        scripture: 'Lc 23,33-46',
        reflection: 'Pregado na Cruz, Jesus perdoa seus algozes: "Pai, perdoai-lhes, pois não sabem o que fazem." E entrega o espírito: "Pai, nas Vossas mãos entrego o meu espírito."',
      },
    ],
  },
  {
    id: 'gloriosos',
    name: 'Mistérios Gloriosos',
    days: 'Quarta-feira e Domingo',
    mysteries: [
      {
        number: 1,
        title: 'A Ressurreição de Jesus',
        fruit: 'Fé',
        scripture: 'Mt 28,1-10',
        reflection: 'Ao terceiro dia, Jesus ressuscita glorioso do sepulcro, vencendo a morte e o pecado. O anjo anuncia às mulheres: "Não está aqui, ressuscitou como havia dito!"',
      },
      {
        number: 2,
        title: 'A Ascensão de Jesus ao Céu',
        fruit: 'Esperança e desejo do Céu',
        scripture: 'At 1,6-11',
        reflection: 'Quarenta dias após a Ressurreição, Jesus sobe ao Céu na presença dos Apóstolos, prometendo: "Eis que estarei convosco todos os dias, até o fim do mundo."',
      },
      {
        number: 3,
        title: 'A Descida do Espírito Santo sobre os Apóstolos',
        fruit: 'Dons do Espírito Santo',
        scripture: 'At 2,1-13',
        reflection: 'No dia de Pentecostes, o Espírito Santo desce sobre os Apóstolos e sobre Maria em forma de línguas de fogo, enchendo-os de coragem para anunciar o Evangelho.',
      },
      {
        number: 4,
        title: 'A Assunção de Nossa Senhora ao Céu',
        fruit: 'Graça de uma boa morte',
        scripture: 'Ap 12,1',
        reflection: 'Terminado o curso de sua vida terrena, a Virgem Maria é elevada em corpo e alma à glória celeste, coroada como Rainha do Céu e da Terra.',
      },
      {
        number: 5,
        title: 'A Coroação de Nossa Senhora como Rainha do Céu e da Terra',
        fruit: 'Devoção a Maria Santíssima',
        scripture: 'Ap 12,1',
        reflection: 'Maria é coroada Rainha do Céu e da Terra pelo seu divino Filho. Ela intercede por nós junto a Deus, sendo nossa Mãe e advogada.',
      },
    ],
  },
]

/** Retorna o grupo de mistérios correspondente ao dia da semana */
export function getMysteryForToday(): MysteryGroup {
  const day = new Date().getDay() // 0=Dom, 1=Seg, ...
  switch (day) {
    case 0: return MYSTERY_GROUPS.find(g => g.id === 'gloriosos')! // Domingo
    case 1: return MYSTERY_GROUPS.find(g => g.id === 'gozosos')!   // Segunda
    case 2: return MYSTERY_GROUPS.find(g => g.id === 'dolorosos')! // Terça
    case 3: return MYSTERY_GROUPS.find(g => g.id === 'gloriosos')! // Quarta
    case 4: return MYSTERY_GROUPS.find(g => g.id === 'luminosos')! // Quinta
    case 5: return MYSTERY_GROUPS.find(g => g.id === 'dolorosos')! // Sexta
    case 6: return MYSTERY_GROUPS.find(g => g.id === 'gozosos')!   // Sábado
    default: return MYSTERY_GROUPS[0]
  }
}
