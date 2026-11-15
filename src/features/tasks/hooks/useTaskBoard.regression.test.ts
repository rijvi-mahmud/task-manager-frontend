import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/httpClient'
import { makePage, makeTask, WORKSPACE_ID } from '../../../test/fixtures'
import { queryWrapper } from '../../../test/queryWrapper'
import { taskApi } from '../api/taskApi'
import type { Task } from '../taskSchemas'
import { useTaskBoard } from './useTaskBoard'

vi.mock('../api/taskApi', () => ({ taskApi: {
  list: vi.fn(), changeStatus: vi.fn(), remove: vi.fn(), create: vi.fn(),
} }))
const api = vi.mocked(taskApi)
const params = { sort: 'NEWEST' } as const
let server: Task[]
beforeEach(() => {
  vi.resetAllMocks()
  server = [makeTask({ id: 1 })]
  api.list.mockImplementation(async (_workspaceId, { status, page, size, q }) => {
    const tasks = server.filter(task => task.status === status && (!q || task.title.includes(q)))
    return { ...makePage(tasks.slice(page * size, (page + 1) * size), tasks.length), page, size }
  })
})
async function loaded() {
  const context = queryWrapper()
  const hook = renderHook(() => useTaskBoard(WORKSPACE_ID, params), context)
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return { ...hook, ...context }
}

it('ignores an old poll after deleting a task', async () => {
  const { result } = await loaded()
  const replies: Array<() => void> = []
  const normal = api.list.getMockImplementation()!
  api.list.mockImplementationOnce((_workspaceId, request) => new Promise(resolve => {
    replies.push(() => resolve(makePage(request.status === 'TODO' ? [makeTask({ id: 1 })] : [])))
  }))
  let poll!: Promise<void>
  act(() => { poll = result.current.refresh() })
  await waitFor(() => expect(replies).toHaveLength(1))
  api.list.mockImplementation(normal)
  api.remove.mockImplementation(async () => { server = [] })
  await act(() => result.current.deleteTask(result.current.columns.TODO.tasks[0]))
  await act(async () => { replies.forEach(release => release()); await poll })
  await waitFor(() => expect(result.current.columns.TODO.tasks).toEqual([]))
})

it('ignores old filter results and consumes the query cancellation signal', async () => {
  const context = queryWrapper()
  const { result, rerender } = renderHook(({ q }) => useTaskBoard(WORKSPACE_ID, { sort: 'NEWEST', q }), {
    ...context, initialProps: { q: '' },
  })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  const signals: AbortSignal[] = []
  const replies: Array<() => void> = []
  api.list.mockImplementation((_workspaceId, request, signal) => request.q === 'old'
    ? new Promise(resolve => { signals.push(signal!); replies.push(() => resolve(makePage([makeTask({ id: 50, status: request.status })]))) })
    : Promise.resolve(makePage(request.status === 'TODO' ? [makeTask({ id: 60, title: 'new' })] : [])))
  rerender({ q: 'old' })
  await waitFor(() => expect(signals).toHaveLength(3))
  rerender({ q: 'new' })
  await waitFor(() => expect(result.current.columns.TODO.tasks[0]?.id).toBe(60))
  expect(signals.every(signal => signal.aborted)).toBe(true)
  await act(async () => replies.forEach(release => release()))
  expect(result.current.columns.TODO.tasks[0].id).toBe(60)
})

it('retains the last fetched snapshot when two overlapping moves fail offline', async () => {
  const { result } = await loaded()
  const rejectors: Array<(error: Error) => void> = []
  api.changeStatus.mockImplementation(() => new Promise<Task>((_resolve, reject) => rejectors.push(reject)))
  let first!: Promise<void>, second!: Promise<void>
  act(() => { first = result.current.moveTask(result.current.columns.TODO.tasks[0], 'IN_PROGRESS') })
  await waitFor(() => expect(result.current.isUpdating).toBe(true))
  act(() => { second = result.current.moveTask(result.current.columns.TODO.tasks[0], 'DONE') })
  await waitFor(() => expect(rejectors).toHaveLength(2))
  api.list.mockRejectedValue(new ApiError(0, 'Offline'))
  await act(async () => { rejectors[0](new ApiError(0, 'Offline')); await first })
  await act(async () => { rejectors[1](new ApiError(0, 'Offline')); await second })
  await waitFor(() => expect(result.current.columns.TODO.tasks).toHaveLength(1))
  expect(result.current.columns.DONE.tasks).toEqual([])
  expect(result.current.columns.IN_PROGRESS.tasks).toEqual([])
})

