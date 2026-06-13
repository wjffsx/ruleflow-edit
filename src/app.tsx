import { Fragment } from 'preact'
import { useEffect } from 'preact/hooks'
import { RuleFlowEditor } from './layout/RuleFlowEditor'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { theme, setTheme } from './store'
import { safeGetTheme } from './utils'

export function App() {
  // Initialize theme from localStorage on first mount
  useEffect(() => {
    setTheme(safeGetTheme() as any)
  }, [])

  return (
    <ErrorBoundary>
      <RuleFlowEditor />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: 'var(--rf-radius-md)',
            background: 'var(--rf-bg-elevated)',
            color: 'var(--rf-text-primary)',
            border: '1px solid var(--rf-border)',
            fontSize: 'var(--rf-text-sm)',
          },
        }}
      />
    </ErrorBoundary>
  )
}
