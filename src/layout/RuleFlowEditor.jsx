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
  startDebug,
  stopDebug,
  cycleDensityMode,
} from '../store/editorStore'

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K: Command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        showCommandPalette()
      }
      // Ctrl+.: Toggle density mode (v2.0 Spec 18.3)
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault()
        cycleDensityMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
