import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { makePage, makeTask, WORKSPACE_ID, makeMember } from '../../../test/fixtures'
import { queryWrapper } from '../../../test/queryWrapper'
import { memberApi } from '../../members/api/memberApi'
import { useMembers } from '../../members/hooks/useMembers'
import type { Member } from '../../members/memberSchemas'
import { taskApi } from '../api/taskApi'
import type { Task } from '../taskSchemas'
import { useTaskBoard } from './useTaskBoard'

vi.mock('../api/taskApi', () => ({ taskApi: { list: vi.fn(), changeStatus: vi.fn() } }))
vi.mock('../../members/api/memberApi', () => ({ memberApi: { list: vi.fn(), add: vi.fn() } }))
const ada: Member = makeMember({ id: 1, name: 'Ada', email: 'ada@example.com' })
const grace: Member = makeMember({ id: 2, name: 'Grace', email: 'grace@example.com' })
let serverTask: Task
let serverMembers: Member[]
beforeEach(() => {
  vi.resetAllMocks()
  serverTask = makeTask({ id: 1 })
  serverMembers = [ada]
  vi.mocked(taskApi.list).mockImplementation(async (_workspaceId, { status }) => makePage(status === serverTask.status ? [serverTask] : []))
  vi.mocked(memberApi.list).mockImplementation(async () => serverMembers)
})
async function loaded() {
  const hook = renderHook(() => ({ board: useTaskBoard(WORKSPACE_ID, { sort: 'NEWEST' }), members: useMembers(WORKSPACE_ID) }), queryWrapper())
  await waitFor(() => expect(hook.result.current.board.isLoading || hook.result.current.members.isLoading).toBe(false))
  vi.mocked(taskApi.list).mockClear()
  vi.mocked(memberApi.list).mockClear()
  return hook
}

it('revalidates tasks for a task move and members for member creation without unrelated requests', async () => {
  const { result } = await loaded()
  vi.mocked(taskApi.changeStatus).mockImplementation(async () => {
    serverTask = { ...serverTask, status: 'DONE', version: 1 }
    return serverTask
  })
  await act(() => result.current.board.moveTask(serverTask, 'DONE'))
  await waitFor(() => expect(result.current.board.columns.DONE.tasks).toHaveLength(1))
  expect(taskApi.list).toHaveBeenCalledTimes(3)
  expect(memberApi.list).not.toHaveBeenCalled()
  vi.mocked(taskApi.list).mockClear()
  vi.mocked(memberApi.add).mockImplementation(async () => { serverMembers = [ada, grace]; return grace })
  await act(() => result.current.members.createMember(grace))
  await waitFor(() => expect(result.current.members.members).toHaveLength(2))
  expect(memberApi.list).toHaveBeenCalledTimes(1)
  expect(taskApi.list).not.toHaveBeenCalled()
})

it.each(['task', 'member'] as const)('revalidates both affected resources when %s is the last overlapping write', async last => {
  const { result } = await loaded()
  let finishTask!: (task: Task) => void
  let finishMember!: (member: Member) => void
  vi.mocked(taskApi.changeStatus).mockReturnValue(new Promise(resolve => { finishTask = resolve }))
  vi.mocked(memberApi.add).mockReturnValue(new Promise(resolve => { finishMember = resolve }))
  let taskWrite!: Promise<void>, memberWrite!: Promise<void>
  act(() => {
    taskWrite = result.current.board.moveTask(serverTask, 'DONE')
    memberWrite = result.current.members.createMember(grace)
  })
  await waitFor(() => expect(taskApi.changeStatus).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(memberApi.add).toHaveBeenCalledTimes(1))
  serverTask = { ...serverTask, status: 'DONE', version: 1 }
  serverMembers = [ada, grace]
  if (last === 'task') {
    await act(async () => { finishMember(grace); await memberWrite })
    expect(memberApi.list).not.toHaveBeenCalled()
    await act(async () => { finishTask(serverTask); await taskWrite })
  } else {
    await act(async () => { finishTask(serverTask); await taskWrite })
    expect(taskApi.list).not.toHaveBeenCalled()
    await act(async () => { finishMember(grace); await memberWrite })
  }
  await waitFor(() => expect(result.current.board.columns.DONE.tasks).toHaveLength(1))
  await waitFor(() => expect(result.current.members.members).toHaveLength(2))
  expect(taskApi.list).toHaveBeenCalledTimes(3)
  expect(memberApi.list).toHaveBeenCalledTimes(1)
})
