export interface ConfessionStep {
  id: string
  speaker: 'penitent' | 'priest' | 'instruction'
  text: string
  /** Texto dinâmico: {lastConfession} e {sins} serão substituídos */
  dynamic?: boolean
}

export const CONFESSION_STEPS: ConfessionStep[] = [
  {
    id: 'intro',
    speaker: 'instruction',
    text: 'Ajoelhe-se ou sente-se diante do sacerdote. Faça o Sinal da Cruz e diga:',
  },
  {
    id: 'greeting',
    speaker: 'penitent',
    text: 'Em nome do Pai, e do Filho, e do Espírito Santo. Amém. Abençoai-me, Padre, porque pequei.',
  },
  {
    id: 'time',
    speaker: 'penitent',
    text: 'A minha última confissão foi {lastConfession}.',
    dynamic: true,
  },
  {
    id: 'sins-intro',
    speaker: 'instruction',
    text: 'Confesse os seus pecados ao sacerdote com sinceridade e humildade:',
  },
  {
    id: 'sins',
    speaker: 'penitent',
    text: '{sins}',
    dynamic: true,
  },
  {
    id: 'sins-end',
    speaker: 'penitent',
    text: 'Por estes e por todos os pecados da minha vida passada, peço perdão a Deus e a vós, Padre, penitência e absolvição.',
  },
  {
    id: 'advice',
    speaker: 'instruction',
    text: 'O sacerdote dará conselhos espirituais e indicará uma penitência. Ouça com atenção e aceite a penitência.',
  },
  {
    id: 'priest-penance',
    speaker: 'priest',
    text: 'Como penitência, reze... (o sacerdote indicará a penitência)',
  },
  {
    id: 'contrition-intro',
    speaker: 'instruction',
    text: 'O sacerdote pedirá que você faça um ato de contrição. Reze com o coração:',
  },
  {
    id: 'contrition',
    speaker: 'penitent',
    text: 'Meu Deus, eu me arrependo de todo coração de Vos ter ofendido, porque sois infinitamente bom e o pecado Vos desagrada. Proponho firmemente, com o auxílio da Vossa graça, não mais Vos ofender e evitar as ocasiões próximas de pecado. Amém.',
  },
  {
    id: 'absolution-intro',
    speaker: 'instruction',
    text: 'O sacerdote pronunciará a fórmula de absolvição. Incline a cabeça com reverência:',
  },
  {
    id: 'absolution',
    speaker: 'priest',
    text: 'Deus, Pai de misericórdia, que, pela morte e ressurreição de seu Filho, reconciliou o mundo consigo e enviou o Espírito Santo para a remissão dos pecados, te conceda, pelo ministério da Igreja, o perdão e a paz. E eu te absolvo dos teus pecados, em nome do Pai, e do Filho, e do Espírito Santo.',
  },
  {
    id: 'response',
    speaker: 'penitent',
    text: 'Amém.',
  },
  {
    id: 'dismissal',
    speaker: 'priest',
    text: 'Dê graças ao Senhor, porque Ele é bom.',
  },
  {
    id: 'dismissal-response',
    speaker: 'penitent',
    text: 'Porque eterna é a Sua misericórdia.',
  },
  {
    id: 'final',
    speaker: 'instruction',
    text: 'A confissão está concluída. Cumpra a penitência o mais breve possível e agradeça a Deus pela Sua misericórdia. Reze um Pai Nosso, uma Ave Maria e um Glória ao Pai em ação de graças.',
  },
]

export const ACT_OF_CONTRITION = 'Meu Deus, eu me arrependo de todo coração de Vos ter ofendido, porque sois infinitamente bom e o pecado Vos desagrada. Proponho firmemente, com o auxílio da Vossa graça, não mais Vos ofender e evitar as ocasiões próximas de pecado. Amém.'
