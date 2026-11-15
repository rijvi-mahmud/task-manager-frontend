import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { Input } from '../../../components/ui/Input'
import { applyServerErrors } from '../../../utils/formErrors'
import { forgotPasswordFormSchema, type ForgotPasswordInput } from '../authSchemas'

export function ForgotPasswordForm({ onSubmit }: { onSubmit: (email: string) => Promise<void> }) {
  const id = useId()
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  })
  const submit = handleSubmit(async ({ email }) => {
    try { await onSubmit(email); setSent(true) } catch (err) { applyServerErrors(err, setError, ['email']) }
  })

  if (sent) {
    return (
      <Alert tone="success">
        If an account exists for that email, a reset link is on its way. It works once, for 30 minutes.
        <span className="mt-1 block text-xs">This demo has no mail server: the link is written to the backend log.</span>
      </Alert>
    )
  }
  return (
    <form aria-label="Request password reset" onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Email" htmlFor={`${id}-email`} required error={errors.email?.message}>
        <Input id={`${id}-email`} type="email" autoComplete="username" required autoFocus invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${id}-email-error` : undefined} {...register('email')} />
      </Field>
      {errors.root?.server && <p role="alert" className="text-sm text-danger">{errors.root.server.message}</p>}
      <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send reset link'}</Button>
    </form>
  )
}
