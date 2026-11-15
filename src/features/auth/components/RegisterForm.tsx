import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { Input } from '../../../components/ui/Input'
import { applyServerErrors } from '../../../utils/formErrors'
import { registerFormSchema, type RegisterInput } from '../authSchemas'

const FIELDS = ['displayName', 'email', 'password'] as const

export function RegisterForm({ onSubmit }: { onSubmit: (input: RegisterInput) => Promise<void> }) {
  const id = useId()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  })
  const submit = handleSubmit(async (input) => {
    try { await onSubmit(input) } catch (err) { applyServerErrors(err, setError, FIELDS) }
  })

  return (
    <form aria-label="Create account" onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Name" htmlFor={`${id}-name`} required error={errors.displayName?.message}>
        <Input id={`${id}-name`} autoComplete="name" required autoFocus invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? `${id}-name-error` : undefined} {...register('displayName')} />
      </Field>
      <Field label="Email" htmlFor={`${id}-email`} required error={errors.email?.message}>
        <Input id={`${id}-email`} type="email" autoComplete="username" required invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${id}-email-error` : undefined} {...register('email')} />
      </Field>
      <Field label="Password" htmlFor={`${id}-password`} required error={errors.password?.message}>
        <Input id={`${id}-password`} type="password" autoComplete="new-password" required invalid={Boolean(errors.password)}
          aria-describedby={`${id}-password-hint${errors.password ? ` ${id}-password-error` : ''}`} {...register('password')} />
      </Field>
      <p id={`${id}-password-hint`} className="-mt-2 text-xs text-muted">At least 8 characters.</p>
      {errors.root?.server && <p role="alert" className="text-sm text-danger">{errors.root.server.message}</p>}
      <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</Button>
    </form>
  )
}
