import { useId } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select, type SelectOption } from '../../../components/ui/Select'
import { formatIsoDate } from '../../../utils/date'
import type { Member } from '../../members/memberSchemas'
import { TASK_PRIORITY_LABELS } from '../constants'
import { TASK_PRIORITIES } from '../taskSchemas'
import type { TaskAssigneeFilter, TaskSortOption, TaskFilterValues } from '../utils/taskFilters'
import { TaskDateRangeFilter } from './TaskDateRangeFilter'

const PRIORITY_OPTIONS: SelectOption<TaskFilterValues['priority']>[] = [
  { value: 'ALL', label: 'All priorities' },
  ...TASK_PRIORITIES.map(value => ({ value, label: TASK_PRIORITY_LABELS[value] })),
]
const SORT_OPTIONS: SelectOption<TaskSortOption>[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
]

interface TaskFiltersProps {
  filter: TaskFilterValues
  members: Member[]
  isFiltered: boolean
  onChange: (patch: Partial<TaskFilterValues>) => void
  onReset: () => void
}
interface FilterChip {
  key: string
  label: string
  reset: Partial<TaskFilterValues>
}

export function TaskFilters({ filter, members, isFiltered, onChange, onReset }: TaskFiltersProps) {
  const searchId = useId()
  const assigneeOptions: SelectOption<TaskAssigneeFilter>[] = [
    { value: 'ALL', label: 'Everyone' },
    { value: 'UNASSIGNED', label: 'Unassigned' },
    ...members.map(member => ({ value: `${member.id}` as const, label: member.name })),
  ]
  const chips: FilterChip[] = []
  if (filter.search.trim()) chips.push({ key: 'search', label: `Search: ${filter.search.trim()}`, reset: { search: '' } })
  if (filter.priority !== 'ALL') chips.push({ key: 'priority', label: `Priority: ${TASK_PRIORITY_LABELS[filter.priority]}`, reset: { priority: 'ALL' } })
  if (filter.assignee !== 'ALL') {
    const name = assigneeOptions.find(option => option.value === filter.assignee)?.label ?? `Member ${filter.assignee}`
    chips.push({ key: 'assignee', label: `Assignee: ${name}`, reset: { assignee: 'ALL' } })
  }
  if (filter.dueFrom || filter.dueTo) {
    const from = filter.dueFrom ? formatIsoDate(filter.dueFrom) : 'Any start'
    const to = filter.dueTo ? formatIsoDate(filter.dueTo) : 'Any end'
    chips.push({ key: 'dates', label: `Due: ${from} – ${to}`, reset: { dueFrom: '', dueTo: '' } })
  }

  return (
    <fieldset className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <legend className="sr-only">Filter tasks</legend>
      <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-muted" aria-hidden />
          Filters
          {chips.length > 0 && <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-muted">{chips.length} active</span>}
        </span>
        {isFiltered && (
          <Button variant="ghost" size="sm" aria-label="Clear filters" onClick={onReset}>
            <X className="size-3.5" aria-hidden /> Clear<span className="hidden sm:inline">filters</span>
          </Button>
        )}
      </div>
      <div className="grid items-start gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[minmax(180px,1.5fr)_minmax(120px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(280px,2fr)]">
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <label htmlFor={searchId} className="mb-1.5 block text-xs font-medium text-muted">Search tasks</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              id={searchId}
              type="search"
              placeholder="Title or description…"
              value={filter.search}
              onChange={event => onChange({ search: event.target.value })}
              className="pl-9"
            />
          </div>
        </div>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-muted">
          Priority
          <Select
            aria-label="Filter by priority"
            className="font-normal"
            options={PRIORITY_OPTIONS}
            value={filter.priority}
            onChange={event => onChange({ priority: event.target.value as TaskFilterValues['priority'] })}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-muted">
          Assignee
          <Select
            aria-label="Filter by assignee"
            className="font-normal"
            options={assigneeOptions}
            value={filter.assignee}
            onChange={event => onChange({ assignee: event.target.value as TaskAssigneeFilter })}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-muted">
          Sort by
          <Select
            aria-label="Sort by task order"
            className="font-normal"
            options={SORT_OPTIONS}
            value={filter.sort}
            onChange={event => onChange({ sort: event.target.value as TaskSortOption })}
          />
        </label>
        <div className="min-w-0 sm:col-span-2 md:col-span-3 lg:col-span-1">
          <TaskDateRangeFilter dueFrom={filter.dueFrom} dueTo={filter.dueTo} onChange={onChange} />
        </div>
      </div>
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
          {chips.map(chip => (
            <Button
              key={chip.key}
              variant="ghost"
              size="sm"
              aria-label={`Remove ${chip.label} filter`}
              onClick={() => onChange(chip.reset)}
              className="max-w-full rounded-full bg-surface-muted text-xs text-fg"
            >
              <span className="truncate">{chip.label}</span>
              <X className="size-3 shrink-0" aria-hidden />
            </Button>
          ))}
        </div>
      )}
    </fieldset>
  )
}
