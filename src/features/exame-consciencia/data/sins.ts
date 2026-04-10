import type { Sin } from './types'

export const SINS: Sin[] = [
  // ── 1.° Mandamento ──
  { id: 1, commandmentId: 1, text: 'Tive dúvidas voluntárias contra a fé?', textPast: 'Tive dúvidas voluntárias contra a fé.', adult: true, teen: true, married: true, mortal: true },
  { id: 2, commandmentId: 1, text: 'Pratiquei superstição, horóscopo, magia ou consulta a espíritos?', textPast: 'Pratiquei superstição, horóscopo, magia ou consulta a espíritos.', adult: true, teen: true, married: true, mortal: true },
  { id: 3, commandmentId: 1, text: 'Dei mais importância a coisas materiais do que a Deus?', textPast: 'Dei mais importância a coisas materiais do que a Deus.', adult: true, teen: true, married: true, mortal: false },
  { id: 4, commandmentId: 1, text: 'Deixei de rezar por muito tempo ou abandonei a oração?', textPast: 'Deixei de rezar por muito tempo.', adult: true, teen: true, married: true, mortal: false },
  { id: 5, commandmentId: 1, text: 'Desesperei da misericórdia de Deus ou presumi da sua bondade para pecar?', textPast: 'Desesperei da misericórdia de Deus ou presumi da sua bondade.', adult: true, teen: false, married: true, mortal: true },
  { id: 6, commandmentId: 1, text: 'Tive vergonha de me manifestar como católico?', textPast: 'Tive vergonha de me manifestar como católico.', adult: true, teen: true, married: true, mortal: false },

  // ── 2.° Mandamento ──
  { id: 7, commandmentId: 2, text: 'Usei o nome de Deus em vão, com irreverência ou por hábito?', textPast: 'Usei o nome de Deus em vão.', adult: true, teen: true, married: true, mortal: false },
  { id: 8, commandmentId: 2, text: 'Blasfemei contra Deus, a Virgem Maria ou os Santos?', textPast: 'Blasfemei contra Deus, a Virgem Maria ou os Santos.', adult: true, teen: true, married: true, mortal: true },
  { id: 9, commandmentId: 2, text: 'Fiz juramentos falsos ou desnecessários?', textPast: 'Fiz juramentos falsos ou desnecessários.', adult: true, teen: false, married: true, mortal: true },
  { id: 10, commandmentId: 2, text: 'Amaldiçoei pessoas ou desejei-lhes o mal?', textPast: 'Amaldiçoei pessoas ou desejei-lhes o mal.', adult: true, teen: true, married: true, mortal: false },

  // ── 3.° Mandamento ──
  { id: 11, commandmentId: 3, text: 'Faltei à Missa de domingo ou dia santo de obrigação sem motivo grave?', textPast: 'Faltei à Missa de domingo ou dia santo de obrigação.', adult: true, teen: true, married: true, mortal: true },
  { id: 12, commandmentId: 3, text: 'Cheguei atrasado à Missa por negligência ou saí antes do final?', textPast: 'Cheguei atrasado à Missa ou saí antes do final.', adult: true, teen: true, married: true, mortal: false },
  { id: 13, commandmentId: 3, text: 'Estive distraído voluntariamente durante a Missa (celular, conversas)?', textPast: 'Estive distraído voluntariamente durante a Missa.', adult: true, teen: true, married: true, mortal: false },
  { id: 14, commandmentId: 3, text: 'Trabalhei desnecessariamente ao domingo sem motivo grave?', textPast: 'Trabalhei desnecessariamente ao domingo.', adult: true, teen: false, married: true, mortal: false },

  // ── 4.° Mandamento ──
  { id: 15, commandmentId: 4, text: 'Desobedeci ou desrespeitei os meus pais?', textPast: 'Desobedeci ou desrespeitei os meus pais.', adult: true, teen: true, married: true, mortal: false },
  { id: 16, commandmentId: 4, text: 'Negligenciei o cuidado dos meus pais ou familiares necessitados?', textPast: 'Negligenciei o cuidado dos meus pais ou familiares necessitados.', adult: true, teen: false, married: true, mortal: false },
  { id: 17, commandmentId: 4, text: 'Causei divisão ou discórdia na minha família?', textPast: 'Causei divisão ou discórdia na minha família.', adult: true, teen: true, married: true, mortal: false },
  { id: 18, commandmentId: 4, text: 'Deixei de educar os meus filhos na fé católica?', textPast: 'Deixei de educar os meus filhos na fé católica.', adult: true, teen: false, married: true, mortal: true },
  { id: 19, commandmentId: 4, text: 'Fui ingrato para com aqueles que me ajudaram?', textPast: 'Fui ingrato para com aqueles que me ajudaram.', adult: true, teen: true, married: true, mortal: false },

  // ── 5.° Mandamento ──
  { id: 20, commandmentId: 5, text: 'Pratiquei ou cooperei com o aborto?', textPast: 'Pratiquei ou cooperei com o aborto.', adult: true, teen: false, married: true, mortal: true },
  { id: 21, commandmentId: 5, text: 'Desejei a morte de alguém?', textPast: 'Desejei a morte de alguém.', adult: true, teen: true, married: true, mortal: true },
  { id: 22, commandmentId: 5, text: 'Agredi fisicamente alguém ou causei dano corporal?', textPast: 'Agredi fisicamente alguém.', adult: true, teen: true, married: true, mortal: true },
  { id: 23, commandmentId: 5, text: 'Dei mau exemplo que pudesse levar outros ao pecado (escândalo)?', textPast: 'Dei mau exemplo que pudesse levar outros ao pecado.', adult: true, teen: true, married: true, mortal: true },
  { id: 24, commandmentId: 5, text: 'Guardei ódio, rancor ou recusei perdoar alguém?', textPast: 'Guardei ódio, rancor ou recusei perdoar alguém.', adult: true, teen: true, married: true, mortal: true },
  { id: 25, commandmentId: 5, text: 'Usei drogas, bebi em excesso ou prejudiquei minha saúde voluntariamente?', textPast: 'Usei drogas, bebi em excesso ou prejudiquei minha saúde.', adult: true, teen: true, married: true, mortal: true },
  { id: 26, commandmentId: 5, text: 'Fui cruel com animais ou destruí a natureza sem necessidade?', textPast: 'Fui cruel com animais ou destruí a natureza.', adult: true, teen: true, married: true, mortal: false },

  // ── 6.° Mandamento ──
  { id: 27, commandmentId: 6, text: 'Cometi atos impuros sozinho (masturbação)?', textPast: 'Cometi atos impuros sozinho.', adult: true, teen: true, married: true, mortal: true },
  { id: 28, commandmentId: 6, text: 'Tive relações sexuais fora do matrimônio (fornicação)?', textPast: 'Tive relações sexuais fora do matrimônio.', adult: true, teen: true, married: false, mortal: true },
  { id: 29, commandmentId: 6, text: 'Cometi adultério?', textPast: 'Cometi adultério.', adult: true, teen: false, married: true, mortal: true },
  { id: 30, commandmentId: 6, text: 'Assisti a pornografia ou conteúdo impuro?', textPast: 'Assisti a pornografia ou conteúdo impuro.', adult: true, teen: true, married: true, mortal: true },
  { id: 31, commandmentId: 6, text: 'Usei métodos artificiais de contracepção?', textPast: 'Usei métodos artificiais de contracepção.', adult: true, teen: false, married: true, mortal: true },
  { id: 32, commandmentId: 6, text: 'Vesti-me ou comportei-me de forma provocante e indecente?', textPast: 'Vesti-me ou comportei-me de forma indecente.', adult: true, teen: true, married: true, mortal: false },

  // ── 7.° Mandamento ──
  { id: 33, commandmentId: 7, text: 'Roubei ou furtei algo?', textPast: 'Roubei ou furtei algo.', adult: true, teen: true, married: true, mortal: true },
  { id: 34, commandmentId: 7, text: 'Prejudiquei alguém em negócios ou transações (fraude, engano)?', textPast: 'Prejudiquei alguém em negócios por fraude ou engano.', adult: true, teen: false, married: true, mortal: true },
  { id: 35, commandmentId: 7, text: 'Danifiquei a propriedade alheia?', textPast: 'Danifiquei a propriedade alheia.', adult: true, teen: true, married: true, mortal: false },
  { id: 36, commandmentId: 7, text: 'Deixei de restituir o que devo ou de pagar dívidas justas?', textPast: 'Deixei de restituir o que devo ou de pagar dívidas.', adult: true, teen: false, married: true, mortal: true },
  { id: 37, commandmentId: 7, text: 'Fui negligente no trabalho ou desperdicei recursos?', textPast: 'Fui negligente no trabalho ou desperdicei recursos.', adult: true, teen: true, married: true, mortal: false },

  // ── 8.° Mandamento ──
  { id: 38, commandmentId: 8, text: 'Menti?', textPast: 'Menti.', adult: true, teen: true, married: true, mortal: false },
  { id: 39, commandmentId: 8, text: 'Falei mal dos outros (detração, fofoca)?', textPast: 'Falei mal dos outros.', adult: true, teen: true, married: true, mortal: false },
  { id: 40, commandmentId: 8, text: 'Caluniei alguém (acusei falsamente)?', textPast: 'Caluniei alguém.', adult: true, teen: true, married: true, mortal: true },
  { id: 41, commandmentId: 8, text: 'Julguei os outros precipitadamente?', textPast: 'Julguei os outros precipitadamente.', adult: true, teen: true, married: true, mortal: false },
  { id: 42, commandmentId: 8, text: 'Revelei segredos confiados a mim sem necessidade?', textPast: 'Revelei segredos confiados a mim.', adult: true, teen: true, married: true, mortal: false },

  // ── 9.° Mandamento ──
  { id: 43, commandmentId: 9, text: 'Consenti em pensamentos impuros ou desejos desordenados?', textPast: 'Consenti em pensamentos impuros.', adult: true, teen: true, married: true, mortal: true },
  { id: 44, commandmentId: 9, text: 'Desejei a pessoa de outrem (cônjuge alheio)?', textPast: 'Desejei a pessoa de outrem.', adult: true, teen: false, married: true, mortal: true },

  // ── 10.° Mandamento ──
  { id: 45, commandmentId: 10, text: 'Tive inveja dos bens ou do sucesso dos outros?', textPast: 'Tive inveja dos bens ou do sucesso dos outros.', adult: true, teen: true, married: true, mortal: false },
  { id: 46, commandmentId: 10, text: 'Fui avarento ou apeguei-me excessivamente ao dinheiro?', textPast: 'Fui avarento ou apeguei-me excessivamente ao dinheiro.', adult: true, teen: false, married: true, mortal: false },
  { id: 47, commandmentId: 10, text: 'Recusei ajudar os pobres e necessitados podendo fazê-lo?', textPast: 'Recusei ajudar os pobres e necessitados.', adult: true, teen: true, married: true, mortal: false },

  // ── Preceitos da Igreja ──
  { id: 48, commandmentId: 11, text: 'Deixei de confessar-me ao menos uma vez por ano?', textPast: 'Deixei de confessar-me ao menos uma vez por ano.', adult: true, teen: true, married: true, mortal: true },
  { id: 49, commandmentId: 11, text: 'Deixei de comungar ao menos pela Páscoa?', textPast: 'Deixei de comungar pela Páscoa.', adult: true, teen: true, married: true, mortal: true },
  { id: 50, commandmentId: 11, text: 'Comunguei em pecado mortal (sem confissão prévia)?', textPast: 'Comunguei em pecado mortal sem confissão prévia.', adult: true, teen: true, married: true, mortal: true },
  { id: 51, commandmentId: 11, text: 'Descumpri o jejum eucarístico (1 hora antes da comunhão)?', textPast: 'Descumpri o jejum eucarístico.', adult: true, teen: true, married: true, mortal: false },
  { id: 52, commandmentId: 11, text: 'Não observei os dias de jejum e abstinência (Quarta de Cinzas, Sexta-feira Santa)?', textPast: 'Não observei os dias de jejum e abstinência.', adult: true, teen: false, married: true, mortal: true },
  { id: 53, commandmentId: 11, text: 'Escondi pecados graves na confissão (confissão sacrílega)?', textPast: 'Escondi pecados graves na confissão.', adult: true, teen: true, married: true, mortal: true },
]
