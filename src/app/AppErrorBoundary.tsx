import { Component, createRef, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'

interface AppErrorBoundaryProps { children: ReactNode }
interface AppErrorBoundaryState { hasError: boolean }

/** Rendering failures recover here; expected API errors stay in query/form UI. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }
  private readonly headingRef = createRef<HTMLHeadingElement>()

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application rendering failed', error, info.componentStack)
    this.headingRef.current?.focus()
  }

  private retry = () => {
    this.setState({ hasError: false }, () => {
      document.querySelector<HTMLElement>('main')?.focus()
    })
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <main tabIndex={-1} className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-12">
        <h1 ref={this.headingRef} tabIndex={-1} className="text-2xl font-semibold">The workspace couldn’t be displayed</h1>
        <p className="text-sm text-muted">Try again. If the problem continues, reload the page. Unsaved form changes may be lost.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={this.retry}>Try again</Button>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      </main>
    )
  }
}
