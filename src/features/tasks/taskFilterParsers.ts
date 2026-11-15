import { createParser, parseAsString, parseAsStringLiteral } from 'nuqs'
import { TASK_PRIORITIES, taskDueDateSchema } from './taskSchemas'
import { DEFAULT_TASK_FILTERS, type TaskAssigneeFilter } from './utils/taskFilters'

const assigneeParser = createParser<TaskAssigneeFilter>({
  parse: value => {
    if (value === 'ALL' || value === 'UNASSIGNED') return value
    return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? `${Number(value)}` : null
  },
  serialize: value => value,
})

const dueDateParser = createParser<string>({
  parse: value => {
    const result = taskDueDateSchema.safeParse(value)
    return result.success ? result.data : null
  },
  serialize: value => value,
}).withDefault('')

/** Invalid URL values fall back to defaults; defaults are omitted from the URL. */
export const taskFilterParsers = {
  dueFrom: dueDateParser,
  dueTo: dueDateParser,
  search: parseAsString.withDefault(DEFAULT_TASK_FILTERS.search),
  priority: parseAsStringLiteral(['ALL', ...TASK_PRIORITIES]).withDefault(DEFAULT_TASK_FILTERS.priority),
  assignee: assigneeParser.withDefault(DEFAULT_TASK_FILTERS.assignee),
  sort: parseAsStringLiteral(['newest', 'dueDate', 'priority']).withDefault(DEFAULT_TASK_FILTERS.sort),
}
