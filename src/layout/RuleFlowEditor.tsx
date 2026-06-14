import { useEffect, useRef } from 'preact/hooks'
import type { CSSProperties, ComponentChild } from 'preact'
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
import { setTheme } from '../store/themeStore'
import { showSuccess } from '../services'
import hotkeys from 'hotkeys-js'
import type { DebugNodeState, DebugMessage, ThemeMode } from '../types/editor'

// ── Props Types ──────────────────────────────────────────────────

/** External debug state injected by the host application */
export interface DebugState {
  nodeStates: Record<string, DebugNodeState>
  messages: DebugMessage[]
  isRunning: boolean
  isPaused: boolean
  currentStep: number
  totalSteps: number
}

/** RuleFlowEditor component props */
export interface RuleFlowEditorProps {
  // ── Data ──
  /** Initial graph data to load */
  initialData?: unknown
  /** Callback when graph data changes */
  onDataChange?: (data: unknown) => void

  // ── Feature toggles ──
  /** Show sidebar (default: true) */
  showSidebar?: boolean
  /** Show debug panel (default: true) */
  showDebugPanel?: boolean
  /** Show toolbar (default: true) */
  showToolbar?: boolean
  /** Show status bar (default: true) */
  showStatusBar?: boolean
  /** Read-only mode (default: false) */
  readOnly?: boolean

  // ── Debug ──
  /** Callback when debug starts */
  onDebugStart?: () => void
  /** Callback when debug steps */
  onDebugStep?: (nodeId: string) => void
  /** External debug state injection */
  debugState?: DebugState

  // ── Style ──
  /** Theme mode */
  theme?: ThemeMode
  /** Container CSS class name */
  className?: string
  /** Container inline style */
  style?: CSSProperties

  // ── Hotkey ──
  /** Hotkey overrides: key=original shortcut, value=new shortcut or false to disable */
  hotkeyOverrides?: Record<string, string | false>

  // ── Property editor ──
  /** Custom property renderer for selected node */
  propertyRenderer?: (node: unknown, onChange: (updated: unknown) => void) => ComponentChild
}

// ── Default shortcuts map ────────────────────────────────────────

const DEFAULT_SHORTCUTS: Record<string, string> = {
  'command-palette': 'ctrl+k',
  save: 'ctrl+s',
  'toggle-sidebar': 'ctrl+b',
  'toggle-panel': 'ctrl+j',
  'cycle-density': 'ctrl+.',
  'zoom-reset': 'ctrl+0',
  'zoom-in': 'ctrl+=,ctrl++',
  'zoom-out': 'ctrl+-',
  'debug-start': 'f5',
  'debug-stop': 'shift+f5',
  'focus-mode': 'f11',
}

// ── Component ────────────────────────────────────────────────────

