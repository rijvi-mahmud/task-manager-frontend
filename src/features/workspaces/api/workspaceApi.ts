import { apiClient } from '../../../api/apiClient'
import type { HttpClient } from '../../../api/httpClient'
import { workspaceListSchema, workspaceSchema, type Workspace, type WorkspaceInput } from '../workspaceSchemas'

/** Typed gateway to /api/v1/workspaces. Only workspaces the user belongs to are visible. */
export class WorkspaceApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  list(signal?: AbortSignal): Promise<Workspace[]> {
    return this.http.get('/workspaces', workspaceListSchema, { signal })
  }

  create(input: WorkspaceInput): Promise<Workspace> {
    return this.http.post('/workspaces', input, workspaceSchema)
  }

  rename(id: number, input: WorkspaceInput): Promise<Workspace> {
    return this.http.put(`/workspaces/${id}`, input, workspaceSchema)
  }

  remove(id: number): Promise<void> {
    return this.http.delete(`/workspaces/${id}`)
  }

  /** Removes the current user from the workspace. */
  leave(id: number, userId: number): Promise<void> {
    return this.http.delete(`/workspaces/${id}/members/${userId}`)
  }
}

export const workspaceApi = new WorkspaceApi(apiClient)
