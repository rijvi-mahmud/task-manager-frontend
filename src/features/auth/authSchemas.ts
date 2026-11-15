import { z } from 'zod'

export const currentUserSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  displayName: z.string(),
})
export type CurrentUser = z.infer<typeof currentUserSchema>

const email = z.string().trim().pipe(z.email('Email must be valid').max(120, 'Email must be at most 120 characters'))

/** bcrypt reads at most 72 bytes; the backend enforces the same limit. */
const newPassword = z.string()
  .refine(value => Array.from(value).length >= 8, 'Password must be at least 8 characters')
  .refine(value => value.trim().length > 0, 'Password must not be blank')
  .refine(value => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 bytes')

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.output<typeof loginFormSchema>

export const registerFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required').max(80, 'Name must be at most 80 characters'),
  email,
  password: newPassword,
})
export type RegisterInput = z.output<typeof registerFormSchema>

export const forgotPasswordFormSchema = z.object({ email })
export type ForgotPasswordInput = z.output<typeof forgotPasswordFormSchema>

export const resetPasswordFormSchema = z.object({
  newPassword,
  confirmPassword: z.string(),
}).refine(values => values.newPassword === values.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
})
export type ResetPasswordValues = z.input<typeof resetPasswordFormSchema>

/** Only same-site paths are accepted as post-login destinations (prevents open redirects). */
export function safeRedirect(target: string | undefined): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}
