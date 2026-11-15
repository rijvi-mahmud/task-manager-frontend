import { useQuery } from '@tanstack/react-query'
import { taskApi } from '../api/taskApi'
import { taskQueryKeys } from '../api/taskQueries'

export function useTaskStats(workspaceId: number) {
  const query = useQuery({ queryKey: taskQueryKeys.stats(workspaceId), queryFn: ({ signal }) => taskApi.stats(workspaceId, signal) })
  return { stats: query.data ?? null, error: query.error, reload: query.refetch }
}
