import { queryOptions } from '@tanstack/react-query'
import { authApi } from './authApi'

export const authQueryKeys = { session: ['auth', 'session'] as const }

/**
 * The current session. `null` means signed out; it is the single source of
 * truth the router guards and the app shell read. Rechecked when the window
 * regains focus, so an expired session is noticed promptly.
 */
export const sessionQueryDefaults = {
  queryFn: ({ signal }: { signal: AbortSignal }) => authApi.me(signal),
  staleTime: 5 * 60_000,
  refetchInterval: false,
  refetchOnWindowFocus: 'always',
} as const

export const sessionQueryOptions = queryOptions({
  queryKey: authQueryKeys.session,
  ...sessionQueryDefaults,
})
