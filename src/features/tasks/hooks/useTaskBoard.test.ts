import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/httpClient'
import { makePage, makeTask, WORKSPACE_ID } from '../../../test/fixtures'
import { queryWrapper } from '../../../test/queryWrapper'
import { taskApi } from '../api/taskApi'
import { taskQueryKeys } from '../api/taskQueries'
import type { Task, TaskInput } from '../taskSchemas'
import { useTaskBoard } from './useTaskBoard'

vi.mock('../api/taskApi', () => ({ taskApi: {
  list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), changeStatus: vi.fn(), remove: vi.fn(),
} }))
const api = vi.mocked(taskApi)
const params = { sort: 'NEWEST' } as const
const input: TaskInput = { title: 'Edited', description: null, status: 'TODO', priority: 'LOW', dueDate: null, assigneeId: null }
let server: Task[]
beforeEach(() => {
  vi.resetAllMocks()
  server = [makeTask({ id: 1 })]
  api.list.mockImplementation(async (_workspaceId, { status, page, size, q }) => {
    const tasks = server.filter(task => task.status === status && (!q || task.title.includes(q)))
    return { ...makePage(tasks.slice(page * size, (page + 1) * size), tasks.length), page, size }
  })
  api.remove.mockImplementation(async (_workspaceId, id) => { server = server.filter(task => task.id !== id) })
  api.get.mockImplementation(async (_workspaceId, id) => server.find(task => task.id === id)!)
})
async function board() {
  const context = queryWrapper()
  const hook = renderHook(() => useTaskBoard(WORKSPACE_ID, params), context)
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return { ...hook, ...context }
}

it('loads a page per column and appends only the selected next page', async () => {
  server = Array.from({ length: 80 }, (_, i) => makeTask({ id: i + 1 }))
  const { result } = await board()
  expect(api.list).toHaveBeenCalledTimes(3)
  api.list.mockClear()
  for (let page = 1; page <= 3; page++) {
    await act(() => result.current.loadMore('TODO'))
    await waitFor(() => expect(result.current.columns.TODO.tasks).toHaveLength((page + 1) * 20))
  }
  expect(api.list.mock.calls.map(([, request]) => [request.status, request.page])).toEqual([
    ['TODO', 1], ['TODO', 2], ['TODO', 3],
  ])
})

it('keeps server data while saving and revalidates after a move', async () => {
  const { result } = await board()
  let release!: (task: Task) => void
  api.changeStatus.mockReturnValue(new Promise(resolve => { release = resolve }))
  let pending!: Promise<void>
  act(() => { pending = result.current.moveTask(result.current.columns.TODO.tasks[0], 'DONE') })
  await waitFor(() => expect(result.current.isUpdating).toBe(true))
  expect(result.current.columns.TODO.total).toBe(1)
  expect(result.current.columns.DONE.tasks).toEqual([])
  server = [makeTask({ id: 1, status: 'DONE', version: 1 })]
  await act(async () => { release(server[0]); await pending })
  await waitFor(() => expect(result.current.columns.DONE.tasks[0]?.version).toBe(1))
})

it('keeps confirmed data when a move and its recovery fetch fail offline', async () => {
  const { result } = await board()
  api.changeStatus.mockRejectedValue(new ApiError(0, 'Offline'))
  api.list.mockRejectedValue(new ApiError(0, 'Offline'))
  await act(() => result.current.moveTask(result.current.columns.TODO.tasks[0], 'DONE'))
  await waitFor(() => expect(result.current.columns.TODO.tasks).toHaveLength(1))
  expect(result.current.columns.DONE.tasks).toEqual([])
  expect(result.current.error).toBe('Offline')
})

it('drops a task deleted remotely while it is being moved', async () => {
  const { result } = await board()
  api.changeStatus.mockRejectedValue(new ApiError(404, 'Deleted'))
  server = []
  await act(() => result.current.moveTask(result.current.columns.TODO.tasks[0], 'DONE'))
  await waitFor(() => expect(result.current.columns.TODO.tasks).toEqual([]))
  expect(result.current.columns.DONE.tasks).toEqual([])
})

it('treats deleting an already deleted task as success', async () => {
  const { result } = await board()
  server = []
  api.remove.mockRejectedValue(new ApiError(404, 'Deleted'))
  await act(() => result.current.deleteTask(result.current.columns.TODO.tasks[0]))
  await waitFor(() => expect(result.current.columns.TODO.tasks).toEqual([]))
  expect(result.current.error).toBeNull()
})

it('sends the last seen version and updates the query cache', async () => {
  server = [makeTask({ id: 1, version: 4 })]
  const { result } = await board()
  const original = result.current.columns.TODO.tasks[0]
  server = [{ ...original, ...input, version: 5 }]
  api.update.mockResolvedValue(server[0])
  await act(() => result.current.updateTask(original, input))
  expect(api.update).toHaveBeenCalledWith(WORKSPACE_ID, 1, input, 4)
  await waitFor(() => expect(result.current.columns.TODO.tasks[0]?.title).toBe('Edited'))
  expect(result.current.successMessage).toBe('Task updated.')
  act(() => result.current.dismissMessage())
  await waitFor(() => expect(result.current.successMessage).toBeNull())
})

it('fetches the latest version after a conflict', async () => {
  const { result, client } = await board()
  server = [makeTask({ id: 1, title: 'Their changes', version: 3 })]
  await act(async () => { expect((await result.current.fetchLatest(1)).version).toBe(3) })
  expect(client.getQueryData<Task>(taskQueryKeys.detail(WORKSPACE_ID, 1))?.version).toBe(3)
})

it('uses date bounds in query keys and reuses a fresh cached date range', async () => {
  const from = '2026-01-01', to = '2026-01-31'
  const { result, rerender } = renderHook(({ dueTo }) => useTaskBoard(WORKSPACE_ID, { sort: 'NEWEST', dueFrom: from, dueTo }), {
    ...queryWrapper(), initialProps: { dueTo: to },
  })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(api.list).toHaveBeenCalledTimes(3)
  expect(api.list.mock.calls.every(([, request]) => request.dueFrom === from && request.dueTo === to)).toBe(true)
  rerender({ dueTo: '2026-02-28' })
  await waitFor(() => expect(api.list).toHaveBeenCalledTimes(6))
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  rerender({ dueTo: to })
  expect(result.current.isLoading).toBe(false)
  expect(api.list).toHaveBeenCalledTimes(6)
})

it('does not fetch, refresh or paginate an invalid date range', async () => {
  const { result } = renderHook(() => useTaskBoard(WORKSPACE_ID, { sort: 'NEWEST', dueFrom: '2026-03-02', dueTo: '2026-03-01' }), queryWrapper())
  await act(async () => { await result.current.refresh(); await result.current.loadMore('TODO') })
  expect(result.current.isLoading).toBe(false)
  expect(api.list).not.toHaveBeenCalled()
})
