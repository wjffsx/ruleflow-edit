/**
 * RuleFlow Editor — View-only entry point.
 *
 * This entry exports only the components needed for read-only visualization:
 * - RuleFlowEditor (view mode)
 * - YAML parser utilities
 * - Core types
 *
 * Edit-mode components (Navbar, Toolbar, Sidebar, DebugPanel, etc.) are NOT included,
 * reducing bundle size by ~200KB for view-only scenarios.
 *
 * @module ruleflow-edit/view
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
  RuleFlowDocument,
  RuleFlowNode,
  RuleFlowEdge,
  RuleChainOutput,
  RoleInRule,
  ConditionOp,
  RelationType as EdgeRelationType,
  EvaluationMode,
} from './types/ruleflowDocument'

// ── Core Components (view mode only) ───────────────────────────────
export { RuleFlowEditor } from './layout/RuleFlowEditor'
export type {
  RuleFlowEditorProps,
  DebugState,
  ToastAdapter,
  EditorMode,
  MonitorState,
  MonitorNodeState,
  MonitorEdgeState,
} from './layout/RuleFlowEditor'

// ── View-only canvas component ─────────────────────────────────────
export { CanvasViewport } from './components/canvas/CanvasViewport'

// ── Minimal store signals (needed for view mode) ───────────────────
export {
  // Canvas
  canvasZoom,
  setZoom,
  canvasStatus,
  selectedNodeId,
  selectedEdgeId,
  chainName,
  lfInstance,
  nodeCount,
  edgeCount,
  // Layout (for grid calculation)
  sidebarCollapsed,
  panelClosed,
  focusMode,
} from './store'

// ── Node registration (needed for rendering) ───────────────────────
export { RuleFlowBaseModel, RuleFlowBaseView, CUSTOM_NODE_TYPES } from './components/nodes/BaseNode'
export {
  RelationEdgeModel,
  RelationEdgeView,
  RELATION_EDGE_TYPE,
  ConditionTreeEdgeModel,
  ConditionTreeEdgeView,
  CONDITION_TREE_EDGE_TYPE,
  getRelationColor,
} from './components/nodes/RelationEdges'
export {
  LogicGateModel,
  LogicGateView,
  LOGIC_GATE_NODE_TYPE,
} from './components/nodes/LogicGateNode'
export type { LogicGateOp } from './components/nodes/LogicGateNode'

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
} from './data'

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

// ── v0.4.0 语义/视图分离 API（外部集成必用）──────────────────────
export type {
  SemanticDocument,
  SemanticNode,
  SemanticEdge,
  ViewDocument,
  ViewNode,
  ViewEdge,
  SplitResult,
  ValidationError,
  ValidationResult,
} from './utils/ruleflowSerializer'

export {
  buildSemanticDocument,
  buildViewDocument,
  splitToSemanticAndView,
  mergeFromSemanticAndView,
  validateSemanticDocument,
  isValidRuleId,
  generateRuleId,
  saveViewToLocalStorage,
  loadViewFromLocalStorage,
  clearViewFromLocalStorage,
  downloadAsJsonFile,
  downloadAsJsonPair,
  readJsonFile,
} from './utils/ruleflowSerializer'

// ── v0.4.0 旧版兼容 API（迁移期）────────────────────────────
export { buildRuleflowDocument, applyDocumentToLf } from './utils/ruleflowSerializer'
