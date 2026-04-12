import type { VerbumNode, RelationType } from '../types/verbum.types'

export const VERBUM_SYSTEM_PROMPT = `
Você é um teólogo católico especialista em tipologia bíblica, Magistério e Tradição da Igreja.
Seu papel é identificar e explicar conexões genuínas entre conceitos, figuras e textos dentro da
fé católica tradicional.

REGRAS ABSOLUTAS:
1. SOMENTE conecte o que tem fundamento real: Escritura, CCC, Concílios, Padres da Igreja, Magistério Pontifício.
2. NUNCA invente referências. Se não souber a fonte exata, diga "segundo a Tradição da Igreja" sem citar referência falsa.
3. TODA conexão tipológica AT→NT deve incluir: versículo do AT, versículo do NT, e pelo menos uma fonte magisterial (CCC §xxx ou nome do Concílio/documento).
4. Respeite a hierarquia das fontes: Escritura > Tradição Apostólica > Concílios Ecumênicos > Documentos Papais > CCC > Padres da Igreja > Teologia escolástica.
5. NUNCA apresente como certo o que é disputado entre teólogos católicos — use "segundo a interpretação predominante" ou similar.
6. Responda SEMPRE em Português do Brasil.
7. Use linguagem acessível mas precisa teologicamente.
8. Quando houver tipologia, cite o Catecismo (CCC §xxx) se disponível.

CONTEXTO DO PROJETO:
Este é o Verbum — Mappa Fidei, um grafo de conhecimento teológico católico para formação de fiéis.
`

export function buildConnectionExplanationPrompt(params: {
  sourceTitle: string
  sourceType: string
  sourceRef?: string
  sourceDesc?: string
  targetTitle: string
  targetType: string
  targetRef?: string
  targetDesc?: string
  relationType: RelationType
}): string {
  return `
Dois nós foram conectados no grafo Verbum. Gere a explicação teológica desta conexão.

## NÓ ORIGEM:
Título: ${params.sourceTitle}
Tipo: ${params.sourceType}
${params.sourceRef ? `Referência: ${params.sourceRef}` : ''}
${params.sourceDesc ? `Descrição: ${params.sourceDesc}` : ''}

## NÓ DESTINO:
Título: ${params.targetTitle}
Tipo: ${params.targetType}
${params.targetRef ? `Referência: ${params.targetRef}` : ''}
${params.targetDesc ? `Descrição: ${params.targetDesc}` : ''}

## TIPO DE CONEXÃO: ${params.relationType}

## INSTRUÇÃO:
Responda APENAS com um JSON válido, sem markdown, sem comentários:

{
  "theological_name": "Nome teológico desta conexão",
  "explanation_short": "1-2 frases para o canvas. Máximo 150 caracteres.",
  "explanation_full": "Explicação completa de 200-400 palavras com fundamentação bíblica e magisterial.",
  "sources": [
    {"type": "biblia", "ref": "Gn 22:2"},
    {"type": "CCC", "ref": "§2572"}
  ],
  "magisterial_weight": 4,
  "is_valid_catholic": true,
  "validation_note": null
}
`
}

export function buildAutoConnectionPrompt(params: {
  newNodeTitle: string
  newNodeType: string
  newNodeRef?: string
  existingNodes: Array<{ id: string; title: string; type: string; ref?: string }>
}): string {
  return `
Um novo nó foi inserido no grafo Verbum. Analise se ele tem conexões teológicas relevantes com os nós existentes.

## NOVO NÓ:
Título: ${params.newNodeTitle}
Tipo: ${params.newNodeType}
${params.newNodeRef ? `Referência: ${params.newNodeRef}` : ''}

## NÓS EXISTENTES NO GRAFO:
${params.existingNodes.map(n => `- ${n.title} (${n.type}) [id: ${n.id}]${n.ref ? ' ' + n.ref : ''}`).join('\n')}

## INSTRUÇÃO:
Identifique APENAS conexões com fundamento real e sólido no Magistério Católico.
Máximo 3 conexões propostas. Prefira qualidade sobre quantidade.
NÃO proponha conexões fracas ou forçadas.

IMPORTANTE: O campo "relation_type" DEVE ser exatamente um destes valores:
- "tipologia" — Figura do AT cumprida no NT
- "doutrina" — Fundamentação doutrinária/dogmática
- "citacao_direta" — Citação explícita de texto bíblico
- "magistério" — Conexão via documento do Magistério
- "patristica" — Fundamento nos Padres da Igreja
- "etimologia" — Conexão etimológica/linguística
- "profetica" — Profecia e cumprimento
NÃO use nenhum outro valor. Se nenhum se encaixa perfeitamente, use "doutrina".

Responda APENAS com JSON válido:
{
  "proposals": [
    {
      "target_node_id": "uuid-do-no-existente",
      "target_node_title": "título para referência",
      "relation_type": "tipologia",
      "confidence": 0.95,
      "theological_name": "Nome da conexão",
      "explanation_short": "Por que se conectam (máx 150 chars)",
      "explanation_full": "Explicação completa 150-300 palavras",
      "magisterial_weight": 5,
      "sources": [{"type": "biblia", "ref": "Jo 3:16"}]
    }
  ]
}

Se não houver conexões válidas e fundamentadas, retorne: {"proposals": []}
`
}
