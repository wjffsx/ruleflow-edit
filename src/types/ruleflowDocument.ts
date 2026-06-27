/**
 * Unified RuleFlow Document — the single data format for the entire system.
 *
 * This format is used by:
 * - Frontend editor (zero transformation)
 * - Backend API (JSON response/request)
 * - File storage (.json)
 * - Debug engine (node IDs naturally aligned)
 *
 * @module ruleflowDocument
 */

// ── Core Types ──────────────────────────────────────────────────

/** Role of a node within its parent rule */
export type RoleInRule = 'condition' | 'action' | 'input' | 'output' | 'logic_gate'

/** Condition combination operator */
export type ConditionOp = 'AND' | 'OR' | 'NOT' | 'leaf'

/** Relation type for edges */
export type RelationType = 'default' | 'True' | 'False' | 'Success' | 'Failure' | 'Custom'

/** Evaluation mode for the rule chain */
export type EvaluationMode = 'all' | 'any'

/** Output definition for a rule chain */
export interface RuleChainOutput {
  pointName: string
  displayName: string
  pointType: string
  dataType: string
  unit?: string
  group?: string
  scope?: 'per_device' | 'global'
  inputPoints?: string[]
  description?: string
}

/** Input definition for a rule chain (Phase 1) */
export interface RuleChainInput {
  pointName: string
  displayName?: string
  pointType: string
  dataType: string
  unit?: string
  group?: string
  description?: string
}

/** Node in the unified graph */
export interface RuleFlowNode {
  id: string
  /** LogicFlow node type: rf-input-port / rf-condition / rf-action / rf-output-port / rf-logic-gate */
  type: string
  /** Canvas X coordinate (frontend only, backend ignores) */
  x: number
  /** Canvas Y coordinate (frontend only, backend ignores) */
  y: number
  /** Display text */
  text: string
  properties: {
    /** Visual node type category */
    nodeType: string
    /** Icon character or name */
    icon: string
    /** Whether the node is enabled */
    enabled?: boolean

    // ── Logical attribution (required by backend) ──
    /** ID of the rule this node belongs to. Inherits from document.defaultRuleId if empty. */
    ruleId?: string
    /** Role of this node within its rule */
    roleInRule: RoleInRule
    /** Rule priority (only on condition nodes) */
    priority?: number

    // ── Condition details ──
    /** Condition combination type */
    conditionOp?: ConditionOp
    /** Leaf condition type: expr_filter / limit_exceeded / quality / fqn_prefix / point_name */
    leafType?: string
    /** Leaf condition configuration */
    leafConfig?: Record<string, unknown>

    // ── Action details ──
    /** Action type: alarm_notify_ext / quality_mark_ext / calc_node / storage_write / ... */
    actionType?: string
    /** Action configuration */
    actionConfig?: Record<string, unknown>
    /** Action order within the same rule */
    actionOrder?: number

    // ── Display (frontend) ──
    /** Condition summary text */
    summary?: string

    // ── Rule-level fields (stored on root condition node) ──
    /** Rule description */
    ruleDescription?: string
    /** Input bindings for this rule */
    inputBindings?: string[]
    /** Input mode: single or multi */
    inputMode?: 'single' | 'multi'
    /** Route targets */
    targets?: string[]

    // ── Logic gate specific ──
    /** Whether the logic gate node is collapsed */
    collapsed?: boolean
    /** Number of child conditions in the logic gate */
    childCount?: number
  }
}

/** Edge in the unified graph */
export interface RuleFlowEdge {
  id: string
  /** Edge type (typically 'polyline') */
  type: string
  sourceNodeId: string
  targetNodeId: string
  properties: {
    relationType: RelationType
  }
}

/** The unified document format — single source of truth */
export interface RuleFlowDocument {
  // ── Metadata (from YAML top-level) ──
  chainId: string
  chainName: string
  enabled: boolean
  root: boolean
  evaluationMode: EvaluationMode
  description?: string
  version?: number
  status?: string
  pipelineType?: string

  /** 节点默认所属规则 ID，单规则链时避免每个节点重复编写 ruleId */
  defaultRuleId?: string

  // ── Input/Output definitions ──
  inputs?: RuleChainInput[]
  outputs?: RuleChainOutput[]

  // ── Graph data (editor native format) ──
  nodes: RuleFlowNode[]
  edges: RuleFlowEdge[]
}
