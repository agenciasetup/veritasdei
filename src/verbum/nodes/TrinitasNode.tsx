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
    cy: 32,
    handlePos: Position.Top,
  },
  {
    position: 'filho' as const,
    label: 'Deus Filho',
    latin: 'Deus Filius',
    verse: 'Jo 1:14',
    cx: 145,
    cy: 145,
    handlePos: Position.Right,
  },
  {
    position: 'espirito_santo' as const,
    label: 'Espírito Santo',
    latin: 'Spiritus Sanctus',
    verse: 'Jo 14:26',
    cx: 35,
    cy: 145,
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
          {/* Clip for the interlocking weave effect */}
          <clipPath id="clipTop">
            <rect x="0" y="0" width="180" height="95" />
          </clipPath>
          <clipPath id="clipBottom">
            <rect x="0" y="85" width="180" height="95" />
          </clipPath>
        </defs>

        {/*
          Proper Triquetra (Trinity Knot)
          Three vesica piscis leaves arranged 120° apart around center (90,100).
          Each leaf is an almond/eye shape formed by two circular arcs.
        */}
        <g
          filter="url(#triquetaGlow)"
          fill="none"
          stroke="url(#triquetaGold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Top leaf — points upward */}
          <path d="
            M 90 28
            C 62 48, 58 82, 72 102
            C 78 112, 84 114, 90 110
            C 96 114, 102 112, 108 102
            C 122 82, 118 48, 90 28
            Z
          " />

          {/* Bottom-left leaf — points to lower-left */}
          <path d="
            M 72 102
            C 52 108, 32 132, 40 156
            C 44 164, 50 168, 56 166
            C 58 172, 64 174, 72 168
            C 92 158, 98 128, 90 110
            Z
          " />

          {/* Bottom-right leaf — points to lower-right */}
          <path d="
            M 108 102
            C 128 108, 148 132, 140 156
            C 136 164, 130 168, 124 166
            C 122 172, 116 174, 108 168
            C 88 158, 82 128, 90 110
            Z
          " />

          {/* Inner circle at the center — symbolizing unity of the Trinity */}
          <circle
            cx="90"
            cy="108"
            r="12"
            strokeWidth="1.8"
            opacity={0.5}
          />
        </g>

        {/* Center dot */}
        <circle
          cx="90"
          cy="108"
          r="3.5"
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
      <Handle type="source" position={Position.Top} id="pai" className="!opacity-0" style={{ top: 32 }} />
      <Handle type="source" position={Position.Right} id="filho" className="!opacity-0" style={{ top: 145 }} />
      <Handle type="source" position={Position.Left} id="espirito_santo" className="!opacity-0" style={{ top: 145 }} />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  )
}

export default memo(TrinitasNode)
