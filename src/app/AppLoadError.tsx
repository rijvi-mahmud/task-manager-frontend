import { ApiError } from '../api/httpClient'
import { Button } from '../components/ui/Button'

/** Expected initial API/route failures, with a real retry instead of a render-failure boundary. */
export function AppLoadError<TError>({ error, onRetry }: { error: TError; onRetry: () => void }) {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">We couldn’t load this page</h1>
      <p role="alert" className="text-sm text-muted">
        {error instanceof ApiError ? error.message : 'Try again. If the problem continues, reload the page.'}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={onRetry}>Try again</Button>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    </main>
  )
}
