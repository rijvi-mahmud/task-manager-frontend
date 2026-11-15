import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { cn } from '../../../utils/cn'
import type { Task } from '../taskSchemas'
import { TaskCard } from './TaskCard'

interface DraggableTaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  /** Omitted when the current user may not delete this task. */
  onDelete?: (task: Task) => void
}

/** Adds drag behaviour to TaskCard via a dedicated handle (keeps buttons clickable). */
export function DraggableTaskCard({ task, onEdit, onDelete }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label={`Move ${task.title}`}
      className="-ml-1 mt-0.5 inline-flex size-8 shrink-0 items-center justify-center cursor-grab touch-none rounded text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  )

  return (
    <li ref={setNodeRef} className={cn(isDragging && 'opacity-40')}>
      <TaskCard task={task} handle={handle} onEdit={onEdit} onDelete={onDelete} />
    </li>
  )
}
