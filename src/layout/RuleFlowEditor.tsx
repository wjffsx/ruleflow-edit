import { useEffect, useRef, useCallback, useState } from 'preact/hooks'
import type { CSSProperties, ComponentChild, FunctionalComponent } from 'preact'
import type { GraphData } from '@logicflow/core'
// P0-B: CanvasViewport 是 view 模式必需，保持静态 import
import { CanvasViewport } from '../components/canvas/CanvasViewport'
// P0-B: 仅保留 view 模式必需的 store signals
import { sidebarCollapsed, panelClosed, focusMode, canvasZoom, setZoom } from '../store'
import { setTheme } from '../store/themeStore'
// P0-B: 移除 toast services 静态 import，改为 edit 模式动态加载
import type { DebugNodeState, DebugMessage, ThemeMode } from '../types/editor'
import type { RuleFlowDocument, RuleFlowNode, RuleFlowEdge } from '../types/ruleflowDocument'

// ── P0-B: Edit mode UI components (dynamic import) ──────────────────────

interface EditUIComponents {
  Navbar: FunctionalComponent
  Toolbar: FunctionalComponent
  Sidebar: FunctionalComponent<{ readOnly?: boolean }>
  RightPanel: FunctionalComponent<{ propertyRenderer?: unknown; readOnly?: boolean }>
  StatusBar: FunctionalComponent
  CommandPalette: FunctionalComponent<{
    onClose: () => void
    onExecuteCommand: (cmdId: string) => void
  }>
  hotkeys: typeof import('hotkeys-js').default
  showSuccess: (msg: string) => void
  showError: (msg: string) => void
  showWarning: (msg: string) => void
  showInfo: (msg: string) => void
  showCommandPalette: () => void
  hideCommandPalette: () => void
  toggleSidebar: () => void
  togglePanel: () => void
  toggleFocusMode: () => void
  startDebug: () => void
  stopDebug: () => void
  cycleDensityMode: () => void
  commandPaletteVisible: { value: boolean }
}

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

  // ── P0-B: Dynamic import edit UI components (only in edit mode) ──
  const [editUI, setEditUI] = useState<EditUIComponents | null>(null)

  useEffect(() => {
    if (effectiveMode !== 'edit') {
      setEditUI(null)
      return
    }

    // Dynamic import all edit-mode dependencies
    Promise.all([
      import('../components/navbar/Navbar'),
      import('../components/toolbar/Toolbar'),
      import('../components/sidebar/Sidebar'),
      import('../components/panel/RightPanel'),
      import('../components/statusbar/StatusBar'),
      import('../components/canvas/CommandPalette'),
      import('hotkeys-js'),
      import('../services'),
      import('../store'),
    ])
      .then(([nav, tb, sb, rp, st, cp, hk, svc, store]) => {
        setEditUI({
          Navbar: nav.Navbar,
          Toolbar: tb.Toolbar,
          Sidebar: sb.Sidebar,
          RightPanel: rp.RightPanel,
          StatusBar: st.StatusBar,
          CommandPalette: cp.CommandPalette,
          hotkeys: hk.default,
          showSuccess: svc.showSuccess,
          showError: svc.showError,
          showWarning: svc.showWarning,
          showInfo: svc.showInfo,
          showCommandPalette: store.showCommandPalette,
          hideCommandPalette: store.hideCommandPalette,
          toggleSidebar: store.toggleSidebar,
          togglePanel: store.togglePanel,
          toggleFocusMode: store.toggleFocusMode,
          startDebug: store.startDebug,
          stopDebug: store.stopDebug,
          cycleDensityMode: store.cycleDensityMode,
          commandPaletteVisible: store.commandPaletteVisible,
        })
      })
      .catch((err) => {
        console.error('[RuleFlowEditor] Failed to load edit UI:', err)
      })
  }, [effectiveMode])

  // ── Toast adapter wrapper ──
  const toast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
      if (toastAdapter) {
        toastAdapter[type](message)
      } else if (editUI) {
        // P0-B: Use dynamically loaded toast services
        switch (type) {
          case 'success':
            editUI.showSuccess(message)
            break
          case 'error':
            editUI.showError(message)
            break
          case 'warning':
            editUI.showWarning(message)
            break
          case 'info':
            editUI.showInfo(message)
            break
        }
      }
    },
    [toastAdapter, editUI],
  )

  // Sync theme from props
  useEffect(() => {
    if (themeProp) {
      setTheme(themeProp)
    }
  }, [themeProp])

  // ── P0-4: Sync debugState prop → internal debug signals ──
  // P0-B: debugState sync only needed in edit/monitor mode, moved to dynamic import
  useEffect(() => {
    if (!props.debugState || effectiveMode === 'view') return
    // Import debug store dynamically
    import('../store/debugStore').then(
      ({
        debugNodeStates,
        debugMessages,
        isDebugRunning,
        isDebugPaused,
        debugStep,
        debugTotalSteps,
      }) => {
        const ds = props.debugState!
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
      },
    )
  }, [props.debugState, effectiveMode])

  const collapsed = sidebarCollapsed.value
  const noPanel = panelClosed.value
  const focused = focusMode.value
  // P0-B: commandPaletteVisible only available in edit mode
  const cmdPaletteVisible = editUI?.commandPaletteVisible?.value ?? false

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

  // ── P0-B: Keyboard shortcuts (only in edit mode, after hotkeys loaded) ──
  useEffect(() => {
    if (effectiveMode !== 'edit' || !editUI?.hotkeys) return

    const el = containerRef.current
    if (!el) return

    const hotkeys = editUI.hotkeys

    // Set hotkeys scope to this editor instance
    hotkeys.setScope('ruleflow-editor')

    const bind = (actionId: string, handler: (e: KeyboardEvent) => void) => {
      const keys = effectiveShortcuts[actionId]
      if (!keys) return
      hotkeys(keys, { scope: 'ruleflow-editor' }, handler)
    }

    bind('command-palette', (e) => {
      e.preventDefault()
      editUI.showCommandPalette()
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
      editUI.toggleSidebar()
    })
    bind('toggle-panel', (e) => {
      e.preventDefault()
      editUI.togglePanel()
    })
    bind('cycle-density', (e) => {
      e.preventDefault()
      editUI.cycleDensityMode()
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
      else editUI.startDebug()
    })
    bind('debug-stop', (e) => {
      e.preventDefault()
      editUI.stopDebug()
    })
    bind('focus-mode', (e) => {
      e.preventDefault()
      editUI.toggleFocusMode()
    })

    return () => {
      hotkeys.deleteScope('ruleflow-editor')
    }
  }, [effectiveMode, editUI, hotkeyOverrides, onDebugStart, onSave, toast, effectiveShortcuts])

  // P0-B: Focus/blur handling (only in edit mode)
  useEffect(() => {
    if (effectiveMode !== 'edit' || !editUI?.hotkeys) return

    const el = containerRef.current
    if (!el) return

    const hotkeys = editUI.hotkeys

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
  }, [effectiveMode, editUI])

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
    showNavbar && effectiveMode === 'edit' ? 'var(--navbar-height)' : '',
    showToolbar && effectiveMode === 'edit' ? 'var(--toolbar-height)' : '',
    '1fr',
    showStatusBar && effectiveMode === 'edit' ? 'var(--statusbar-height)' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const areas = [
    showNavbar && effectiveMode === 'edit' ? '"navbar navbar navbar"' : '',
    showToolbar && effectiveMode === 'edit' ? '"toolbar toolbar toolbar"' : '',
    '"sidebar canvas panel"',
    showStatusBar && effectiveMode === 'edit' ? '"status status status"' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleExecuteCommand = (cmdId: string) => {
    if (!editUI) return
    switch (cmdId) {
      case 'run':
        if (onDebugStart) onDebugStart()
        else editUI.startDebug()
        break
      case 'stop':
        editUI.stopDebug()
        break
      default:
        console.log('Command:', cmdId)
    }
  }

  // ── P0-B: Loading state for edit mode ──
  if (effectiveMode === 'edit' && !editUI) {
    return (
      <div
        ref={containerRef}
        class="h-full flex items-center justify-center bg-[var(--rf-bg-primary)]"
        style={style}
      >
        <div class="text-[var(--rf-text-secondary)]">加载编辑器...</div>
      </div>
    )
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
      {/* P0-B: Edit UI components rendered only when loaded */}
      {editUI && showNavbar && <editUI.Navbar />}
      {editUI && effectiveShowToolbar && <editUI.Toolbar />}
      {editUI && effectiveShowSidebar && <editUI.Sidebar readOnly={effectiveReadOnly} />}
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
      {editUI && effectiveShowDebugPanel && !focused && (
        <editUI.RightPanel propertyRenderer={props.propertyRenderer} readOnly={effectiveReadOnly} />
      )}
      {editUI && showStatusBar && <editUI.StatusBar />}

      {/* Command palette (Ctrl+K) - only in edit mode */}
      {editUI && cmdPaletteVisible && (
        <editUI.CommandPalette
          onClose={editUI.hideCommandPalette}
          onExecuteCommand={handleExecuteCommand}
        />
      )}
    </div>
  )
}
