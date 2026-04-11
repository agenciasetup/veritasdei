import {
  buildConnectionExplanationPrompt,
  buildAutoConnectionPrompt,
} from '../prompts/theologicalPrompts'
import type { RelationType, AIConnectionExplanation, AIAutoConnectionResponse } from '../types/verbum.types'

/**
 * Call the server-side API route to get a connection explanation from GPT-4o.
 */
export async function getConnectionExplanation(params: {
  sourceTitle: string
  sourceType: string
  sourceRef?: string
  sourceDesc?: string
  targetTitle: string
  targetType: string
  targetRef?: string
  targetDesc?: string
  relationType: RelationType
}): Promise<AIConnectionExplanation | null> {
  try {
    const prompt = buildConnectionExplanationPrompt(params)

    const response = await fetch('/api/verbum/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode: 'explain' }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data as AIConnectionExplanation
  } catch (error) {
    console.error('getConnectionExplanation error:', error)
    return null
  }
}

/**
 * Call the server-side API route to get auto-connection proposals from GPT-4o.
 */
export async function getAutoConnectionProposals(params: {
  newNodeTitle: string
  newNodeType: string
  newNodeRef?: string
  existingNodes: Array<{ id: string; title: string; type: string; ref?: string }>
}): Promise<AIAutoConnectionResponse | null> {
  try {
    const prompt = buildAutoConnectionPrompt(params)

    const response = await fetch('/api/verbum/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode: 'auto' }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data as AIAutoConnectionResponse
  } catch (error) {
    console.error('getAutoConnectionProposals error:', error)
    return null
  }
}
