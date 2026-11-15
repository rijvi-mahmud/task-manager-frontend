import { act, render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { CurrentUser } from '../features/auth/authSchemas'
import type { Workspace } from '../features/workspaces/workspaceSchemas'
import { authApi } from '../features/auth/api/authApi'
import { workspaceApi } from '../features/workspaces/api/workspaceApi'
import { ApiError } from '../api/httpClient'
import { currentUser, makeWorkspace } from '../test/fixtures'
import App from './App'
import { createQueryClient } from './queryClient'

vi.mock('../features/auth/api/authApi', () => ({ authApi: { me: vi.fn(), logout: vi.fn() } }))
vi.mock('../features/workspaces/api/workspaceApi', () => ({ workspaceApi: { list: vi.fn() } }))
vi.mock('../features/tasks/TasksPage', () => ({ TasksPage: () => <main><h1>Workspace ready</h1></main> }))

const clients: ReturnType<typeof createQueryClient>[] = []
function mountApp() {
  const client = createQueryClient()
  clients.push(client)
  return render(<QueryClientProvider client={client}><App /></QueryClientProvider>)
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => {
  vi.resetAllMocks()
  window.history.replaceState({}, '', '/workspaces/10')
})
afterEach(() => {
  clients.splice(0).forEach(client => client.clear())
  vi.restoreAllMocks()
})

it.each([1, 2, 3])('shows skeletons through session and workspace loading on cold load %i', async () => {
  const session = deferred<CurrentUser | null>()
  const workspaces = deferred<Workspace[]>()
  vi.mocked(authApi.me).mockReturnValue(session.promise)
  vi.mocked(workspaceApi.list).mockReturnValue(workspaces.promise)
  mountApp()
  expect(screen.getByRole('status')).toHaveTextContent('Loading Task Manager')
  expect(workspaceApi.list).not.toHaveBeenCalled()
  await act(async () => { session.resolve(currentUser) })
  await waitFor(() => expect(workspaceApi.list).toHaveBeenCalledTimes(1))
  expect(await screen.findByRole('status')).toHaveTextContent('Loading Task Manager')
  expect(screen.queryByText(/something went wrong|cancelledError|page not found/i)).not.toBeInTheDocument()
  await act(async () => { workspaces.resolve([makeWorkspace()]) })
  expect(await screen.findByRole('heading', { name: 'Workspace ready' })).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(authApi.me).toHaveBeenCalledTimes(1)
})

it('shows a retryable startup error for an actual session API failure', async () => {
  vi.mocked(authApi.me).mockRejectedValueOnce(new ApiError(503, 'Service unavailable')).mockResolvedValue(currentUser)
  vi.mocked(workspaceApi.list).mockResolvedValue([makeWorkspace()])
  mountApp()
  expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable')
  await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('heading', { name: 'Workspace ready' })).toBeInTheDocument()
})

it('sends an unauthenticated reload to sign-in after the session skeleton', async () => {
  const session = deferred<CurrentUser | null>()
  vi.mocked(authApi.me).mockReturnValue(session.promise)
  mountApp()
  expect(screen.getByRole('status')).toHaveTextContent('Loading Task Manager')
  await act(async () => { session.resolve(null) })
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  expect(workspaceApi.list).not.toHaveBeenCalled()
})

it('shows a retryable route error for a workspace API failure', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(authApi.me).mockResolvedValue(currentUser)
  vi.mocked(workspaceApi.list).mockRejectedValueOnce(new ApiError(503, 'Boards unavailable')).mockResolvedValue([makeWorkspace()])
  mountApp()
  expect(await screen.findByRole('alert')).toHaveTextContent('Boards unavailable')
  await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('heading', { name: 'Workspace ready' })).toBeInTheDocument()
  vi.restoreAllMocks()
})
