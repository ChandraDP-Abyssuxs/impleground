import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/common/Button'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Shown in the fallback heading, e.g. "Retro Studio". */
  panelName: string
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface in devtools; nothing user-facing beyond the fallback below.
    console.error(`[ImPleGround] ${this.props.panelName} crashed:`, error, info.componentStack)
  }

  private reset = (): void => this.setState({ error: null })

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-danger/40 bg-danger/5 p-8 text-center">
        <AlertTriangle size={28} className="text-danger" />
        <div>
          <p className="font-display text-sm font-semibold text-ink">{this.props.panelName} hit a snag</p>
          <p className="mt-1 max-w-sm text-xs text-ink-muted">
            {error.message || 'Something went wrong rendering this panel.'} Your source image is safe — try
            resetting this panel, or reload the page if it keeps happening.
          </p>
        </div>
        <Button size="sm" onClick={this.reset}>
          Reset panel
        </Button>
      </div>
    )
  }
}
