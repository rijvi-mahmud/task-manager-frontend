import type { CurrentUser } from '../authSchemas'
import { useSession } from './useSession'

/** The signed-in user. Only valid below the authenticated layout, which renders nothing without one. */
export function useCurrentUser(): CurrentUser {
  const { data } = useSession()
  if (!data) throw new Error('useCurrentUser must be used inside the authenticated layout')
  return data
}
