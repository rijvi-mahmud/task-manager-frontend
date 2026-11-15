import { useState } from 'react'
import { Link, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { LayoutGrid, LogOut } from 'lucide-react'
import type { CurrentUser } from '../features/auth/authSchemas'
import { Alert } from '../components/ui/Alert'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { useAuthActions, useSession } from '../features/auth/hooks/useSession'
import { WorkspaceNameForm } from '../features/workspaces/components/WorkspaceNameForm'
import { WorkspaceSwitcher } from '../features/workspaces/components/WorkspaceSwitcher'
import { useWorkspaceActions, useWorkspaces } from '../features/workspaces/hooks/useWorkspaces'

/** Signed-in chrome: workspace switcher and account menu around the routed page. */
export function AppShell() {
  const { data: user } = useSession()
  return user ? <SignedInShell key={user.id} user={user} /> : null
}

/** Keyed by account: dialogs and route-local UI do not survive an identity change. */
function SignedInShell({ user }: { user: CurrentUser }) {
  const { workspaceId } = useParams({ strict: false })
  const { workspaces } = useWorkspaces()
  const { createWorkspace } = useWorkspaceActions()
  const { logout, isSigningOut, signOutError, dismissSignOutError } = useAuthActions()
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only rounded-lg bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">
        Skip to content
      </a>
      <header className="border-b border-line bg-surface">
        <nav aria-label="Main" className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
              <LayoutGrid className="size-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">Task Manager</span>
          </Link>
          <WorkspaceSwitcher workspaces={workspaces} currentId={workspaceId ?? null} onCreate={() => setIsCreating(true)} />
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <Avatar decorative name={user.displayName} seed={user.id} />
            <span className="hidden min-w-0 flex-col text-xs leading-4 md:flex">
              <span className="truncate font-medium">{user.displayName}</span>
              <span className="truncate text-muted">{user.email}</span>
            </span>
            <Button
              variant="ghost" size="sm" aria-label="Sign out" disabled={isSigningOut}
              onClick={async () => {
                try {
                  await logout()
                  await navigate({ to: '/login', search: {}, replace: true })
                } catch { /* The mutation error is displayed below; the session stays intact. */ }
              }}
            >
              <LogOut className="size-4" aria-hidden /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </nav>
      </header>

      {signOutError && (
        <div className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-8">
          <Alert action={<Button variant="ghost" size="sm" onClick={dismissSignOutError}>Dismiss</Button>}>
            Couldn’t sign out. Your session may still be active. Try again. {signOutError}
          </Alert>
        </div>
      )}
      <Outlet />

      <Dialog open={isCreating} title="New workspace" onClose={() => setIsCreating(false)}>
        <WorkspaceNameForm submitLabel="Create workspace" onSubmit={async (input) => {
          const workspace = await createWorkspace(input)
          setIsCreating(false)
          await navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: workspace.id } })
        }} />
      </Dialog>
    </div>
  )
}
