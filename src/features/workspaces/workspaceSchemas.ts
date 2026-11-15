import { z } from 'zod'

export const workspaceRoleSchema = z.enum(['OWNER', 'MEMBER'])
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>

export const workspaceSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  /** The current user's role in this workspace. */
  role: workspaceRoleSchema,
  memberCount: z.number().int(),
})
export const workspaceListSchema = z.array(workspaceSchema)
export type Workspace = z.infer<typeof workspaceSchema>

/** Mirrors the backend WorkspaceRequest constraints. */
export const workspaceFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be at most 80 characters'),
})
export type WorkspaceFormValues = z.input<typeof workspaceFormSchema>
export type WorkspaceInput = z.output<typeof workspaceFormSchema>
