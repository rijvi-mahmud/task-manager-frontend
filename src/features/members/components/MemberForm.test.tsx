import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/httpClient'
import { MemberForm } from './MemberForm'

it('labels the email input and associates validation messages with it', async () => {
  render(<MemberForm onSubmit={vi.fn()} />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Add member' }))
  const email = screen.getByRole('textbox', { name: 'Email' })
  expect(email).toBeRequired()
  expect(email).toHaveAttribute('aria-invalid', 'true')
  expect(email).toHaveAccessibleDescription(/Email must be valid/)
  expect(email).toHaveFocus()
})

it('explains that unknown emails join when they register', () => {
  render(<MemberForm onSubmit={vi.fn()} />)
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(/join this workspace as soon as they register/)
})

it('trims the email, submits it, and clears the form', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<MemberForm onSubmit={onSubmit} />)
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: 'Email' }), '  grace@example.com ')
  await user.click(screen.getByRole('button', { name: 'Add member' }))
  expect(onSubmit).toHaveBeenCalledWith({ email: 'grace@example.com' })
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('')
})

it('shows a conflict from the server as a form error', async () => {
  const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, 'This person is already a member of the workspace'))
  render(<MemberForm onSubmit={onSubmit} />)
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com')
  await user.click(screen.getByRole('button', { name: 'Add member' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('This person is already a member of the workspace')
})
