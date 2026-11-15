import { TaskBoardSkeleton } from '../features/tasks/components/TaskBoardSkeleton'

/** Shared first-load and route-pending presentation; placeholders carry no account data. */
export function AppLoadingSkeleton() {
  return (
    <main id="main" tabIndex={-1} aria-busy="true" className="min-h-screen">
      <p role="status" className="sr-only">Loading Task Manager…</p>
      <div aria-hidden="true" className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-8">
          <div className="size-8 animate-pulse rounded-lg bg-line" />
          <div className="h-5 w-36 animate-pulse rounded bg-line" />
          <div className="ml-auto size-8 animate-pulse rounded-full bg-line" />
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-8">
        <div aria-hidden="true" className="h-8 w-52 animate-pulse rounded bg-line" />
        <div aria-hidden="true" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map(item => <div key={item} className="h-20 animate-pulse rounded-xl border border-line bg-surface" />)}
        </div>
        <div aria-hidden="true" className="h-12 animate-pulse rounded-xl border border-line bg-surface" />
        <TaskBoardSkeleton />
      </div>
    </main>
  )
}
