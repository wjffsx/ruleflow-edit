import { signal, computed } from '@preact/signals'

// Theme
export const theme = signal(localStorage.getItem('rf-theme') || 'light')
export function setTheme(t) {
  theme.value = t
  localStorage.setItem('rf-theme', t)
  document.documentElement.setAttribute('data-theme', t)
}

// v2.0: Density mode (Spec 5.4 / 18.4)
export const densityMode = signal(localStorage.getItem('rf-density') || 'comfortable')
export function setDensityMode(mode) {
  densityMode.value = mode
  localStorage.setItem('rf-density', mode)
  document.documentElement.setAttribute('data-density', mode === 'comfortable' ? '' : mode)
}
export function cycleDensityMode() {
  const modes = ['comfortable', 'compact', 'ultra-compact']
  const currentIdx = modes.indexOf(densityMode.value)
  const nextIdx = (currentIdx + 1) % modes.length
  setDensityMode(modes[nextIdx])
}

// Layout state
export const sidebarCollapsed = signal(false)
export const panelClosed = signal(false)
export const focusMode = signal(false)
export const activePanelTab = signal('properties') // 'properties' | 'debug' | 'outline'
export const panelMode = signal('fixed') // 'fixed' | 'floating' | 'inline'

// Canvas state
export const canvasZoom = signal(100)
export const canvasStatus = signal('editing') // 'editing' | 'running' | 'deployed' | 'disabled'

// Selection
export const selectedNodeId = signal(null)
export const selectedEdgeId = signal(null)
export const selectedNodeIds = signal([]) // multi-select for batch ops

// Chain info
export const chainName = signal('未命名规则链')
export const lastSaved = signal(null)
export const isDirty = signal(false)

// LogicFlow instance reference (set by CanvasViewport)
export let lfInstance = null
export function setLfInstance(lf) { lfInstance = lf }

// Stats
export const nodeCount = signal(0)
export const edgeCount = signal(0)
export const errorCount = signal(0)
export const warningCount = signal(0)

// ── Phase 2: Interactive Enhancement ──

// Relation type selector (appears after edge creation)
export const relationSelectorState = signal(null) // { x, y, edgeId } | null
export function showRelationSelector(x, y, edgeId) {
  relationSelectorState.value = { x, y, edgeId }
}
export function hideRelationSelector() {
  relationSelectorState.value = null
}

// Property bubble (appears near selected node)
export const propertyBubbleState = signal(null) // { x, y, nodeData } | null
export function showPropertyBubble(x, y, nodeData) {
  propertyBubbleState.value = { x, y, nodeData }
}
export function hidePropertyBubble() {
  propertyBubbleState.value = null
}

// Node search (Ctrl+F)
export const nodeSearchVisible = signal(false)
export function toggleNodeSearch() {
  nodeSearchVisible.value = !nodeSearchVisible.value
}
export function showNodeSearch() {
  nodeSearchVisible.value = true
}
export function hideNodeSearch() {
  nodeSearchVisible.value = false
}

// Batch action toolbar
export const batchToolbarState = signal(null) // { x, y, count } | null
export function showBatchToolbar(x, y, count) {
  batchToolbarState.value = { x, y, count }
}
export function hideBatchToolbar() {
  batchToolbarState.value = null
}

// Sidebar category collapse state (persisted in localStorage)
const SAVED_COLLAPSE_KEY = 'rf-sidebar-collapsed'
function loadCollapsedState() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_COLLAPSE_KEY)) || {}
  } catch { return {} }
}
export const sidebarCollapsedCategories = signal(loadCollapsedState())
export function toggleCategoryCollapse(categoryId) {
  const current = { ...sidebarCollapsedCategories.value }
  current[categoryId] = !current[categoryId]
  sidebarCollapsedCategories.value = current
  localStorage.setItem(SAVED_COLLAPSE_KEY, JSON.stringify(current))
}
export function isCategoryCollapsed(categoryId) {
  return !!sidebarCollapsedCategories.value[categoryId]
}

// ── Phase 3: Debug Experience ──

// Debug state
export const isDebugRunning = signal(false)
export const debugNodeId = signal(null)
export const debugStep = signal(0) // current step in execution
export const debugTotalSteps = signal(0)
export const debugExecutionPath = signal([]) // ordered list of node IDs in execution path
export const debugNodeStates = signal({}) // { nodeId: 'success' | 'failure' | 'processing' | 'idle' }
export const debugMessages = signal([]) // { time, nodeId, type, message }
export const debugBreakpoints = signal([]) // [nodeId, ...]
export const isDebugPaused = signal(false)

export function startDebug() {
  isDebugRunning.value = true
  isDebugPaused.value = false
  canvasStatus.value = 'running'
  activePanelTab.value = 'debug'
}

export function pauseDebug() {
  isDebugPaused.value = true
}

export function resumeDebug() {
  isDebugPaused.value = false
}

export function stopDebug() {
  isDebugRunning.value = false
  isDebugPaused.value = false
  debugStep.value = 0
  debugExecutionPath.value = []
  debugNodeStates.value = {}
  canvasStatus.value = 'editing'
}

export function stepDebug() {
  if (debugStep.value < debugTotalSteps.value) {
    debugStep.value++
  }
}

export function toggleBreakpoint(nodeId) {
  const bps = [...debugBreakpoints.value]
  const idx = bps.indexOf(nodeId)
  if (idx >= 0) {
    bps.splice(idx, 1)
  } else {
    bps.push(nodeId)
  }
  debugBreakpoints.value = bps
}

export function setDebugNodeState(nodeId, state) {
  debugNodeStates.value = { ...debugNodeStates.value, [nodeId]: state }
}

export function addDebugMessage(msg) {
  debugMessages.value = [...debugMessages.value, { ...msg, time: Date.now() }]
}

// ── Phase 4: Ecosystem ──

// Command palette (Ctrl+K)
export const commandPaletteVisible = signal(false)
export function toggleCommandPalette() {
  commandPaletteVisible.value = !commandPaletteVisible.value
}
export function showCommandPalette() {
  commandPaletteVisible.value = true
}
export function hideCommandPalette() {
  commandPaletteVisible.value = false
}

// Search
export const searchQuery = signal('')

// History (undo/redo)
export const canUndo = signal(false)
export const canRedo = signal(false)

// ── Actions ──

export function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

export function togglePanel() {
  panelClosed.value = !panelClosed.value
}

export function toggleFocusMode() {
  focusMode.value = !focusMode.value
  if (focusMode.value) {
    sidebarCollapsed.value = true
    panelClosed.value = true
  }
}

export function setZoom(z) {
  canvasZoom.value = Math.min(200, Math.max(25, Math.round(z)))
}

export function setCanvasStatus(s) {
  canvasStatus.value = s
}

export function setActivePanelTab(tab) {
  activePanelTab.value = tab
}

export function setPanelMode(mode) {
  panelMode.value = mode
}
