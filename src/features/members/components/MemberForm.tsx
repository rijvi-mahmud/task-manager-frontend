import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { Input } from '../../../components/ui/Input'
import { applyServerErrors } from '../../../utils/formErrors'
import { memberFormSchema, type MemberFormValues, type MemberInput } from '../memberSchemas'

export function MemberForm({ onSubmit }: { onSubmit: (input: MemberInput) => Promise<void> }) {
  const id = useId()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues, undefined, MemberInput>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: { email: '' },
  })

  const submit = handleSubmit(async (input) => {
    try {
      await onSubmit(input)
      reset()
    } catch (err) {
      applyServerErrors(err, setError, ['email'])
    }
  })

  return (
    <form aria-label="Add member" onSubmit={submit} noValidate className="flex flex-col gap-3">
      <p role="status" className="sr-only">{isSubmitting ? 'Adding member…' : ''}</p>
      <Field label="Email" htmlFor={`${id}-email`} required error={errors.email?.message}>
        <Input
          id={`${id}-email`}
          type="email"
          required
          autoComplete="email"
          aria-describedby={`${id}-hint${errors.email ? ` ${id}-email-error` : ''}`}
          placeholder="jane@company.com"
          invalid={Boolean(errors.email)}
          {...register('email')}
        />
      </Field>
      <p id={`${id}-hint`} className="text-xs text-muted">
        No account yet? They join this workspace as soon as they register with this email.
      </p>
      {errors.root?.server && (
        <p role="alert" className="text-sm text-danger">
          {errors.root.server.message}
        </p>
      )}
      <Button type="submit" variant="primary" size="sm" className="self-end" disabled={isSubmitting}>
        <Plus className="size-3.5" /> Add member
      </Button>
    </form>
  )
}
