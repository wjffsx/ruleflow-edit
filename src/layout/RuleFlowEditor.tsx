import { useEffect, useRef, useCallback } from 'preact/hooks'
import type { CSSProperties, ComponentChild } from 'preact'
import type { GraphData } from '@logicflow/core'
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
  isDebugRunning,
  isDebugPaused,
  debugStep,
  debugTotalSteps,
  debugNodeStates,
  debugMessages,
} from '../store'
import { setTheme } from '../store/themeStore'
import { showSuccess, showError, showWarning, showInfo } from '../services'
import hotkeys from 'hotkeys-js'
import type { DebugNodeState, DebugMessage, ThemeMode } from '../types/editor'
import type { RuleFlowDocument, RuleFlowNode, RuleFlowEdge } from '../types/ruleflowDocument'

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

/** Toast adapter — allows host application to intercept notifications */
export interface ToastAdapter {
  success(message: string): void
  error(message: string): void
  warning(message: string): void
  info(message: string): void
}

/** Editor display mode */
export type EditorMode = 'edit' | 'view' | 'monitor'

/** Runtime monitoring state for continuous observation */
export interface MonitorNodeState {
  status: 'running' | 'error' | 'idle' | 'disabled'
  /** Evaluation count */
  evalCount?: number
  /** Match count */
  matchCount?: number
  /** Error count */
  errorCount?: number
  /** Average latency in ms */
  avgLatencyMs?: number
  /** Last evaluation timestamp */
  lastEvalAt?: string
  /** Custom metrics for display */
  metrics?: Record<string, number | string>
}

export interface MonitorEdgeState {
  /** Flow rate (events/sec) */
  flowRate?: number
  /** Error rate (0-1) */
  errorRate?: number
  /** Average latency in ms */
  avgLatencyMs?: number
}

export interface MonitorState {
  /** Per-node runtime state and metrics */
  nodeStates: Record<string, MonitorNodeState>
  /** Per-edge runtime metrics */
  edgeStates: Record<string, MonitorEdgeState>
}

/** RuleFlowEditor component props */
export interface RuleFlowEditorProps {
  // ── Data ──
  /** Initial graph data to load (RuleFlowDocument or LogicFlow GraphData) */
  initialData?: RuleFlowDocument | GraphData
  /** Callback when graph data changes */
  onDataChange?: (data: RuleFlowDocument) => void
  /** Callback when user triggers save (Ctrl+S) */
  onSave?: (data: RuleFlowDocument) => void

  // ── Feature toggles ──
  /** Show navbar (default: true) */
  showNavbar?: boolean
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
  /** Editor mode: 'edit' = full editing, 'view' = read-only with hidden edit UI, 'monitor' = view + real-time data overlay (default: 'edit') */
  mode?: EditorMode

  // ── Debug ──
  /** Callback when debug starts */
  onDebugStart?: () => void
  /** Callback when debug steps */
  onDebugStep?: (nodeId: string) => void
  /** External debug state injection */
  debugState?: DebugState

  // ── Monitoring ──
  /** Runtime monitoring state for continuous observation (web scenario) */
  monitorState?: MonitorState

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

  // ── Toast ──
  /** Custom toast adapter — if provided, host handles all notifications */
  toastAdapter?: ToastAdapter

