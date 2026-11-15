import { CalendarClock, CheckCircle2, Layers3, Timer } from 'lucide-react'
import { cn } from '../../../utils/cn'
import type { TaskStats } from '../taskSchemas'

export function TaskStatsCards({ stats }: { stats: TaskStats | null }) {
  const completion = stats?.total ? Math.round(stats.done / stats.total * 100) : 0
  const items = [
    { label: 'Total tasks', value: stats?.total, caption: 'Across the workspace', icon: Layers3 },
    { label: 'In progress', value: stats?.inProgress, caption: 'Currently being worked on', icon: Timer },
    { label: 'Completed', value: stats?.done, caption: stats ? `${completion}% completion rate` : 'Calculating progress', icon: CheckCircle2 },
    { label: 'Overdue', value: stats?.overdue, caption: 'Past due and still open', icon: CalendarClock },
  ]
  return (
    <dl aria-label="Workspace task summary" aria-busy={stats === null} className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-4">
      {items.map(({ label, value, caption, icon: Icon }, index) => (
        <div
          key={label}
          className={cn('min-w-0 p-4 sm:px-5',
            index % 2 === 1 && 'border-l border-line',
            index > 1 && 'border-t border-line lg:border-t-0',
            index === 2 && 'lg:border-l lg:border-line',
          )}
        >
          <dt className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
            {label}<Icon className="size-4 shrink-0" aria-hidden />
          </dt>
          <dd className="mt-2">
            <span className="block text-2xl font-semibold tracking-tight tabular-nums">{value ?? '—'}</span>
            <span className="mt-1 block text-xs text-muted">{caption}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
