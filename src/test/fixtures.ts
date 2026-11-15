import type { Task, TaskPage } from '../features/tasks/taskSchemas'
import type { Member } from '../features/members/memberSchemas'
import type { Workspace } from '../features/workspaces/workspaceSchemas'
import type { CurrentUser } from '../features/auth/authSchemas'

let nextId = 1

/** Builds a valid Task with sensible defaults; override what the test cares about. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id ?? nextId++
  return {
    id,
    title: `Task ${id}`,
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: null,
    assigneeId: null,
    assigneeName: null,
    overdue: false,
    version: 0,
    createdById: 1,
    createdByName: 'Ada Lovelace',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

/** Wraps tasks in a page envelope as GET /tasks returns it. */
export function makePage(items: Task[], totalItems = items.length): TaskPage {
  return { items, page: 0, size: 20, totalItems, totalPages: Math.ceil(totalItems / 20) }
}

/** Workspace id used by tests that do not care which workspace they are in. */
export const WORKSPACE_ID = 10

export function makeMember(overrides: Partial<Member> = {}): Member {
  return { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'MEMBER', pending: false, ...overrides }
}

export function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return { id: WORKSPACE_ID, name: 'Launch team', role: 'OWNER', memberCount: 1, ...overrides }
}

export const currentUser: CurrentUser = { id: 1, email: 'ada@example.com', displayName: 'Ada Lovelace' }
