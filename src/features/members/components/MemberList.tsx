import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { errorMessage } from '../../../api/httpClient'
import type { Member } from '../memberSchemas'

interface MemberListProps {
  members: Member[]
  /** Whether the current user may remove other members (owners only). */
  canManage: boolean
  currentUserId: number
  onDelete: (member: Member) => Promise<void>
}

/** Lists members with an inline two-step remove (no nested modal). */
export function MemberList({ members, canManage, currentUserId, onDelete }: MemberListProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasConfirmingMember = members.some(member => member.id === confirmingId)

  useEffect(() => {
    if (confirmingId === null || !hasConfirmingMember) return
    const container = containerRef.current
    cancelRef.current?.focus()
    return () => {
      const trigger = container?.querySelector<HTMLButtonElement>(`[data-member-id="${confirmingId}"]`)
      const focusTarget = trigger ?? container
      focusTarget?.focus()
    }
  }, [confirmingId, hasConfirmingMember])

  async function remove(member: Member) {
    if (removingId !== null) return
    setRemovingId(member.id)
    try {
      await onDelete(member)
      setError(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setConfirmingId(null)
      setRemovingId(null)
    }
  }

  return (
    <div ref={containerRef} role="region" aria-label="Member list" tabIndex={-1} className="flex flex-col gap-2">
      <p role="status" className="sr-only">{removingId !== null ? 'Removing member…' : ''}</p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {members.length === 0 ? <EmptyState>No members yet.</EmptyState> : <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 px-3 py-2">
            <Avatar decorative name={member.name} seed={member.id} size="md" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                {member.name}{member.id === currentUserId && <span className="text-xs font-normal text-muted">(you)</span>}
              </p>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>
            <span className="flex shrink-0 gap-1">
              {member.pending && <Badge tone="warning">Invited</Badge>}
              {member.role === 'OWNER' && <Badge>Owner</Badge>}
            </span>
            {!canManage || member.id === currentUserId ? null : confirmingId === member.id ? (
              <div role="group" aria-label={`Confirm removing ${member.name}`} className="flex items-center gap-1">
                <Button ref={cancelRef} size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="danger" disabled={removingId !== null} onClick={() => void remove(member)}>
                  {removingId === member.id ? 'Removing…' : 'Remove'}
                </Button>
              </div>
            ) : (
              <Button data-member-id={member.id} disabled={removingId !== null} variant="ghost" size="icon" onClick={() => setConfirmingId(member.id)} aria-label={`Remove ${member.name}`}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </li>
        ))}
      </ul>}
      {canManage && <p className="text-xs text-muted">Removing a member unassigns their tasks in this workspace.</p>}
    </div>
  )
}
