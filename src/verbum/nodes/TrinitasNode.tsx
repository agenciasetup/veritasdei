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
    cx: 90,
    cy: 26,
    handlePos: Position.Top,
  },
  {
    position: 'filho' as const,
    label: 'Deus Filho',
    latin: 'Deus Filius',
    verse: 'Jo 1:14',
    cx: 145,
    cy: 122,
    handlePos: Position.Right,
  },
  {
    position: 'espirito_santo' as const,
    label: 'Espírito Santo',
    latin: 'Spiritus Sanctus',
    verse: 'Jo 14:26',
    cx: 35,
    cy: 122,
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

      {/* Slowly rotating Triquetra SVG — proper symmetrical Celtic triquetra */}
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
            <stop offset="0%" stopColor="#E0C060" />
            <stop offset="50%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#A88A3C" />
          </linearGradient>
          <filter id="triquetaGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/*
          Proper Triquetra — one vesica piscis leaf rotated 3× at 120° intervals.
          Center at (90,90). Each leaf extends 62px from center to tip.
          Uses SVG transform for mathematically perfect 3-fold symmetry.
        */}
        <g
          filter="url(#triquetaGlow)"
          fill="none"
          stroke="url(#triquetaGold)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Top leaf — vesica piscis pointing upward */}
          <path d="M 90 90 C 66 70, 64 42, 90 24 C 116 42, 114 70, 90 90 Z" />
          {/* Bottom-left leaf — same shape rotated 120° */}
          <path d="M 90 90 C 66 70, 64 42, 90 24 C 116 42, 114 70, 90 90 Z" transform="rotate(120, 90, 90)" />
          {/* Bottom-right leaf — same shape rotated 240° */}
          <path d="M 90 90 C 66 70, 64 42, 90 24 C 116 42, 114 70, 90 90 Z" transform="rotate(240, 90, 90)" />

          {/* Outer circle — symbolizing divine unity */}
          <circle cx="90" cy="90" r="56" strokeWidth="1.5" opacity={0.4} />
          {/* Inner circle at center — symbolizing consubstantiality */}
          <circle cx="90" cy="90" r="14" strokeWidth="1.5" opacity={0.45} />
        </g>

        {/* Center dot */}
        <circle
          cx="90"
          cy="90"
          r="3"
          fill={VERBUM_COLORS.ui_gold}
          opacity={0.6}
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
      <Handle type="source" position={Position.Top} id="pai" className="!opacity-0" style={{ top: 24 }} />
      <Handle type="source" position={Position.Right} id="filho" className="!opacity-0" style={{ top: 122 }} />
      <Handle type="source" position={Position.Left} id="espirito_santo" className="!opacity-0" style={{ top: 122 }} />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  )
}

export default memo(TrinitasNode)
