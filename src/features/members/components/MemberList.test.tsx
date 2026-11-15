import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { MemberList } from './MemberList'
import { makeMember } from '../../../test/fixtures'

const ada = makeMember({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' })
it('focuses the safe inline confirmation action and restores the trigger on cancel', async () => {
  render(<MemberList members={[ada]} canManage currentUserId={99} onDelete={vi.fn()} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Remove Ada Lovelace' }))
  expect(screen.getByRole('group', { name: 'Confirm removing Ada Lovelace' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.getByRole('button', { name: 'Remove Ada Lovelace' })).toHaveFocus()
})

it('moves focus to the list region if a confirmed deletion removes the trigger', async () => {
  const onDelete = vi.fn().mockResolvedValue(undefined)
  const { rerender } = render(<MemberList members={[ada]} canManage currentUserId={99} onDelete={onDelete} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Remove Ada Lovelace' }))
  rerender(<MemberList members={[]} canManage currentUserId={99} onDelete={onDelete} />)
  expect(screen.getByRole('region', { name: 'Member list' })).toHaveFocus()
})
