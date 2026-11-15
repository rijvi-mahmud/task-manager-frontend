import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/httpClient'
import { makeTask, makeMember } from '../../../test/fixtures'
import { TaskForm } from './TaskForm'

const members = [
  makeMember({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' }),
  makeMember({ id: 2, name: 'Alan Turing', email: 'alan@example.com' }),
]

function renderForm(props: Partial<Parameters<typeof TaskForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<TaskForm members={members} submitLabel="Save" onSubmit={onSubmit} onCancel={vi.fn()} {...props} />)
  return { onSubmit: (props.onSubmit as typeof onSubmit) ?? onSubmit, user: userEvent.setup() }
}

describe('TaskForm', () => {
  it('shows a validation error and does not submit an empty title', async () => {
    const { onSubmit, user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the parsed payload, including assignee and priority', async () => {
    const { onSubmit, user } = renderForm()

    await user.type(screen.getByLabelText('Title'), '  Write tests ')
    await user.selectOptions(screen.getByLabelText('Priority'), 'HIGH')
    await user.selectOptions(screen.getByLabelText('Assignee'), 'Alan Turing')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Write tests',
      description: null,
      status: 'TODO',
      priority: 'HIGH',
      dueDate: null,
      assigneeId: 2,
    })
  })

  it('prefills fields when editing', () => {
    renderForm({ task: makeTask({ title: 'Existing', assigneeId: 1, priority: 'LOW' }) })

    expect(screen.getByLabelText('Title')).toHaveValue('Existing')
    expect(screen.getByLabelText('Priority')).toHaveValue('LOW')
    expect(screen.getByLabelText('Assignee')).toHaveValue('1')
  })

  it('shows backend field errors on the matching input', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(400, 'Validation failed', { title: 'Title taken' }))
    const { user } = renderForm({ onSubmit })

    await user.type(screen.getByLabelText('Title'), 'Dup')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Title taken')).toBeInTheDocument()
  })

  it('on a 409, offers to load the latest version', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, 'Task was modified by someone else.'))
    const onLoadLatest = vi.fn().mockResolvedValue(undefined)
    const { user } = renderForm({ onSubmit, onLoadLatest, task: makeTask({ title: 'Mine' }) })

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(await screen.findByRole('button', { name: 'Load latest version' }))

    expect(onLoadLatest).toHaveBeenCalledOnce()
  })

  it('does not offer to load the latest version for other errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(500, 'Boom'))
    const { user } = renderForm({ onSubmit, onLoadLatest: vi.fn(), task: makeTask({ title: 'Mine' }) })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Boom')
    expect(screen.queryByRole('button', { name: 'Load latest version' })).not.toBeInTheDocument()
  })

  it('shows non-field errors at form level', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, 'Task was modified by someone else.'))
    const { user } = renderForm({ onSubmit })

    await user.type(screen.getByLabelText('Title'), 'Edit')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Task was modified by someone else.')
  })
  it('shows a failed conflict reload and lets the user retry', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, 'Conflict'))
    const onLoadLatest = vi.fn().mockRejectedValueOnce(new ApiError(0, 'Offline')).mockResolvedValueOnce(undefined)
    const { user } = renderForm({ onSubmit, onLoadLatest, task: makeTask() })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(await screen.findByRole('button', { name: 'Load latest version' }))
    expect(await screen.findByText('Offline')).toHaveAttribute('role', 'alert')
    await user.click(screen.getByRole('button', { name: 'Load latest version' }))
    expect(onLoadLatest).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Offline')).not.toBeInTheDocument()
  })

})

it('describes and focuses server-rejected select fields', async () => {
  const onSubmit = vi.fn().mockRejectedValue(new ApiError(400, 'Validation failed', {
    status: 'Status is unavailable', priority: 'Priority is unavailable', assigneeId: 'Member no longer exists',
  }))
  const { user } = renderForm({ onSubmit, task: makeTask() })
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(await screen.findByText('Status is unavailable')).toBeInTheDocument()
  for (const [label, message] of [['Status', 'Status is unavailable'], ['Priority', 'Priority is unavailable'], ['Assignee', 'Member no longer exists']]) {
    const select = screen.getByRole('combobox', { name: label })
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription(message)
  }
  expect(screen.getByRole('combobox', { name: 'Status' })).toHaveFocus()
})
