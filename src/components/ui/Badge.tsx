import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type BadgeTone = 'neutral' | 'danger' | 'warning' | 'success'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-muted',
  danger: 'bg-danger/12 text-danger',
  warning: 'bg-warning/14 text-warning',
  success: 'bg-success/14 text-success',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}
