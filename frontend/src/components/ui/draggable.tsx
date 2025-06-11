import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ReactNode } from 'react'

interface DraggableProps {
  id: string
  children: ReactNode
  className?: string
  data?: any
}

export function Draggable({ id, children, className = '', data }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${className}`}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}
