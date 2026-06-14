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
    /** ID of the rule this node belongs to */
    ruleId: string
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

  // ── Graph data (editor native format) ──
  nodes: RuleFlowNode[]
  edges: RuleFlowEdge[]

  // ── Output definitions ──
  outputs?: RuleChainOutput[]
}

// ── YAML Compatibility (single-direction, non-core) ──────────────

import yaml from 'js-yaml'

/** Auto-increment ID counter for generated nodes/edges */
let idCounter = 0
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`
}

/** Reset ID counter (useful for testing) */
export function resetIdCounter(): void {
  idCounter = 0
}

/**
 * Layout constants for auto-positioning nodes during YAML import.
 * Nodes are arranged in a grid pattern by type order.
 */
const LAYOUT = {
  startX: 200,
  startY: 100,
  colSpacing: 280,
  rowSpacing: 120,
  inputY: 80,
  outputY: 80,
}

/**
 * Convert a VPPTU rulechain YAML string to RuleFlowDocument.
 * This is a one-time migration function for importing old configs.
 *
 * Expected YAML structure (ruleflow Go engine format):
 * ```yaml
 * chain:
 *   id: chain-1
 *   name: "My Chain"
 *   root: true
 *   enabled: true
 *   evaluation_mode: all
 *   description: "..."
 * rules:
 *   - id: rule-1
 *     name: "Rule 1"
 *     priority: 1
 *     enabled: true
 *     condition:
 *       op: AND / OR / NOT / leaf
 *       leaf_type: "value_range"
 *       leaf_config: { ... }
 *       conditions:
 *         - op: leaf
 *           leaf_type: "..."
 *           leaf_config: { ... }
 *     actions:
 *       - type: "alarm_notify_ext"
 *         config: { ... }
 * outputs:
 *   - point_name: ...
 *     display_name: ...
 * ```
 *
 * @param yamlString - The YAML content of a rulechain config
 * @returns A RuleFlowDocument ready for the editor
 */
export function fromYAML(yamlString: string): RuleFlowDocument {
  const parsed = yaml.load(yamlString) as Record<string, any>
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('fromYAML: invalid YAML content')
  }

  const chain = parsed.chain || parsed
  const rules = parsed.rules || []
  const outputs = parsed.outputs || []

  // Reset ID counter for deterministic output
  resetIdCounter()

  const nodes: RuleFlowNode[] = []
  const edges: RuleFlowEdge[] = []

  // ── Input port node ──
  const inputNodeId = nextId('node')
  nodes.push({
    id: inputNodeId,
    type: 'rf-input-port',
    x: LAYOUT.startX,
    y: LAYOUT.inputY,
    text: '输入',
    properties: {
      nodeType: 'port',
      icon: 'LogIn',
      enabled: true,
      ruleId: '',
      roleInRule: 'input',
    },
  })

  // ── Process each rule ──
  let ruleCol = 0

  for (const rule of rules) {
    const ruleId = rule.id || nextId('rule')
    const ruleName = rule.name || ruleId
    const priority = rule.priority ?? 1
    const ruleEnabled = rule.enabled !== false

    // Condition node(s)
    const condition = rule.condition
    let conditionNodeId: string

    if (condition) {
      conditionNodeId = processCondition(
        condition,
        ruleId,
        ruleName,
        priority,
        ruleEnabled,
        nodes,
        edges,
        LAYOUT.startX + (ruleCol + 1) * LAYOUT.colSpacing,
        LAYOUT.startY,
      )
    } else {
      // No condition — create a default pass-through
      conditionNodeId = nextId('node')
      nodes.push({
        id: conditionNodeId,
        type: 'rf-condition',
        x: LAYOUT.startX + (ruleCol + 1) * LAYOUT.colSpacing,
        y: LAYOUT.startY,
        text: ruleName,
        properties: {
          nodeType: 'condition',
          icon: 'GitBranch',
          enabled: ruleEnabled,
          ruleId,
          roleInRule: 'condition',
          priority,
          conditionOp: 'leaf',
          summary: '无条件（始终通过）',
        },
      })
    }

    // Edge from input to condition
    edges.push({
      id: nextId('edge'),
      type: 'polyline',
      sourceNodeId: inputNodeId,
      targetNodeId: conditionNodeId,
      properties: { relationType: 'default' },
    })

    // Action nodes
    const actions = rule.actions || []
    let prevNodeId = conditionNodeId

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      const actionNodeId = nextId('node')
      const actionType = action.type || 'transform'
      const actionName = action.name || actionType

      nodes.push({
        id: actionNodeId,
        type: 'rf-action',
        x: LAYOUT.startX + (ruleCol + 1) * LAYOUT.colSpacing,
        y: LAYOUT.startY + (i + 1) * LAYOUT.rowSpacing,
        text: actionName,
        properties: {
          nodeType: 'action',
          icon: 'Play',
          enabled: ruleEnabled,
          ruleId,
          roleInRule: 'action',
          actionType,
          actionConfig: action.config || {},
          actionOrder: i + 1,
          summary: actionType,
        },
      })

      // Edge from previous to action
      edges.push({
        id: nextId('edge'),
        type: 'polyline',
        sourceNodeId: prevNodeId,
        targetNodeId: actionNodeId,
        properties: { relationType: i === 0 ? 'True' : 'Success' },
      })

      prevNodeId = actionNodeId
    }

    // If no actions, connect condition to output with True edge
    if (actions.length === 0) {
      // Will be connected to output later
    }

    ruleCol++
  }

  // ── Output port node ──
  const outputNodeId = nextId('node')
  nodes.push({
    id: outputNodeId,
    type: 'rf-output-port',
    x: LAYOUT.startX + (ruleCol + 1) * LAYOUT.colSpacing,
    y: LAYOUT.outputY,
    text: '输出',
    properties: {
      nodeType: 'port',
      icon: 'LogOut',
      enabled: true,
      ruleId: '',
      roleInRule: 'output',
    },
  })

  // Connect last action of each rule (or condition if no actions) to output
  // Find all action nodes that have no outgoing Success edges, and condition nodes with no actions
  const nodesWithOutgoing = new Set(edges.map((e) => e.sourceNodeId))
  const terminalNodes = nodes.filter(
    (n) =>
      (n.properties.roleInRule === 'action' || n.properties.roleInRule === 'condition') &&
      !nodesWithOutgoing.has(n.id),
  )

  for (const terminal of terminalNodes) {
    edges.push({
      id: nextId('edge'),
      type: 'polyline',
      sourceNodeId: terminal.id,
      targetNodeId: outputNodeId,
      properties: {
        relationType: terminal.properties.roleInRule === 'condition' ? 'True' : 'Success',
      },
    })
  }

  // ── Build document ──
  return {
    chainId: chain.id || chain.chainId || 'unnamed',
    chainName: chain.name || chain.chainName || '未命名规则链',
    enabled: chain.enabled !== false,
    root: chain.root === true,
    evaluationMode: chain.evaluation_mode || chain.evaluationMode || 'all',
    description: chain.description || '',
    nodes,
    edges,
    outputs: outputs.map((o: Record<string, any>) => ({
      pointName: o.point_name || o.pointName || '',
      displayName: o.display_name || o.displayName || '',
      pointType: o.point_type || o.pointType || 'virtual',
      dataType: o.data_type || o.dataType || 'float64',
      unit: o.unit,
      group: o.group,
      scope: o.scope,
      inputPoints: o.input_points || o.inputPoints,
    })),
  }
}

/**
 * Process a condition block from YAML, creating the appropriate nodes and edges.
 * Handles both leaf conditions and nested AND/OR/NOT condition trees.
 */
function processCondition(
  condition: Record<string, any>,
  ruleId: string,
  ruleName: string,
  priority: number,
  ruleEnabled: boolean,
  nodes: RuleFlowNode[],
  edges: RuleFlowEdge[],
  baseX: number,
  baseY: number,
): string {
  const op = condition.op || 'leaf'

  // Leaf condition — single rf-condition node
  if (op === 'leaf' || (!condition.op && !condition.conditions)) {
    const nodeId = nextId('node')
    const leafType = condition.leaf_type || condition.type || 'expr_filter'
    const summary = condition.summary || leafType

    nodes.push({
      id: nodeId,
      type: 'rf-condition',
      x: baseX,
      y: baseY,
      text: ruleName,
      properties: {
        nodeType: 'condition',
        icon: 'GitBranch',
        enabled: ruleEnabled,
        ruleId,
        roleInRule: 'condition',
        priority,
        conditionOp: 'leaf',
        leafType,
        leafConfig: condition.leaf_config || condition.config || {},
        summary,
      },
    })

    return nodeId
  }

  // Logic gate condition (AND/OR/NOT) — rf-logic-gate node + child conditions
  const gateNodeId = nextId('node')
  const childConditions = condition.conditions || []
  const childCount = childConditions.length

  nodes.push({
    id: gateNodeId,
    type: 'rf-logic-gate',
    x: baseX,
    y: baseY,
    text: `${op} 条件组`,
    properties: {
      nodeType: 'logic_gate',
      icon: 'GitBranch',
      enabled: ruleEnabled,
      ruleId,
      roleInRule: 'logic_gate',
      priority,
      conditionOp: op as ConditionOp,
      collapsed: false,
      childCount,
      summary: `${op}(${childCount} 个子条件)`,
    },
  })

  // Process child conditions
  for (let i = 0; i < childConditions.length; i++) {
    const child = childConditions[i]
    const childNodeId = processCondition(
      child,
      ruleId,
      `${ruleName}.条件${i + 1}`,
      priority,
      ruleEnabled,
      nodes,
      edges,
      baseX + LAYOUT.colSpacing,
      baseY + i * LAYOUT.rowSpacing,
    )

    // Edge from gate to child (condition tree edge)
    edges.push({
      id: nextId('edge'),
      type: 'condition-tree-edge',
      sourceNodeId: gateNodeId,
      targetNodeId: childNodeId,
      properties: { relationType: 'default' },
    })
  }

  return gateNodeId
}

/**
 * Convert a RuleFlowDocument to VPPTU rulechain YAML string.
 * This is a one-time export function for human-readable output.
 *
 * Handles recursive LogicGate (AND/OR/NOT) nodes by following
 * condition-tree-edge connections to reconstruct nested conditions.
 *
 * @param doc - The RuleFlowDocument to export
 * @returns A YAML string representation
 */
export function toYAML(doc: RuleFlowDocument): string {
  // Build lookup maps
  const nodeMap = new Map<string, RuleFlowNode>()
  for (const node of doc.nodes) {
    nodeMap.set(node.id, node)
  }

  // Build adjacency: nodeId → child node IDs via condition-tree-edge
  const childrenMap = new Map<string, string[]>()
  // Also track which nodes are targets of condition-tree-edges (to find roots)
  const ctEdgeTargets = new Set<string>()
  for (const edge of doc.edges) {
    if (edge.type === 'condition-tree-edge') {
      const children = childrenMap.get(edge.sourceNodeId) || []
      children.push(edge.targetNodeId)
      childrenMap.set(edge.sourceNodeId, children)
      ctEdgeTargets.add(edge.targetNodeId)
    }
  }

  // Group nodes by ruleId to reconstruct rules
  const rulesMap = new Map<string, RuleFlowNode[]>()
  for (const node of doc.nodes) {
    const ruleId = node.properties.ruleId
    if (!ruleId) continue
    if (!rulesMap.has(ruleId)) {
      rulesMap.set(ruleId, [])
    }
    rulesMap.get(ruleId)!.push(node)
  }

  // Build YAML structure
  const rules: string[] = []

  for (const [ruleId, nodes] of rulesMap) {
    const actionNodes = nodes
      .filter((n) => n.properties.roleInRule === 'action')
      .sort((a, b) => (a.properties.actionOrder ?? 0) - (b.properties.actionOrder ?? 0))

    // Find the root condition node: a condition or logic_gate node that is NOT
    // a target of any condition-tree-edge (i.e., not a child of another gate)
    const conditionNodes = nodes.filter(
      (n) =>
        (n.properties.roleInRule === 'condition' || n.properties.roleInRule === 'logic_gate') &&
        !ctEdgeTargets.has(n.id),
    )

    // The root condition node is the first one not targeted by condition-tree-edge
    const condNode = conditionNodes[0]

    // Get rule name from the root condition node, or from any condition node in the tree
    const anyCondNode =
      nodes.find((n) => n.properties.roleInRule === 'condition') ||
      nodes.find((n) => n.properties.roleInRule === 'logic_gate')

    let yaml = `  - id: ${ruleId}\n`
    yaml += `    name: "${condNode?.text || anyCondNode?.text || ruleId}"\n`
    yaml += `    priority: ${condNode?.properties.priority ?? anyCondNode?.properties.priority ?? 0}\n`
    yaml += `    enabled: ${condNode?.properties.enabled ?? anyCondNode?.properties.enabled ?? true}\n`

    // Build condition block
    if (condNode) {
      yaml += `    condition:\n`
      yaml += buildConditionYAML(condNode.id, nodeMap, childrenMap, '      ')
    }

    if (actionNodes.length > 0) {
      yaml += `    actions:\n`
      for (const action of actionNodes) {
        yaml += `      - type: "${action.properties.actionType}"\n`
        if (
          action.properties.actionConfig &&
          Object.keys(action.properties.actionConfig).length > 0
        ) {
          yaml += `        config:\n`
          for (const [key, value] of Object.entries(action.properties.actionConfig)) {
            yaml += `          ${key}: ${JSON.stringify(value)}\n`
          }
        }
      }
    }

    rules.push(yaml)
  }

  let output = `chain:\n`
  output += `  id: ${doc.chainId}\n`
  output += `  name: "${doc.chainName}"\n`
  output += `  root: ${doc.root}\n`
  output += `  enabled: ${doc.enabled}\n`
  if (doc.evaluationMode) {
    output += `  evaluation_mode: ${doc.evaluationMode}\n`
  }
  if (doc.description) {
    output += `  description: "${doc.description}"\n`
  }
  output += `\nrules:\n`
  output += rules.join('\n')

  if (doc.outputs && doc.outputs.length > 0) {
    output += `\noutputs:\n`
    for (const o of doc.outputs) {
      output += `  - point_name: ${o.pointName}\n`
      output += `    display_name: "${o.displayName}"\n`
      output += `    point_type: ${o.pointType}\n`
      output += `    data_type: ${o.dataType}\n`
    }
  }

  return output
}

/**
 * Recursively build YAML condition block for a node.
 * Leaf conditions produce leaf_type/leaf_config.
 * Logic gates (AND/OR/NOT) produce op + nested conditions.
 */
function buildConditionYAML(
  nodeId: string,
  nodeMap: Map<string, RuleFlowNode>,
  childrenMap: Map<string, string[]>,
  indent: string,
): string {
  const node = nodeMap.get(nodeId)
  if (!node) return ''

  const op = node.properties.conditionOp

  // Leaf condition
  if (op === 'leaf' || (!op && node.properties.roleInRule === 'condition')) {
    let yaml = `${indent}op: leaf\n`
    if (node.properties.leafType) {
      yaml += `${indent}leaf_type: "${node.properties.leafType}"\n`
    }
    if (node.properties.leafConfig && Object.keys(node.properties.leafConfig).length > 0) {
      yaml += `${indent}leaf_config:\n`
      for (const [key, value] of Object.entries(node.properties.leafConfig)) {
        yaml += `${indent}  ${key}: ${JSON.stringify(value)}\n`
      }
    }
    return yaml
  }

  // Logic gate condition (AND/OR/NOT)
  let yaml = `${indent}op: ${op}\n`
  const childIds = childrenMap.get(nodeId) || []
  if (childIds.length > 0) {
    yaml += `${indent}conditions:\n`
    for (const childId of childIds) {
      yaml += `${indent}  - \n`
      yaml += buildConditionYAML(childId, nodeMap, childrenMap, `${indent}    `)
    }
  }

  return yaml
}

/** Create an empty RuleFlowDocument with default values */
export function createEmptyDocument(chainId: string, chainName: string): RuleFlowDocument {
  return {
    chainId,
    chainName,
    enabled: true,
    root: false,
    evaluationMode: 'all',
    nodes: [],
    edges: [],
    outputs: [],
  }
}
