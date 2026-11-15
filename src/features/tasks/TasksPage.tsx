import { useState } from 'react'
import { CalendarX2, Plus, RefreshCw, SearchX, Settings, Users } from 'lucide-react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { MembersDialog } from '../members/components/MembersDialog'
import { useMembers } from '../members/hooks/useMembers'
import type { Member } from '../members/memberSchemas'
import type { CurrentUser } from '../auth/authSchemas'
import { WorkspaceSettingsDialog } from '../workspaces/components/WorkspaceSettingsDialog'
import { useWorkspaceActions } from '../workspaces/hooks/useWorkspaces'
import type { Workspace } from '../workspaces/workspaceSchemas'
import { TaskBoardSkeleton } from './components/TaskBoardSkeleton'
import { TaskBoard } from './components/TaskBoard'
import { TaskFilters } from './components/TaskFilters'
import { TaskFormDialog, type TaskFormMode } from './components/TaskFormDialog'
import { TaskStatsCards } from './components/TaskStatsCards'
import { TASK_SEARCH_DEBOUNCE_MS } from './constants'
import { useTaskBoard } from './hooks/useTaskBoard'
import { useTaskFilters } from './hooks/useTaskFilters'
import { useTaskStats } from './hooks/useTaskStats'
import type { Task } from './taskSchemas'
import { getTaskDateRangeError, hasActiveTaskFilters, toTaskListParams } from './utils/taskFilters'
import { getWorkspaceStatus } from './utils/taskMessages'

interface TasksPageProps {
  workspace: Workspace
  currentUser: CurrentUser
  /** Called after the user deleted or left this workspace. */
  onWorkspaceGone: () => void
}

