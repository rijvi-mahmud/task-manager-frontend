interface WorkspaceState {
  hasError: boolean
  isUpdating: boolean
  isLoading: boolean
  isFetching: boolean
}

export function getWorkspaceStatus(state: WorkspaceState) {
  if (state.hasError) return { text: 'Attention needed', dotClassName: 'bg-danger' }
  if (state.isUpdating) return { text: 'Saving changes…', dotClassName: 'bg-warning' }
  if (state.isLoading) return { text: 'Loading tasks…', dotClassName: 'bg-muted' }
  if (state.isFetching) return { text: 'Refreshing workspace…', dotClassName: 'bg-muted' }
  return { text: 'Updates automatically', dotClassName: 'bg-success' }
}
