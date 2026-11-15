import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '../../utils/cn'

export type AlertTone = 'error' | 'warning' | 'success' | 'info'
const tones = {
  error: { icon: CircleAlert, className: 'bg-danger/10 text-danger' },
  warning: { icon: TriangleAlert, className: 'bg-warning/10 text-warning' },
  success: { icon: CircleCheck, className: 'bg-success/10 text-success' },
  info: { icon: Info, className: 'bg-surface-muted text-fg' },
} satisfies Record<AlertTone, { icon: typeof Info; className: string }>

interface AlertProps {
  children: ReactNode
  tone?: AlertTone
  action?: ReactNode
}

export function Alert({ children, tone = 'error', action }: AlertProps) {
  const { icon: Icon, className } = tones[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} aria-atomic="true" className={cn('flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm', className)}>
      <Icon aria-hidden className="size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  )
}
