import { taskDueDateSchema, type TaskPriority, type TaskStatus } from '../taskSchemas'

export type TaskSortOption = 'newest' | 'dueDate' | 'priority'

/** 'ALL', 'UNASSIGNED', or a member id as a string (select-friendly). */
export type TaskAssigneeFilter = 'ALL' | 'UNASSIGNED' | `${number}`

/** What the filter bar holds. */
export interface TaskFilterValues {
  search: string
  dueFrom: string
  dueTo: string
  priority: TaskPriority | 'ALL'
  assignee: TaskAssigneeFilter
  sort: TaskSortOption
}

export const DEFAULT_TASK_FILTERS: TaskFilterValues = { search: '', priority: 'ALL', assignee: 'ALL', sort: 'newest', dueFrom: '', dueTo: '' }

/** Query parameters for GET /tasks, minus status and paging (added per column). */
export interface TaskListParams {
  q?: string
  dueFrom?: string
  dueTo?: string
  priority?: TaskPriority
  assigneeId?: number
  unassigned?: true
  sort: 'NEWEST' | 'DUE_DATE' | 'PRIORITY'
}

export interface TaskPageRequest extends TaskListParams {
  status: TaskStatus
  page: number
  size: number
}

const TASK_SORT_PARAMS: Record<TaskSortOption, TaskListParams['sort']> = {
  newest: 'NEWEST',
  dueDate: 'DUE_DATE',
  priority: 'PRIORITY',
}

/** Pure: turns filter-bar state into API parameters, omitting "any" values. */
export function toTaskListParams(filter: TaskFilterValues): TaskListParams {
  const params: TaskListParams = { sort: TASK_SORT_PARAMS[filter.sort] }
  const q = filter.search.trim()
  if (q) params.q = q
  if (filter.dueFrom) params.dueFrom = filter.dueFrom
  if (filter.dueTo) params.dueTo = filter.dueTo
  if (filter.priority !== 'ALL') params.priority = filter.priority
  if (filter.assignee === 'UNASSIGNED') params.unassigned = true
  else if (filter.assignee !== 'ALL') params.assigneeId = Number(filter.assignee)
  return params
}

export function hasActiveTaskFilters(filter: TaskFilterValues): boolean {
  return filter.search.trim() !== '' || filter.priority !== 'ALL' || filter.assignee !== 'ALL' || filter.dueFrom !== '' || filter.dueTo !== ''
}

/** Calendar dates compare lexically after ISO validation; no timezone conversion. */
export function getTaskDateRangeError({ dueFrom, dueTo }: { dueFrom?: string; dueTo?: string }): string | null {
  if ((dueFrom && !taskDueDateSchema.safeParse(dueFrom).success) || (dueTo && !taskDueDateSchema.safeParse(dueTo).success)) {
    return 'Enter valid due dates between 0001-01-01 and 9999-12-31.'
  }
  return dueFrom && dueTo && dueFrom > dueTo ? 'Due from must be on or before due to.' : null
}
