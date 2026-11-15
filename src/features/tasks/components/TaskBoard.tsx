import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { TASK_STATUS_LABELS } from '../constants'
import { TASK_STATUSES, taskStatusSchema, type Task, type TaskStatus } from '../taskSchemas'
import type { TaskBoardColumns } from '../utils/taskBoardState'
import { TaskCard } from './TaskCard'
import { TaskColumn } from './TaskColumn'

interface TaskBoardProps {
  columns: TaskBoardColumns
  loadingMoreStatus: TaskStatus | null
  onLoadMore: (status: TaskStatus) => void
  onAdd: (status: TaskStatus) => void
  onMove: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  /** Whether the current user may delete this task (its creator or a workspace owner). */
  canDelete: (task: Task) => boolean
}

const getDraggedTask = (data: { task?: Task } | undefined): Task | undefined => data?.task

/** Screen-reader announcements using task titles and column names instead of raw ids. */
const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${getDraggedTask(active.data.current)?.title ?? 'task'}.`,
  onDragOver: ({ over }) => {
    const status = taskStatusSchema.safeParse(over?.id)
    return status.success ? `Over ${TASK_STATUS_LABELS[status.data]}.` : 'Not over a column.'
  },
  onDragEnd: ({ active, over }) => {
    const status = taskStatusSchema.safeParse(over?.id)
    const title = getDraggedTask(active.data.current)?.title ?? 'Task'
    return status.success ? `${title} dropped in ${TASK_STATUS_LABELS[status.data]}. Saving change.` : `${title} dropped.`
  },
  onDragCancel: ({ active }) => `Moving ${getDraggedTask(active.data.current)?.title ?? 'task'} cancelled.`,
}

/** Kanban board: owns drag-and-drop wiring only; state changes are delegated via onMove. */
export function TaskBoard({ columns, loadingMoreStatus, onLoadMore, onAdd, onMove, onEdit, onDelete, canDelete }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTask(getDraggedTask(active.data.current) ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    const task = getDraggedTask(active.data.current)
    const target = taskStatusSchema.safeParse(over?.id)
    if (task && target.success && task.status !== target.data) {
      onMove(task, target.data)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
      accessibility={{ announcements }}
    >
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            column={columns[status]}
            isLoadingMore={loadingMoreStatus === status}
            onLoadMore={() => onLoadMore(status)}
            onAdd={() => onAdd(status)}
            onEdit={onEdit}
            onDelete={onDelete}
            canDelete={canDelete}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && <div aria-hidden="true"><TaskCard task={activeTask} className="rotate-2 cursor-grabbing shadow-xl" /></div>}
      </DragOverlay>
    </DndContext>
  )
}
