/**
 * Ruleflow 文档与 LogicFlow 实例的双向转换
 * - buildRuleflowDocument: LogicFlow → RuleFlowDocument（保存）
 * - applyDocumentToLf: RuleFlowDocument → LogicFlow（加载）
 * - downloadAsJsonFile: 浏览器端下载 JSON
 * - readJsonFile: File → RuleFlowDocument
 * - buildSemanticDocument: LogicFlow → SemanticDocument（后端使用，纯语义）
 * - buildViewDocument: LogicFlow → ViewDocument（前端使用，纯视图）
 * - mergeFromSemanticAndView: semantic + view → RuleFlowDocument（加载）
 * - saveViewToLocalStorage / loadViewFromLocalStorage: 视图态本地化
 *
 * 统一两条保存路径（Ctrl+S + 工具栏"保存"），保证字节级一致。
 */
import type { LogicFlow } from '@logicflow/core'
import type { RuleFlowDocument, RuleFlowNode, RuleFlowEdge } from '../types/ruleflowDocument'

// ============================================================
// 阶段 2: 语义/视图分离类型定义
// ============================================================

/** 后端使用的纯语义数据（无任何视图状态） */
export interface SemanticDocument {
  /** 文档 schema 版本 */
  version: string | number
  /** 规则链 ID */
  chainId: string
  /** 规则链名称 */
  chainName: string
  /** 是否启用 */
  enabled: boolean
  /** 是否根规则链 */
  root: boolean
  /** 评估模式 */
  evaluationMode: 'all' | 'any'
  /** 描述 */
  description?: string
  /** 文档语义版本号 */
  schemaVersion: number
  /** 状态 */
  status?: 'draft' | 'published' | 'archived'
  /** 管道类型 */
  pipelineType?: 'standard' | 'fast' | 'batch'
  /** 节点默认所属规则 ID（节点无 ruleId 时使用此值） */
  defaultRuleId?: string
  /** 输入数据点 */
  inputs?: Array<Record<string, unknown>>
  /** 输出数据点 */
  outputs?: Array<Record<string, unknown>>
  /** 节点（纯语义，不含 x/y/icon/width/height） */
  nodes: SemanticNode[]
  /** 边（纯语义，不含 pointsList/startPoint/endPoint） */
  edges: SemanticEdge[]
}

/** 语义节点：仅含后端需要的字段 */
export interface SemanticNode {
  id: string
  type: string
  /** 节点显示文本（拍扁后的 string） */
  text: string
  /** 业务属性（不含视图字段） */
  properties: Record<string, unknown>
}

/** 语义边：仅含后端需要的字段 */
export interface SemanticEdge {
  id: string
  type: string
  sourceNodeId: string
  targetNodeId: string
  properties: Record<string, unknown>
}

/** 前端使用的纯视图状态（可本地化存储） */
export interface ViewDocument {
  /** 视图层 schema 版本 */
  version: string | number
  /** 关联的规则链 ID（可选，用于多链区分） */
  chainId?: string
  /** 节点位置/尺寸/图标 */
  nodes: ViewNode[]
  /** 边几何/标签 */
  edges: ViewEdge[]
  /** 视图层缩放/平移 */
  transform?: {
    scale: number
    translateX: number
    translateY: number
  }
  /** 画布网格显示状态 */
  gridVisible?: boolean
  /** 当前选中节点 ID（用于恢复选中状态） */
  selectedNodeId?: string | null
}

export interface ViewNode {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  icon?: string
  collapsed?: boolean
}

export interface ViewEdge {
  id: string
  sourceAnchorId?: string
  targetAnchorId?: string
  startPoint?: { x: number; y: number }
  endPoint?: { x: number; y: number }
  pointsList?: Array<{ x: number; y: number }>
  text?: { x: number; y: number; value: string }
}

/** 拆分结果：纯语义 + 纯视图 */
export interface SplitResult {
  semantic: SemanticDocument
  view: ViewDocument
}

// ============================================================
// 阶段 2: 字段白名单
// ============================================================

/** 节点 properties 中需剥离的视图字段 */
const VIEW_NODE_PROPERTY_FIELDS = ['width', 'height', 'icon', 'collapsed'] as const
/** 节点顶层需剥离的视图字段（语义节点中不保留 x/y） */
const VIEW_NODE_FIELDS = ['x', 'y'] as const
/** 边需剥离的视图字段（语义边中不保留几何） */
const VIEW_EDGE_FIELDS = [
  'sourceAnchorId',
  'targetAnchorId',
  'startPoint',
  'endPoint',
  'pointsList',
  'text',
] as const

