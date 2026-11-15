import { describe, expect, it } from 'vitest'
import { DEFAULT_TASK_FILTERS, getTaskDateRangeError, hasActiveTaskFilters, toTaskListParams } from './taskFilters'

describe('toTaskListParams', () => {
  it('sends only the sort for the default filter', () => {
    expect(toTaskListParams(DEFAULT_TASK_FILTERS)).toEqual({ sort: 'NEWEST' })
  })

  it('maps every filter to its API parameter and trims the search', () => {
    expect(toTaskListParams({ ...DEFAULT_TASK_FILTERS, search: '  login ', priority: 'HIGH', assignee: '7', sort: 'dueDate' })).toEqual({
      q: 'login',
      priority: 'HIGH',
      assigneeId: 7,
      sort: 'DUE_DATE',
    })
  })

  it('uses the unassigned flag rather than an id', () => {
    expect(toTaskListParams({ ...DEFAULT_TASK_FILTERS, assignee: 'UNASSIGNED', sort: 'priority' })).toEqual({
      unassigned: true,
      sort: 'PRIORITY',
    })
  })

  it('ignores whitespace-only search', () => {
    expect(toTaskListParams({ ...DEFAULT_TASK_FILTERS, search: '   ' })).toEqual({ sort: 'NEWEST' })
  })
})

describe('hasActiveTaskFilters', () => {
  it('is false for the default filter and true once anything narrows it', () => {
    expect(hasActiveTaskFilters(DEFAULT_TASK_FILTERS)).toBe(false)
    expect(hasActiveTaskFilters({ ...DEFAULT_TASK_FILTERS, search: 'x' })).toBe(true)
    expect(hasActiveTaskFilters({ ...DEFAULT_TASK_FILTERS, sort: 'priority' })).toBe(false) // sorting doesn't hide tasks
  })
})

it.each([
  { dueFrom: '2026-01-01', dueTo: '' },
  { dueFrom: '', dueTo: '2026-01-31' },
  { dueFrom: '2026-01-15', dueTo: '2026-01-15' },
])('sends only the selected calendar-date bounds: $dueFrom / $dueTo', range => {
  const filter = { ...DEFAULT_TASK_FILTERS, ...range }
  expect(toTaskListParams(filter)).toEqual({ sort: 'NEWEST',
    ...(range.dueFrom ? { dueFrom: range.dueFrom } : {}),
    ...(range.dueTo ? { dueTo: range.dueTo } : {}),
  })
  expect(hasActiveTaskFilters(filter)).toBe(true)
  expect(getTaskDateRangeError(range)).toBeNull()
})

it('validates the date range before fetching, including supported years and leap days', () => {
  expect(getTaskDateRangeError({ dueFrom: '2026-03-02', dueTo: '2026-03-01' })).toBe('Due from must be on or before due to.')
  for (const date of ['0000-01-01', '10000-01-01', '2026-02-29', 'not-a-date']) {
    expect(getTaskDateRangeError({ dueFrom: date })).not.toBeNull()
    expect(getTaskDateRangeError({ dueTo: date })).not.toBeNull()
  }
  expect(getTaskDateRangeError({ dueFrom: '0001-01-01', dueTo: '9999-12-31' })).toBeNull()
  expect(getTaskDateRangeError({ dueFrom: '2024-02-29', dueTo: '2024-02-29' })).toBeNull()
})
