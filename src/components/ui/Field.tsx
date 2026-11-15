import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface FieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}

/** Label + control + error message. */
export function Field({ label, htmlFor, required, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1 text-xs font-medium text-muted">
        <label htmlFor={htmlFor}>{label}</label>
        {required && <span aria-hidden="true">*</span>}
      </div>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
