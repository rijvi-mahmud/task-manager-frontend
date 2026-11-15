import { expect, it } from 'vitest'
import { makeTask } from '../../../test/fixtures'
import { createEmptyTaskColumns, deduplicateTaskColumns } from './taskBoardState'

it('deduplicates remote moves across columns using the newest version', () => {
  const old = makeTask({ id: 1, status: 'DONE', version: 1 })
  const newer = { ...old, status: 'TODO' as const, version: 2 }
  const columns = createEmptyTaskColumns()
  columns.DONE = { tasks: [old], total: 1 }
  columns.TODO = { tasks: [newer, newer], total: 1 }
  const merged = deduplicateTaskColumns(columns)
  expect(merged.DONE).toEqual({ tasks: [], total: 0 })
  expect(merged.TODO.tasks).toEqual([newer])
})
