import { h, Fragment } from 'preact'
import { RuleFlowEditor } from './layout/RuleFlowEditor'
import { ToastContainer } from './components/common/ToastContainer'

export function App() {
  return (
    <Fragment>
      <RuleFlowEditor />
      <ToastContainer />
    </Fragment>
  )
}
