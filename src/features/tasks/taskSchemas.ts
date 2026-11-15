import { z } from 'zod'

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE'])
export type TaskStatus = z.infer<typeof taskStatusSchema>
export const TASK_STATUSES = taskStatusSchema.options

export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])
export type TaskPriority = z.infer<typeof taskPrioritySchema>
export const TASK_PRIORITIES = taskPrioritySchema.options

export const taskDueDateSchema = z.iso.date('Enter a valid date').refine(
  date => date >= '0001-01-01', 'Due date must be between 0001-01-01 and 9999-12-31',
)

/** Shape of a task as returned by the API (validated at runtime). */
export const taskSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: taskDueDateSchema.nullable(),
  assigneeId: z.number().int().nullable(),
  assigneeName: z.string().nullable(),
  overdue: z.boolean(),
  version: z.number().int(),
  /** Null when the creator's account no longer exists. */
  createdById: z.number().int().nullable(),
  createdByName: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type Task = z.infer<typeof taskSchema>

/** One page of tasks, as returned by GET /workspaces/{id}/tasks. */
export const taskPageSchema = z.object({
  items: z.array(taskSchema),
  page: z.number().int(),
  size: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
})
export type TaskPage = z.infer<typeof taskPageSchema>

/** Board-wide counts from GET /workspaces/{id}/tasks/stats (not affected by filters). */
export const taskStatsSchema = z.object({
  total: z.number().int(),
  todo: z.number().int(),
  inProgress: z.number().int(),
  done: z.number().int(),
  overdue: z.number().int(),
})
export type TaskStats = z.infer<typeof taskStatsSchema>

/**
 * Form schema. Input is what the form fields hold (strings); output is the
 * API payload (nulls for empty optional fields, numeric assignee id).
 * Limits mirror the backend's Bean Validation constraints.
 */
export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title must be at most 120 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be at most 1000 characters')
    .transform((v) => v || null),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z
    .union([z.literal(''), taskDueDateSchema])
    .transform((v) => v || null),
  assigneeId: z.string().transform((v) => (v ? Number(v) : null)),
})
export type TaskFormValues = z.input<typeof taskFormSchema>
export type TaskInput = z.output<typeof taskFormSchema>

export function toTaskFormValues(task?: Task): TaskFormValues {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'TODO',
    priority: task?.priority ?? 'MEDIUM',
    dueDate: task?.dueDate ?? '',
    assigneeId: task?.assigneeId != null ? String(task.assigneeId) : '',
  }
}
