import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Alert, type AlertTone } from './Alert'

it.each<{ tone: AlertTone; role: 'alert' | 'status' }>([
  { tone: 'error', role: 'alert' },
  { tone: 'warning', role: 'status' },
  { tone: 'success', role: 'status' },
  { tone: 'info', role: 'status' },
])('$tone feedback uses the appropriate live-region urgency', ({ tone, role }) => {
  render(<Alert tone={tone}>Feedback message</Alert>)
  expect(screen.getByRole(role)).toHaveTextContent('Feedback message')
  expect(screen.getByRole(role)).toHaveAttribute('aria-atomic', 'true')
})
