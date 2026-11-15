import type { QueryClient } from '@tanstack/react-query'
import { authQueryKeys } from './api/authQueries'
import type { CurrentUser } from './authSchemas'

export const sessionQueryFilter = { queryKey: authQueryKeys.session, exact: true } as const

/** Cancel older reads before committing a confirmed authentication change. */
export async function replaceSession(queryClient: QueryClient, user: CurrentUser | null) {
  await queryClient.cancelQueries(sessionQueryFilter)
  queryClient.setQueryData(authQueryKeys.session, user)
}

/** All session writers, including background /me refreshes, share this boundary. */
export function observeSessionIdentity(queryClient: QueryClient) {
  const initial = queryClient.getQueryData<CurrentUser | null>(authQueryKeys.session)
  let previousUserId = initial === undefined ? undefined : initial?.id ?? null
  return queryClient.getQueryCache().subscribe(event => {
    if (event.type !== 'updated' || event.action.type !== 'success'
      || event.query.queryKey.length !== 2
      || event.query.queryKey[0] !== 'auth' || event.query.queryKey[1] !== 'session') return
    const user = queryClient.getQueryData<CurrentUser | null>(authQueryKeys.session)
    if (user === undefined) return
    const userId = user?.id ?? null
    if (userId === previousUserId) return
    previousUserId = userId
    // Removing queries cancels their requests and discards data from the old account.
    queryClient.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' })
    queryClient.getMutationCache().clear()
  })
}
