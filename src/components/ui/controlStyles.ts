import { cn } from '../../utils/cn'

/** Shared look for text inputs, selects and textareas. */
export function controlClass(invalid?: boolean, className?: string): string {
  return cn(
    'w-full min-w-0 min-h-10 rounded-lg border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    invalid ? 'border-danger' : 'border-control-border',
    className,
  )
}
