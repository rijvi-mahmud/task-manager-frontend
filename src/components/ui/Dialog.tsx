import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  title: string
  descriptionId?: string
  onClose: () => void
  children: ReactNode
}

/**
 * Modal built on native <dialog>: focus trapping, Escape and top-layer
 * stacking come from the browser. Children mount only while open, so
 * forms inside start fresh each time.
 */
export function Dialog({ open, title, descriptionId, onClose, children }: DialogProps) {
  const titleId = useId()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={() => {
        if (ref.current?.open) return
        onClose()
        if (document.activeElement === document.body) document.querySelector<HTMLElement>('main')?.focus()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={open ? titleId : undefined}
      aria-describedby={open ? descriptionId : undefined}
      className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-black/35"
    >
      {open && (
        <div>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-6">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </Button>
          </div>
          <div className="p-5 sm:p-6">{children}</div>
        </div>
      )}
    </dialog>
  )
}
