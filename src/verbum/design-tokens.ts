export const VERBUM_COLORS = {
  // Fundo
  canvas_bg: '#0A0806',
  canvas_particles: '#2A1F0E',

  // Texto
  text_primary: '#F5EDD6',
  text_secondary: '#A89060',
  text_muted: '#5C4A2A',

  // Nós
  node_canonical_bg: '#1A1208',
  node_canonical_border: '#C9A84C',
  node_canonical_glow: 'rgba(201, 168, 76, 0.3)',
  node_figura_bg: '#12100C',
  node_figura_border: '#7A6030',
  node_versiculo_bg: '#0E0D0B',
  node_versiculo_border: '#4A3A1A',
  node_dogma_bg: '#130C12',
  node_dogma_border: '#8B4A7A',
  node_personal_bg: '#0C100E',
  node_personal_border: '#2A4030',

  // Arestas
  edge_tipologia: '#D4AA4A',
  edge_doutrina: '#9AB0C8',
  edge_profetica: '#D4884A',
  edge_magisterio: '#E8E0D0',
  edge_patristica: '#C8A860',
  edge_proposta: '#D4884A',
  edge_rejeitada: 'transparent',

  // Camadas
  layer_opacity: [1, 0.9, 0.75, 0.6, 0.45, 0.3] as const,
  layer_blur: [0, 0, 1, 2, 3, 4] as const,
  layer_scale: [1.2, 1.1, 1, 0.95, 0.9, 0.85] as const,

  // UI
  ui_bg: 'rgba(10, 8, 6, 0.92)',
  ui_border: '#3A2A10',
  ui_gold: '#C9A84C',
  ui_gold_hover: '#E0BE6A',
} as const

export const EDGE_WEIGHT_STROKE = {
  1: 1,
  2: 1.5,
  3: 2,
  4: 2.5,
  5: 3.5,
} as const
