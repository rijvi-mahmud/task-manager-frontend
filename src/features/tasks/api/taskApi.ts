import { apiClient } from '../../../api/apiClient'
import type { HttpClient } from '../../../api/httpClient'
import {
  taskPageSchema,
  taskSchema,
  taskStatsSchema,
  type Task,
  type TaskInput,
  type TaskPage,
  type TaskStats,
  type TaskStatus,
} from '../taskSchemas'
import type { TaskPageRequest } from '../utils/taskFilters'

const base = (workspaceId: number) => `/workspaces/${workspaceId}/tasks`

function toQuery(request: TaskPageRequest): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(request)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return params.toString()
}

/** Typed gateway to /api/v1/workspaces/{workspaceId}/tasks. Mirrors the backend's command/query endpoints. */
export class TaskApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  list(workspaceId: number, request: TaskPageRequest, signal?: AbortSignal): Promise<TaskPage> {
    return this.http.get(`${base(workspaceId)}?${toQuery(request)}`, taskPageSchema, { signal })
  }

  stats(workspaceId: number, signal?: AbortSignal): Promise<TaskStats> {
    return this.http.get(`${base(workspaceId)}/stats`, taskStatsSchema, { signal })
  }

  get(workspaceId: number, id: number, signal?: AbortSignal): Promise<Task> {
    return this.http.get(`${base(workspaceId)}/${id}`, taskSchema, { signal })
  }

  create(workspaceId: number, input: TaskInput): Promise<Task> {
    return this.http.post(base(workspaceId), input, taskSchema)
  }

  /** `version` is the one the client last saw; a stale value yields 409. */
  update(workspaceId: number, id: number, input: TaskInput, version: number): Promise<Task> {
    return this.http.put(`${base(workspaceId)}/${id}`, { ...input, version }, taskSchema)
  }

  changeStatus(workspaceId: number, id: number, status: TaskStatus): Promise<Task> {
    return this.http.patch(`${base(workspaceId)}/${id}/status`, { status }, taskSchema)
  }

  assign(workspaceId: number, id: number, assigneeId: number | null): Promise<Task> {
    return this.http.patch(`${base(workspaceId)}/${id}/assignee`, { assigneeId }, taskSchema)
  }

  remove(workspaceId: number, id: number): Promise<void> {
    return this.http.delete(`${base(workspaceId)}/${id}`)
  }
}

export const taskApi = new TaskApi(apiClient)
