import { createClient } from '@/lib/supabase/client'
import { getAutoConnectionProposals } from './openai.service'
import type { ConnectionProposal, RelationType, VerbumSource } from '../types/verbum.types'

// Lazy-init: deferred from module import to prevent premature Supabase auth init.
let supabase: ReturnType<typeof createClient> | undefined

interface SimpleNode {
  id: string
  title: string
  type: string
  ref?: string
  description?: string
}

/**
 * Main function: propose connections for a newly added node.
 * Priority: typology registry (no AI) > AI proposals (GPT-4o).
 */
export async function proposeConnections(
  newNode: SimpleNode,
  existingNodes: SimpleNode[]
): Promise<ConnectionProposal[]> {
  // STEP 1: Check typology registry (curated, no AI needed)
  const registryMatches = await checkTypologyRegistry(newNode, existingNodes)
  if (registryMatches.length > 0) {
    return registryMatches
  }

  // STEP 2: If fewer than 2 nodes, skip auto-connection
  if (existingNodes.length < 2) return []

  // STEP 3: Call AI for proposals (send up to 50 nodes for better matching)
  try {
    const aiResult = await getAutoConnectionProposals({
      newNodeTitle: newNode.title,
      newNodeType: newNode.type,
      newNodeRef: newNode.ref,
      existingNodes: existingNodes.slice(0, 20).map((n) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        ref: n.ref,
      })),
    })

    if (!aiResult?.proposals) return []

    return aiResult.proposals
      .filter((p) => p.confidence >= 0.5)
      .map((p) => ({
        ...p,
        source_node_id: newNode.id,
        source_node_title: newNode.title,
        source: 'ai' as const,
      }))
  } catch {
    return []
  }
}

/**
 * Check the curated typology registry for matches.
 * If the new node matches a known type/antitype, and the corresponding
 * entity exists in the canvas, propose the connection immediately.
 */
async function checkTypologyRegistry(
  newNode: SimpleNode,
  existingNodes: SimpleNode[]
): Promise<ConnectionProposal[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const normalized = newNode.title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // Check if new node matches a type alias
  const { data: typeMatches } = await supabase
    .from('verbum_typology_registry')
    .select('*')
    .contains('aliases_type', [normalized])

  const proposals: ConnectionProposal[] = []

  if (typeMatches && typeMatches.length > 0) {
    for (const match of typeMatches) {
      // Find if any existing node matches the antitype aliases
      const antitypeNode = existingNodes.find((en) => {
        const enNorm = en.title.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return (match.aliases_antitype as string[]).some((alias) => {
          const aliasNorm = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return enNorm.includes(aliasNorm) || aliasNorm.includes(enNorm)
        })
      })

      if (antitypeNode) {
        proposals.push({
          source_node_id: newNode.id,
          source_node_title: newNode.title,
          target_node_id: antitypeNode.id,
          target_node_title: antitypeNode.title,
          relation_type: match.relation_type as RelationType,
          confidence: 1.0,
          theological_name: match.theological_name,
          explanation_short: match.explanation_short,
          explanation_full: match.explanation_pt,
          magisterial_weight: match.magisterial_weight,
          sources: (match.sources as VerbumSource[]) || [],
          source: 'registry',
        })
      }
    }
  }

  // Also check if new node matches an antitype alias
  const { data: antitypeMatches } = await supabase
    .from('verbum_typology_registry')
    .select('*')
    .contains('aliases_antitype', [normalized])

  if (antitypeMatches && antitypeMatches.length > 0) {
    for (const match of antitypeMatches) {
      const typeNode = existingNodes.find((en) => {
        const enNorm = en.title.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return (match.aliases_type as string[]).some((alias) => {
          const aliasNorm = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return enNorm.includes(aliasNorm) || aliasNorm.includes(enNorm)
        })
      })

      if (typeNode) {
        proposals.push({
          source_node_id: newNode.id,
          source_node_title: newNode.title,
          target_node_id: typeNode.id,
          target_node_title: typeNode.title,
          relation_type: match.relation_type as RelationType,
          confidence: 1.0,
          theological_name: match.theological_name,
          explanation_short: match.explanation_short,
          explanation_full: match.explanation_pt,
          magisterial_weight: match.magisterial_weight,
          sources: (match.sources as VerbumSource[]) || [],
          source: 'registry',
        })
      }
    }
  }

  return proposals
}
