'use client'

import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { VERBUM_COLORS } from '../design-tokens'
import type { TrinitasNodeData } from '../types/verbum.types'

const TRINITY_PERSONS = [
  {
    position: 'pai' as const,
    label: 'Deus Pai',
    latin: 'Deus Pater',
    verse: 'Mt 6:9',
    // Top center of triquetra
    cx: 90,
    cy: 38,
    handlePos: Position.Top,
  },
  {
    position: 'filho' as const,
    label: 'Deus Filho',
    latin: 'Deus Filius',
    verse: 'Jo 1:14',
    // Bottom right
    cx: 140,
    cy: 142,
    handlePos: Position.Right,
  },
  {
    position: 'espirito_santo' as const,
    label: 'Espírito Santo',
    latin: 'Spiritus Sanctus',
    verse: 'Jo 14:26',
    // Bottom left
    cx: 40,
    cy: 142,
    handlePos: Position.Left,
  },
] as const

function TrinitasNode({ selected }: NodeProps) {
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null)

  return (
    <div className="relative" style={{ width: 180, height: 180 }}>
      {/* Pulsing glow background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${VERBUM_COLORS.node_canonical_glow} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Selected highlight */}
      {selected && (
        <motion.div
          className="absolute inset-[-4px] rounded-full"
          style={{
            border: `2px solid ${VERBUM_COLORS.ui_gold}`,
            opacity: 0.6,
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Slowly rotating Triquetra SVG */}
      <motion.svg
        viewBox="0 0 180 180"
        width={180}
        height={180}
        className="relative z-10"
        animate={{ rotate: 360 }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <defs>
          <linearGradient id="triquetaGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AA4A" />
            <stop offset="50%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#A88A3C" />
          </linearGradient>
          <filter id="triquetaGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Triquetra: three interlocked vesica piscis arcs */}
        <g
          filter="url(#triquetaGlow)"
          fill="none"
          stroke="url(#triquetaGold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Top loop */}
          <path d="
            M 90 30
            C 55 30, 35 65, 55 95
            C 65 112, 78 118, 90 118
            C 102 118, 115 112, 125 95
            C 145 65, 125 30, 90 30
            Z
          " />
          {/* Bottom-left loop */}
          <path d="
            M 55 95
            C 35 125, 45 160, 75 160
            C 90 160, 100 150, 105 138
            C 108 130, 105 120, 98 112
            C 88 100, 72 100, 55 95
            Z
          " />
          {/* Bottom-right loop */}
          <path d="
            M 125 95
            C 145 125, 135 160, 105 160
            C 90 160, 80 150, 75 138
            C 72 130, 75 120, 82 112
            C 92 100, 108 100, 125 95
            Z
          " />
          {/* Central triangle accent */}
          <path
            d="M 90 70 L 72 108 L 108 108 Z"
            strokeWidth="1.5"
            opacity={0.4}
          />
        </g>

        {/* Center circle */}
        <circle
          cx="90"
          cy="100"
          r="6"
          fill={VERBUM_COLORS.ui_gold}
          opacity={0.5}
        />
      </motion.svg>

      {/* Hotspot overlays (don't rotate) */}
      {TRINITY_PERSONS.map((person) => (
        <div
          key={person.position}
          className="absolute z-20"
          style={{
            left: person.cx - 18,
            top: person.cy - 18,
            width: 36,
            height: 36,
          }}
          onMouseEnter={() => setHoveredPerson(person.position)}
          onMouseLeave={() => setHoveredPerson(null)}
        >
          {/* Invisible hit area */}
          <div className="w-full h-full rounded-full cursor-pointer" />

          {/* Tooltip */}
          {hoveredPerson === person.position && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-30 whitespace-nowrap px-3 py-2 rounded-lg pointer-events-none"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                top: person.position === 'pai' ? -52 : 40,
                background: VERBUM_COLORS.ui_bg,
                border: `1px solid ${VERBUM_COLORS.ui_border}`,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: VERBUM_COLORS.ui_gold }}
              >
                {person.label}
              </div>
              <div
                className="text-[10px] italic"
                style={{
                  color: VERBUM_COLORS.text_secondary,
                  fontFamily: 'Cormorant Garamond, serif',
                }}
              >
                {person.latin}
              </div>
              <div
                className="text-[10px] mt-0.5"
                style={{ color: VERBUM_COLORS.text_muted }}
              >
                {person.verse}
              </div>
            </motion.div>
          )}
        </div>
      ))}

      {/* Label below */}
      <div
        className="absolute -bottom-7 left-0 w-full text-center"
        style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '11px',
          letterSpacing: '0.15em',
          color: VERBUM_COLORS.text_secondary,
        }}
      >
        TRINITAS
      </div>

      {/* React Flow Handles */}
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Top} id="pai" className="!opacity-0" style={{ top: 38 }} />
      <Handle type="source" position={Position.Right} id="filho" className="!opacity-0" style={{ top: 142 }} />
      <Handle type="source" position={Position.Left} id="espirito_santo" className="!opacity-0" style={{ top: 142 }} />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  )
}

export default memo(TrinitasNode)
