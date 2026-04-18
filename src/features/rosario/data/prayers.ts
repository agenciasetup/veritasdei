import type { Prayer } from './types'

/**
 * Prayer texts in Portuguese and (optionally) Latin.
 *
 * Formatting convention: `\n` separates poetic lines within a stanza;
 * `\n\n` separates stanzas. The UI renders with `white-space: pre-line`,
 * so both turn into visible line breaks — the blank gap between stanzas
 * is what lets the reader track long prayers like the Credo.
 */

export const SINAL_DA_CRUZ: Prayer = {
  id: 'sinal-da-cruz',
  name: 'Sinal da Cruz',
  latinName: 'Signum Crucis',
  text: 'Pelo sinal da Santa Cruz, livrai-nos, Deus, Nosso Senhor, dos nossos inimigos.\n\nEm nome do Pai, e do Filho, e do Espírito Santo. Amém.',
  latinText: 'In nomine Patris, et Filii, et Spiritus Sancti. Amen.',
}

export const CREDO: Prayer = {
  id: 'credo',
  name: 'Credo Apostólico',
  latinName: 'Symbolum Apostolorum',
  text: 'Creio em Deus Pai todo-poderoso,\nCriador do céu e da terra;\n\ne em Jesus Cristo, seu único Filho, nosso Senhor;\nque foi concebido pelo poder do Espírito Santo;\nnasceu da Virgem Maria;\npadeceu sob Pôncio Pilatos,\nfoi crucificado, morto e sepultado;\ndesceu à mansão dos mortos;\nressuscitou ao terceiro dia;\nsubiu aos céus,\nestá sentado à direita de Deus Pai todo-poderoso,\ndonde há de vir a julgar os vivos e os mortos.\n\nCreio no Espírito Santo,\nna Santa Igreja Católica,\nna comunhão dos santos,\nna remissão dos pecados,\nna ressurreição da carne,\nna vida eterna. Amém.',
  latinText: 'Credo in Deum Patrem omnipotentem,\nCreatorem caeli et terrae.\n\nEt in Iesum Christum, Filium eius unicum, Dominum nostrum,\nqui conceptus est de Spiritu Sancto,\nnatus ex Maria Virgine,\npassus sub Pontio Pilato,\ncrucifixus, mortuus, et sepultus,\ndescendit ad inferos,\ntertia die resurrexit a mortuis,\nascendit ad caelos,\nsedet ad dexteram Dei Patris omnipotentis,\ninde venturus est iudicare vivos et mortuos.\n\nCredo in Spiritum Sanctum,\nsanctam Ecclesiam catholicam,\nsanctorum communionem,\nremissionem peccatorum,\ncarnis resurrectionem,\nvitam aeternam. Amen.',
}

export const PAI_NOSSO: Prayer = {
  id: 'pai-nosso',
  name: 'Pai Nosso',
  latinName: 'Pater Noster',
  text: 'Pai nosso, que estais no céu,\nsantificado seja o Vosso nome,\nvenha a nós o Vosso reino,\nseja feita a Vossa vontade,\nassim na terra como no céu.\n\nO pão nosso de cada dia nos dai hoje,\nperdoai-nos as nossas ofensas,\nassim como nós perdoamos a quem nos tem ofendido,\ne não nos deixeis cair em tentação,\nmas livrai-nos do mal. Amém.',
  latinText: 'Pater noster, qui es in caelis,\nsanctificetur nomen tuum;\nadveniat regnum tuum;\nfiat voluntas tua,\nsicut in caelo et in terra.\n\nPanem nostrum quotidianum da nobis hodie;\net dimitte nobis debita nostra,\nsicut et nos dimittimus debitoribus nostris;\net ne nos inducas in tentationem;\nsed libera nos a malo. Amen.',
}

