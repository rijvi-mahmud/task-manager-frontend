import { Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../utils/cn'
import { TASK_STATUS_DOT_CLASSES, TASK_STATUS_LABELS } from '../constants'
import type { Task, TaskStatus } from '../taskSchemas'
import type { TaskBoardColumn } from '../utils/taskBoardState'
import { DraggableTaskCard } from './DraggableTaskCard'

interface TaskColumnProps {
  status: TaskStatus
  column: TaskBoardColumn
  isLoadingMore: boolean
  onLoadMore: () => void
  onAdd: () => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  canDelete: (task: Task) => boolean
}

/** Drop target for one status. Shows the loaded tasks, the total that match, and "load more". */
export function TaskColumn({ status, column, isLoadingMore, onLoadMore, onAdd, onEdit, onDelete, canDelete }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const { tasks, total } = column
  const remaining = total - tasks.length

  return (
    <section
      ref={setNodeRef}
      aria-label={TASK_STATUS_LABELS[status]}
      className={cn(
        'flex min-h-72 flex-col rounded-xl border bg-surface-muted/60 p-3 transition-colors',
        isOver ? 'border-accent bg-accent/5' : 'border-line',
      )}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={cn('size-2 rounded-full', TASK_STATUS_DOT_CLASSES[status])} aria-hidden />
        <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
        <span
          className="rounded-lg border border-line bg-surface px-2 py-0.5 text-xs font-medium text-muted tabular-nums"
        >
          {total}
          <span className="sr-only">{total === 1 ? ' task' : ' tasks'}</span>
        </span>
        <Button size="icon" variant="ghost" className="ml-auto" onClick={onAdd} aria-haspopup="dialog" aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}><Plus className="size-4" /></Button>
      </header>

      {tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-4 py-9 text-center text-xs text-muted">
          <span className="mb-1 rounded-xl bg-surface p-2.5"><Plus className="size-4" aria-hidden /></span>
          <p className="font-medium">No tasks here yet</p>
          <p>Add a task or move one into this column.</p>
          <Button size="sm" variant="ghost" onClick={onAdd}>Add task</Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={canDelete(task) ? onDelete : undefined} />
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <Button size="sm" variant="ghost" className="mt-2" disabled={isLoadingMore} onClick={onLoadMore}>
          {isLoadingMore ? 'Loading…' : `Load more (${remaining})`}
        </Button>
      )}
    </section>
  )
}
