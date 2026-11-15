import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError, errorMessage } from '../api/httpClient'

/**
 * Pushes a failed submission's errors into react-hook-form: backend field
 * errors land on their inputs, anything else becomes a form-level error.
 */
export function applyServerErrors<T extends FieldValues, TError>(
  err: TError,
  setError: UseFormSetError<T>,
  fields: ReadonlyArray<Path<T>>,
): void {
  if (err instanceof ApiError) {
    const known = Object.entries(err.fieldErrors).filter(([field]) => fields.includes(field as Path<T>))
    known.forEach(([field, message], index) => setError(field as Path<T>, { type: 'server', message }, { shouldFocus: index === 0 }))
    if (known.length > 0) return
  }
  setError('root.server', { type: 'server', message: errorMessage(err) })
}
