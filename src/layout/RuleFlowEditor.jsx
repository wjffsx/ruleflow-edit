import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
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
} from '../store/editorStore'
import { showSuccess, showInfo } from '../services/toastService'
import hotkeys from 'hotkeys-js'

const rootStyle = {
  display: 'grid',
  gridTemplateRows: 'var(--navbar-height) var(--toolbar-height) 1fr var(--statusbar-height)',
  gridTemplateColumns: 'var(--sidebar-width) 1fr var(--panel-width)',
  gridTemplateAreas: `
    "navbar  navbar  navbar"
    "toolbar toolbar toolbar"
    "sidebar canvas  panel"
    "status  status  status"
  `,
  height: '100vh',
  overflow: 'hidden',
  background: 'var(--rf-bg-primary)',
  color: 'var(--rf-text-primary)',
  fontFamily: 'var(--rf-font-sans)',
  fontSize: 'var(--rf-text-base)',
  transition: 'grid-template-columns var(--rf-duration-normal) var(--rf-ease-default)',
}

export function RuleFlowEditor() {
  const collapsed = sidebarCollapsed.value
  const noPanel = panelClosed.value
  const focused = focusMode.value
  const cmdPaletteVisible = commandPaletteVisible.value

  // Keyboard shortcuts - use hotkeys-js
  useEffect(() => {
    // Ctrl+K: Command palette
    hotkeys('ctrl+k', (e) => {
      e.preventDefault()
      showCommandPalette()
    })
    
    // Ctrl+S: Save (show toast)
    hotkeys('ctrl+s', (e) => {
      e.preventDefault()
      showSuccess('规则链已保存')
    })
    
    // Ctrl+B: Toggle sidebar
    hotkeys('ctrl+b', (e) => {
      e.preventDefault()
      toggleSidebar()
    })
    
    // Ctrl+J: Toggle panel
    hotkeys('ctrl+j', (e) => {
      e.preventDefault()
      togglePanel()
    })
    
    // Ctrl+.: Toggle density mode
    hotkeys('ctrl+.', (e) => {
      e.preventDefault()
      cycleDensityMode()
    })
    
    // Ctrl+0: Reset zoom
    hotkeys('ctrl+0', (e) => {
      e.preventDefault()
      setZoom(100)
    })
    
    // Ctrl++ or Ctrl+=: Zoom in
    hotkeys('ctrl+=,ctrl++', (e) => {
      e.preventDefault()
      setZoom(canvasZoom.value + 10)
    })
    
    // Ctrl+-: Zoom out
    hotkeys('ctrl+-', (e) => {
      e.preventDefault()
      setZoom(canvasZoom.value - 10)
    })
    
    // F5: Run debug
    hotkeys('f5', (e) => {
      e.preventDefault()
      startDebug()
    })
    
    // Shift+F5: Stop debug
    hotkeys('shift+f5', (e) => {
      e.preventDefault()
      stopDebug()
    })
    
    // F11: Focus mode
    hotkeys('f11', (e) => {
      e.preventDefault()
      toggleFocusMode()
    })
    
    return () => {
      hotkeys.unbind('ctrl+k,ctrl+s,ctrl+b,ctrl+j,ctrl+.,ctrl+0,ctrl+=,ctrl++,ctrl+-,f5,shift+f5,f11')
    }
  }, [])

  // Compute grid columns based on layout state
  let columns = 'var(--sidebar-width) 1fr var(--panel-width)'
  if (focused) {
    columns = '0 1fr 0'
  } else if (collapsed && noPanel) {
    columns = 'var(--sidebar-collapsed-width) 1fr 0'
  } else if (collapsed) {
    columns = 'var(--sidebar-collapsed-width) 1fr var(--panel-width)'
  } else if (noPanel) {
    columns = 'var(--sidebar-width) 1fr 0'
  }

  const handleExecuteCommand = (cmdId) => {
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
    <div style={{ ...rootStyle, gridTemplateColumns: columns }} class="rf-editor-root">
      <Navbar />
      <Toolbar />
      <Sidebar />
      <CanvasViewport />
      {focused ? null : <RightPanel />}
      <StatusBar />

      {/* ── Global overlays ── */}

      {/* Command palette (Ctrl+K) */}
      {cmdPaletteVisible && (
        <CommandPalette
          onClose={hideCommandPalette}
          onExecuteCommand={handleExecuteCommand}
        />
      )}
    </div>
  )
}
