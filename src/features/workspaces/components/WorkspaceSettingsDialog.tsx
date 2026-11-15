import { useState } from 'react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { errorMessage } from '../../../api/httpClient'
import type { Workspace, WorkspaceInput } from '../workspaceSchemas'
import { WorkspaceNameForm } from './WorkspaceNameForm'

interface WorkspaceSettingsDialogProps {
  open: boolean
  workspace: Workspace
  onRename: (input: WorkspaceInput) => Promise<void>
  onDelete: () => Promise<void>
  onLeave: () => Promise<void>
  onClose: () => void
}

/** Owners rename or delete the workspace; members can leave it. */
export function WorkspaceSettingsDialog({ open, workspace, onRename, onDelete, onLeave, onClose }: WorkspaceSettingsDialogProps) {
  const isOwner = workspace.role === 'OWNER'
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try { await action() } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} title="Workspace settings" onClose={() => { setConfirming(false); setError(null); onClose() }}>
      <div className="flex flex-col gap-6">
        {isOwner && (
          <WorkspaceNameForm defaultName={workspace.name} submitLabel="Rename" onSubmit={async (input) => { await onRename(input); onClose() }} />
        )}
        <section aria-labelledby="danger-zone" className="flex flex-col gap-3 border-t border-line pt-4">
          <h3 id="danger-zone" className="text-sm font-semibold">{isOwner ? 'Delete workspace' : 'Leave workspace'}</h3>
          <p className="text-sm text-muted">
            {isOwner
              ? 'Deletes the workspace and all of its tasks for everyone. This cannot be undone.'
              : 'You will lose access to this board. An owner can add you again.'}
          </p>
          {error && <Alert>{error}</Alert>}
          {confirming ? (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={() => void run(isOwner ? onDelete : onLeave)}>
                {isOwner ? `Delete “${workspace.name}”` : 'Leave'}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" className="self-end" onClick={() => setConfirming(true)}>
              {isOwner ? 'Delete workspace…' : 'Leave workspace…'}
            </Button>
          )}
        </section>
      </div>
    </Dialog>
  )
}
