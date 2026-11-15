import type { ComponentProps } from 'react'
import { controlClass } from './controlStyles'

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean
}

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={controlClass(invalid, `resize-y ${className ?? ''}`)}
      {...props}
    />
  )
}
