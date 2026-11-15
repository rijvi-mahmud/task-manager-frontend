import { z } from 'zod'
import { workspaceRoleSchema } from '../workspaces/workspaceSchemas'

/** A workspace member: someone tasks can be assigned to. `id` is the user id. */
export const memberSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  role: workspaceRoleSchema,
  /** Added by email but has not registered yet. */
  pending: z.boolean(),
})
export const memberListSchema = z.array(memberSchema)
export type Member = z.infer<typeof memberSchema>

/** Mirrors the backend AddMemberRequest constraints. */
export const memberFormSchema = z.object({
  email: z.string().trim().pipe(z.email('Email must be valid').max(120, 'Email must be at most 120 characters')),
})
export type MemberFormValues = z.input<typeof memberFormSchema>
export type MemberInput = z.output<typeof memberFormSchema>
