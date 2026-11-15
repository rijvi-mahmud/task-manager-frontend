import { useId, useState, type ReactNode } from 'react'
import { useMountedRef } from '../../hooks/useMountedRef'
import { errorMessage } from '../../api/httpClient'
import { Alert } from './Alert'
import { Button } from './Button'
import { Dialog } from './Dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

export function ConfirmDialog({ open, title, ...props }: ConfirmDialogProps) {
  const descriptionId = useId()
  return (
    <Dialog open={open} title={title} descriptionId={descriptionId} onClose={props.onClose}>
      {open && <ConfirmationSession {...props} descriptionId={descriptionId} />}
    </Dialog>
  )
}

function ConfirmationSession({ message, confirmLabel = 'Confirm', onConfirm, onClose, descriptionId }:
  Omit<ConfirmDialogProps, 'open' | 'title'> & { descriptionId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useMountedRef()

  async function handleConfirm() {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      if (mountedRef.current) onClose()
    } catch (error) {
      if (mountedRef.current) setError(errorMessage(error))
    } finally {
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  return (
    <>
      <p id={descriptionId} className="text-sm text-muted">{message}</p>
      <p role="status" className="sr-only">{isSubmitting ? 'Working…' : ''}</p>
      {error && <Alert>{error}</Alert>}
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose} autoFocus>Cancel</Button>
        <Button variant="danger" onClick={() => void handleConfirm()} disabled={isSubmitting}>
          {isSubmitting ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </>
  )
}
