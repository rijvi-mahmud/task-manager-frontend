import { useNavigate } from '@tanstack/react-router'
import { Select } from '../../../components/ui/Select'
import type { Workspace } from '../workspaceSchemas'

const NEW = 'new'

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  currentId: number | null
  onCreate: () => void
}

/** Native select: keyboard and screen-reader friendly without a custom listbox. */
export function WorkspaceSwitcher({ workspaces, currentId, onCreate }: WorkspaceSwitcherProps) {
  const navigate = useNavigate()
  const options = [
    ...(currentId === null ? [{ value: '', label: 'Choose a workspace' }] : []),
    ...workspaces.map(workspace => ({ value: String(workspace.id), label: workspace.name })),
    { value: NEW, label: '+ New workspace…' },
  ]
  return (
    <label className="flex min-w-0 items-center gap-2 text-sm">
      <span className="sr-only">Workspace</span>
      <Select
        className="min-h-9 max-w-56 py-1.5"
        value={currentId === null ? '' : String(currentId)}
        options={options}
        onChange={(event) => {
          const value = event.target.value
          if (value === NEW) onCreate()
          else if (value) void navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: Number(value) } })
        }}
      />
    </label>
  )
}
