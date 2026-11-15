export function TaskBoardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((col) => (
        <div key={col} className="flex flex-col gap-2 rounded-xl bg-surface-muted p-3">
          <div className="mb-2 h-4 w-24 animate-pulse rounded bg-line" />
          {[0, 1].map((row) => (
            <div key={row} className="h-20 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      ))}
    </div>
  )
}
