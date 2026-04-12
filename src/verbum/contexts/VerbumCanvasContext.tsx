'use client'

import { createContext, useContext } from 'react'

interface VerbumCanvasContextType {
  onAnalyzeNode: (nodeId: string) => void
  onUpdateNodeData: (nodeId: string, data: Record<string, unknown>) => void
  isReadOnly: boolean
}

const VerbumCanvasContext = createContext<VerbumCanvasContextType>({
  onAnalyzeNode: () => {},
  onUpdateNodeData: () => {},
  isReadOnly: false,
})

export const VerbumCanvasProvider = VerbumCanvasContext.Provider

export function useVerbumCanvas() {
  return useContext(VerbumCanvasContext)
}
