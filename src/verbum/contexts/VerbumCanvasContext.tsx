'use client'

import { createContext, useContext } from 'react'

interface VerbumCanvasContextType {
  onAnalyzeNode: (nodeId: string) => void
  isReadOnly: boolean
}

const VerbumCanvasContext = createContext<VerbumCanvasContextType>({
  onAnalyzeNode: () => {},
  isReadOnly: false,
})

export const VerbumCanvasProvider = VerbumCanvasContext.Provider

export function useVerbumCanvas() {
  return useContext(VerbumCanvasContext)
}
