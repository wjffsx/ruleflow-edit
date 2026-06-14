import { useEffect } from 'preact/hooks'
import { RuleFlowEditor } from './layout/RuleFlowEditor'
import { ToastContainer } from './services/toastService'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { setTheme } from './store'
import { safeGetTheme } from './utils'
import type { ThemeMode } from './types/editor'

export function App() {
  // Initialize theme from localStorage on first mount
  useEffect(() => {
    setTheme(safeGetTheme() as ThemeMode)
  }, [])

  return (
    <ErrorBoundary>
      <RuleFlowEditor />
      <ToastContainer />
    </ErrorBoundary>
  )
}
