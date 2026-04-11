'use client'

import { Suspense } from 'react'
import VerbumCanvas from './canvas/VerbumCanvas'
import VerbumCanvasLoading from '@/app/verbum/canvas/loading'

export default function Verbum() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden" style={{ zIndex: 50 }}>
      <Suspense fallback={<VerbumCanvasLoading />}>
        <VerbumCanvas />
      </Suspense>
    </div>
  )
}
