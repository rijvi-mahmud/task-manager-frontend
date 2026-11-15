import type { ComponentProps } from 'react'
import { controlClass } from './controlStyles'

export interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean
}

export function Input({ invalid, className, ...props }: InputProps) {
  return <input aria-invalid={invalid || undefined} className={controlClass(invalid, className)} {...props} />
}
