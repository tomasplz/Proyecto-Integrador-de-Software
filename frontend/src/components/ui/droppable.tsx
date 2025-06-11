import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface DroppableProps {
  id: string
  children: ReactNode
  className?: string
  data?: any
}

export function Droppable({ id, children, className = '', data }: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-accent/50 ring-2 ring-primary' : ''}`}
    >
      {children}
    </div>
  )
}
