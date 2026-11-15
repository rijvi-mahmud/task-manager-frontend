/** Remembers the last opened workspace per browser. Storage may be unavailable; that is fine. */
const KEY = 'taskmanager.lastWorkspaceId'

export function rememberWorkspace(id: number) {
  try { localStorage.setItem(KEY, String(id)) } catch { /* private mode or blocked storage */ }
}

export function lastWorkspaceId(): number | null {
  try {
    const value = Number(localStorage.getItem(KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}
