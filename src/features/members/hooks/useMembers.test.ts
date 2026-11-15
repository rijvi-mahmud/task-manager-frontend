import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { queryWrapper } from '../../../test/queryWrapper'
import { ApiError } from '../../../api/httpClient'
import { memberApi } from '../api/memberApi'
import { useMembers } from './useMembers'
import { WORKSPACE_ID, makeMember } from '../../../test/fixtures'

vi.mock('../api/memberApi', () => ({ memberApi: { list: vi.fn(), remove: vi.fn() } }))

const ada = makeMember({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' })

async function renderLoaded() {
  vi.mocked(memberApi.list).mockResolvedValue([ada])
  const hook = renderHook(() => useMembers(WORKSPACE_ID), queryWrapper())
  await waitFor(() => expect(hook.result.current.members).toHaveLength(1))
  return hook
}

describe('useMembers', () => {
  it('treats removing an already-removed member as success', async () => {
    const { result } = await renderLoaded()
    vi.mocked(memberApi.remove).mockRejectedValue(new ApiError(404, 'Member with id 1 not found'))

    vi.mocked(memberApi.list).mockResolvedValue([])
    await act(() => result.current.deleteMember(ada))

    await waitFor(() => expect(result.current.members).toEqual([]))
    expect(result.current.successMessage).toBe('Member removed.')
  })

  it('rethrows other failures and keeps the member', async () => {
    const { result } = await renderLoaded()
    vi.mocked(memberApi.remove).mockRejectedValue(new ApiError(500, 'Boom'))

    await expect(act(() => result.current.deleteMember(ada))).rejects.toThrow('Boom')
    expect(result.current.members).toEqual([ada])
  })
})
