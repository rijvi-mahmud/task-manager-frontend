import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { Input } from '../../../components/ui/Input'
import { Select, type SelectOption } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { applyServerErrors } from '../../../utils/formErrors'
import { ApiError, errorMessage } from '../../../api/httpClient'
import type { Member } from '../../members/memberSchemas'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../constants'
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  taskFormSchema,
  toTaskFormValues,
  type Task,
  type TaskFormValues,
  type TaskInput,
  type TaskStatus,
} from '../taskSchemas'

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }))
const PRIORITY_OPTIONS = TASK_PRIORITIES.map((value) => ({ value, label: TASK_PRIORITY_LABELS[value] }))
const FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'assigneeId'] as const

interface TaskFormProps {
  /** Present when editing; absent when creating. */
  task?: Task
  defaultStatus?: TaskStatus
  members: Member[]
  submitLabel: string
  onSubmit: (input: TaskInput) => Promise<void>
  onCancel: () => void
  /** Offered when saving hits a 409 (someone else changed the task): reload it into the form. */
  onLoadLatest?: () => Promise<void>
}

export function TaskForm({ task, defaultStatus, members, submitLabel, onSubmit, onCancel, onLoadLatest }: TaskFormProps) {
  const id = useId()
  const [isLoadingLatest, setIsLoadingLatest] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function loadLatest() {
    if (!onLoadLatest || isLoadingLatest) return
    setIsLoadingLatest(true)
    setLoadError(null)
    try {
      await onLoadLatest()
    } catch (err) {
      setLoadError(errorMessage(err))
    } finally {
      setIsLoadingLatest(false)
    }
  }
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues, undefined, TaskInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { ...toTaskFormValues(task), status: task?.status ?? defaultStatus ?? 'TODO' },
  })

  const assigneeOptions: SelectOption<string>[] = [
    { value: '', label: 'Unassigned' },
    ...members.map((member) => ({ value: String(member.id), label: member.name })),
  ]

  const submit = handleSubmit(async (input) => {
    try {
      await onSubmit(input)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('root.server', { type: 'conflict', message: err.message })
      } else {
        applyServerErrors(err, setError, FIELDS)
      }
    }
  })

  const conflict = errors.root?.server?.type === 'conflict' && onLoadLatest !== undefined

  const describedBy = (field: keyof TaskFormValues) => (errors[field] ? `${id}-${field}-error` : undefined)

  return (
    <form aria-label={task ? 'Edit task' : 'Create task'} onSubmit={submit} noValidate className="flex flex-col gap-4">
      <p role="status" className="sr-only">
        {isLoadingLatest ? 'Loading latest task version…' : isSubmitting ? 'Saving task…' : ''}
      </p>
      <p className="text-xs text-muted">Fields marked * are required.</p>
      <Field label="Title" htmlFor={`${id}-title`} required error={errors.title?.message}>
        <Input
          id={`${id}-title`}
          placeholder="What needs doing?"
          autoFocus
          required
          invalid={Boolean(errors.title)}
          aria-describedby={describedBy('title')}
          {...register('title')}
        />
      </Field>

      <Field label="Description" htmlFor={`${id}-description`} error={errors.description?.message}>
        <Textarea
          id={`${id}-description`}
          rows={3}
          placeholder="Add context, links, or acceptance criteria…"
          invalid={Boolean(errors.description)}
          aria-describedby={describedBy('description')}
          {...register('description')}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Status" htmlFor={`${id}-status`} error={errors.status?.message}>
          <Select
            id={`${id}-status`}
            invalid={Boolean(errors.status)}
            aria-describedby={describedBy('status')}
            options={STATUS_OPTIONS}
            {...register('status')}
          />
        </Field>
        <Field label="Priority" htmlFor={`${id}-priority`} error={errors.priority?.message}>
          <Select
            id={`${id}-priority`}
            invalid={Boolean(errors.priority)}
            aria-describedby={describedBy('priority')}
            options={PRIORITY_OPTIONS}
            {...register('priority')}
          />
        </Field>
        <Field label="Due date" htmlFor={`${id}-dueDate`} error={errors.dueDate?.message}>
          <Input
            id={`${id}-dueDate`}
            type="date"
            invalid={Boolean(errors.dueDate)}
            aria-describedby={describedBy('dueDate')}
            {...register('dueDate')}
          />
        </Field>
        <Field label="Assignee" htmlFor={`${id}-assigneeId`} error={errors.assigneeId?.message}>
          <Select
            id={`${id}-assigneeId`}
            invalid={Boolean(errors.assigneeId)}
            aria-describedby={describedBy('assigneeId')}
            options={assigneeOptions}
            {...register('assigneeId')}
          />
        </Field>
      </div>

      {errors.root?.server && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-danger">
          <span>{errors.root.server.message}</span>
          {conflict && (
            <Button size="sm" disabled={isLoadingLatest} onClick={() => void loadLatest()}>
              Load latest version
            </Button>
          )}
        </div>
      )}
      {loadError && <p role="alert" className="text-sm text-danger">{loadError}</p>}
      {conflict && (
        <Alert tone="warning">Loading the latest version replaces your unsaved changes in this form.</Alert>
      )}

      <div className="mt-1 flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
