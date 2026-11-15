import { useEffect, useRef } from 'react'

/** Prevents an old UI session's async completion from acting on a new session. */
export function useMountedRef() {
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])
  return mountedRef
}
