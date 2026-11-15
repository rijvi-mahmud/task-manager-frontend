import { useEffect } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useCurrentUser } from '../../auth/hooks/useCurrentUser'
import { TasksPage } from '../../tasks/TasksPage'
import { NotFoundPage } from '../../../app/NotFoundPage'
import { rememberWorkspace } from '../lastWorkspace'
import { useWorkspaces } from '../hooks/useWorkspaces'

const route = getRouteApi('/app/workspaces/$workspaceId')

export function WorkspacePage() {
  const { workspaceId } = route.useParams()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { workspaces } = useWorkspaces()
  const workspace = workspaces.find(candidate => candidate.id === workspaceId)

  useEffect(() => {
    if (workspace) rememberWorkspace(workspace.id)
  }, [workspace])

  // Not a member (or it was deleted): the API would answer 404 for everything.
  if (!workspace) return <NotFoundPage />
  // Keyed so dialogs and local state never carry over to another workspace.
  return <TasksPage key={workspace.id} workspace={workspace} currentUser={user} onWorkspaceGone={() => void navigate({ to: '/' })} />
}
