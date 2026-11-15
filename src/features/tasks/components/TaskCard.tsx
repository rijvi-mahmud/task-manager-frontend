import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../utils/cn'
import type { Task } from '../taskSchemas'
import { DueDateLabel } from './DueDateLabel'
import { PriorityBadge } from './PriorityBadge'

interface TaskCardProps {
  task: Task
  handle?: ReactNode
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  className?: string
}

/** Card content has its own row so actions never squeeze the task title. */
export function TaskCard({ task, handle, onEdit, onDelete, className }: TaskCardProps) {
  const isDone = task.status === 'DONE'
  return (
    <article
      aria-label={task.title}
      className={cn('rounded-xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-accent/30', className)}
    >
      <div className="mb-3 flex min-h-9 items-center gap-1.5">
        {handle}
        <span className="text-[11px] font-medium tracking-wide text-muted">TASK-{String(task.id).padStart(3, '0')}</span>
        {(onEdit || onDelete) && (
          <div className="-mr-1 ml-auto flex shrink-0">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>
                <Pencil className="size-3.5" aria-hidden />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            )}
          </div>
        )}
      </div>
      <h4 className={cn('text-sm leading-6 font-semibold break-words', isDone && 'text-muted line-through')}>{task.title}</h4>
      {task.description && <p className="mt-1.5 line-clamp-2 text-sm leading-5 break-words whitespace-pre-line text-muted">{task.description}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate
          ? <DueDateLabel dueDate={task.dueDate} overdue={task.overdue && !isDone} />
          : <span className="text-xs text-muted">No due date</span>}
      </div>
      <div className="mt-3 flex min-h-8 items-center gap-2 border-t border-line pt-3">
        {task.assigneeId !== null && task.assigneeName ? (
          <>
            <Avatar decorative name={task.assigneeName} seed={task.assigneeId} />
            <span className="truncate text-xs text-muted" title={task.assigneeName}>{task.assigneeName}</span>
          </>
        ) : <span className="text-xs text-muted">Unassigned</span>}
      </div>
    </article>
  )
}
