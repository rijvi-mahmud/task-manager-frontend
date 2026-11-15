import { apiClient } from '../../../api/apiClient'
import { ApiError, type HttpClient } from '../../../api/httpClient'
import { currentUserSchema, type CurrentUser, type LoginInput, type RegisterInput } from '../authSchemas'

/** Typed gateway to /api/v1/auth. The session itself is an HttpOnly cookie the browser manages. */
export class AuthApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  /** The signed-in user, or null when there is no valid session. */
  async me(signal?: AbortSignal): Promise<CurrentUser | null> {
    try {
      return await this.http.get('/auth/me', currentUserSchema, { signal })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  }

  login(input: LoginInput): Promise<CurrentUser> {
    return this.http.post('/auth/login', input, currentUserSchema)
  }

  register(input: RegisterInput): Promise<CurrentUser> {
    return this.http.post('/auth/register', input, currentUserSchema)
  }

  logout(): Promise<void> {
    return this.http.postNoContent('/auth/logout', {})
  }

  requestPasswordReset(email: string): Promise<void> {
    return this.http.postNoContent('/auth/password-reset', { email })
  }

  resetPassword(token: string, newPassword: string): Promise<void> {
    return this.http.postNoContent('/auth/password-reset/confirm', { token, newPassword })
  }
}

export const authApi = new AuthApi(apiClient)
