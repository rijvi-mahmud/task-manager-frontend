import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { Input } from '../../../components/ui/Input'
import { errorMessage } from '../../../api/httpClient'
import { resetPasswordFormSchema, type ResetPasswordValues } from '../authSchemas'

export function ResetPasswordForm({ onSubmit }: { onSubmit: (newPassword: string) => Promise<void> }) {
  const id = useId()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })
  const submit = handleSubmit(async ({ newPassword }) => {
    try { await onSubmit(newPassword) } catch (err) { setError('root.server', { message: errorMessage(err) }) }
  })

  return (
    <form aria-label="Set a new password" onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="New password" htmlFor={`${id}-new`} required error={errors.newPassword?.message}>
        <Input id={`${id}-new`} type="password" autoComplete="new-password" required autoFocus invalid={Boolean(errors.newPassword)}
          aria-describedby={errors.newPassword ? `${id}-new-error` : undefined} {...register('newPassword')} />
      </Field>
      <Field label="Confirm password" htmlFor={`${id}-confirm`} required error={errors.confirmPassword?.message}>
        <Input id={`${id}-confirm`} type="password" autoComplete="new-password" required invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? `${id}-confirm-error` : undefined} {...register('confirmPassword')} />
      </Field>
      {errors.root?.server && <p role="alert" className="text-sm text-danger">{errors.root.server.message}</p>}
      <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Set new password'}</Button>
    </form>
  )
}
