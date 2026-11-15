import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { APP_WRITE_MUTATION_KEY } from '../../../api/queryKeys'
import { invalidateAfterMutation } from '../../../api/invalidateAfterMutation'
import { errorMessage } from '../../../api/httpClient'
import { workspaceApi } from '../api/workspaceApi'
import { workspaceQueryKeys, workspacesQueryOptions } from '../api/workspaceQueries'
import type { WorkspaceInput } from '../workspaceSchemas'

export function useWorkspaces() {
  const query = useQuery(workspacesQueryOptions)
  return {
    workspaces: query.data ?? [],
    isLoading: query.isPending,
    error: query.error ? errorMessage(query.error) : null,
    reload: query.refetch,
  }
}

export function useWorkspaceActions() {
  const queryClient = useQueryClient()
  const settle = () => invalidateAfterMutation(queryClient, [workspaceQueryKeys.all])
  const mutationKey = [...APP_WRITE_MUTATION_KEY, 'workspaces']
  const create = useMutation({ mutationKey, mutationFn: (input: WorkspaceInput) => workspaceApi.create(input), onSettled: settle })
  const rename = useMutation({
    mutationKey, onSettled: settle,
    mutationFn: ({ id, input }: { id: number; input: WorkspaceInput }) => workspaceApi.rename(id, input),
  })
  // Deleting or leaving drops the workspace from the list; its board and member queries
  // (keyed [feature, workspaceId, ...]) are discarded.
  const forget = (id: number) => {
    queryClient.setQueryData(workspaceQueryKeys.all, (list: { id: number }[] | undefined) => list?.filter(w => w.id !== id))
    queryClient.removeQueries({ predicate: query => query.queryKey[0] !== 'workspaces' && query.queryKey[1] === id })
  }
  const remove = useMutation({
    mutationKey, mutationFn: (id: number) => workspaceApi.remove(id),
    onSuccess: (_data, id) => forget(id), onSettled: settle,
  })
  const leave = useMutation({
    mutationKey, mutationFn: ({ id, userId }: { id: number; userId: number }) => workspaceApi.leave(id, userId),
    onSuccess: (_data, { id }) => forget(id), onSettled: settle,
  })
  return {
    createWorkspace: create.mutateAsync,
    renameWorkspace: (id: number, input: WorkspaceInput) => rename.mutateAsync({ id, input }),
    deleteWorkspace: remove.mutateAsync,
    leaveWorkspace: (id: number, userId: number) => leave.mutateAsync({ id, userId }),
  }
}
