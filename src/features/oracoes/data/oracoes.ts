import type { Oracao } from './types'

export const ORACOES: Oracao[] = [
  {
    id: 'pai-nosso',
    name: 'Pai Nosso',
    latinName: 'Pater Noster',
    category: 'principal',
    origin: 'Ensinada pelo próprio Jesus Cristo aos Apóstolos (Mt 6,9-13)',
    explanation: 'A oração do Pai Nosso é chamada "oração dominical" porque foi ensinada diretamente pelo Senhor Jesus. É o modelo e resumo de toda oração cristã. Contém sete petições: três voltadas à glória de Deus e quatro às nossas necessidades. Santo Tomás de Aquino a chamou de "a mais perfeita das orações."',
    text: `Pai nosso que estais nos Céus,
santificado seja o vosso Nome,
venha a nós o vosso Reino,
seja feita a vossa vontade
assim na terra como no Céu.

O pão nosso de cada dia nos dai hoje,
perdoai-nos as nossas ofensas
assim como nós perdoamos
a quem nos tem ofendido,
e não nos deixeis cair em tentação,
mas livrai-nos do Mal.

Amém.`,
  },
  {
    id: 'ave-maria',
    name: 'Ave Maria',
    latinName: 'Ave Maria',
    category: 'principal',
    origin: 'Saudação do Anjo Gabriel a Maria (Lc 1,28) e de Isabel (Lc 1,42)',
    explanation: 'A Ave Maria é composta de duas partes: a saudação bíblica (palavras do Anjo Gabriel e de Santa Isabel) e a súplica da Igreja. Na primeira parte, louvamos a Deus pelas maravilhas que realizou em Maria. Na segunda, confiamos a ela as nossas necessidades, pedindo sua intercessão agora e na hora da morte.',
    text: `Ave Maria, cheia de graça,
o Senhor é convosco.
Bendita sois vós entre as mulheres
e bendito é o fruto do vosso ventre, Jesus.

Santa Maria, Mãe de Deus,
rogai por nós pecadores,
agora e na hora da nossa morte.

Amém.`,
  },
  {
    id: 'credo-apostolico',
    name: 'Credo Apostólico',
    latinName: 'Symbolum Apostolorum',
    category: 'credo',
    origin: 'Tradição apostólica, formulado nos primeiros séculos da Igreja',
    explanation: 'O Símbolo dos Apóstolos é o mais antigo resumo da fé cristã. Chamado "apostólico" porque é considerado resumo fiel da fé dos Apóstolos. Dividido em 12 artigos, professa a fé na Trindade: Deus Pai Criador, Jesus Cristo Redentor e o Espírito Santo Santificador. É recitado no Batismo e no Rosário.',
    text: `Creio em Deus Pai todo-poderoso,
Criador do Céu e da terra.

E em Jesus Cristo, seu único Filho, nosso Senhor,
que foi concebido pelo poder do Espírito Santo,
nasceu da Virgem Maria,
padeceu sob Pôncio Pilatos,
foi crucificado, morto e sepultado,
desceu à mansão dos mortos,
ressuscitou ao terceiro dia,
subiu aos Céus,
está sentado à direita de Deus Pai todo-poderoso,
donde há de vir a julgar os vivos e os mortos.

Creio no Espírito Santo,
na Santa Igreja Católica,
na comunhão dos Santos,
na remissão dos pecados,
na ressurreição da carne,
na vida eterna.

Amém.`,
  },
  {
    id: 'credo-niceno',
    name: 'Credo Niceno-Constantinopolitano',
    latinName: 'Symbolum Nicaenum',
    category: 'credo',
    origin: 'Concílio de Niceia (325) e Constantinopla (381)',
    explanation: 'O Credo Niceno-Constantinopolitano é a profissão de fé solene definida pelos primeiros Concílios Ecumênicos para combater as heresias cristológicas (arianismo). É mais detalhado que o Credo Apostólico, especialmente sobre a divindade de Cristo ("Deus de Deus, Luz da Luz, Deus verdadeiro de Deus verdadeiro") e do Espírito Santo. É recitado na Missa dominical.',
    text: `Creio em um só Deus, Pai todo-poderoso,
Criador do Céu e da terra,
de todas as coisas visíveis e invisíveis.

Creio em um só Senhor, Jesus Cristo,
Filho Unigênito de Deus,
nascido do Pai antes de todos os séculos:
Deus de Deus, Luz da Luz,
Deus verdadeiro de Deus verdadeiro;
gerado, não criado, consubstancial ao Pai.
Por Ele todas as coisas foram feitas.
E, por nós, homens, e para nossa salvação,
desceu dos Céus.

E encarnou pelo Espírito Santo,
no seio da Virgem Maria,
e Se fez homem.
Também por nós foi crucificado sob Pôncio Pilatos;
padeceu e foi sepultado.
Ressuscitou ao terceiro dia,
conforme as Escrituras;
e subiu aos Céus,
onde está sentado à direita do Pai.
E de novo há de vir, em sua glória,
para julgar os vivos e os mortos;
e o seu Reino não terá fim.

Creio no Espírito Santo,
Senhor que dá a vida,
e procede do Pai e do Filho;
e com o Pai e o Filho é adorado e glorificado:
Ele que falou pelos profetas.

Creio na Igreja Una, Santa, Católica e Apostólica.
Professo um só Batismo para remissão dos pecados.
E espero a ressurreição dos mortos
e a vida do mundo que há de vir.

Amém.`,
  },
  {
    id: 'ato-fe',
    name: 'Ato de Fé',
    category: 'ato',
    explanation: 'O Ato de Fé é uma oração pela qual professamos crer firmemente em todas as verdades reveladas por Deus e ensinadas pela Santa Igreja Católica, porque Deus — Verdade infinita — não pode enganar nem ser enganado.',
    text: `Meu Deus, porque sois a Verdade infalível,
creio firmemente em tudo o que a Santa Igreja Católica
propõe à nossa fé,
porque Vós lho revelastes.
Nesta fé quero viver e morrer.

Amém.`,
  },
  {
    id: 'ato-esperanca',
    name: 'Ato de Esperança',
    category: 'ato',
    explanation: 'O Ato de Esperança é uma oração pela qual confiamos que Deus nos dará a vida eterna e as graças necessárias para alcançá-la, porque Ele é fiel às suas promessas, todo-poderoso e infinitamente misericordioso.',
    text: `Meu Deus, porque sois todo-poderoso,
infinitamente bom e misericordioso,
espero obter o perdão dos meus pecados,
a graça de perseverar no bem
e alcançar a vida eterna,
pelas promessas de Cristo Nosso Senhor
e pelos méritos de sua Paixão.

Amém.`,
  },
  {
    id: 'ato-caridade',
    name: 'Ato de Caridade',
    category: 'ato',
    explanation: 'O Ato de Caridade é uma oração pela qual declaramos amar a Deus sobre todas as coisas por Ele mesmo — porque é infinitamente bom e digno de ser amado — e ao próximo como a nós mesmos, por amor de Deus.',
    text: `Meu Deus, porque sois infinitamente bom
e digno de ser amado,
amo-Vos de todo o coração sobre todas as coisas,
e ao próximo como a mim mesmo, por amor de Vós.
Perdoai-me se Vos não amo como devo.
Concedei-me a graça de Vos amar cada dia mais.

Amém.`,
  },
  {
    id: 'rosario',
    name: 'Santo Rosário',
    latinName: 'Rosarium',
    category: 'devocional',
    origin: 'Tradição atribuída a São Domingos de Gusmão (séc. XIII)',
    explanation: 'O Santo Rosário é a principal devoção mariana da Igreja Católica. Consiste na meditação dos mistérios da vida de Cristo e de Maria, acompanhada da recitação de orações vocais (Pai Nosso, Ave Maria, Glória). Possui quatro conjuntos de mistérios — Gozosos, Luminosos, Dolorosos e Gloriosos — cada um com cinco mistérios. São João Paulo II o chamou de "compêndio do Evangelho."',
    text: `Estrutura de cada dezena:
1. Anuncia-se o Mistério
2. Pai Nosso
3. 10 Ave Marias (meditando o mistério)
4. Glória ao Pai
5. Ó meu Jesus (oração de Fátima)

MISTÉRIOS GOZOSOS (segunda e sábado):
1. A Anunciação do Anjo a Maria
2. A Visitação de Maria a Isabel
3. O Nascimento de Jesus
4. A Apresentação de Jesus no Templo
5. A Perda e o Encontro de Jesus no Templo

MISTÉRIOS LUMINOSOS (quinta-feira):
1. O Batismo de Jesus no Jordão
2. As Bodas de Caná
3. O Anúncio do Reino de Deus
4. A Transfiguração
5. A Instituição da Eucaristia

MISTÉRIOS DOLOROSOS (terça e sexta):
1. A Agonia de Jesus no Getsêmani
2. A Flagelação
3. A Coroação de Espinhos
4. Jesus carrega a Cruz
5. A Crucificação e Morte de Jesus

MISTÉRIOS GLORIOSOS (quarta e domingo):
1. A Ressurreição de Jesus
2. A Ascensão de Jesus ao Céu
3. A Descida do Espírito Santo
4. A Assunção de Maria
5. A Coroação de Maria como Rainha`,
  },
]
