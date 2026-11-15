import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import type { Member, MemberInput } from '../memberSchemas'
import { MemberForm } from './MemberForm'
import { MemberList } from './MemberList'

interface MembersDialogProps {
  open: boolean
  members: Member[]
  isLoading: boolean
  loadError: string | null
  onRetryLoad: () => void
  /** Owners add and remove members; everyone else sees the list read-only. */
  canManage: boolean
  currentUserId: number
  successMessage?: string | null
  onCreate: (input: MemberInput) => Promise<void>
  onDelete: (member: Member) => Promise<void>
  onClose: () => void
}

export function MembersDialog({
  open, members, isLoading, loadError, onRetryLoad, canManage, currentUserId, successMessage, onCreate, onDelete, onClose,
}: MembersDialogProps) {
  return (
    <Dialog open={open} title="Workspace members" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {successMessage && <Alert tone="success">{successMessage}</Alert>}
        {loadError ? (
          <Alert action={<Button size="sm" variant="ghost" onClick={onRetryLoad}>Retry</Button>}>{loadError}</Alert>
        ) : isLoading ? (
          <p role="status" className="text-sm text-muted">Loading members…</p>
        ) : (
          <MemberList members={members} canManage={canManage} currentUserId={currentUserId} onDelete={onDelete} />
        )}
        {canManage ? (
          <div className="border-t border-line pt-4">
            <MemberForm onSubmit={onCreate} />
          </div>
        ) : (
          <p className="text-xs text-muted">Only workspace owners can add or remove members.</p>
        )}
      </div>
    </Dialog>
  )
}
