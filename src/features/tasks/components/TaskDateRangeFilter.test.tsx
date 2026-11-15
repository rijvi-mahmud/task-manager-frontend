import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { TaskDateRangeFilter } from './TaskDateRangeFilter'

it('labels date inputs, constrains calendar bounds and emits date strings', () => {
  const onChange = vi.fn()
  render(<TaskDateRangeFilter dueFrom="2026-01-01" dueTo="2026-01-31" onChange={onChange} />)
  expect(screen.getByRole('group', { name: 'Due date range' })).toBeInTheDocument()
  const from = screen.getByLabelText('Due from')
  const to = screen.getByLabelText('Due to')
  expect(from).toHaveAttribute('max', '2026-01-31')
  expect(to).toHaveAttribute('min', '2026-01-01')
  expect(from).toHaveAccessibleDescription(/Includes both dates/)
  fireEvent.change(from, { target: { value: '2026-01-02' } })
  expect(onChange).toHaveBeenCalledWith({ dueFrom: '2026-01-02' })
  fireEvent.change(to, { target: { value: '' } })
  expect(onChange).toHaveBeenCalledWith({ dueTo: '' })
})
