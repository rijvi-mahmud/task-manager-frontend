import { act, renderHook, waitFor } from '@testing-library/react'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { withNuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import { expect, it, vi } from 'vitest'
import { DEFAULT_TASK_FILTERS, toTaskListParams } from '../utils/taskFilters'
import { useTaskFilters } from './useTaskFilters'

it('loads shared URL filters and maps them to backend query parameters', () => {
  const { result } = renderHook(useTaskFilters, {
    wrapper: withNuqsTestingAdapter({ searchParams: '?q=login&priority=HIGH&assignee=7&sort=dueDate' }),
  })
  expect(toTaskListParams(result.current[0])).toEqual({ q: 'login', priority: 'HIGH', assigneeId: 7, sort: 'DUE_DATE' })
})

it.each(['-1', '0', '1.5', 'nope', '9007199254740992'])(
  'defaults invalid URL enums and assignee %s instead of sending invalid API values', assignee => {
    const { result } = renderHook(useTaskFilters, {
      wrapper: withNuqsTestingAdapter({ searchParams: { priority: 'urgent', sort: 'random', assignee } }),
    })
    expect(result.current[0]).toEqual(DEFAULT_TASK_FILTERS)
  },
)

it('updates several filters atomically and clears only filter parameters', async () => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>()
  const { result } = renderHook(useTaskFilters, {
    wrapper: withNuqsTestingAdapter({ searchParams: '?view=board', onUrlUpdate, hasMemory: true }),
  })
  await act(async () => { await result.current[1]({ priority: 'HIGH', assignee: 'UNASSIGNED', search: 'release' }) })
  const update = onUrlUpdate.mock.lastCall![0].searchParams
  expect(Object.fromEntries(update)).toEqual({ view: 'board', priority: 'HIGH', assignee: 'UNASSIGNED', q: 'release' })
  expect(toTaskListParams(result.current[0])).toEqual({ sort: 'NEWEST', priority: 'HIGH', unassigned: true, q: 'release' })
  await act(async () => { await result.current[1](null) })
  expect(onUrlUpdate.mock.lastCall![0].searchParams.toString()).toBe('view=board')
  expect(result.current[0]).toEqual(DEFAULT_TASK_FILTERS)
})

it('uses the SPA adapter to restore filters on browser history navigation', async () => {
  window.history.replaceState(null, '', '/?priority=HIGH')
  const { result, unmount } = renderHook(useTaskFilters, { wrapper: NuqsAdapter })
  expect(result.current[0].priority).toBe('HIGH')
  act(() => {
    window.history.replaceState(null, '', '/?q=history&priority=LOW')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await waitFor(() => expect(result.current[0]).toMatchObject({ search: 'history', priority: 'LOW' }))
  unmount()
  window.history.replaceState(null, '', '/')
})

it('preserves ISO date bounds in shared URLs and removes them on reset', async () => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>()
  const { result } = renderHook(useTaskFilters, {
    wrapper: withNuqsTestingAdapter({ searchParams: '?dueFrom=2024-02-29&dueTo=2024-03-01&view=board', onUrlUpdate, hasMemory: true }),
  })
  expect(toTaskListParams(result.current[0])).toEqual({ sort: 'NEWEST', dueFrom: '2024-02-29', dueTo: '2024-03-01' })
  await act(async () => { await result.current[1](null) })
  expect(onUrlUpdate.mock.lastCall![0].searchParams.toString()).toBe('view=board')
})

it.each(['0000-01-01', '2026-02-30', '2026-01-01T00:00:00Z', 'not-a-date'])(
  'defaults unsupported URL dates instead of forwarding %s', date => {
    const { result } = renderHook(useTaskFilters, {
      wrapper: withNuqsTestingAdapter({ searchParams: { dueFrom: date, dueTo: date } }),
    })
    expect(result.current[0].dueFrom).toBe('')
    expect(result.current[0].dueTo).toBe('')
  },
)
