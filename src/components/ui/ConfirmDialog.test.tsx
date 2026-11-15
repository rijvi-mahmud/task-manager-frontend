import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

it('names and describes the dialog and initially focuses the safe action', () => {
  render(<ConfirmDialog open title="Delete task" message="This cannot be undone." onConfirm={vi.fn()} onClose={vi.fn()} />)
  const dialog = screen.getByRole('dialog', { name: 'Delete task' })
  expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
})

it('announces a failed action and keeps the confirmation open for retry', async () => {
  const onClose = vi.fn()
  render(<ConfirmDialog open title="Delete task" message="Delete it?" onConfirm={vi.fn().mockRejectedValue(new Error('Offline. Try again.'))} onClose={onClose} />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Confirm' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Offline. Try again.')
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled()
})

it('does not let an old confirmation close a newly opened dialog', async () => {
  let finish!: () => void
  const onConfirm = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
  const onClose = vi.fn()
  const props = { title: 'Delete task', message: 'Delete it?', onConfirm, onClose }
  const { rerender } = render(<ConfirmDialog {...props} open />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce())
  rerender(<ConfirmDialog {...props} open={false} />)
  rerender(<ConfirmDialog {...props} open />)
  onClose.mockClear()
  await act(async () => { finish() })
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled()
})
