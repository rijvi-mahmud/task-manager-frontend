import type { ReactNode } from 'react'
import { LayoutGrid } from 'lucide-react'

/** Centered card for the signed-out pages. */
export function AuthLayout({ title, subtitle, children, footer }: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3 font-semibold tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-fg"><LayoutGrid className="size-5" aria-hidden /></span>
          Task Manager
        </div>
        <section aria-labelledby="auth-title" className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h1 id="auth-title" className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </main>
  )
}
