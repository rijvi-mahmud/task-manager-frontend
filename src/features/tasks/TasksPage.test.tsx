import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { queryWrapper } from '../../test/queryWrapper'
import { ApiError } from '../../api/httpClient'
import { currentUser, makePage, makeTask, makeWorkspace, makeMember } from '../../test/fixtures'
import { memberApi } from '../members/api/memberApi'
import { taskApi } from './api/taskApi'
import { TasksPage } from './TasksPage'

vi.mock('./api/taskApi', () => ({ taskApi: { list: vi.fn(), stats: vi.fn() } }))
vi.mock('../members/api/memberApi', () => ({ memberApi: { list: vi.fn() } }))

const pageProps = { workspace: makeWorkspace(), currentUser, onWorkspaceGone: vi.fn() }
const emptyStats = { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 }

describe('TasksPage', () => {
  it('tells the user when team members fail to load, and retries', async () => {
    vi.mocked(taskApi.list).mockResolvedValue(makePage([]))
    vi.mocked(taskApi.stats).mockResolvedValue({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 })
    vi.mocked(memberApi.list)
      .mockRejectedValueOnce(new ApiError(503, 'Service unavailable'))
      .mockResolvedValueOnce([makeMember({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' })])

    render(<TasksPage {...pageProps} />, queryWrapper())

    expect(await screen.findByText(/Couldn't load workspace members/)).toHaveTextContent('Service unavailable')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.queryByText(/Couldn't load workspace members/)).not.toBeInTheDocument()
    expect(memberApi.list).toHaveBeenCalledTimes(2)
  })
  it('opens quick-add in the selected column with its status selected', async () => {
    vi.mocked(taskApi.list).mockResolvedValue(makePage([]))
    vi.mocked(taskApi.stats).mockResolvedValue({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 })
    vi.mocked(memberApi.list).mockResolvedValue([])
    render(<TasksPage {...pageProps} />, queryWrapper())
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Add task to Done' }))
    expect(screen.getByLabelText('Status')).toHaveValue('DONE')
    expect(screen.getByRole('heading', { name: 'New task' })).toBeInTheDocument()
  })

})

it('shows an accessible invalid-date message without fetching task columns', async () => {
  vi.mocked(taskApi.list).mockClear()
  vi.mocked(taskApi.stats).mockResolvedValue({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 })
  vi.mocked(memberApi.list).mockResolvedValue([])
  render(<TasksPage {...pageProps} />, queryWrapper(undefined, '?dueFrom=2026-03-02&dueTo=2026-03-01'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Due from must be on or before due to.')
  expect(screen.getByLabelText('Due from')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByLabelText('Due to')).toHaveAccessibleDescription(/Due from must be on or before due to/)
  expect(screen.getByText('Choose a valid due-date range to load tasks.')).toBeInTheDocument()
  expect(taskApi.list).not.toHaveBeenCalled()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(screen.getByLabelText('Due from')).toHaveValue('')
  expect(screen.getByLabelText('Due to')).toHaveValue('')
  expect(await screen.findByRole('button', { name: 'Add task to Done' })).toBeInTheDocument()
  expect(taskApi.list).toHaveBeenCalledTimes(3)
})

it('removes one active filter at a time and can reset an empty filtered view', async () => {
  vi.mocked(taskApi.list).mockResolvedValue(makePage([]))
  vi.mocked(taskApi.stats).mockResolvedValue({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 })
  vi.mocked(memberApi.list).mockResolvedValue([])
  render(<TasksPage {...pageProps} />, queryWrapper(undefined, '?q=release&priority=HIGH&dueFrom=2026-01-01&dueTo=2026-01-31'))
  const user = userEvent.setup()
  expect(await screen.findByRole('heading', { name: 'No tasks match these filters' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Remove Priority: High filter' }))
  expect(screen.getByRole('combobox', { name: 'Filter by priority' })).toHaveValue('ALL')
  expect(screen.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('release')
  expect(screen.getByLabelText('Due from')).toHaveValue('2026-01-01')
  await waitFor(() => expect(vi.mocked(taskApi.list).mock.calls.some(([, request]) =>
    request.q === 'release' && !request.priority && request.dueFrom === '2026-01-01')).toBe(true))
  await user.click(screen.getByRole('button', { name: /^Remove Due:/ }))
  expect(screen.getByLabelText('Due from')).toHaveValue('')
  expect(screen.getByLabelText('Due to')).toHaveValue('')
  expect(screen.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('release')
  await user.click(await screen.findByRole('button', { name: 'Reset filters' }))
  expect(screen.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add task to Done' })).toBeInTheDocument())
})

it('lets the user retry member loading from inside the members dialog', async () => {
  vi.mocked(taskApi.list).mockResolvedValue(makePage([]))
  vi.mocked(taskApi.stats).mockResolvedValue({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 })
  vi.mocked(memberApi.list).mockRejectedValueOnce(new ApiError(503, 'Offline'))
    .mockResolvedValueOnce([makeMember({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' })])
  render(<TasksPage {...pageProps} />, queryWrapper())
  await screen.findByText(/Couldn't load workspace members/)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /^Members/ }))
  const dialog = screen.getByRole('dialog', { name: 'Workspace members' })
  expect(within(dialog).getByText('Offline')).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: 'Retry' }))
  expect(await within(dialog).findByText('Ada Lovelace')).toBeInTheDocument()
  expect(within(dialog).queryByText('Offline')).not.toBeInTheDocument()
})

describe('permissions', () => {
  function renderBoard(role: 'OWNER' | 'MEMBER') {
    const mine = makeTask({ id: 1, title: 'Mine', createdById: currentUser.id })
    const theirs = makeTask({ id: 2, title: 'Theirs', createdById: 2 })
    vi.mocked(taskApi.list).mockImplementation(async (_workspaceId, { status }) => makePage(status === 'TODO' ? [mine, theirs] : []))
    vi.mocked(taskApi.stats).mockResolvedValue(emptyStats)
    vi.mocked(memberApi.list).mockResolvedValue([
      makeMember({ id: 1, role }),
      makeMember({ id: 2, name: 'Grace Hopper', email: 'grace@example.com', role: role === 'OWNER' ? 'MEMBER' : 'OWNER' }),
    ])
    render(<TasksPage {...pageProps} workspace={makeWorkspace({ role })} />, queryWrapper())
  }

  it('lets a member delete only the tasks they created', async () => {
    renderBoard('MEMBER')
    expect(await screen.findByRole('button', { name: 'Delete Mine' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Theirs' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete Theirs' })).not.toBeInTheDocument()
  })

  it('lets an owner delete any task', async () => {
    renderBoard('OWNER')
    expect(await screen.findByRole('button', { name: 'Delete Theirs' })).toBeInTheDocument()
  })

  it('shows members read-only to a non-owner', async () => {
    renderBoard('MEMBER')
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Members/ }))
    const dialog = screen.getByRole('dialog', { name: 'Workspace members' })
    expect(await within(dialog).findByText('Grace Hopper')).toBeInTheDocument()
    expect(within(dialog).queryByRole('form', { name: 'Add member' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument()
    expect(within(dialog).getByText('Only workspace owners can add or remove members.')).toBeInTheDocument()
  })
})
