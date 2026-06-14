import { useEffect } from 'preact/hooks'
import { RuleFlowEditor } from './layout/RuleFlowEditor'
import { ToastContainer } from './services/toastService'
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
      <ToastContainer />
    </ErrorBoundary>
  )
}
