import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { TaskFormDialog } from '../features/tasks/components/TaskFormDialog'
import { formatIsoDate } from '../utils/date'

afterEach(() => vi.useRealTimers())
it('does not let an old save close a newly opened form', async () => {
  let release!: () => void
  const onCreate = vi.fn(() => new Promise<void>(resolve => { release = resolve }))
  const onClose = vi.fn()
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
  const props = { members: [], onCreate, onClose, onUpdate: vi.fn(), onLoadLatest: vi.fn() }
  const { rerender } = render(<TaskFormDialog {...props} mode={{kind:'create'}} />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Title'), 'first')
  await user.click(screen.getByRole('button', {name:'Create task'}))
  rerender(<TaskFormDialog {...props} mode={null} />)
  rerender(<TaskFormDialog {...props} mode={{kind:'create'}} />)
  await user.type(screen.getByLabelText('Title'), 'unsaved second form')
  onClose.mockClear()
  await act(async () => release())
  expect(onClose).not.toHaveBeenCalled()
})
it('preserves the year for dates before 0100', () => {
  expect(formatIsoDate('0099-01-01')).not.toContain('1999')
  expect(formatIsoDate('0099-01-01')).toContain('99')
})