/** LogicFlow 原始节点类型（内部存储结构） */
interface LfNode {
  id: string
  type: string
  x?: number
  y?: number
  text?: string | { x?: number | null; y?: number | null; value?: string }
  properties?: Record<string, unknown>
  [key: string]: unknown
}

/** LogicFlow 原始边类型（内部存储结构） */
interface LfEdge {
  id: string
  type?: string
  sourceNodeId: string
  targetNodeId: string
  properties?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * 将 LogicFlow 实例数据序列化为 RuleFlowDocument。
 * - 节点 text 拍扁为字符串（去除 LogicFlow 内部坐标）
 * - 边 properties.relationType 保留
 * - 自动补齐默认值：enabled=true, root=false, evaluationMode='all'
 */
export function buildRuleflowDocument(
  lf: LogicFlow,
  chainName: string,
  options: {
    chainId?: string
    description?: string
    version?: number
    defaultRuleId?: string
  } = {},
): RuleFlowDocument {
  const graphData = lf.getGraphData() as {
    nodes?: LfNode[]
    edges?: LfEdge[]
  }
  return {
    chainId: options.chainId ?? '',
    chainName,
    enabled: true,
    root: false,
    evaluationMode: 'all',
    description: options.description,
    version: options.version,
    defaultRuleId: options.defaultRuleId,
    nodes: (graphData.nodes || []).map(serializeNode),
    edges: (graphData.edges || []).map(serializeEdge),
  }
}

/** text 字段统一拍扁为 string。空值回退到空串。 */
function flattenText(text: unknown): string {
  if (text == null) return ''
  if (typeof text === 'string') return text
  if (typeof text === 'object') {
    const obj = text as { value?: unknown }
    return typeof obj.value === 'string' ? obj.value : ''
  }
  return String(text)
}

/** 从 properties 中剥离视图字段（宽/高/图标/折叠状态） */
function stripViewFromProperties(props: Record<string, unknown>): Record<string, unknown> {
  const out = { ...props }
  VIEW_NODE_PROPERTY_FIELDS.forEach((f) => delete out[f])
  return out
}

/** 从边对象中剥离视图字段（锚点/几何/标签） */
function stripViewFromEdge(e: Record<string, unknown>): Record<string, unknown> {
  const out = { ...e }
  VIEW_EDGE_FIELDS.forEach((f) => delete out[f])
  return out
}

// ============================================================
// 阶段 2: 序列化函数（语义/视图分离版本）
// ============================================================

/** 节点 → 纯语义（不含 x/y/icon/width/height/collapsed） */
function toSemanticNode(n: LfNode): SemanticNode {
  return {
    id: n.id,
    type: n.type,
    text: flattenText(n.text),
    properties: stripViewFromProperties(n.properties ?? {}),
  }
}

/** 节点 → 纯视图（仅 x/y/width/height/icon/collapsed） */
function toViewNode(n: LfNode): ViewNode {
  const out: ViewNode = {
    id: n.id,
    x: n.x ?? 0,
    y: n.y ?? 0,
  }
  const props = (n.properties ?? {}) as Record<string, unknown>
  if (typeof props.width === 'number') out.width = props.width
  if (typeof props.height === 'number') out.height = props.height
  if (typeof props.icon === 'string') out.icon = props.icon
  if (typeof props.collapsed === 'boolean') out.collapsed = props.collapsed
  return out
}

/** 边 → 纯语义（不含 sourceAnchorId/targetAnchorId/startPoint/endPoint/pointsList/text） */
function toSemanticEdge(e: LfEdge): SemanticEdge {
  return {
    id: e.id,
    type: e.type ?? 'polyline',
    sourceNodeId: e.sourceNodeId,
    targetNodeId: e.targetNodeId,
    properties: (e.properties ?? {}) as Record<string, unknown>,
  }
}

/** 边 → 纯视图 */
function toViewEdge(e: LfEdge): ViewEdge {
  const out: ViewEdge = { id: e.id }
  const anyE = e as unknown as Record<string, unknown>
  if (typeof anyE.sourceAnchorId === 'string') out.sourceAnchorId = anyE.sourceAnchorId
  if (typeof anyE.targetAnchorId === 'string') out.targetAnchorId = anyE.targetAnchorId
  if (anyE.startPoint && typeof anyE.startPoint === 'object') {
    out.startPoint = anyE.startPoint as { x: number; y: number }
  }
  if (anyE.endPoint && typeof anyE.endPoint === 'object') {
    out.endPoint = anyE.endPoint as { x: number; y: number }
  }
  if (Array.isArray(anyE.pointsList)) {
    out.pointsList = anyE.pointsList as Array<{ x: number; y: number }>
  }
  if (anyE.text && typeof anyE.text === 'object') {
    out.text = anyE.text as { x: number; y: number; value: string }
  }
  return out
}

// ============================================================
// 阶段 2: 顶层 API
// ============================================================

/** 端口节点 properties 中属于 inputs/outputs 的字段（提取后从节点中移除避免冗余） */
const PORT_SEMANTIC_FIELDS = [
  'pointName',
  'displayName',
  'pointType',
  'dataType',
  'unit',
  'group',
  'scope',
  'inputPoints',
] as const

/**
 * 从 LogicFlow 实例构建纯语义文档（后端使用）。
 * 严格不包含任何视图字段（x/y/width/height/icon/pointsList 等）。
 * 自动从 rf-input-port 节点提取 inputs[]，从 rf-output-port 节点提取 outputs[]。
 */
export function buildSemanticDocument(
  lf: LogicFlow,
  chainName: string,
  options: { chainId?: string; description?: string; defaultRuleId?: string } = {},
): SemanticDocument {
  const graphData = lf.getGraphData() as { nodes?: LfNode[]; edges?: LfEdge[] }
  const rawNodes = graphData.nodes || []

  // 提取 inputs[]（从 rf-input-port 节点）
  const inputs: Array<Record<string, unknown>> = []
  // 提取 outputs[]（从 rf-output-port 节点）
  const outputs: Array<Record<string, unknown>> = []

  const semanticNodes = rawNodes.map((n) => {
    const sn = toSemanticNode(n)
    if (n.type === 'rf-input-port') {
      const props = n.properties ?? {}
      const input: Record<string, unknown> = {
        pointName: props.pointName ?? `${n.id}`,
      }
      if (props.displayName) input.displayName = props.displayName
      if (props.pointType) input.pointType = props.pointType
      else input.pointType = 'analog'
      if (props.dataType) input.dataType = props.dataType
      else input.dataType = 'double'
      if (props.unit) input.unit = props.unit
      if (props.group) input.group = props.group
      inputs.push(input)
      // 从节点 properties 中移除端口语义字段（避免冗余）
      PORT_SEMANTIC_FIELDS.forEach((f) => delete sn.properties[f])
    } else if (n.type === 'rf-output-port') {
      const props = n.properties ?? {}
      const output: Record<string, unknown> = {
        pointName: props.pointName ?? `${n.id}`,
        displayName: (props.displayName as string) ?? '',
      }
      if (props.pointType) output.pointType = props.pointType
      else output.pointType = 'virtual'
      if (props.dataType) output.dataType = props.dataType
      else output.dataType = 'double'
      if (props.unit) output.unit = props.unit
      if (props.group) output.group = props.group
      if (props.scope) output.scope = props.scope
      if (props.inputPoints) output.inputPoints = props.inputPoints
      outputs.push(output)
      // 从节点 properties 中移除端口语义字段（避免冗余）
      PORT_SEMANTIC_FIELDS.forEach((f) => delete sn.properties[f])
    }
    return sn
  })

  return {
    version: '2.0',
    chainId: options.chainId ?? '',
    chainName,
    enabled: true,
    root: false,
    evaluationMode: 'all',
    description: options.description,
    schemaVersion: 1,
    defaultRuleId: options.defaultRuleId,
    inputs: inputs.length > 0 ? inputs : undefined,
    outputs: outputs.length > 0 ? outputs : undefined,
    nodes: semanticNodes,
    edges: (graphData.edges || []).map(toSemanticEdge),
  }
}

/**
 * 从 LogicFlow 实例构建纯视图文档（前端使用）。
 * 严格不包含任何业务字段（ruleId/leafType/actionType/leafConfig 等）。
 */
export function buildViewDocument(lf: LogicFlow, chainId?: string): ViewDocument {
  const graphData = lf.getGraphData() as { nodes?: LfNode[]; edges?: LfEdge[] }
  const view: ViewDocument = {
    version: '2.0',
    chainId,
    nodes: (graphData.nodes || []).map(toViewNode),
    edges: (graphData.edges || []).map(toViewEdge),
  }
  // 读取画布 transform
  try {
    const t = lf.getTransform() as {
      SCALE_X?: number
      SCALE_Y?: number
      TRANSLATE_X?: number
      TRANSLATE_Y?: number
    }
    if (t) {
      view.transform = {
        scale: t.SCALE_X ?? 1,
        translateX: t.TRANSLATE_X ?? 0,
        translateY: t.TRANSLATE_Y ?? 0,
      }
    }
  } catch (_e) {
    /* ignore */
  }
  return view
}

/**
 * 一步到位：拆分 LogicFlow 为 semantic + view。
 */
export function splitToSemanticAndView(
  lf: LogicFlow,
  chainName: string,
  options: { chainId?: string; description?: string; defaultRuleId?: string } = {},
): SplitResult {
  return {
    semantic: buildSemanticDocument(lf, chainName, options),
    view: buildViewDocument(lf, options.chainId),
  }
}

/**
 * 合并 semantic + view → RuleFlowDocument（用于加载到 LogicFlow）。
 * view 可选：若缺失则使用默认布局（LogicFlow 自动布局）。
 * 自动将 semantic.inputs[]/outputs[] 回填到对应端口节点 properties。
 */
export function mergeFromSemanticAndView(
  semantic: SemanticDocument,
  view?: ViewDocument | null,
): RuleFlowDocument {
  const viewNodeMap = new Map<string, ViewNode>()
  const viewEdgeMap = new Map<string, ViewEdge>()
  if (view) {
    view.nodes.forEach((n) => viewNodeMap.set(n.id, n))
    view.edges.forEach((e) => viewEdgeMap.set(e.id, e))
  }

  // 构建 inputs[]/outputs[] 查找表：pointName → 条目
  const inputMap = new Map<string, Record<string, unknown>>()
  const outputMap = new Map<string, Record<string, unknown>>()
  if (semantic.inputs) {
    semantic.inputs.forEach((inp) => {
      const pn = (inp.pointName as string) || ''
      if (pn) inputMap.set(pn, inp)
    })
  }
  if (semantic.outputs) {
    semantic.outputs.forEach((out) => {
      const pn = (out.pointName as string) || ''
      if (pn) outputMap.set(pn, out)
    })
  }

  return {
    chainId: semantic.chainId,
    chainName: semantic.chainName,
    enabled: semantic.enabled,
    root: semantic.root,
    evaluationMode: semantic.evaluationMode,
    description: semantic.description,
    status: semantic.status,
    pipelineType: semantic.pipelineType,
    defaultRuleId: semantic.defaultRuleId,
    inputs: semantic.inputs as any,
    outputs: semantic.outputs as any,
    nodes: semantic.nodes.map((sn) => {
      const vn = viewNodeMap.get(sn.id)
      // 从 semantic.inputs[]/outputs[] 中查找匹配的端口配置回填
      const portConfig =
        sn.type === 'rf-input-port'
          ? inputMap.get((sn.properties.pointName as string) ?? '')
          : sn.type === 'rf-output-port'
            ? outputMap.get((sn.properties.pointName as string) ?? '')
            : undefined
      return {
        id: sn.id,
        type: sn.type,
        x: vn?.x ?? 0,
        y: vn?.y ?? 0,
        text: sn.text,
        properties: {
          ...sn.properties,
          ...(portConfig || {}),
          ...(vn?.width != null ? { width: vn.width } : {}),
          ...(vn?.height != null ? { height: vn.height } : {}),
          ...(vn?.icon ? { icon: vn.icon } : {}),
          ...(vn?.collapsed != null ? { collapsed: vn.collapsed } : {}),
        } as any,
      }
    }),
    edges: semantic.edges.map((se) => {
      const ve = viewEdgeMap.get(se.id)
      return {
        id: se.id,
        type: se.type,
        sourceNodeId: se.sourceNodeId,
        targetNodeId: se.targetNodeId,
        properties: se.properties as any,
        ...(ve?.sourceAnchorId ? { sourceAnchorId: ve.sourceAnchorId } : {}),
        ...(ve?.targetAnchorId ? { targetAnchorId: ve.targetAnchorId } : {}),
        ...(ve?.startPoint ? { startPoint: ve.startPoint } : {}),
        ...(ve?.endPoint ? { endPoint: ve.endPoint } : {}),
        ...(ve?.pointsList ? { pointsList: ve.pointsList } : {}),
        ...(ve?.text ? { text: ve.text } : {}),
      } as any
    }),
  }
}

// ============================================================
// 阶段 4.1: 视图态本地化（localStorage）
// ============================================================

const VIEW_LS_KEY_PREFIX = 'ruleflow:view:'
const VIEW_LS_KEY_DEFAULT = `${VIEW_LS_KEY_PREFIX}default`

function getViewLsKey(chainId?: string): string {
  return chainId ? `${VIEW_LS_KEY_PREFIX}${chainId}` : VIEW_LS_KEY_DEFAULT
}

/** 将视图态保存到 localStorage。失败（如隐私模式）静默忽略。 */
export function saveViewToLocalStorage(view: ViewDocument, chainId?: string): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(getViewLsKey(chainId), JSON.stringify(view))
  } catch (_e) {
    /* 静默失败：隐私模式或配额满 */
  }
}

