import { useEffect } from 'preact/hooks'
import { Navbar } from '../components/navbar/Navbar'
import { Toolbar } from '../components/toolbar/Toolbar'
import { Sidebar } from '../components/sidebar/Sidebar'
import { CanvasViewport } from '../components/canvas/CanvasViewport'
import { RightPanel } from '../components/panel/RightPanel'
import { StatusBar } from '../components/statusbar/StatusBar'
import { CommandPalette } from '../components/canvas/CommandPalette'
import {
  sidebarCollapsed,
  panelClosed,
  focusMode,
  commandPaletteVisible,
  showCommandPalette,
  hideCommandPalette,
  toggleSidebar,
  togglePanel,
  toggleFocusMode,
  startDebug,
  stopDebug,
  cycleDensityMode,
  setZoom,
  canvasZoom,
} from '../store'
import { showSuccess } from '../services'
import hotkeys from 'hotkeys-js'
import s from '../styles/layout.module.css'

export function RuleFlowEditor() {
  const collapsed = sidebarCollapsed.value
  const noPanel = panelClosed.value
  const focused = focusMode.value
  const cmdPaletteVisible = commandPaletteVisible.value

  // Keyboard shortcuts - use hotkeys-js
  useEffect(() => {
    hotkeys('ctrl+k', (e) => {
      e.preventDefault()
      showCommandPalette()
    })

    hotkeys('ctrl+s', (e) => {
      e.preventDefault()
      showSuccess('规则链已保存')
    })

    hotkeys('ctrl+b', (e) => {
      e.preventDefault()
      toggleSidebar()
    })

    hotkeys('ctrl+j', (e) => {
      e.preventDefault()
      togglePanel()
    })

    hotkeys('ctrl+.', (e) => {
      e.preventDefault()
      cycleDensityMode()
    })

    hotkeys('ctrl+0', (e) => {
      e.preventDefault()
      setZoom(100)
    })

    hotkeys('ctrl+=,ctrl++', (e) => {
      e.preventDefault()
      setZoom(canvasZoom.value + 10)
    })

    hotkeys('ctrl+-', (e) => {
      e.preventDefault()
      setZoom(canvasZoom.value - 10)
    })

    hotkeys('f5', (e) => {
      e.preventDefault()
      startDebug()
    })

    hotkeys('shift+f5', (e) => {
      e.preventDefault()
      stopDebug()
    })

    hotkeys('f11', (e) => {
      e.preventDefault()
      toggleFocusMode()
    })

    return () => {
      hotkeys.unbind(
        'ctrl+k,ctrl+s,ctrl+b,ctrl+j,ctrl+.,ctrl+0,ctrl+=,ctrl++,ctrl+-,f5,shift+f5,f11',
      )
    }
  }, [])

  // Compute column class
  let colClass = s.colsDefault
  if (focused) {
    colClass = s.colsFocused
  } else if (collapsed && noPanel) {
    colClass = s.colsCollapsedNoPanel
  } else if (collapsed) {
    colClass = s.colsCollapsed
  } else if (noPanel) {
    colClass = s.colsNoPanel
  }

  const handleExecuteCommand = (cmdId: string) => {
    switch (cmdId) {
      case 'run':
        startDebug()
        break
      case 'stop':
        stopDebug()
        break
      default:
        console.log('Command:', cmdId)
    }
  }

  return (
    <div class={`${s.editorRoot} ${colClass}`}>
      <Navbar />
      <Toolbar />
      <Sidebar />
      <CanvasViewport />
      {focused ? null : <RightPanel />}
      <StatusBar />

      {/* Command palette (Ctrl+K) */}
      {cmdPaletteVisible && (
        <CommandPalette onClose={hideCommandPalette} onExecuteCommand={handleExecuteCommand} />
      )}
    </div>
  )
}
