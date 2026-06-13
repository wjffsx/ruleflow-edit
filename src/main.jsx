import { h, render } from 'preact'
import { App } from './App'
import './theme/tokens.css'
import './index.css'

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('rf-theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

render(<App />, document.getElementById('app'))
