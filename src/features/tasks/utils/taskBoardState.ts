import { TASK_STATUSES, type Task, type TaskStatus } from '../taskSchemas'

export interface TaskBoardColumn { tasks: Task[]; total: number }
export type TaskBoardColumns = Record<TaskStatus, TaskBoardColumn>
export const createEmptyTaskColumns = (): TaskBoardColumns => ({
  TODO: { tasks: [], total: 0 }, IN_PROGRESS: { tasks: [], total: 0 }, DONE: { tasks: [], total: 0 },
})

/** Independent column responses can overlap during remote moves. Newest wins. */
export function deduplicateTaskColumns(columns: TaskBoardColumns): TaskBoardColumns {
  const latest = new Map<number, Task>()
  for (const status of TASK_STATUSES) for (const task of columns[status].tasks) {
    const old = latest.get(task.id)
    if (!old || task.version > old.version) latest.set(task.id, task)
  }
  const next = createEmptyTaskColumns()
  for (const status of TASK_STATUSES) {
    const tasks = [...latest.values()].filter(task => task.status === status)
    const removed = new Set(columns[status].tasks.filter(task => latest.get(task.id)?.status !== status).map(task => task.id))
    next[status] = { tasks, total: Math.max(tasks.length, columns[status].total - removed.size) }
  }
  return next
}
