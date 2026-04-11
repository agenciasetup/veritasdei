'use client'

import VerbumCanvas from './canvas/VerbumCanvas'

export default function Verbum() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden" style={{ zIndex: 50 }}>
      <VerbumCanvas />
    </div>
  )
}
