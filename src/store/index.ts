/**
 * RuleFlow Editor store — unified public API.
 * All store modules are re-exported from this single entry point.
 *
 * Exports marked with `@internal` are for cross-module internal use only;
 * components should prefer the higher-level action functions.
 *
 * @module store
 */

// Theme & density
export {
  theme,
  setTheme,
  densityMode,
  setDensityMode,
  cycleDensityMode,
  sidebarCollapsedCategories,
  toggleCategoryCollapse,
  isCategoryCollapsed,
} from './themeStore'

// Layout
export {
  sidebarCollapsed,
  toggleSidebar,
  panelClosed,
  togglePanel,
  focusMode,
  toggleFocusMode,
  activePanelTab,
  setActivePanelTab,
  panelMode,
  /** @internal used by PropertiesTab */ setPanelMode,
} from './layoutStore'

// Canvas
export {
  canvasZoom,
  setZoom,
  canvasStatus,
  setCanvasStatus,
  selectedNodeId,
  selectedEdgeId,
  selectedNodeIds,
  chainName,
  lastSaved,
  isDirty,
  lfInstance,
  /** @internal used by useLogicFlow */ setLfInstance,
  nodeCount,
  edgeCount,
  errorCount,
  warningCount,
  outlineNodes,
  relationSelectorState,
  showRelationSelector,
  hideRelationSelector,
  propertyBubbleState,
  showPropertyBubble,
  hidePropertyBubble,
  nodeSearchVisible,
  toggleNodeSearch,
  showNodeSearch,
  hideNodeSearch,
  batchToolbarState,
  showBatchToolbar,
  hideBatchToolbar,
} from './canvasStore'

// Debug — @internal signals are used by debugSimulation.ts
export {
  isDebugRunning,
  isDebugPaused,
  debugNodeId,
  /** @internal used by debugSimulation */ debugStep,
  /** @internal used by debugSimulation */ debugTotalSteps,
  /** @internal used by debugSimulation */ debugExecutionPath,
  debugNodeStates,
  debugMessages,
  debugBreakpoints,
  startDebug,
  pauseDebug,
  resumeDebug,
  stopDebug,
  stepDebug,
  toggleBreakpoint,
  /** @internal used by debugSimulation */ setDebugNodeState,
  /** @internal used by debugSimulation */ addDebugMessage,
} from './debugStore'

// Command palette & search
export {
  commandPaletteVisible,
  toggleCommandPalette,
  showCommandPalette,
  hideCommandPalette,
  searchQuery,
} from './commandStore'

// History (undo/redo)
export { canUndo, canRedo, undo, redo, /** @internal */ syncHistoryState } from './historyStore'