export const AVE_MARIA: Prayer = {
  id: 'ave-maria',
  name: 'Ave Maria',
  latinName: 'Ave Maria',
  text: 'Ave Maria, cheia de graça,\no Senhor é convosco;\nbendita sois vós entre as mulheres,\ne bendito é o fruto do vosso ventre, Jesus.\n\nSanta Maria, Mãe de Deus,\nrogai por nós, pecadores,\nagora e na hora da nossa morte. Amém.',
  latinText: 'Ave Maria, gratia plena, Dominus tecum;\nbenedicta tu in mulieribus,\net benedictus fructus ventris tui, Iesus.\n\nSancta Maria, Mater Dei,\nora pro nobis peccatoribus,\nnunc et in hora mortis nostrae. Amen.',
}

export const GLORIA: Prayer = {
  id: 'gloria',
  name: 'Glória ao Pai',
  latinName: 'Gloria Patri',
  text: 'Glória ao Pai, ao Filho e ao Espírito Santo,\ncomo era no princípio, agora e sempre,\ne pelos séculos dos séculos. Amém.',
  latinText: 'Gloria Patri, et Filio, et Spiritui Sancto,\nsicut erat in principio, et nunc, et semper,\net in saecula saeculorum. Amen.',
}

export const ORACAO_FATIMA: Prayer = {
  id: 'oracao-fatima',
  name: 'Oração de Fátima',
  latinName: 'Oratio Fatimae',
  text: 'Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno,\nlevai as almas todas para o céu,\ne socorrei principalmente as que mais precisarem.',
  latinText: 'O mi Iesu, dimitte nobis debita nostra,\nlibera nos ab igne inferni,\nconduc in caelum omnes animas,\npraesertim illas quae maxime indigent misericordia tua.',
}

export const SALVE_RAINHA: Prayer = {
  id: 'salve-rainha',
  name: 'Salve Rainha',
  latinName: 'Salve Regina',
  text: 'Salve, Rainha, Mãe de misericórdia,\nvida, doçura e esperança nossa, salve!\n\nA vós bradamos, os degredados filhos de Eva.\nA vós suspiramos, gemendo e chorando\nneste vale de lágrimas.\n\nEia, pois, advogada nossa,\nesses vossos olhos misericordiosos a nós volvei;\ne depois deste desterro,\nmostrai-nos Jesus, bendito fruto do vosso ventre.\n\nÓ clemente, ó piedosa, ó doce sempre Virgem Maria.',
  latinText: 'Salve, Regina, Mater misericordiae,\nvita, dulcedo et spes nostra, salve.\n\nAd te clamamus, exsules filii Evae.\nAd te suspiramus, gementes et flentes\nin hac lacrimarum valle.\n\nEia ergo, advocata nostra,\nillos tuos misericordes oculos ad nos converte.\nEt Iesum, benedictum fructum ventris tui,\nnobis post hoc exsilium ostende.\n\nO clemens, O pia, O dulcis Virgo Maria.',
}

export const ORACAO_FINAL: Prayer = {
  id: 'oracao-final',
  name: 'Oração Final',
  latinName: 'Oratio Finalis',
  text: 'Rogai por nós, Santa Mãe de Deus.\nPara que sejamos dignos das promessas de Cristo.\n\nOremos:\nÓ Deus, cujo Filho Unigênito,\npela sua vida, morte e ressurreição,\nnos mereceu o prêmio da salvação eterna,\nconcedei-nos, nós Vos suplicamos,\nque meditando estes mistérios\ndo Santíssimo Rosário da bem-aventurada Virgem Maria,\nimitemos o que eles contêm\ne alcancemos o que prometem.\nPelo mesmo Cristo, Senhor nosso. Amém.',
  latinText: 'Ora pro nobis, sancta Dei Genetrix.\nUt digni efficiamur promissionibus Christi.\n\nOremus:\nDeus, cuius Unigenitus per vitam,\nmortem et resurrectionem suam\nnobis salutis aeternae praemia comparavit:\nconcede, quaesumus,\nut haec mysteria sacratissimo\nbeatae Mariae Virginis Rosario recolentes,\net imitemur quod continent,\net quod promittunt assequamur.\nPer eundem Christum Dominum nostrum. Amen.',
}
