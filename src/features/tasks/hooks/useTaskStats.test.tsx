import { act, renderHook } from '@testing-library/react'
import { focusManager } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { createQueryClient } from '../../../app/queryClient'
import { queryWrapper } from '../../../test/queryWrapper'
import { taskApi } from '../api/taskApi'
import { useTaskStats } from './useTaskStats'
import { WORKSPACE_ID } from '../../../test/fixtures'

vi.mock('../api/taskApi', () => ({ taskApi: { stats: vi.fn() } }))
afterEach(() => { vi.useRealTimers(); focusManager.setFocused(undefined) })
it('lets slow periodic reads finish before scheduling another poll', async () => {
  vi.useFakeTimers()
  focusManager.setFocused(true)
  const stats = { total: 1, todo: 1, inProgress: 0, done: 0, overdue: 0 }
  vi.mocked(taskApi.stats).mockResolvedValue(stats)
  const client = createQueryClient()
  client.setDefaultOptions({ ...client.getDefaultOptions(), queries: { ...client.getDefaultOptions().queries, gcTime: Infinity } })
  const { result } = renderHook(() => useTaskStats(WORKSPACE_ID), queryWrapper(client))
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(result.current.stats?.total).toBe(1)
  vi.mocked(taskApi.stats).mockImplementation(() => new Promise(resolve => {
    setTimeout(() => resolve({ ...stats, total: 42 }), 16_000)
  }))
  await act(async () => { await vi.advanceTimersByTimeAsync(61_000) })
  expect(result.current.stats?.total).toBe(42)
  expect(taskApi.stats).toHaveBeenCalledTimes(3)
})