  // ── Fine-grained callbacks ──
  /** Callback when a node is added */
  onNodeAdd?: (node: RuleFlowNode) => void
  /** Callback when a node is deleted */
  onNodeDelete?: (nodeId: string) => void
  /** Callback when a node is updated */
  onNodeUpdate?: (node: RuleFlowNode) => void
  /** Callback when an edge is added */
  onEdgeAdd?: (edge: RuleFlowEdge) => void
  /** Callback when an edge is deleted */
  onEdgeDelete?: (edgeId: string) => void
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
    showNavbar = true,
    showSidebar = true,
    showDebugPanel = true,
    showToolbar = true,
    showStatusBar = true,
    readOnly = false,
    mode,
    theme: themeProp,
    className,
    style,
    hotkeyOverrides,
    onDebugStart,
    onDebugStep,
    onSave,
    toastAdapter,
    onDataChange,
    onNodeAdd,
    onNodeDelete,
    onNodeUpdate,
    onEdgeAdd,
    onEdgeDelete,
    monitorState,
  } = props

  // ── Derive effective mode and readOnly ──
  const effectiveMode: EditorMode = mode || (readOnly ? 'view' : 'edit')
  const effectiveReadOnly = effectiveMode !== 'edit'

  // P0-1: In view/monitor mode, auto-hide editing UI
  const effectiveShowSidebar = effectiveMode === 'edit' ? showSidebar : false
  const effectiveShowToolbar = effectiveMode === 'edit' ? showToolbar : false
  const effectiveShowDebugPanel = effectiveMode === 'edit' ? showDebugPanel : false

  const containerRef = useRef<HTMLDivElement>(null)

  // ── Toast adapter wrapper ──
  const toast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
      if (toastAdapter) {
        toastAdapter[type](message)
      } else {
        switch (type) {
          case 'success':
            showSuccess(message)
            break
          case 'error':
            showError(message)
            break
          case 'warning':
            showWarning(message)
            break
          case 'info':
            showInfo(message)
            break
        }
      }
    },
    [toastAdapter],
  )

  // Sync theme from props
  useEffect(() => {
    if (themeProp) {
      setTheme(themeProp)
    }
  }, [themeProp])

  // ── P0-4: Sync debugState prop → internal debug signals ──
  useEffect(() => {
    if (!props.debugState) return
    const ds = props.debugState
    debugNodeStates.value = ds.nodeStates
    debugMessages.value = ds.messages.map((m) => ({
      nodeId: m.nodeId,
      type: m.type,
      message: m.message,
      time: (m as any).time ?? Date.now(),
    }))
    isDebugRunning.value = ds.isRunning
    isDebugPaused.value = ds.isPaused
    debugStep.value = ds.currentStep
    debugTotalSteps.value = ds.totalSteps
  }, [props.debugState])

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

    const bind = (actionId: string, handler: (e: KeyboardEvent) => void) => {
      const keys = effectiveShortcuts[actionId]
      if (!keys) return
      hotkeys(keys, { scope: 'ruleflow-editor' }, handler)
    }

    bind('command-palette', (e) => {
      e.preventDefault()
      showCommandPalette()
    })
    bind('save', (e) => {
      e.preventDefault()
      // P0-6: Call onSave if provided, otherwise show toast
      if (onSave) {
        try {
          const lf = (window as unknown as Record<string, unknown>).__lf as
            | import('@logicflow/core').LogicFlow
            | undefined
          if (lf) {
            const graphData = lf.getGraphData() as any
            const doc: RuleFlowDocument = {
              chainId: '',
              chainName: '',
              enabled: true,
              root: false,
              evaluationMode: 'all',
              nodes: (graphData.nodes || []).map((n: any) => ({
                id: n.id,
                type: n.type,
                x: n.x ?? 0,
                y: n.y ?? 0,
                text: typeof n.text === 'object' ? (n.text?.value ?? '') : (n.text ?? ''),
                properties: n.properties ?? {},
              })),
              edges: (graphData.edges || []).map((e: any) => ({
                id: e.id,
                type: e.type ?? 'polyline',
                sourceNodeId: e.sourceNodeId,
                targetNodeId: e.targetNodeId,
                properties: e.properties ?? {},
              })),
            }
            onSave(doc)
          }
        } catch (_e) {
          toast('error', '保存失败')
        }
      } else {
        toast('success', '规则链已保存')
      }
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
  }, [hotkeyOverrides, onDebugStart, onSave, toast])

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
  if (focused || effectiveMode !== 'edit') {
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

  // ── P0-8: Dynamic grid-template-rows/areas based on showNavbar ──
  const gridRows = [
    showNavbar ? 'var(--navbar-height)' : '',
    showToolbar ? 'var(--toolbar-height)' : '',
    '1fr',
    showStatusBar ? 'var(--statusbar-height)' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const areas = [
    showNavbar ? '"navbar navbar navbar"' : '',
    showToolbar ? '"toolbar toolbar toolbar"' : '',
    '"sidebar canvas panel"',
    showStatusBar ? '"status status status"' : '',
  ]
    .filter(Boolean)
    .join(' ')

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
        effectiveReadOnly ? 'rf-readonly' : '',
        effectiveMode === 'monitor' ? 'rf-monitor' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        gridTemplateRows: gridRows,
        gridTemplateAreas: areas,
        gridTemplateColumns: gridCols,
        transition: 'grid-template-columns var(--rf-duration-normal) var(--rf-ease-default)',
        ...style,
      }}
      tabIndex={-1}
    >
      {showNavbar && <Navbar />}
      {effectiveShowToolbar && <Toolbar />}
      {effectiveShowSidebar && <Sidebar readOnly={effectiveReadOnly} />}
      <CanvasViewport
        initialData={props.initialData}
        readOnly={effectiveReadOnly}
        mode={effectiveMode}
        monitorState={monitorState}
        onDataChange={onDataChange}
        onNodeAdd={onNodeAdd}
        onNodeDelete={onNodeDelete}
        onNodeUpdate={onNodeUpdate}
        onEdgeAdd={onEdgeAdd}
        onEdgeDelete={onEdgeDelete}
      />
      {effectiveShowDebugPanel && !focused && (
        <RightPanel propertyRenderer={props.propertyRenderer} readOnly={effectiveReadOnly} />
      )}
      {showStatusBar && <StatusBar />}

      {/* Command palette (Ctrl+K) */}
      {cmdPaletteVisible && (
        <CommandPalette onClose={hideCommandPalette} onExecuteCommand={handleExecuteCommand} />
      )}
    </div>
  )
}
