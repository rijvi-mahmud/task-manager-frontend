import { infiniteQueryOptions } from '@tanstack/react-query'
import { TASK_PAGE_SIZE } from '../constants'
import type { TaskStatus } from '../taskSchemas'
import type { TaskListParams } from '../utils/taskFilters'
import { taskApi } from './taskApi'

/** Every key carries the workspace id second, so one workspace's cache can be dropped as a unit. */
export const taskQueryKeys = {
  all: ['tasks'] as const,
  workspace: (workspaceId: number) => ['tasks', workspaceId] as const,
  list: (workspaceId: number, params: TaskListParams, status: TaskStatus) => ['tasks', workspaceId, 'list', params, status] as const,
  detail: (workspaceId: number, id: number) => ['tasks', workspaceId, 'detail', id] as const,
  stats: (workspaceId: number) => ['tasks', workspaceId, 'stats'] as const,
}

export function taskColumnQueryOptions(workspaceId: number, params: TaskListParams, status: TaskStatus) {
  return infiniteQueryOptions({
    queryKey: taskQueryKeys.list(workspaceId, params, status),
    queryFn: ({ pageParam, signal }) => taskApi.list(workspaceId, { ...params, status, page: pageParam, size: TASK_PAGE_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: last => last.page + 1 < last.totalPages ? last.page + 1 : undefined,
  })
}
