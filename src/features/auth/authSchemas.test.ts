import { describe, expect, it } from 'vitest'
import { registerFormSchema, resetPasswordFormSchema, safeRedirect } from './authSchemas'

describe('safeRedirect', () => {
  it.each([
    ['/workspaces/3?q=x', '/workspaces/3?q=x'],
    [undefined, '/'],
    ['https://evil.example', '/'],
    ['//evil.example/path', '/'],
    ['javascript:alert(1)', '/'],
  ])('%s → %s', (target, expected) => {
    expect(safeRedirect(target)).toBe(expected)
  })
})

describe('password rules', () => {
  const base = { displayName: 'Ada', email: 'ada@example.com' }

  it('mirrors the backend 8-character minimum and 72-byte bcrypt maximum', () => {
    expect(registerFormSchema.safeParse({ ...base, password: 'short' }).success).toBe(false)
    expect(registerFormSchema.safeParse({ ...base, password: 'a'.repeat(72) }).success).toBe(true)
    expect(registerFormSchema.safeParse({ ...base, password: 'a'.repeat(73) }).success).toBe(false)
    // 25 three-byte characters = 75 bytes, though only 25 characters.
    expect(registerFormSchema.safeParse({ ...base, password: '€'.repeat(25) }).success).toBe(false)
    expect(registerFormSchema.safeParse({ ...base, password: '😀'.repeat(4) }).success).toBe(false)
    expect(registerFormSchema.safeParse({ ...base, password: '😀'.repeat(8) }).success).toBe(true)
    expect(registerFormSchema.safeParse({ ...base, password: ' '.repeat(8) }).success).toBe(false)
  })

  it('requires the confirmation to match', () => {
    const result = resetPasswordFormSchema.safeParse({ newPassword: 'correct horse', confirmPassword: 'correct horsE' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['confirmPassword'])
  })
})
