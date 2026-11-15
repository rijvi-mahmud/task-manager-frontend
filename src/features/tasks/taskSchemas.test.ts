import { describe, expect, it } from 'vitest'
import { makeTask } from '../../test/fixtures'
import { taskFormSchema, taskSchema, toTaskFormValues } from './taskSchemas'

describe('taskFormSchema', () => {
  const valid = { title: '  Ship  ', description: '  ', status: 'TODO', priority: 'HIGH', dueDate: '', assigneeId: '' }

  it('turns form strings into the API payload', () => {
    expect(taskFormSchema.parse(valid)).toEqual({
      title: 'Ship',
      description: null,
      status: 'TODO',
      priority: 'HIGH',
      dueDate: null,
      assigneeId: null,
    })
  })

  it('converts assignee id and keeps a real due date', () => {
    const out = taskFormSchema.parse({ ...valid, assigneeId: '7', dueDate: '2026-05-01' })
    expect(out.assigneeId).toBe(7)
    expect(out.dueDate).toBe('2026-05-01')
  })

  it('rejects a blank title and an over-long one', () => {
    expect(taskFormSchema.safeParse({ ...valid, title: '   ' }).error?.issues[0].message).toBe('Title is required')
    expect(taskFormSchema.safeParse({ ...valid, title: 'x'.repeat(121) }).success).toBe(false)
  })

  it('round-trips an existing task through form values', () => {
    const task = makeTask({ title: 'Edit me', assigneeId: 3, dueDate: '2026-01-31', description: 'd' })
    expect(taskFormSchema.parse(toTaskFormValues(task))).toMatchObject({
      title: 'Edit me',
      description: 'd',
      assigneeId: 3,
      dueDate: '2026-01-31',
    })
  })
})

describe('taskSchema', () => {
  it('rejects responses with an unknown status', () => {
    expect(taskSchema.safeParse({ ...makeTask(), status: 'ARCHIVED' }).success).toBe(false)
  })
})
