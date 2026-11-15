import type { BadgeTone } from '../../components/ui/Badge'
import type { TaskPriority, TaskStatus } from './taskSchemas'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const TASK_PRIORITY_TONES: Record<TaskPriority, BadgeTone> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
}

export const TASK_STATUS_DOT_CLASSES: Record<TaskStatus, string> = {
  TODO: 'bg-muted',
  IN_PROGRESS: 'bg-warning',
  DONE: 'bg-success',
}

export const TASK_PAGE_SIZE = 20
export const TASK_SEARCH_DEBOUNCE_MS = 300

export const TASK_SUCCESS_MESSAGES = {
  create: 'Task created.',
  update: 'Task updated.',
  move: 'Task status updated.',
  delete: 'Task deleted.',
} as const
