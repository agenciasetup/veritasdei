'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'

import DividerEditor from './blocks/DividerEditor'
import HeadingEditor from './blocks/HeadingEditor'
import ParagraphEditor from './blocks/ParagraphEditor'
import VerseEditor from './blocks/VerseEditor'
import { labelForBlockType } from './factory'
import type { Block } from '../types'

export default function SortableBlock({
  id,
  block,
  onChange,
  onDelete,
}: {
  id: string
  block: Block
  onChange: (b: Block) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 30 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-start gap-2 rounded-xl transition-colors"
    >
      {/* Drag handle */}
      <button
        type="button"
        aria-label="Reordenar"
        className="flex items-center justify-center rounded-md mt-1 opacity-30 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        style={{
          width: 24,
          height: 24,
          color: '#8A8378',
        }}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Content editor */}
      <div
        className="flex-1 rounded-xl p-3"
        style={{
          background: 'rgba(20,18,14,0.35)',
          border: '1px solid rgba(201,168,76,0.1)',
        }}
      >
        <p
          className="text-[10px] mb-2"
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: '#8A8378',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}
        >
          {labelForBlockType(block.type)}
        </p>
        <BlockEditorSwitch block={block} onChange={onChange} />
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Remover bloco"
        className="flex items-center justify-center rounded-md mt-1 opacity-30 group-hover:opacity-100 transition-opacity active:scale-90"
        style={{
          width: 24,
          height: 24,
          color: '#D94F5C',
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function BlockEditorSwitch({
  block,
  onChange,
}: {
  block: Block
  onChange: (b: Block) => void
}) {
  switch (block.type) {
    case 'heading':
      return <HeadingEditor block={block} onChange={onChange} />
    case 'paragraph':
      return <ParagraphEditor block={block} onChange={onChange} />
    case 'verse':
      return <VerseEditor block={block} onChange={onChange} />
    case 'divider':
      return <DividerEditor />
    default:
      return (
        <p
          className="text-xs"
          style={{
            color: '#8A8378',
            fontFamily: 'Poppins, sans-serif',
            fontStyle: 'italic',
          }}
        >
          Este tipo de bloco ainda não é editável visualmente — virá num próximo sprint.
        </p>
      )
  }
}