it('retains stale data if recovery fails and revalidates on manual retry', async () => {
  const { result } = await loaded()
  let resolveFirst!: (task: Task) => void, rejectSecond!: (error: Error) => void
  api.changeStatus.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
    .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSecond = reject }))
  let first!: Promise<void>, second!: Promise<void>
  act(() => { first = result.current.moveTask(result.current.columns.TODO.tasks[0], 'IN_PROGRESS') })
  await waitFor(() => expect(result.current.isUpdating).toBe(true))
  act(() => { second = result.current.moveTask(result.current.columns.TODO.tasks[0], 'DONE') })
  await waitFor(() => expect(api.changeStatus).toHaveBeenCalledTimes(2))
  server = [makeTask({ id: 1, status: 'IN_PROGRESS', version: 1 })]
  await act(async () => { resolveFirst(server[0]); await first })
  const normal = api.list.getMockImplementation()!
  api.list.mockRejectedValue(new ApiError(0, 'Offline'))
  await act(async () => { rejectSecond(new ApiError(0, 'Offline')); await second })
  await waitFor(() => expect(result.current.isUpdating).toBe(false))
  expect(result.current.columns.TODO.tasks).toHaveLength(1)
  expect(result.current.error).toBe('Offline')
  api.list.mockImplementation(normal)
  await act(() => result.current.refresh())
  await waitFor(() => expect(result.current.columns.IN_PROGRESS.tasks[0]?.version).toBe(1))
})

it('ignores an out-of-order older mutation response', async () => {
  const { result } = await loaded()
  const replies: Array<(task: Task) => void> = []
  api.changeStatus.mockImplementation(() => new Promise(resolve => replies.push(resolve)))
  let first!: Promise<void>, second!: Promise<void>
  act(() => { first = result.current.moveTask(result.current.columns.TODO.tasks[0], 'IN_PROGRESS') })
  await waitFor(() => expect(result.current.isUpdating).toBe(true))
  act(() => { second = result.current.moveTask(result.current.columns.TODO.tasks[0], 'DONE') })
  await waitFor(() => expect(replies).toHaveLength(2))
  server = [makeTask({ id: 1, status: 'DONE', version: 2 })]
  await act(async () => { replies[1](server[0]); await second })
  expect(result.current.isUpdating).toBe(true)
  expect(result.current.columns.TODO.tasks).toHaveLength(1)
  await act(async () => { replies[0](makeTask({ id: 1, status: 'IN_PROGRESS', version: 1 })); await first })
  await waitFor(() => expect(result.current.columns.DONE.tasks[0]?.version).toBe(2))
  expect(result.current.columns.IN_PROGRESS.tasks).toEqual([])
})

it('refreshes every loaded page beyond 100 rows', async () => {
  server = Array.from({ length: 140 }, (_, i) => makeTask({ id: i + 1 }))
  const { result } = await loaded()
  for (let i = 0; i < 5; i++) {
    await act(() => result.current.loadMore('TODO'))
    await waitFor(() => expect(result.current.columns.TODO.tasks).toHaveLength((i + 2) * 20))
  }
  server[110] = { ...server[110], title: 'Remote edit', version: 1 }
  server.splice(119, 1)
  await act(() => result.current.refresh())
  await waitFor(() => expect(result.current.columns.TODO.tasks.find(task => task.id === 111)?.title).toBe('Remote edit'))
  expect(result.current.columns.TODO.tasks.some(task => task.id === 120)).toBe(false)
})

it('loads the active filter after deletion cancels an older read', async () => {
  const context = queryWrapper()
  const { result, rerender } = renderHook(({ q }) => useTaskBoard(WORKSPACE_ID, { sort: 'NEWEST', q }), { ...context, initialProps: { q: '' } })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  let release!: () => void
  api.remove.mockReturnValue(new Promise<void>(resolve => { release = resolve }))
  let deletion!: Promise<void>
  act(() => { deletion = result.current.deleteTask(result.current.columns.TODO.tasks[0]) })
  rerender({ q: 'new' })
  server = [makeTask({ id: 2, title: 'new' })]
  await act(async () => { release(); await deletion })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  await waitFor(() => expect(result.current.columns.TODO.tasks[0]?.id).toBe(2))
})
