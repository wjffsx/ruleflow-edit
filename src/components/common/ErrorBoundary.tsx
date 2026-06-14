import type { ComponentChildren } from 'preact'
import { Component, h } from 'preact'

/** Props for ErrorBoundary component */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ComponentChildren
  /** Optional fallback render function */
  fallback?: (error: Error, reset: () => void) => ComponentChildren
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/** Error info from Preact */
interface ErrorInfo {
  componentStack?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RuleFlow Editor] ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleReset)
      }
      return h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: 32,
            fontFamily: 'var(--rf-font-sans, system-ui, sans-serif)',
            color: 'var(--rf-text-primary, #111827)',
            background: 'var(--rf-bg-primary, #ffffff)',
          },
        },
        [
          h(
            'div',
            {
              style: {
                fontSize: 48,
                marginBottom: 16,
              },
            },
            '\u26A0\uFE0F',
          ),
          h(
            'h2',
            {
              style: {
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 8,
              },
            },
            '编辑器遇到了一个错误',
          ),
          h(
            'p',
            {
              style: {
                fontSize: 14,
                color: 'var(--rf-text-secondary, #6b7280)',
                marginBottom: 24,
                maxWidth: 400,
                textAlign: 'center',
              },
            },
            this.state.error?.message || '未知错误',
          ),
          h(
            'button',
            {
              onClick: this.handleReset,
              style: {
                padding: '8px 16px',
                borderRadius: 'var(--rf-radius-md, 6px)',
                background: 'var(--rf-brand-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              },
            },
            '重新加载',
          ),
        ],
      )
    }
    return this.props.children
  }
}