/** One workspace's board. Composes server hooks and URL filters; only dialog state lives on the page. */
export function TasksPage({ workspace, currentUser, onWorkspaceGone }: TasksPageProps) {
  const workspaceId = workspace.id
  const isOwner = workspace.role === 'OWNER'
  const [filter, setFilter] = useTaskFilters()
  const search = useDebouncedValue(filter.search, TASK_SEARCH_DEBOUNCE_MS)
  const params = toTaskListParams({ ...filter, search })
  const dateRangeError = getTaskDateRangeError(filter)
  const { stats, error: statsError, reload: reloadStats } = useTaskStats(workspaceId)
  const board = useTaskBoard(workspaceId, params)
  const {
    members, isLoading: isMembersLoading, error: membersError,
    successMessage: memberSuccessMessage, dismissMessage: dismissMemberMessage,
    reload: reloadMembers, createMember, deleteMember,
  } = useMembers(workspaceId)
  const { renameWorkspace, deleteWorkspace, leaveWorkspace } = useWorkspaceActions()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [formMode, setFormMode] = useState<TaskFormMode | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const hasFilters = hasActiveTaskFilters(filter)
  const taskCount = Object.values(board.columns).reduce((total, column) => total + column.total, 0)
  const isEmptyFilteredBoard = hasFilters && !dateRangeError && !board.isLoading && !board.error && taskCount === 0
  const workspaceStatus = getWorkspaceStatus({
    hasError: Boolean(dateRangeError || board.error || membersError || statsError),
    isUpdating: board.isUpdating,
    isLoading: board.isLoading,
    isFetching: board.isFetching,
  })

  function resetFilters() {
    void setFilter(null)
  }
  function openMembersDialog() {
    dismissMemberMessage()
    setIsMembersDialogOpen(true)
  }
  async function handleDeleteMember(member: Member) {
    await deleteMember(member)
    await setFilter(current => current.assignee === `${member.id}` ? { assignee: 'ALL' } : {})
  }
  /** Mirrors the server rule: a task's creator or a workspace owner may delete it. */
  function canDelete(task: Task) {
    return isOwner || task.createdById === currentUser.id
  }
  async function leaveTo(action: () => Promise<void>) {
    await action()
    onWorkspaceGone()
  }
  async function handleLoadLatest(task: Task) {
    const latest = await board.fetchLatest(task.id)
    setFormMode(mode => mode?.kind === 'edit' && mode.task === task ? { kind: 'edit', task: latest } : mode)
  }

  return (
<>
      <main id="main" tabIndex={-1} aria-labelledby="workspace-title" className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 id="workspace-title" className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">{workspace.name}</h1>
            <p className="mt-1.5 text-sm text-muted">
              {isOwner ? 'You own this workspace.' : 'You are a member of this workspace.'} Everyone here sees and edits the same board.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button variant="secondary" aria-haspopup="dialog" onClick={openMembersDialog}>
              <Users className="size-4" aria-hidden /> Members
              <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-xs tabular-nums">{isMembersLoading ? '—' : members.length}</span>
            </Button>
            <Button variant="secondary" aria-haspopup="dialog" aria-label="Workspace settings" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="size-4" aria-hidden />
            </Button>
            <Button
              aria-label="Refresh board"
              disabled={Boolean(dateRangeError) || board.isFetching || board.isLoading || board.isUpdating}
              onClick={() => void board.refresh()}
            >
              <RefreshCw className={`size-4 ${board.isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden /> Refresh
            </Button>
            <Button variant="primary" aria-haspopup="dialog" className="flex-1 sm:flex-none" onClick={() => setFormMode({ kind: 'create' })}>
              <Plus className="size-4" aria-hidden /> New task
            </Button>
          </div>
        </header>

        <TaskStatsCards stats={stats} />
        <TaskFilters
          filter={filter}
          members={members}
          isFiltered={hasFilters}
          onChange={patch => { void setFilter(patch) }}
          onReset={resetFilters}
        />

        {board.error && (
          <Alert action={
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => void board.refresh()}>Reload</Button>
              {board.canDismissError && <Button size="sm" variant="ghost" onClick={board.dismissMessage}>Dismiss</Button>}
            </div>
          }>
            {board.error}
          </Alert>
        )}
        {board.successMessage && (
          <Alert tone="success" action={<Button size="sm" variant="ghost" onClick={board.dismissMessage}>Dismiss</Button>}>
            {board.successMessage}
          </Alert>
        )}
        {statsError && (
          <Alert tone="warning" action={<Button size="sm" variant="ghost" onClick={() => void reloadStats()}>Retry counts</Button>}>
            Couldn’t refresh task counts. Try again.
          </Alert>
        )}
        {membersError && (
          <Alert tone="warning" action={<Button size="sm" variant="ghost" onClick={() => void reloadMembers()}>Retry</Button>}>
            Couldn't load workspace members. Check the connection before assigning tasks. {membersError}
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold">Board</h2>
            {!board.isLoading && !dateRangeError && (
              <span className="text-xs text-muted">{taskCount.toLocaleString()} {hasFilters ? 'matching ' : ''}{taskCount === 1 ? 'task' : 'tasks'}</span>
            )}
          </div>
          <span role="status" aria-atomic="true" className="inline-flex items-center gap-2 text-xs text-muted">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${workspaceStatus.dotClassName}`} />
            {workspaceStatus.text}
            {!board.isLoading && !dateRangeError && <span className="sr-only">. {taskCount} tasks in view.</span>}
          </span>
        </div>

        {dateRangeError ? (
          <EmptyState>
            <CalendarX2 className="mx-auto mb-3 size-6" aria-hidden />
            <p>Choose a valid due-date range to load tasks.</p>
          </EmptyState>
        ) : board.isLoading && !board.error ? (
          <TaskBoardSkeleton />
        ) : isEmptyFilteredBoard ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-5 py-12 text-center">
            <span className="rounded-full bg-surface-muted p-3"><SearchX className="size-5 text-muted" aria-hidden /></span>
            <h3 className="text-sm font-semibold">No tasks match these filters</h3>
            <p className="max-w-sm text-sm text-muted">Try a different search, change the due dates, or clear your filters to see all tasks.</p>
            <Button size="sm" onClick={resetFilters}>Reset filters</Button>
          </div>
        ) : (
          <TaskBoard
            columns={board.columns}
            loadingMoreStatus={board.loadingMoreStatus}
            onLoadMore={status => void board.loadMore(status)}
            onAdd={status => setFormMode({ kind: 'create', status })}
            onMove={(task, status) => void board.moveTask(task, status)}
            onEdit={task => setFormMode({ kind: 'edit', task })}
            onDelete={setPendingDelete}
            canDelete={canDelete}
          />
        )}

        <details className="text-xs text-muted">
          <summary className="w-fit cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Keyboard shortcuts</summary>
          <p className="mt-2 max-w-xl leading-5">Focus a task’s move handle, press Space to pick it up, use arrow keys to move, then press Space to drop. You can also choose Edit and change the status.</p>
        </details>
      </main>

      <TaskFormDialog
        mode={formMode}
        members={members}
        onCreate={board.createTask}
        onUpdate={board.updateTask}
        onLoadLatest={handleLoadLatest}
        onClose={() => setFormMode(null)}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete task"
        message={<>Delete <strong className="text-fg">{pendingDelete?.title}</strong>? This cannot be undone.</>}
        confirmLabel="Delete"
        onConfirm={() => pendingDelete ? board.deleteTask(pendingDelete) : undefined}
        onClose={() => setPendingDelete(null)}
      />
      <MembersDialog
        open={isMembersDialogOpen}
        members={members}
        isLoading={isMembersLoading}
        loadError={membersError}
        onRetryLoad={() => void reloadMembers()}
        canManage={isOwner}
        currentUserId={currentUser.id}
        successMessage={memberSuccessMessage}
        onCreate={createMember}
        onDelete={handleDeleteMember}
        onClose={() => setIsMembersDialogOpen(false)}
      />
      <WorkspaceSettingsDialog
        open={isSettingsOpen}
        workspace={workspace}
        onRename={input => renameWorkspace(workspaceId, input).then(() => undefined)}
        onDelete={() => leaveTo(() => deleteWorkspace(workspaceId))}
        onLeave={() => leaveTo(() => leaveWorkspace(workspaceId, currentUser.id))}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}
