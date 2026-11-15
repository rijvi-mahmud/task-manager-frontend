import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { APP_WRITE_MUTATION_KEY } from '../../../api/queryKeys'
import { invalidateAfterMutation } from '../../../api/invalidateAfterMutation'
import { ApiError, errorMessage } from '../../../api/httpClient'
import { memberQueryKeys } from '../api/memberQueries'
import { taskQueryKeys } from '../../tasks/api/taskQueries'
import { workspaceQueryKeys } from '../../workspaces/api/workspaceQueries'
import { memberApi } from '../api/memberApi'
import type { Member, MemberInput } from '../memberSchemas'

type MemberMutationOperation = { type: 'create'; input: MemberInput } | { type: 'delete'; member: Member }

export function useMembers(workspaceId: number) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: memberQueryKeys.list(workspaceId),
    queryFn: ({ signal }) => memberApi.list(workspaceId, signal),
  })
  const mutation = useMutation({
    mutationKey: [...APP_WRITE_MUTATION_KEY, 'members'],
    onMutate: (operation) => Promise.all([
      queryClient.cancelQueries({ queryKey: memberQueryKeys.list(workspaceId) }),
      ...(operation.type === 'delete' ? [queryClient.cancelQueries({ queryKey: taskQueryKeys.workspace(workspaceId) })] : []),
    ]),
    mutationFn: async (operation: MemberMutationOperation) => {
      if (operation.type === 'create') return memberApi.add(workspaceId, operation.input)
      try { await memberApi.remove(workspaceId, operation.member.id) }
      catch (error) { if (!(error instanceof ApiError && error.status === 404)) throw error }
      return undefined
    },
    // Removing someone unassigns their tasks; either change alters the member count.
    onSettled: (_data, _error, operation) => invalidateAfterMutation(queryClient,
      operation.type === 'delete'
        ? [memberQueryKeys.list(workspaceId), taskQueryKeys.workspace(workspaceId), workspaceQueryKeys.all]
        : [memberQueryKeys.list(workspaceId), workspaceQueryKeys.all]),
  })
  const successMessage = mutation.isSuccess
    ? (mutation.variables.type === 'create' ? 'Member added.' : 'Member removed.')
    : null
  return {
    members: query.data ?? [], isLoading: query.isPending,
    successMessage, dismissMessage: mutation.reset,
    error: query.error ? errorMessage(query.error) : null, reload: query.refetch,
    createMember: async (input: MemberInput) => { await mutation.mutateAsync({ type: 'create', input }) },
    deleteMember: async (member: Member) => { await mutation.mutateAsync({ type: 'delete', member }) },
  }
}
