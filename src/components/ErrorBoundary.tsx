import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; message: string | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error)
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Application crashed:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, message: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
          <p className="max-w-md text-sm text-slate-600">
            The application encountered an unexpected error. Please try refreshing the page.
          </p>
          {this.state.message && (
            <pre className="max-w-lg overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-700">
              {this.state.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
