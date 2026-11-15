import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { APP_WRITE_MUTATION_KEY } from './queryKeys'

/** Batch overlapping writes and await native revalidation of affected active queries. */
export async function invalidateAfterMutation(queryClient: QueryClient, queryKeys: readonly QueryKey[]) {
  await Promise.all(queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey, refetchType: 'none' })))
  if (queryClient.isMutating({ mutationKey: APP_WRITE_MUTATION_KEY }) === 1) {
    await queryClient.refetchQueries({ type: 'active', predicate: query => query.state.isInvalidated })
  }
}
