'use client'

import { VERBUM_COLORS } from '../design-tokens'

/**
 * Subtle CSS-only particle background for the Verbum canvas.
 * Uses radial-gradient dots — no heavy library needed.
 */
export default function CanvasBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, #1A1208 0%, ${VERBUM_COLORS.canvas_bg} 60%)`,
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(${VERBUM_COLORS.canvas_particles} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Vignette edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 40%, ${VERBUM_COLORS.canvas_bg} 100%)`,
        }}
      />
    </div>
  )
}
