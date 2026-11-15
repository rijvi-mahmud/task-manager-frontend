import { Badge } from '../../../components/ui/Badge'
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_TONES } from '../constants'
import type { TaskPriority } from '../taskSchemas'

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge tone={TASK_PRIORITY_TONES[priority]}>{TASK_PRIORITY_LABELS[priority]}</Badge>
}
