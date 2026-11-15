import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { Input } from '../../../components/ui/Input'
import { applyServerErrors } from '../../../utils/formErrors'
import { loginFormSchema, type LoginInput } from '../authSchemas'

export function LoginForm({ onSubmit }: { onSubmit: (input: LoginInput) => Promise<void> }) {
  const id = useId()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })
  const submit = handleSubmit(async (input) => {
    try { await onSubmit(input) } catch (err) { applyServerErrors(err, setError, ['email', 'password']) }
  })

  return (
    <form aria-label="Sign in" onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Email" htmlFor={`${id}-email`} required error={errors.email?.message}>
        <Input id={`${id}-email`} type="email" autoComplete="username" required autoFocus
          invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${id}-email-error` : undefined} {...register('email')} />
      </Field>
      <Field label="Password" htmlFor={`${id}-password`} required error={errors.password?.message}>
        <Input id={`${id}-password`} type="password" autoComplete="current-password" required
          invalid={Boolean(errors.password)} aria-describedby={errors.password ? `${id}-password-error` : undefined} {...register('password')} />
      </Field>
      {errors.root?.server && <p role="alert" className="text-sm text-danger">{errors.root.server.message}</p>}
      <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  )
}
