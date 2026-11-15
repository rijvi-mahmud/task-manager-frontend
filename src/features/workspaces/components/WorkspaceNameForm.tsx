import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { Input } from '../../../components/ui/Input'
import { applyServerErrors } from '../../../utils/formErrors'
import { workspaceFormSchema, type WorkspaceFormValues, type WorkspaceInput } from '../workspaceSchemas'

interface WorkspaceNameFormProps {
  defaultName?: string
  submitLabel: string
  onSubmit: (input: WorkspaceInput) => Promise<void>
}

export function WorkspaceNameForm({ defaultName = '', submitLabel, onSubmit }: WorkspaceNameFormProps) {
  const id = useId()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<WorkspaceFormValues, undefined, WorkspaceInput>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: { name: defaultName },
  })
  const submit = handleSubmit(async (input) => {
    try { await onSubmit(input) } catch (err) { applyServerErrors(err, setError, ['name']) }
  })
  return (
    <form aria-label={submitLabel} onSubmit={submit} noValidate className="flex flex-col gap-3">
      <Field label="Workspace name" htmlFor={`${id}-name`} required error={errors.name?.message}>
        <Input id={`${id}-name`} required autoFocus placeholder="Launch team" invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${id}-name-error` : undefined} {...register('name')} />
      </Field>
      {errors.root?.server && <p role="alert" className="text-sm text-danger">{errors.root.server.message}</p>}
      <Button type="submit" variant="primary" size="sm" className="self-end" disabled={isSubmitting}>{submitLabel}</Button>
    </form>
  )
}
