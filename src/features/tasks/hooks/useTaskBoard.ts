import { useInfiniteQuery, useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query'
import { APP_WRITE_MUTATION_KEY } from '../../../api/queryKeys'
import { invalidateAfterMutation } from '../../../api/invalidateAfterMutation'
import { ApiError, errorMessage } from '../../../api/httpClient'
import { taskColumnQueryOptions, taskQueryKeys } from '../api/taskQueries'
import { taskApi } from '../api/taskApi'
import { TASK_SUCCESS_MESSAGES } from '../constants'
import { TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from '../taskSchemas'
import { createEmptyTaskColumns, deduplicateTaskColumns } from '../utils/taskBoardState'
import { getTaskDateRangeError, type TaskListParams } from '../utils/taskFilters'

const TASK_MUTATION_KEY = [...APP_WRITE_MUTATION_KEY, 'tasks'] as const
type TaskMutationOperation =
  | { type: 'create'; input: TaskInput }
  | { type: 'update'; task: Task; input: TaskInput }
  | { type: 'move'; task: Task; status: TaskStatus }
  | { type: 'delete'; task: Task }
const isNotFoundError = <TError,>(error: TError) => error instanceof ApiError && error.status === 404

export function useTaskBoard(workspaceId: number, params: TaskListParams) {
  const queryClient = useQueryClient()
  const isWritePending = useIsMutating({ mutationKey: APP_WRITE_MUTATION_KEY }) > 0
  const isDateRangeValid = getTaskDateRangeError(params) === null
  const todoQuery = useInfiniteQuery({ ...taskColumnQueryOptions(workspaceId, params, 'TODO'), enabled: isDateRangeValid })
  const inProgressQuery = useInfiniteQuery({ ...taskColumnQueryOptions(workspaceId, params, 'IN_PROGRESS'), enabled: isDateRangeValid })
  const doneQuery = useInfiniteQuery({ ...taskColumnQueryOptions(workspaceId, params, 'DONE'), enabled: isDateRangeValid })
  const queries = [todoQuery, inProgressQuery, doneQuery]
  const mutation = useMutation({
    mutationKey: TASK_MUTATION_KEY,
    onMutate: () => queryClient.cancelQueries({ queryKey: taskQueryKeys.workspace(workspaceId) }),
    mutationFn: async (operation: TaskMutationOperation) => {
      switch (operation.type) {
        case 'create': return taskApi.create(workspaceId, operation.input)
        case 'update': return taskApi.update(workspaceId, operation.task.id, operation.input, operation.task.version)
        case 'move': return taskApi.changeStatus(workspaceId, operation.task.id, operation.status)
        case 'delete':
          try { await taskApi.remove(workspaceId, operation.task.id) }
          catch (error) { if (!isNotFoundError(error)) throw error }
          return undefined
      }
    },
    onSettled: () => invalidateAfterMutation(queryClient, [taskQueryKeys.workspace(workspaceId)]),
  })

  const columns = createEmptyTaskColumns()
  TASK_STATUSES.forEach((status, index) => {
    const pages = queries[index].data?.pages ?? []
    columns[status] = { tasks: pages.flatMap(page => page.items), total: pages[0]?.totalItems ?? 0 }
  })
  const queryError = queries.find(query => query.error)?.error
  const mutationError = mutation.isError && (mutation.variables?.type === 'move' || mutation.variables?.type === 'delete')
    ? errorMessage(mutation.error) : null

  async function refresh() {
    if (isWritePending || !isDateRangeValid) return
    await Promise.all(queries.map(query => query.refetch({ cancelRefetch: false })))
  }
  async function loadMore(status: TaskStatus) {
    const query = queries[TASK_STATUSES.indexOf(status)]
    if (!isDateRangeValid || isWritePending || query.isFetching || !query.hasNextPage) return
    await query.fetchNextPage({ cancelRefetch: false })
  }
  return {
    columns: deduplicateTaskColumns(columns),
    isLoading: isDateRangeValid && queries.some(query => query.isPending), isFetching: queries.some(query => query.isFetching), isUpdating: isWritePending,
    loadingMoreStatus: TASK_STATUSES.find((_, index) => queries[index].isFetchingNextPage) ?? null,
    error: mutationError ?? (queryError ? errorMessage(queryError) : null),
    canDismissError: mutationError !== null, dismissMessage: mutation.reset,
    successMessage: mutation.isSuccess && mutation.variables ? TASK_SUCCESS_MESSAGES[mutation.variables.type] : null,
    refresh, loadMore,
    createTask: async (input: TaskInput) => { await mutation.mutateAsync({ type: 'create', input }) },
    updateTask: async (task: Task, input: TaskInput) => { await mutation.mutateAsync({ type: 'update', task, input }) },
    moveTask: async (task: Task, status: TaskStatus) => {
      if (task.status !== status) await mutation.mutateAsync({ type: 'move', task, status }).catch(() => undefined)
    },
    deleteTask: async (task: Task) => { await mutation.mutateAsync({ type: 'delete', task }) },
    fetchLatest: (id: number) => queryClient.fetchQuery({
      queryKey: taskQueryKeys.detail(workspaceId, id), queryFn: ({ signal }) => taskApi.get(workspaceId, id, signal), staleTime: 0,
    }),
  }
}
