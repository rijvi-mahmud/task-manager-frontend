import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, errorMessage } from '../../../api/httpClient'
import { authApi } from '../api/authApi'
import { sessionQueryOptions } from '../api/authQueries'
import type { LoginInput, RegisterInput } from '../authSchemas'
import { replaceSession, sessionQueryFilter } from '../sessionLifecycle'

export function useSession() {
  return useQuery(sessionQueryOptions)
}

/** TanStack owns request state; confirmed session changes share one cache boundary. */
export function useAuthActions() {
  const queryClient = useQueryClient()
  const cancelSessionRead = () => queryClient.cancelQueries(sessionQueryFilter)
  const login = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onMutate: cancelSessionRead,
    onSuccess: user => replaceSession(queryClient, user),
  })
  const register = useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onMutate: cancelSessionRead,
    onSuccess: user => replaceSession(queryClient, user),
  })
  const logout = useMutation({
    mutationFn: async () => {
      try { await authApi.logout() }
      catch (error) {
        // An expired session is already signed out; other failures need a retry.
        if (!(error instanceof ApiError && error.status === 401)) throw error
      }
    },
    onMutate: cancelSessionRead,
    onSuccess: () => replaceSession(queryClient, null),
  })
  const resetPassword = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => authApi.resetPassword(token, password),
    onMutate: cancelSessionRead,
    onSuccess: async () => {
      await cancelSessionRead()
      // A reset link can belong to a different account from this browser session.
      // A failed follow-up read must not turn a committed reset into a failed mutation.
      await queryClient.invalidateQueries({ ...sessionQueryFilter, refetchType: 'all' })
    },
  })
  return {
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout: logout.mutateAsync,
    isSigningOut: logout.isPending,
    signOutError: logout.error ? errorMessage(logout.error) : null,
    dismissSignOutError: logout.reset,
    resetPassword: (token: string, password: string) => resetPassword.mutateAsync({ token, password }),
    resetPasswordSucceeded: resetPassword.isSuccess,
  }
}
