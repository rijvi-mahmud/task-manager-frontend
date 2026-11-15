import { CalendarDays } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { formatIsoDate } from '../../../utils/date'

export function DueDateLabel({ dueDate, overdue }: { dueDate: string; overdue: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', overdue ? 'font-semibold text-danger' : 'text-muted')}>
      <CalendarDays className="size-3.5" aria-hidden />
      {overdue && 'Overdue · '}
      <time dateTime={dueDate}>{formatIsoDate(dueDate)}</time>
    </span>
  )
}
