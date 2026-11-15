import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

afterEach(() => vi.restoreAllMocks())
function Workspace({ fail }: { fail: boolean }) {
  if (fail) throw new Error('Internal details must not appear in recovery UI')
  return <main tabIndex={-1}><h1>Recovered workspace</h1></main>
}

it('catches a rendering failure, focuses a recovery heading and hides internal error details', () => {
  const report = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<AppErrorBoundary><Workspace fail /></AppErrorBoundary>)
  expect(screen.getByRole('heading', { name: 'The workspace couldn’t be displayed' })).toHaveFocus()
  expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
  expect(screen.queryByText('Internal details must not appear in recovery UI')).not.toBeInTheDocument()
  expect(report).toHaveBeenCalled()
})

it('recovers after the problem is resolved and gives focus to the workspace', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const { rerender } = render(<AppErrorBoundary><Workspace fail /></AppErrorBoundary>)
  rerender(<AppErrorBoundary><Workspace fail={false} /></AppErrorBoundary>)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))
  expect(screen.getByRole('heading', { name: 'Recovered workspace' })).toBeInTheDocument()
  expect(screen.getByRole('main')).toHaveFocus()
})