export function RuleFlowEditor(props: RuleFlowEditorProps = {}) {
  const {
    showSidebar = true,
    showDebugPanel = true,
    showToolbar = true,
    showStatusBar = true,
    readOnly = false,
    theme: themeProp,
    className,
    style,
    hotkeyOverrides,
    onDebugStart,
    onDebugStep,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)

  // Sync theme from props
  useEffect(() => {
    if (themeProp) {
      setTheme(themeProp)
    }
  }, [themeProp])

  const collapsed = sidebarCollapsed.value
  const noPanel = panelClosed.value
  const focused = focusMode.value
  const cmdPaletteVisible = commandPaletteVisible.value

  // ── Resolve effective shortcuts ──
  const effectiveShortcuts = { ...DEFAULT_SHORTCUTS }
  if (hotkeyOverrides) {
    for (const [key, value] of Object.entries(hotkeyOverrides)) {
      if (value === false) {
        delete effectiveShortcuts[key]
      } else {
        effectiveShortcuts[key] = value
      }
    }
  }

  // ── Keyboard shortcuts (scoped to container) ──
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Set hotkeys scope to this editor instance
    hotkeys.setScope('ruleflow-editor')

    const bindings: string[] = []

    const bind = (actionId: string, handler: (e: KeyboardEvent) => void) => {
      const keys = effectiveShortcuts[actionId]
      if (!keys) return
      hotkeys(keys, { scope: 'ruleflow-editor' }, handler)
      bindings.push(keys)
    }

    bind('command-palette', (e) => {
      e.preventDefault()
      showCommandPalette()
    })
    bind('save', (e) => {
      e.preventDefault()
      showSuccess('规则链已保存')
    })
    bind('toggle-sidebar', (e) => {
      e.preventDefault()
      toggleSidebar()
    })
    bind('toggle-panel', (e) => {
      e.preventDefault()
      togglePanel()
    })
    bind('cycle-density', (e) => {
      e.preventDefault()
      cycleDensityMode()
    })
    bind('zoom-reset', (e) => {
      e.preventDefault()
      setZoom(100)
    })
    bind('zoom-in', (e) => {
      e.preventDefault()
      setZoom(canvasZoom.value + 10)
    })
    bind('zoom-out', (e) => {
      e.preventDefault()
      setZoom(canvasZoom.value - 10)
    })
    bind('debug-start', (e) => {
      e.preventDefault()
      if (onDebugStart) onDebugStart()
      else startDebug()
    })
    bind('debug-stop', (e) => {
      e.preventDefault()
      stopDebug()
    })
    bind('focus-mode', (e) => {
      e.preventDefault()
      toggleFocusMode()
    })

    return () => {
      hotkeys.deleteScope('ruleflow-editor')
    }
  }, [hotkeyOverrides, onDebugStart])

  // Focus/blur handling — activate/deactivate hotkeys scope
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onFocus = () => {
      hotkeys.setScope('ruleflow-editor')
    }
    const onBlur = () => {
      hotkeys.setScope('all')
    }

    el.addEventListener('focusin', onFocus)
    el.addEventListener('focusout', onBlur)

    return () => {
      el.removeEventListener('focusin', onFocus)
      el.removeEventListener('focusout', onBlur)
    }
  }, [])

  // ── Compute grid-template-columns ──
  let gridCols: string
  if (focused) {
    gridCols = '0 1fr 0'
  } else if (!showSidebar && noPanel) {
    gridCols = '0 1fr 0'
  } else if (collapsed && noPanel) {
    gridCols = 'var(--sidebar-collapsed-width) 1fr var(--sidebar-collapsed-width)'
  } else if (collapsed) {
    gridCols = 'var(--sidebar-collapsed-width) 1fr var(--panel-width)'
  } else if (noPanel) {
    gridCols = 'var(--sidebar-width) 1fr var(--sidebar-collapsed-width)'
  } else {
    gridCols = 'var(--sidebar-width) 1fr var(--panel-width)'
  }

  const handleExecuteCommand = (cmdId: string) => {
    switch (cmdId) {
      case 'run':
        if (onDebugStart) onDebugStart()
        else startDebug()
        break
      case 'stop':
        stopDebug()
        break
      default:
        console.log('Command:', cmdId)
    }
  }

  return (
    <div
      ref={containerRef}
      class={[
        'grid h-full overflow-hidden bg-[var(--rf-bg-primary)] text-[var(--rf-text-primary)] font-[var(--rf-font-sans)] text-[var(--rf-text-base)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        gridTemplateRows: [
          showToolbar ? 'var(--navbar-height) var(--toolbar-height)' : 'var(--navbar-height)',
          '1fr',
          showStatusBar ? 'var(--statusbar-height)' : '',
        ]
          .filter(Boolean)
          .join(' '),
        gridTemplateAreas: showToolbar
          ? '"navbar navbar navbar" "toolbar toolbar toolbar" "sidebar canvas panel" "status status status"'
          : '"navbar navbar navbar" "sidebar canvas panel" "status status status"',
        gridTemplateColumns: gridCols,
        transition: 'grid-template-columns var(--rf-duration-normal) var(--rf-ease-default)',
        ...style,
      }}
      tabIndex={-1}
    >
      <Navbar />
      {showToolbar && <Toolbar />}
      {showSidebar && <Sidebar />}
      <CanvasViewport />
      {showDebugPanel && !focused && <RightPanel propertyRenderer={props.propertyRenderer} />}
      {showStatusBar && <StatusBar />}

      {/* Command palette (Ctrl+K) */}
      {cmdPaletteVisible && (
        <CommandPalette onClose={hideCommandPalette} onExecuteCommand={handleExecuteCommand} />
      )}
    </div>
  )
}
