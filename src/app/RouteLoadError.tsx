import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { AppLoadError } from './AppLoadError'

/** Retrying a route must rerun its failed loader, not only reset its render boundary. */
export function RouteLoadError({ error }: ErrorComponentProps) {
  const router = useRouter()
  return <AppLoadError error={error} onRetry={() => { void router.invalidate() }} />
}
