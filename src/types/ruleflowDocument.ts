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

  // ── Input/Output definitions ──
  inputs?: RuleChainInput[]
  outputs?: RuleChainOutput[]

  // ── Graph data (editor native format) ──
  nodes: RuleFlowNode[]
  edges: RuleFlowEdge[]
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
  const outputs = parsed.outputs || chain.outputs || []

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

    // Rule-level fields to store on root condition node
    const ruleDescription = rule.description || ''
    const inputBindings = rule.input_bindings || rule.inputBindings || undefined
    const inputMode = rule.input_mode || rule.inputMode || undefined
    const targets = rule.targets || undefined

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
      // Attach rule-level fields to the root condition node
      const condNode = nodes.find((n) => n.id === conditionNodeId)
      if (condNode) {
        if (ruleDescription) condNode.properties.ruleDescription = ruleDescription
        if (inputBindings) condNode.properties.inputBindings = inputBindings
        if (inputMode) condNode.properties.inputMode = inputMode
        if (targets) condNode.properties.targets = targets
      }
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
          ruleDescription: ruleDescription || undefined,
          inputBindings,
          inputMode,
          targets,
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

  // ── Parse inputs ──
  const rawInputs = chain.inputs || []
  const inputs: RuleChainInput[] = rawInputs.map((inp: Record<string, any>) => ({
    pointName: inp.point_name || inp.pointName || '',
    displayName: inp.display_name || inp.displayName,
    pointType: inp.point_type || inp.pointType || 'analog',
    dataType: inp.data_type || inp.dataType || 'double',
    unit: inp.unit,
    group: inp.group,
    description: inp.description,
  }))

  // ── Build document ──
  return {
    chainId: chain.id || chain.chainId || 'unnamed',
    chainName: chain.name || chain.chainName || '未命名规则链',
    enabled: chain.enabled !== false,
    root: chain.root === true,
    evaluationMode: chain.evaluation_mode || chain.evaluationMode || 'all',
    description: chain.description || '',
    version: chain.version ?? undefined,
    status: chain.status || undefined,
    pipelineType: chain.pipeline_type || chain.pipelineType || undefined,
    inputs: inputs.length > 0 ? inputs : undefined,
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
      description: o.description,
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
  // 兼容 op / operator 两种键名
  const op = (condition.op || condition.operator || 'leaf').toLowerCase()
  // 兼容 conditions / children 两种键名
  const childConditions = condition.conditions || condition.children || []

  // Leaf condition — single rf-condition node
  if (
    op === 'leaf' ||
    (!condition.op && !condition.operator && !condition.conditions && !condition.children)
  ) {
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
  const childCount = childConditions.length
  // 内部存储使用大写 AND/OR/NOT
  const opUpper = op.toUpperCase() as ConditionOp

  nodes.push({
    id: gateNodeId,
    type: 'rf-logic-gate',
    x: baseX,
    y: baseY,
    text: `${opUpper} 条件组`,
    properties: {
      nodeType: 'logic_gate',
      icon: 'GitBranch',
      enabled: ruleEnabled,
      ruleId,
      roleInRule: 'logic_gate',
      priority,
      conditionOp: opUpper,
      collapsed: false,
      childCount,
      summary: `${opUpper}(${childCount} 个子条件)`,
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
 * Builds a JavaScript object matching the YAML structure, then serializes
 * with `yaml.dump()` for clean, spec-compliant output.
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

  // ── Build chain object ──
  const chainObj: Record<string, any> = {
    id: doc.chainId,
    name: doc.chainName,
    root: doc.root,
    enabled: doc.enabled,
  }
  if (doc.version != null) {
    chainObj.version = doc.version
  }
  if (doc.status) {
    chainObj.status = doc.status
  }
  if (doc.pipelineType) {
    chainObj.pipeline_type = doc.pipelineType
  }
  if (doc.evaluationMode) {
    chainObj.evaluation_mode = doc.evaluationMode
  }
  if (doc.description) {
    chainObj.description = doc.description
  }
  if (doc.inputs && doc.inputs.length > 0) {
    chainObj.inputs = doc.inputs.map((inp) => {
      const inputObj: Record<string, any> = {
        point_name: inp.pointName,
        point_type: inp.pointType,
        data_type: inp.dataType,
      }
      if (inp.displayName) inputObj.display_name = inp.displayName
      if (inp.unit) inputObj.unit = inp.unit
      if (inp.group) inputObj.group = inp.group
      if (inp.description) inputObj.description = inp.description
      return inputObj
    })
  }
  if (doc.outputs && doc.outputs.length > 0) {
    chainObj.outputs = doc.outputs.map((o) => {
      const outputObj: Record<string, any> = {
        point_name: o.pointName,
        display_name: o.displayName,
        point_type: o.pointType,
        data_type: o.dataType,
      }
      if (o.unit != null) outputObj.unit = o.unit
      if (o.group) outputObj.group = o.group
      if (o.scope) outputObj.scope = o.scope
      if (o.inputPoints && o.inputPoints.length > 0) {
        outputObj.input_points = [...o.inputPoints]
      }
      if (o.description) outputObj.description = o.description
      return outputObj
    })
  }

  // ── Build rules array ──
  const rulesArray: Record<string, any>[] = []

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

    const ruleObj: Record<string, any> = {
      id: ruleId,
      name: condNode?.text || anyCondNode?.text || ruleId,
      priority: condNode?.properties.priority ?? anyCondNode?.properties.priority ?? 0,
      enabled: condNode?.properties.enabled ?? anyCondNode?.properties.enabled ?? true,
    }

    // Rule-level fields from root condition node
    const rootCondProps = condNode?.properties
    if (rootCondProps?.ruleDescription) {
      ruleObj.description = rootCondProps.ruleDescription
    }
    if (rootCondProps?.inputBindings && rootCondProps.inputBindings.length > 0) {
      ruleObj.input_bindings = [...rootCondProps.inputBindings]
    }
    if (rootCondProps?.inputMode) {
      ruleObj.input_mode = rootCondProps.inputMode
    }
    if (rootCondProps?.targets && rootCondProps.targets.length > 0) {
      ruleObj.targets = [...rootCondProps.targets]
    }

    // Build condition block
    if (condNode) {
      ruleObj.condition = buildConditionObject(condNode.id, nodeMap, childrenMap)
    }

    if (actionNodes.length > 0) {
      ruleObj.actions = actionNodes.map((action) => {
        const actionObj: Record<string, any> = {
          type: action.properties.actionType,
        }
        if (
          action.properties.actionConfig &&
          Object.keys(action.properties.actionConfig).length > 0
        ) {
          actionObj.config = { ...action.properties.actionConfig }
        }
        return actionObj
      })
    }

    rulesArray.push(ruleObj)
  }

  // ── Serialize to YAML ──
  const yamlObj = {
    chain: chainObj,
    rules: rulesArray,
  }

  return yaml.dump(yamlObj, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  })
}

/**
 * Recursively build a condition object for YAML serialization.
 * Leaf conditions produce { operator: 'leaf', leaf_type, leaf_config }.
 * Logic gates (AND/OR/NOT) produce { operator: 'and'|'or'|'not', children: [...] }.
 */
function buildConditionObject(
  nodeId: string,
  nodeMap: Map<string, RuleFlowNode>,
  childrenMap: Map<string, string[]>,
): Record<string, any> {
  const node = nodeMap.get(nodeId)
  if (!node) return {}

  const op = node.properties.conditionOp

  // Leaf condition
  if (op === 'leaf' || (!op && node.properties.roleInRule === 'condition')) {
    const result: Record<string, any> = {
      operator: 'leaf',
    }
    if (node.properties.leafType) {
      result.leaf_type = node.properties.leafType
    }
    if (node.properties.leafConfig && Object.keys(node.properties.leafConfig).length > 0) {
      result.leaf_config = { ...node.properties.leafConfig }
    }
    return result
  }

  // Logic gate condition (AND/OR/NOT) — 输出小写操作符以兼容 Go 引擎
  const opLower = (op || 'and').toLowerCase()
  const result: Record<string, any> = {
    operator: opLower,
  }
  const childIds = childrenMap.get(nodeId) || []
  if (childIds.length > 0) {
    result.children = childIds.map((childId) => buildConditionObject(childId, nodeMap, childrenMap))
  }

  return result
}

/** Create an empty RuleFlowDocument with default values */
export function createEmptyDocument(chainId: string, chainName: string): RuleFlowDocument {
  return {
    chainId,
    chainName,
    enabled: true,
    root: false,
    evaluationMode: 'all',
    version: 1,
    status: 'draft',
    nodes: [],
    edges: [],
    inputs: [],
    outputs: [],
  }
}

/**
 * Parse rule chain definition from JSON string (web backend format).
 *
 * The web backend stores `RuleChainData.definition` as a JSON string.
 * The structure is similar to YAML but uses camelCase keys and may
 * have a slightly different nesting. This function normalizes it to
 * RuleFlowDocument.
 *
 * Expected JSON structure:
 * ```json
 * {
 *   "chain": { "id": "...", "name": "...", "root": true, "enabled": true, "evaluationMode": "all" },
 *   "rules": [
 *     {
 *       "id": "rule-1", "name": "Rule 1", "priority": 1, "enabled": true,
 *       "condition": { "op": "AND", "conditions": [...] },
 *       "actions": [{ "type": "alarm_notify_ext", "config": {} }]
 *     }
 *   ],
 *   "outputs": [{ "pointName": "...", "displayName": "..." }]
 * }
 * ```
 *
 * Also supports the YAML-compatible snake_case format (auto-detected):
 * ```json
 * { "chain": { "evaluation_mode": "all" }, "rules": [...] }
 * ```
 *
 * @param jsonString - The JSON content of a rulechain definition
 * @returns A RuleFlowDocument ready for the editor
 */
export function fromDefinitionJSON(jsonString: string): RuleFlowDocument {
  let parsed: Record<string, any>
  try {
    parsed = JSON.parse(jsonString)
  } catch (e) {
    throw new Error('fromDefinitionJSON: invalid JSON content', { cause: e })
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('fromDefinitionJSON: parsed result is not an object')
  }

  // Normalize camelCase ↔ snake_case keys so fromYAML can process it
  const chain = parsed.chain || parsed
  const rules = parsed.rules || []
  const outputs = parsed.outputs || []

  // Normalize chain keys
  const normalizedChain = {
    ...chain,
    id: chain.id || chain.chainId || '',
    name: chain.name || chain.chainName || '',
    evaluation_mode: chain.evaluation_mode || chain.evaluationMode || 'all',
  }

  // Normalize rule keys
  const normalizedRules = rules.map((rule: Record<string, any>) => ({
    ...rule,
    condition: rule.condition ? normalizeConditionKeys(rule.condition) : undefined,
    actions: (rule.actions || []).map((action: Record<string, any>) => ({
      ...action,
      config: action.config || action.actionConfig || {},
    })),
  }))

  // Normalize output keys
  const normalizedOutputs = outputs.map((o: Record<string, any>) => ({
    point_name: o.point_name || o.pointName || '',
    display_name: o.display_name || o.displayName || '',
    point_type: o.point_type || o.pointType || 'virtual',
    data_type: o.data_type || o.dataType || 'float64',
    unit: o.unit,
    group: o.group,
    scope: o.scope,
    input_points: o.input_points || o.inputPoints,
  }))

  // Re-serialize to YAML-compatible format and delegate to fromYAML
  const yamlCompatible = {
    chain: normalizedChain,
    rules: normalizedRules,
    outputs: normalizedOutputs,
  }

  // Use JSON.stringify → fromYAML (fromYAML uses yaml.load which handles JSON too)
  return fromYAML(JSON.stringify(yamlCompatible))
}

/**
 * Recursively normalize condition keys from camelCase to snake_case
 * for YAML-compatible processing by fromYAML.
 */
function normalizeConditionKeys(condition: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {
    ...condition,
    op: condition.op || condition.operator || 'leaf',
    leaf_type: condition.leaf_type || condition.leafType,
    leaf_config: condition.leaf_config || condition.leafConfig || condition.config,
  }

  const children = condition.conditions || condition.children
  if (children) {
    result.conditions = children.map((c: Record<string, any>) => normalizeConditionKeys(c))
  }

  return result
}
