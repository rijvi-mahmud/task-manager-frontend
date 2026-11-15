import { useQueryStates } from 'nuqs'
import { taskFilterParsers } from '../taskFilterParsers'

/** nuqs owns URL state, history synchronization and atomic filter updates. */
export function useTaskFilters() {
  return useQueryStates(taskFilterParsers, { urlKeys: { search: 'q' } })
}
