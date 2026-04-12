'use client'

import { memo, useRef, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { VERBUM_COLORS } from '../design-tokens'
import { useVerbumCanvas } from '../contexts/VerbumCanvasContext'
import type { PostItNodeData, PostItColor } from '../types/verbum.types'

const COLOR_STYLES: Record<PostItColor, { bg: string; border: string; dot: string }> = {
  amber:  { bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.35)',  dot: '#C9A84C' },
  pink:   { bg: 'rgba(200,100,120,0.12)', border: 'rgba(200,100,120,0.35)', dot: '#C86478' },
  blue:   { bg: 'rgba(100,150,200,0.12)', border: 'rgba(100,150,200,0.35)', dot: '#6496C8' },
  green:  { bg: 'rgba(100,180,100,0.12)', border: 'rgba(100,180,100,0.35)', dot: '#64B464' },
  purple: { bg: 'rgba(140,100,200,0.12)', border: 'rgba(140,100,200,0.35)', dot: '#8C64C8' },
}

const COLOR_KEYS: PostItColor[] = ['amber', 'pink', 'blue', 'green', 'purple']

function PostItNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as PostItNodeData
  const { onUpdateNodeData, isReadOnly } = useVerbumCanvas()
  const titleRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const color = d.color || 'amber'
  const style = COLOR_STYLES[color]

  const handleTitleBlur = useCallback(() => {
    const newTitle = titleRef.current?.textContent?.trim() || 'Nota'
    if (newTitle !== d.title) {
      onUpdateNodeData(id, { title: newTitle })
    }
  }, [id, d.title, onUpdateNodeData])

  const handleBodyBlur = useCallback(() => {
    const newBody = bodyRef.current?.textContent || ''
    if (newBody !== d.body) {
      onUpdateNodeData(id, { body: newBody })
    }
  }, [id, d.body, onUpdateNodeData])

  const handleColorChange = useCallback((newColor: PostItColor) => {
    onUpdateNodeData(id, { color: newColor })
  }, [id, onUpdateNodeData])

  // Prevent React Flow from starting a drag when editing text
  const stopDrag = useCallback((e: React.MouseEvent | React.FocusEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <div
      className="relative rounded-lg min-w-[160px] max-w-[240px] transition-shadow group"
      style={{
        background: style.bg,
        border: `1.5px solid ${selected ? VERBUM_COLORS.ui_gold : style.border}`,
        boxShadow: selected
          ? `0 0 12px ${style.border}`
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Title */}
      <div
        ref={titleRef}
        contentEditable={!isReadOnly}
        suppressContentEditableWarning
        onBlur={handleTitleBlur}
        onMouseDown={stopDrag}
        onFocus={stopDrag}
        className="px-3 pt-2.5 pb-1 text-xs font-semibold outline-none"
        style={{
          fontFamily: 'Poppins, sans-serif',
          color: VERBUM_COLORS.text_primary,
          borderBottom: `1px solid ${style.border}`,
          cursor: isReadOnly ? 'default' : 'text',
          minHeight: '1.5em',
        }}
      >
        {d.title}
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        contentEditable={!isReadOnly}
        suppressContentEditableWarning
        onBlur={handleBodyBlur}
        onMouseDown={stopDrag}
        onFocus={stopDrag}
        className="px-3 pt-1.5 pb-2 text-[11px] outline-none leading-relaxed"
        style={{
          fontFamily: 'Poppins, sans-serif',
          color: VERBUM_COLORS.text_secondary,
          cursor: isReadOnly ? 'default' : 'text',
          minHeight: '2em',
          maxHeight: '120px',
          overflowY: 'auto',
        }}
      >
        {d.body}
      </div>

      {/* Color picker — visible on hover */}
      {!isReadOnly && (
        <div
          className="flex items-center justify-center gap-1.5 pb-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {COLOR_KEYS.map((c) => (
            <button
              key={c}
              onClick={(e) => { e.stopPropagation(); handleColorChange(c) }}
              className="w-3 h-3 rounded-full transition-transform hover:scale-125"
              style={{
                background: COLOR_STYLES[c].dot,
                border: c === color ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
              }}
              title={c}
            />
          ))}
        </div>
      )}

      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </div>
  )
}

export default memo(PostItNode)
