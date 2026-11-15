import { useId } from 'react'
import { Field } from '../../../components/ui/Field'
import { Input } from '../../../components/ui/Input'
import { getTaskDateRangeError, type TaskFilterValues } from '../utils/taskFilters'

type DateRangeValues = Pick<TaskFilterValues, 'dueFrom' | 'dueTo'>
interface TaskDateRangeFilterProps extends DateRangeValues {
  onChange: (patch: Partial<DateRangeValues>) => void
}

export function TaskDateRangeFilter({ dueFrom, dueTo, onChange }: TaskDateRangeFilterProps) {
  const id = useId()
  const error = getTaskDateRangeError({ dueFrom, dueTo })
  const descriptionId = `${id}-hint${error ? ` ${id}-error` : ''}`
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Due date range</legend>
      <div className="grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        <Field label="Due from" htmlFor={`${id}-from`}>
          <Input
            id={`${id}-from`}
            type="date"
            min="0001-01-01"
            max={dueTo || '9999-12-31'}
            value={dueFrom}
            invalid={Boolean(error)}
            aria-describedby={descriptionId}
            onChange={event => onChange({ dueFrom: event.target.value })}
          />
        </Field>
        <Field label="Due to" htmlFor={`${id}-to`}>
          <Input
            id={`${id}-to`}
            type="date"
            min={dueFrom || '0001-01-01'}
            max="9999-12-31"
            value={dueTo}
            invalid={Boolean(error)}
            aria-describedby={descriptionId}
            onChange={event => onChange({ dueTo: event.target.value })}
          />
        </Field>
      </div>
      <p id={`${id}-hint`} className="sr-only">Includes both dates. Leave either date empty for an open-ended range.</p>
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </fieldset>
  )
}
