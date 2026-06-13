import { h, render } from 'preact'
import { App } from './app'
import './theme/tokens.css'
import './index.css'

render(<App />, document.getElementById('app')!)
