import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../api/httpClient'
import { createQueryClient } from '../app/queryClient'
import { authApi } from '../features/auth/api/authApi'
import { authQueryKeys, sessionQueryOptions } from '../features/auth/api/authQueries'
import { useAuthActions, useSession } from '../features/auth/hooks/useSession'
import type { CurrentUser } from '../features/auth/authSchemas'
import { queryWrapper } from './queryWrapper'

vi.mock('../features/auth/api/authApi', () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), resetPassword: vi.fn() } }))
const alice: CurrentUser = { id: 1, email: 'alice@example.com', displayName: 'Alice' }
const bob: CurrentUser = { id: 2, email: 'bob@example.com', displayName: 'Bob' }
beforeEach(() => vi.resetAllMocks())

it('preserves the session when server logout fails', async () => {
  const client = createQueryClient()
  client.setQueryData(authQueryKeys.session, alice)
  vi.mocked(authApi.logout).mockRejectedValue(new ApiError(503, 'Server unavailable'))
  const { result } = renderHook(useAuthActions, queryWrapper(client))
  await act(async () => { await expect(result.current.logout()).rejects.toThrow('Server unavailable') })
  expect(client.getQueryData(authQueryKeys.session)).toEqual(alice)
  await waitFor(() => expect(result.current.signOutError).toBe('Server unavailable'))
})

it('cancels an in-flight session response before successful logout', async () => {
  const client = createQueryClient()
  client.setQueryData(authQueryKeys.session, alice)
  let finish!: (user: CurrentUser) => void
  let requestSignal: AbortSignal | undefined
  vi.mocked(authApi.me).mockImplementation(signal => {
    requestSignal = signal
    return new Promise(resolve => { finish = resolve })
  })
  vi.mocked(authApi.logout).mockResolvedValue(undefined)
  const pending = client.fetchQuery({ ...sessionQueryOptions, staleTime: 0 }).catch(() => undefined)
  const { result } = renderHook(useAuthActions, queryWrapper(client))
  await act(async () => { await result.current.logout() })
  expect(client.getQueryData(authQueryKeys.session)).toBeNull()
  expect(requestSignal?.aborted).toBe(true)
  await act(async () => { finish(alice); await pending })
  expect(client.getQueryData(authQueryKeys.session)).toBeNull()
})

it('discards private query data when a session refresh identifies another account', async () => {
  const client = createQueryClient()
  client.setQueryData(authQueryKeys.session, alice)
  const oldData = [{ id: 42, title: 'Alice private task' }]
  client.setQueryData(['tasks', 7], oldData)
  vi.mocked(authApi.me).mockResolvedValue(bob)
  const { result } = renderHook(useSession, queryWrapper(client))
  await act(async () => { await client.invalidateQueries({ queryKey: authQueryKeys.session }) })
  await waitFor(() => expect(result.current.data?.id).toBe(bob.id))
  expect(client.getQueryData(['tasks', 7])).toBeUndefined()
})


it('preserves another account session after a password reset', async () => {
  const client = createQueryClient()
  client.setQueryData(authQueryKeys.session, bob)
  vi.mocked(authApi.resetPassword).mockResolvedValue(undefined)
  vi.mocked(authApi.me).mockResolvedValue(bob)
  const { result } = renderHook(() => { useSession(); return useAuthActions() }, queryWrapper(client))
  await act(async () => { await result.current.resetPassword('alice-reset-token', 'New-password-123') })
  expect(client.getQueryData(authQueryKeys.session)).toEqual(bob)
})

it('cancels private reads when the account identity changes', async () => {
  const client = createQueryClient()
  client.setQueryData(authQueryKeys.session, alice)
  let requestSignal: AbortSignal | undefined
  const pending = client.fetchQuery({ queryKey: ['tasks', 7], queryFn: ({ signal }) => {
    requestSignal = signal
    return new Promise<string>(() => undefined)
  } }).catch(() => undefined)
  client.setQueryData(authQueryKeys.session, bob)
  await pending
  expect(requestSignal?.aborted).toBe(true)
  expect(client.getQueryData(['tasks', 7])).toBeUndefined()
})

it('keeps a committed password reset successful when session revalidation fails', async () => {
  const client = createQueryClient()
  client.setQueryData(authQueryKeys.session, alice)
  vi.mocked(authApi.resetPassword).mockResolvedValue(undefined)
  vi.mocked(authApi.me).mockRejectedValue(new ApiError(503, 'Service unavailable'))
  const { result } = renderHook(() => { useSession(); return useAuthActions() }, queryWrapper(client))
  await act(async () => { await expect(result.current.resetPassword('reset-token', 'New-password-123')).resolves.toBeUndefined() })
  await waitFor(() => expect(result.current.resetPasswordSucceeded).toBe(true))
  expect(client.getQueryState(authQueryKeys.session)?.error).toMatchObject({ status: 503 })
})
