/**
 * RuleFlow Editor — public API entry point.
 *
 * This is the single library entry for consumers. All public types,
 * components, hooks, stores, data, services, and utilities are
 * re-exported from here. Internal implementation details are excluded.
 *
 * @module ruleflow-edit
 */

// ── Types ──────────────────────────────────────────────────────────
export type {
  NodeCategory,
  NodeItem,
  VisualCategory,
  PortNode,
  NoteNode,
  RelationType,
  NodeTypeMeta,
  ThemeMode,
  DensityMode,
  CanvasStatus,
  PanelTab,
  PanelMode,
  DebugNodeState,
  DebugMessage,
  PropertyBubbleState,
  RelationSelectorState,
  SearchItem,
  CommandItem,
} from './types/editor'

export type {
  NodeData,
  EdgeData,
  GraphData,
  NodeModel,
  EdgeModel,
  TransformModel,
  EventCenter,
  GraphModel,
} from '@logicflow/core'

// ── Components ─────────────────────────────────────────────────────
export { App } from './app'
export { CanvasViewport } from './components/canvas/CanvasViewport'
export { CommandPalette } from './components/canvas/CommandPalette'
export { EmptyState } from './components/canvas/EmptyState'
export { NodeSearch } from './components/canvas/NodeSearch'
export { PropertyBubble } from './components/canvas/PropertyBubble'
export { RelationTypeSelector } from './components/canvas/RelationTypeSelector'
export { ZoomControls } from './components/canvas/ZoomControls'
export { BatchActionToolbar } from './components/canvas/BatchActionToolbar'
export { ErrorBoundary } from './components/common/ErrorBoundary'
export { Navbar } from './components/navbar/Navbar'
export { DebugPanel } from './components/panel/DebugPanel'
export { OutlineTab } from './components/panel/OutlineTab'
export { PropertiesTab } from './components/panel/PropertiesTab'
export { RightPanel } from './components/panel/RightPanel'
export { Sidebar } from './components/sidebar/Sidebar'
export { StatusBar } from './components/statusbar/StatusBar'
export { Toolbar } from './components/toolbar/Toolbar'
export { ToolbarBtn } from './components/toolbar/ToolbarBtn'
export { ContextActions } from './components/toolbar/ContextActions'
export { FileGroup } from './components/toolbar/FileGroup'
export { EditGroup } from './components/toolbar/EditGroup'
export { RunGroup } from './components/toolbar/RunGroup'
export { ViewGroup } from './components/toolbar/ViewGroup'
export { LayoutGroup } from './components/toolbar/LayoutGroup'
export { ThemeToggle } from './theme'

// ── Hooks ──────────────────────────────────────────────────────────
export { useLogicFlow } from './components/canvas/useLogicFlow'
export { setupLogicFlowEvents } from './components/canvas/useLogicFlowEvents'

// ── Node registration classes ──────────────────────────────────────
export { RuleFlowBaseModel, RuleFlowBaseView, CUSTOM_NODE_TYPES } from './components/nodes/BaseNode'
export {
  RelationEdgeModel,
  RelationEdgeView,
  RELATION_EDGE_TYPE,
  getRelationColor,
} from './components/nodes/RelationEdges'

// ── Store (public signals & actions only) ──────────────────────────
export {
  // Theme & density
  theme,
  setTheme,
  densityMode,
  setDensityMode,
  cycleDensityMode,
  sidebarCollapsedCategories,
  toggleCategoryCollapse,
  isCategoryCollapsed,
  // Layout
  sidebarCollapsed,
  toggleSidebar,
  panelClosed,
  togglePanel,
  focusMode,
  toggleFocusMode,
  activePanelTab,
  setActivePanelTab,
  panelMode,
  // Canvas
  canvasZoom,
  setZoom,
  canvasStatus,
  selectedNodeId,
  selectedEdgeId,
  selectedNodeIds,
  chainName,
  lastSaved,
  isDirty,
  lfInstance,
  nodeCount,
  edgeCount,
  errorCount,
  warningCount,
  outlineNodes,
  // Debug
  isDebugRunning,
  isDebugPaused,
  debugNodeId,
  debugNodeStates,
  debugMessages,
  debugBreakpoints,
  startDebug,
  pauseDebug,
  resumeDebug,
  stopDebug,
  stepDebug,
  toggleBreakpoint,
  // History
  canUndo,
  canRedo,
  undo,
  redo,
} from './store'

// ── Data ───────────────────────────────────────────────────────────
export {
  NODE_CATEGORIES,
  PORT_NODES,
  NOTE_NODE,
  RELATION_TYPES,
  NODE_TYPE_MAP,
  NODE_VISUAL_MAP,
  NODE_STYLE_MAP,
  CATEGORY_TO_LF_TYPE,
  TYPE_ORDER,
  getNodeStyle,
  ICON_MAP,
  DEMO_DATA,
} from './data'

// ── Services ───────────────────────────────────────────────────────
export { searchService } from './services/searchService'
export { calculateSimplePosition } from './services/floatingPosition'
export { showSuccess, showError, showWarning, showInfo } from './services/toastService'

// ── Utils ──────────────────────────────────────────────────────────
export {
  safeReadStorage,
  safeJsonParse,
  hasRequiredKeys,
  isValidGraphData,
  isValidNodeItem,
  safeGetTheme,
  safeGetThemePref,
  safeGetDensity,
  safeGetLang,
  safeReadJsonStorage,
  isBooleanRecord,
  safeSetStorage,
} from './utils/validation'
export { RuleFlowError, ERROR_CODES } from './utils/errors'
export type { ErrorCode } from './utils/errors'

// ── i18n ───────────────────────────────────────────────────────────
export { currentLang, t, getLang, setLang } from './i18n'
