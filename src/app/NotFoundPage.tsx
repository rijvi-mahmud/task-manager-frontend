import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center gap-3 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted">This page doesn’t exist, or you don’t have access to it.</p>
      <Link to="/" className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline">Go to your workspaces</Link>
    </main>
  )
}
