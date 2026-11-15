import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/httpClient'
import { appConfig } from '../config/appConfig'
import { authQueryKeys, sessionQueryDefaults } from '../features/auth/api/authQueries'
import { observeSessionIdentity, sessionQueryFilter } from '../features/auth/sessionLifecycle'

/**
 * One cache per application (and a fresh instance for each test). A 401 rechecks
 * the current session: an older account's delayed failure must not sign out a
 * newer account. The session endpoint alone confirms whether someone is signed in.
 */
export function createQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: revalidateSessionOn401 }),
    mutationCache: new MutationCache({ onError: revalidateSessionOn401 }),
    defaultOptions: {
      queries: {
        staleTime: appConfig.queries.staleTimeMs,
        retry: false,
        // The API may run on localhost even when the browser reports offline.
        networkMode: 'always',
        refetchInterval: appConfig.queries.refetchIntervalMs,
      },
      mutations: { retry: false, networkMode: 'always' },
    },
  })
  function revalidateSessionOn401(error: Error) {
    if (error instanceof ApiError && error.status === 401 && queryClient.getQueryData(authQueryKeys.session)) {
      // Keep a pending /me read: overlapping failures share TanStack's native request.
      return queryClient.invalidateQueries({ ...sessionQueryFilter, refetchType: 'all' }, { cancelRefetch: false })
    }
  }
  queryClient.setQueryDefaults(authQueryKeys.session, sessionQueryDefaults)
  observeSessionIdentity(queryClient)
  return queryClient
}
