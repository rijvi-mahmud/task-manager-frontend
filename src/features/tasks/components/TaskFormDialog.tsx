import { useMountedRef } from '../../../hooks/useMountedRef'
import { Dialog } from '../../../components/ui/Dialog'
import type { Member } from '../../members/memberSchemas'
import type { Task, TaskInput, TaskStatus } from '../taskSchemas'
import { TaskForm } from './TaskForm'

export type TaskFormMode = { kind: 'create'; status?: TaskStatus } | { kind: 'edit'; task: Task }

interface TaskFormDialogProps {
  mode: TaskFormMode | null
  members: Member[]
  onCreate: (input: TaskInput) => Promise<void>
  onUpdate: (task: Task, input: TaskInput) => Promise<void>
  /** Reloads the task being edited after a conflict; the dialog then shows the fresh copy. */
  onLoadLatest: (task: Task) => Promise<void>
  onClose: () => void
}

/** An open session owns its form and asynchronous completion callbacks. */
export function TaskFormDialog(props: TaskFormDialogProps) {
  const mode = props.mode
  const title = mode?.kind === 'edit' ? 'Edit task' : 'New task'
  return (
    <Dialog open={mode !== null} title={title} onClose={props.onClose}>
      {mode && (
        <FormSession
          key={mode.kind === 'edit' ? `${mode.task.id}-${mode.task.version}` : `new-${mode.status ?? 'TODO'}`}
          {...props}
          mode={mode}
        />
      )}
    </Dialog>
  )
}

function FormSession({ mode, members, onCreate, onUpdate, onLoadLatest, onClose }: TaskFormDialogProps & { mode: TaskFormMode }) {
  const mountedRef = useMountedRef()
  const editing = mode.kind === 'edit' ? mode.task : undefined

  async function submit(input: TaskInput) {
    if (editing) await onUpdate(editing, input)
    else await onCreate(input)
    if (mountedRef.current) onClose()
  }

  return (
    <TaskForm
      task={editing}
      defaultStatus={mode.kind === 'create' ? mode.status : undefined}
      members={members}
      submitLabel={editing ? 'Save changes' : 'Create task'}
      onSubmit={submit}
      onCancel={onClose}
      onLoadLatest={editing ? () => onLoadLatest(editing) : undefined}
    />
  )
}
