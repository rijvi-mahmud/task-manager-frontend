import { describe, expect, it, vi } from 'vitest'
import { ApiError, HttpClient } from '../../../api/httpClient'
import { AuthApi } from './authApi'

function apiWith(get: HttpClient['get']) {
  const client = new HttpClient('/api')
  vi.spyOn(client, 'get').mockImplementation(get)
  return new AuthApi(client)
}

describe('AuthApi.me', () => {
  it('returns null when there is no session', async () => {
    const api = apiWith(vi.fn().mockRejectedValue(new ApiError(401, 'Sign in to continue.')))
    await expect(api.me()).resolves.toBeNull()
  })

  it('propagates other failures instead of signing the user out', async () => {
    const api = apiWith(vi.fn().mockRejectedValue(new ApiError(503, 'Service unavailable')))
    await expect(api.me()).rejects.toThrow('Service unavailable')
  })
})
