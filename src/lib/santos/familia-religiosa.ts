export type FamiliaReligiosa =
  | 'franciscano'
  | 'dominicano'
  | 'carmelita'
  | 'jesuita'
  | 'beneditino'
  | 'agostiniano'
  | 'mariano'
  | 'cristologico'
  | 'arcanjo'
  | 'apostolo'
  | 'secular'
  | 'leigo'

interface FamiliaMeta {
  label: string
  lema: string        // frase curta sobre a tradição
  acento: string      // cor de acento (chip, border, highlight)
  acentoSoft: string  // versão translúcida do acento
}

/**
 * Metadados por família religiosa.
 * Cores respeitam a tradição dos hábitos quando aplicável:
 * - Franciscano: terroso (marrom hábito)
 * - Dominicano: preto sobre branco (preto do manto dominicano)
 * - Carmelita: marrom escuro (hábito) + creme (escapulário)
 * - Beneditino: preto (hábito) com toque dourado (abades)
 * - Jesuíta: carmesim (casula tradicional)
 * - Mariano: azul celeste (cor mariana)
 * - Arcanjo: dourado puro (esplendor angelical)
 * - Apóstolo: vermelho martírio
 * - Outros: tons próximos ao dourado do app (coerência visual)
 */
export const FAMILIA_META: Record<FamiliaReligiosa, FamiliaMeta> = {
  franciscano: {
    label: 'Franciscano',
    lema: '"Senhor, fazei de mim instrumento de vossa paz."',
    acento: '#8B6F47',      // marrom hábito
    acentoSoft: 'rgba(139,111,71,0.18)',
  },
  dominicano: {
    label: 'Dominicano',
    lema: '"Laudare, benedicere, praedicare."',
    acento: '#1C1C1C',      // preto dominicano
    acentoSoft: 'rgba(242,237,228,0.1)',
  },
  carmelita: {
    label: 'Carmelita',
    lema: '"Zelo zelatus sum pro Domino Deo exercituum."',
    acento: '#6B4F2D',      // marrom carmelita
    acentoSoft: 'rgba(107,79,45,0.18)',
  },
  jesuita: {
    label: 'Jesuíta',
    lema: '"Ad maiorem Dei gloriam."',
    acento: '#8B2635',      // carmesim
    acentoSoft: 'rgba(139,38,53,0.18)',
  },
  beneditino: {
    label: 'Beneditino',
    lema: '"Ora et labora."',
    acento: '#2D2D2D',      // preto beneditino
    acentoSoft: 'rgba(201,168,76,0.15)',
  },
  agostiniano: {
    label: 'Agostiniano',
    lema: '"Tarde vos amei, ó Beleza tão antiga e tão nova."',
    acento: '#3D3D6B',      // azul agostiniano
    acentoSoft: 'rgba(61,61,107,0.2)',
  },
  mariano: {
    label: 'Devoção Mariana',
    lema: '"Fazei tudo o que Ele vos disser." (Jo 2,5)',
    acento: '#4A6FA5',      // azul celeste mariano
    acentoSoft: 'rgba(74,111,165,0.2)',
  },
  cristologico: {
    label: 'Devoção ao Senhor',
    lema: '"Vinde a mim, todos os que estais cansados." (Mt 11,28)',
    acento: '#A8453E',      // vermelho Sagrado Coração
    acentoSoft: 'rgba(168,69,62,0.18)',
  },
  arcanjo: {
    label: 'Milícia Celeste',
    lema: '"Quis ut Deus?" — "Quem como Deus?"',
    acento: '#C9A84C',      // dourado angelical
    acentoSoft: 'rgba(201,168,76,0.22)',
  },
  apostolo: {
    label: 'Apóstolo',
    lema: '"Ide por todo o mundo e pregai o Evangelho." (Mc 16,15)',
    acento: '#8B3A3A',      // vermelho martírio
    acentoSoft: 'rgba(139,58,58,0.2)',
  },
  secular: {
    label: 'Clero / Consagração secular',
    lema: '"Não tenhais medo!"',
    acento: '#6B6B6B',
    acentoSoft: 'rgba(107,107,107,0.18)',
  },
  leigo: {
    label: 'Leigo',
    lema: '"Santidade é possível em qualquer estado de vida."',
    acento: '#8B7A5B',
    acentoSoft: 'rgba(139,122,91,0.18)',
  },
}

export function getFamiliaMeta(familia: string | null | undefined): FamiliaMeta | null {
  if (!familia) return null
  return FAMILIA_META[familia as FamiliaReligiosa] ?? null
}
