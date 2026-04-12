import type { Node, Edge } from '@xyflow/react'

interface ExportData {
  flowName: string
  nodes: Node[]
  edges: Edge[]
}

/** Generate a structured text synthesis from canvas nodes and edges */
export function generateTextSynthesis({ flowName, nodes, edges }: ExportData): string {
  const lines: string[] = []

  lines.push(`VERBUM - ${flowName}`)
  lines.push('='.repeat(40))
  lines.push('')

  // Group nodes by layer
  const layerNames: Record<number, string> = {
    0: 'Fundamento (Santissima Trindade)',
    1: 'Revelacao Primordial',
    2: 'Profecia e Tipo',
    3: 'Encarnacao e Missao',
    4: 'Igreja e Magisterio',
    5: 'Estudo Pessoal',
  }

  const nodesByLayer = new Map<number, Node[]>()
  for (const node of nodes) {
    const layerId = ((node.data as Record<string, unknown>)?.layer_id as number) ?? 5
    if (!nodesByLayer.has(layerId)) nodesByLayer.set(layerId, [])
    nodesByLayer.get(layerId)!.push(node)
  }

  // Output nodes grouped by layer
  for (const [layerId, layerNodes] of Array.from(nodesByLayer.entries()).sort((a, b) => a[0] - b[0])) {
    lines.push(`--- ${layerNames[layerId] || `Camada ${layerId}`} ---`)
    lines.push('')

    for (const node of layerNodes) {
      const data = node.data as Record<string, unknown>
      const title = (data.title as string) || (data.display_name as string) || ''
      const type = node.type || ''

      if (type === 'trinitas') {
        lines.push(`  [Trinitas] Santissima Trindade`)
      } else if (type === 'versiculo') {
        const ref = (data.bible_reference as string) || ''
        const text = (data.bible_text as string) || ''
        lines.push(`  [Versiculo] ${ref}`)
        if (text) lines.push(`    "${text}"`)
      } else if (type === 'dogma') {
        lines.push(`  [Dogma] ${title}`)
        if (data.ccc_paragraph) lines.push(`    CCC §${data.ccc_paragraph}`)
        if (data.description) lines.push(`    ${data.description}`)
      } else if (type === 'postit') {
        lines.push(`  [Nota] ${title}`)
        if (data.body) lines.push(`    ${data.body}`)
      } else {
        lines.push(`  [${type === 'figura' ? 'Personagem' : type}] ${title}`)
        if (data.title_latin) lines.push(`    (${data.title_latin})`)
        if (data.historical_period) lines.push(`    Periodo: ${data.historical_period}`)
        if (data.bible_key_verse) lines.push(`    Versiculo-chave: ${data.bible_key_verse}`)
      }
      lines.push('')
    }
  }

  // Output connections
  const approvedEdges = edges.filter((e) => {
    const status = ((e.data as Record<string, unknown>)?.status as string) || ''
    return status === 'aprovada'
  })

  if (approvedEdges.length > 0) {
    lines.push('')
    lines.push('--- Conexoes Aprovadas ---')
    lines.push('')

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    for (const edge of approvedEdges) {
      const data = edge.data as Record<string, unknown> | undefined
      const sourceName = (data?.source_name as string) ||
        ((nodeMap.get(edge.source)?.data as Record<string, unknown>)?.title as string) || edge.source
      const targetName = (data?.target_name as string) ||
        ((nodeMap.get(edge.target)?.data as Record<string, unknown>)?.title as string) || edge.target
      const theologicalName = (data?.theological_name as string) || ''
      const relationType = (data?.relation_type as string) || ''
      const explanation = (data?.explanation_short as string) || (data?.explanation_full as string) || ''

      lines.push(`  ${sourceName} --> ${targetName}`)
      if (theologicalName) lines.push(`    Tipo: ${theologicalName} (${relationType})`)
      if (explanation) lines.push(`    ${explanation}`)
      lines.push('')
    }
  }

  lines.push('')
  lines.push(`Gerado pelo Verbum - Mappa Fidei`)
  lines.push(`${nodes.length} nos, ${edges.length} conexoes`)

  return lines.join('\n')
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  }
}

/** Download text as a file */
export function downloadAsFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