/** 从 localStorage 读取视图态。失败返回 null。 */
export function loadViewFromLocalStorage(chainId?: string): ViewDocument | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(getViewLsKey(chainId))
    if (!raw) return null
    return JSON.parse(raw) as ViewDocument
  } catch (_e) {
    return null
  }
}

/** 清除指定链的视图态 */
export function clearViewFromLocalStorage(chainId?: string): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(getViewLsKey(chainId))
  } catch (_e) {
    /* ignore */
  }
}

// ============================================================
// 阶段 4.2: JSON Schema 强校验
// ============================================================

/** 视图中禁止出现的字段名（用于白名单校验） */
const FORBIDDEN_FIELDS_IN_SEMANTIC = [
  // 节点位置
  'x',
  'y',
  'width',
  'height',
  // 节点装饰
  'icon',
  'collapsed',
  // 边几何
  'sourceAnchorId',
  'targetAnchorId',
  'startPoint',
  'endPoint',
  'pointsList',
  // 视图层 transform 不应出现在 semantic
  'transform',
  'gridVisible',
  'selectedNodeId',
] as const

export interface ValidationError {
  field: string
  message: string
  path?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * 校验 SemanticDocument 严格不含视图字段。
 * 阶段 4.2: 防止误传视图态给后端。
 */
export function validateSemanticDocument(doc: unknown): ValidationResult {
  const errors: ValidationError[] = []
  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: '文档必须是对象' }] }
  }
  const d = doc as Record<string, unknown>

  // 顶层字段校验
  for (const field of FORBIDDEN_FIELDS_IN_SEMANTIC) {
    if (field in d) {
      errors.push({ field, path: '$', message: `语义文档顶层禁止包含视图字段 "${field}"` })
    }
  }

  // 节点校验
  const nodes = d.nodes as Array<Record<string, unknown>> | undefined
  if (Array.isArray(nodes)) {
    nodes.forEach((n, i) => {
      if (!n || typeof n !== 'object') return
      for (const field of ['x', 'y'] as const) {
        if (field in n) {
          errors.push({
            field,
            path: `$.nodes[${i}]`,
            message: `语义节点禁止包含视图字段 "${field}"`,
          })
        }
      }
      // properties 内部
      const props = n.properties as Record<string, unknown> | undefined
      if (props && typeof props === 'object') {
        for (const field of ['width', 'height', 'icon', 'collapsed'] as const) {
          if (field in props) {
            errors.push({
              field,
              path: `$.nodes[${i}].properties.${field}`,
              message: `语义节点 properties 禁止包含视图字段 "${field}"`,
            })
          }
        }
      }
    })
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================
// 阶段 4.3: ruleId 命名约定
// ============================================================

/** ruleId 命名规则：小写字母/数字/冒号/下划线/连字符 */
const RULE_ID_PATTERN = /^(rule|node|cond|act|gate|port|io):[a-z0-9_-]{1,64}$/

/**
 * 校验 ruleId 是否符合 `rule:xxx` 命名约定。
 * 阶段 4.3: 强制类型前缀避免命名空间冲突。
 */
export function isValidRuleId(ruleId: string, type?: string): boolean {
  if (typeof ruleId !== 'string' || ruleId.length === 0) return false
  if (!RULE_ID_PATTERN.test(ruleId)) return false
  if (type) {
    const prefix = ruleId.split(':')[0].toLowerCase()
    const expectedPrefixes: Record<string, string[]> = {
      rule: ['rule'],
      condition: ['cond', 'rule'],
      action: ['act', 'rule'],
      node: ['node'],
      logic_gate: ['gate', 'rule'],
      input_port: ['port', 'io'],
      output_port: ['port', 'io'],
    }
    const allowed = expectedPrefixes[type] || []
    if (allowed.length > 0 && !allowed.includes(prefix)) {
      return false
    }
  }
  return true
}

/**
 * 自动生成 ruleId（根据 nodeType）。
 * 阶段 4.3: 用类型前缀 + 时间戳 + 随机后缀避免冲突。
 */
export function generateRuleId(type: string): string {
  const prefixMap: Record<string, string> = {
    rule: 'rule',
    condition: 'cond',
    action: 'act',
    node: 'node',
    logic_gate: 'gate',
    input_port: 'port',
    output_port: 'port',
  }
  const prefix = prefixMap[type] || 'rule'
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  return `${prefix}:${ts}_${rand}`
}

// ============================================================
// 序列化/反序列化函数
// ============================================================

/** 节点序列化：text 拍扁为 string，properties 剥离视图字段。 */
function serializeNode(n: LfNode): RuleFlowNode {
  return {
    id: n.id,
    type: n.type,
    x: 0, // 旧版兼容，真实 x/y 在 view 中
    y: 0,
    text: flattenText(n.text),
    properties: stripViewFromProperties(n.properties ?? {}) as any,
  }
}

/** 边序列化：仅保留语义字段，剔除几何信息 */
function serializeEdge(e: LfEdge): RuleFlowEdge {
  return {
    id: e.id,
    type: e.type ?? 'polyline',
    sourceNodeId: e.sourceNodeId,
    targetNodeId: e.targetNodeId,
    properties: (e.properties ?? {}) as any,
  }
}

/**
 * 将 RuleFlowDocument 应用到 LogicFlow 实例。
 * 适用于加载 JSON 文件到画布。
 */
export function applyDocumentToLf(lf: LogicFlow, doc: RuleFlowDocument): void {
  const lfData = {
    nodes: (doc.nodes || []).map(deserializeNode),
    edges: (doc.edges || []).map(deserializeEdge),
  }
  lf.clearData()
  lf.render(lfData as Parameters<typeof lf.render>[0])
}

/** 节点反序列化：text 一律包成对象 {value: string}（LogicFlow 期望形态） */
function deserializeNode(n: RuleFlowNode): LfNode {
  return {
    id: n.id,
    type: n.type,
    x: n.x ?? 0,
    y: n.y ?? 0,
    text: typeof n.text === 'string' ? { value: n.text } : n.text,
    properties: (n.properties ?? {}) as Record<string, unknown>,
  }
}

/** 边反序列化：保留所有附加字段（LogicFlow 需要 startPoint/endPoint 等） */
function deserializeEdge(e: RuleFlowEdge): LfEdge {
  return {
    id: e.id,
    type: e.type,
    sourceNodeId: e.sourceNodeId,
    targetNodeId: e.targetNodeId,
    properties: (e.properties ?? {}) as Record<string, unknown>,
  }
}

/** 浏览器端下载 JSON 文件。文件名默认按 chainName 拼接。 */
export function downloadAsJsonFile(doc: RuleFlowDocument, filename?: string): void {
  const safeName = (filename || doc.chainName || '未命名规则链').replace(/[\\/:*?"<>|]/g, '_')
  const blob = new Blob([JSON.stringify(doc, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 浏览器端下载双文件（semantic + view）。
 * 文件名格式：`{chainName}.rules.json` + `{chainName}.view.json`
 * 阶段 2: 物理隔离语义/视图数据。
 */
export function downloadAsJsonPair(
  semantic: SemanticDocument,
  view: ViewDocument,
  chainName: string,
): void {
  const safeName = (chainName || semantic.chainName || '未命名规则链').replace(/[\\/:*?"<>|]/g, '_')

  // 下载语义文件
  const semanticBlob = new Blob([JSON.stringify(semantic, null, 2)], {
    type: 'application/json',
  })
  triggerDownload(semanticBlob, `${safeName}.rules.json`)

  // 下载视图文件（轻量延后，避免浏览器拦截多文件下载）
  setTimeout(() => {
    const viewBlob = new Blob([JSON.stringify(view, null, 2)], {
      type: 'application/json',
    })
    triggerDownload(viewBlob, `${safeName}.view.json`)
  }, 100)
}

/** 触发单个文件下载（通用） */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 读取 File 对象并解析为 RuleFlowDocument。 */
export function readJsonFile(file: File): Promise<RuleFlowDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const doc = JSON.parse(text) as RuleFlowDocument
        resolve(doc)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
