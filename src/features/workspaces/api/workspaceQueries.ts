import { queryOptions } from '@tanstack/react-query'
import { workspaceApi } from './workspaceApi'

export const workspaceQueryKeys = { all: ['workspaces'] as const }

export const workspacesQueryOptions = queryOptions({
  queryKey: workspaceQueryKeys.all,
  queryFn: ({ signal }) => workspaceApi.list(signal),
})
