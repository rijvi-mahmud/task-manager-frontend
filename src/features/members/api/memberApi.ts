import { apiClient } from '../../../api/apiClient'
import type { HttpClient } from '../../../api/httpClient'
import { memberListSchema, memberSchema, type Member, type MemberInput } from '../memberSchemas'

/** Typed gateway to /api/v1/workspaces/{id}/members. */
export class MemberApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  list(workspaceId: number, signal?: AbortSignal): Promise<Member[]> {
    return this.http.get(`/workspaces/${workspaceId}/members`, memberListSchema, { signal })
  }

  add(workspaceId: number, input: MemberInput): Promise<Member> {
    return this.http.post(`/workspaces/${workspaceId}/members`, input, memberSchema)
  }

  remove(workspaceId: number, userId: number): Promise<void> {
    return this.http.delete(`/workspaces/${workspaceId}/members/${userId}`)
  }
}

export const memberApi = new MemberApi(apiClient)
