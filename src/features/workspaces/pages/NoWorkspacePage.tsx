import { useNavigate } from '@tanstack/react-router'
import { WorkspaceNameForm } from '../components/WorkspaceNameForm'
import { useWorkspaceActions } from '../hooks/useWorkspaces'

/** Shown when the user belongs to no workspace (they left or deleted them all). */
export function NoWorkspacePage() {
  const navigate = useNavigate()
  const { createWorkspace } = useWorkspaceActions()
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Create a workspace</h1>
      <p className="text-sm text-muted">
        A workspace is a shared task board. Create one, then add teammates by email. If someone invites you, their workspace shows up here.
      </p>
      <div className="rounded-xl border border-line bg-surface p-5">
        <WorkspaceNameForm submitLabel="Create workspace" onSubmit={async (input) => {
          const workspace = await createWorkspace(input)
          await navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: workspace.id } })
        }} />
      </div>
    </main>
  )
}
