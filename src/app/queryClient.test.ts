import { waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../api/httpClient'
import { authApi } from '../features/auth/api/authApi'
import { authQueryKeys } from '../features/auth/api/authQueries'
import type { CurrentUser } from '../features/auth/authSchemas'
import { createQueryClient } from './queryClient'

vi.mock('../features/auth/api/authApi', () => ({ authApi: { me: vi.fn() } }))
const alice: CurrentUser = { id: 1, email: 'alice@example.com', displayName: 'Alice' }
const bob: CurrentUser = { id: 2, email: 'bob@example.com', displayName: 'Bob' }
const clients: ReturnType<typeof createQueryClient>[] = []
function clientForAlice() {
  const client = createQueryClient()
  clients.push(client)
  client.setQueryData(authQueryKeys.session, alice)
  return client
}
beforeEach(() => { vi.resetAllMocks(); vi.mocked(authApi.me).mockResolvedValue(null) })
afterEach(() => clients.splice(0).forEach(client => client.clear()))

it('ends the session when a 401 is confirmed by the session endpoint', async () => {
  const client = clientForAlice()
  await client.fetchQuery({ queryKey: ['tasks', 1], queryFn: () => Promise.reject(new ApiError(401, 'Sign in to continue.')) })
    .catch(() => undefined)
  await waitFor(() => expect(client.getQueryData(authQueryKeys.session)).toBeNull())
  expect(authApi.me).toHaveBeenCalledTimes(1)
})

it('keeps the session on other errors', async () => {
  const client = clientForAlice()
  await client.fetchQuery({ queryKey: ['tasks', 1], queryFn: () => Promise.reject(new ApiError(403, 'Forbidden')) })
    .catch(() => undefined)
  expect(client.getQueryData(authQueryKeys.session)).toEqual(alice)
  expect(authApi.me).not.toHaveBeenCalled()
})

it('keeps the replacement account when an old mutation returns a delayed 401', async () => {
  const client = clientForAlice()
  let failRequest!: (error: Error) => void
  let markStarted!: () => void
  const started = new Promise<void>(resolve => { markStarted = resolve })
  const mutation = client.getMutationCache().build(client, {
    mutationFn: () => new Promise<void>((_resolve, reject) => {
      failRequest = reject
      markStarted()
    }),
  })
  const pending = mutation.execute(undefined).catch(() => undefined)
  await started
  client.setQueryData(authQueryKeys.session, bob)
  vi.mocked(authApi.me).mockResolvedValue(bob)
  expect(client.getMutationCache().getAll()).toHaveLength(0)
  failRequest(new ApiError(401, 'Old session expired'))
  await pending
  expect(authApi.me).toHaveBeenCalledTimes(1)
  expect(client.getQueryData(authQueryKeys.session)).toEqual(bob)
})

it('keeps a confirmed session when its revalidation temporarily fails', async () => {
  const client = clientForAlice()
  vi.mocked(authApi.me).mockRejectedValue(new ApiError(503, 'Service unavailable'))
  await client.fetchQuery({ queryKey: ['tasks', 1], queryFn: () => Promise.reject(new ApiError(401, 'Sign in to continue.')) })
    .catch(() => undefined)
  await waitFor(() => expect(client.getQueryState(authQueryKeys.session)?.error).toMatchObject({ status: 503 }))
  expect(client.getQueryData(authQueryKeys.session)).toEqual(alice)
})

it('shares one session revalidation across overlapping 401 responses', async () => {
  const client = clientForAlice()
  let finish!: (user: CurrentUser) => void
  vi.mocked(authApi.me).mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const request = (id: number) => client.fetchQuery({
    queryKey: ['tasks', id], queryFn: () => Promise.reject(new ApiError(401, 'Sign in to continue.')),
  }).catch(() => undefined)
  await Promise.all([request(1), request(2)])
  expect(authApi.me).toHaveBeenCalledTimes(1)
  finish(alice)
  await waitFor(() => expect(client.getQueryState(authQueryKeys.session)?.fetchStatus).toBe('idle'))
  expect(client.getQueryData(authQueryKeys.session)).toEqual(alice)
})
