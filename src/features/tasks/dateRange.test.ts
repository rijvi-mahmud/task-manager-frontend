import { expect, it } from 'vitest'
import { taskFormSchema, taskSchema, toTaskFormValues } from './taskSchemas'
import { makeTask } from '../../test/fixtures'

it.each(['0000-01-01', '+10000-01-01', '-0001-01-01'])('rejects unsupported due date %s in forms and responses', dueDate => {
  const task = makeTask({ dueDate })
  expect(taskSchema.safeParse(task).success).toBe(false)
  expect(taskFormSchema.safeParse(toTaskFormValues(task)).success).toBe(false)
})
it.each(['0001-01-01', '9999-12-31'])('accepts supported boundary %s', dueDate => {
  const task = makeTask({ dueDate })
  expect(taskSchema.safeParse(task).success).toBe(true)
  expect(taskFormSchema.safeParse(toTaskFormValues(task)).success).toBe(true)
})
