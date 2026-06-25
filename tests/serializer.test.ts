/**
 * Ruleflow 序列化器单元测试（自检）
 * 运行：npx tsx tests/serializer.test.ts 或 node --import tsx tests/serializer.test.ts
 */
import {
  buildSemanticDocument,
  buildViewDocument,
  splitToSemanticAndView,
  mergeFromSemanticAndView,
  validateSemanticDocument,
  isValidRuleId,
  generateRuleId,
  type SemanticDocument,
  type ViewDocument,
} from '../src/utils/ruleflowSerializer.ts'

let passed = 0
let failed = 0
const failures: string[] = []

function test(name: string, fn: () => void): void {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    const msg = e instanceof Error ? e.message : String(e)
    failures.push(`${name}: ${msg}`)
    console.log(`  ✗ ${name}: ${msg}`)
  }
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg)
}

function assertEqual<T>(actual: T, expected: T, msg: string): void {
  if (actual !== expected) throw new Error(`${msg} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`)
}

console.log('=== 阶段 2: 语义/视图分离测试 ===\n')

// 构造 mock LogicFlow
const mockLf: any = {
  getGraphData: () => ({
    nodes: [
      {
        id: 'n1',
        type: 'rf-input-port',
        x: 100,
        y: 200,
        text: { value: 'A 相电压' },
        properties: {
          nodeType: 'input_port',
          icon: '→',
          width: 200,
          height: 80,
          summary: 'm1:UA',
          ruleId: 'rule_001',
          priority: 0,
          enabled: true,
        },
      },
      {
        id: 'n2',
        type: 'rf-condition',
        x: 400,
        y: 300,
        text: 'SOC 监控',
        properties: {
          nodeType: 'condition',
          icon: '◇',
          width: 200,
          height: 80,
          summary: '条件: AND',
          ruleId: 'rule_001',
          priority: 1,
          enabled: true,
        },
      },
    ],
    edges: [
      {
        id: 'e1',
        type: 'polyline',
        sourceNodeId: 'n1',
        targetNodeId: 'n2',
        sourceAnchorId: 'n1_1',
        targetAnchorId: 'n2_3',
        startPoint: { x: 200, y: 200 },
        endPoint: { x: 300, y: 300 },
        pointsList: [
          { x: 200, y: 200 },
          { x: 300, y: 300 },
        ],
        text: { x: 250, y: 250, value: 'default' },
        properties: { relationType: 'default' },
      },
    ],
  }),
  getTransform: () => ({ SCALE_X: 1.5, SCALE_Y: 1.5, TRANSLATE_X: 50, TRANSLATE_Y: 0 }),
}

test('buildSemanticDocument 剥离所有视图字段', () => {
  const sem: SemanticDocument = buildSemanticDocument(mockLf, '测试链')
  assertEqual(sem.chainName, '测试链', 'chainName')
  assertEqual(sem.version, '2.0', 'version')
  assertEqual(sem.nodes.length, 2, '节点数')
  assertEqual(sem.edges.length, 1, '边数')

  // 节点：不含 x/y
  for (const n of sem.nodes) {
    assert(!('x' in n), `语义节点 ${n.id} 不应包含 x`)
    assert(!('y' in n), `语义节点 ${n.id} 不应包含 y`)
    assert(!('width' in (n.properties || {})), `语义节点 ${n.id} properties 不应包含 width`)
    assert(!('height' in (n.properties || {})), `语义节点 ${n.id} properties 不应包含 height`)
    assert(!('icon' in (n.properties || {})), `语义节点 ${n.id} properties 不应包含 icon`)
  }

  // 边：不含几何
  for (const e of sem.edges) {
    assert(!('sourceAnchorId' in e), `语义边 ${e.id} 不应包含 sourceAnchorId`)
    assert(!('targetAnchorId' in e), `语义边 ${e.id} 不应包含 targetAnchorId`)
    assert(!('startPoint' in e), `语义边 ${e.id} 不应包含 startPoint`)
    assert(!('endPoint' in e), `语义边 ${e.id} 不应包含 endPoint`)
    assert(!('pointsList' in e), `语义边 ${e.id} 不应包含 pointsList`)
    assert(!('text' in e), `语义边 ${e.id} 不应包含 text`)
  }
})

test('buildSemanticDocument 保留业务字段', () => {
  const sem = buildSemanticDocument(mockLf, '测试链')
  const n1 = sem.nodes.find((n) => n.id === 'n1')!
  assertEqual(n1.text, 'A 相电压', 'text 拍扁为 string')
  assertEqual(n1.properties.summary, 'm1:UA', 'summary 保留')
  assertEqual(n1.properties.ruleId, 'rule_001', 'ruleId 保留')
  assertEqual(n1.properties.nodeType, 'input_port', 'nodeType 保留')

  const e1 = sem.edges[0]
  assertEqual(e1.properties.relationType, 'default', '边 relationType 保留')
})

test('buildViewDocument 仅含视图字段', () => {
  const view: ViewDocument = buildViewDocument(mockLf, '测试链')
  assertEqual(view.chainId, '测试链', 'chainId')
  assertEqual(view.version, '2.0', 'version')
  assertEqual(view.nodes.length, 2, '视图节点数')
  assertEqual(view.edges.length, 1, '视图边数')

  // 节点：含 x/y
  for (const n of view.nodes) {
    assert(typeof n.x === 'number', `视图节点 ${n.id} 应有 x`)
    assert(typeof n.y === 'number', `视图节点 ${n.id} 应有 y`)
    assert(!('properties' in n), `视图节点 ${n.id} 不应包含 properties`)
    assert(!('summary' in n), `视图节点 ${n.id} 不应包含 summary`)
    assert(!('ruleId' in n), `视图节点 ${n.id} 不应包含 ruleId`)
  }

  // 边：含几何
  const ve = view.edges[0]
  assert(typeof ve.startPoint === 'object', '视图边 startPoint 存在')
  assert(typeof ve.endPoint === 'object', '视图边 endPoint 存在')
  assert(Array.isArray(ve.pointsList), '视图边 pointsList 是数组')
  assert(!('properties' in ve), '视图边不应包含 properties')
  assert(!('relationType' in ve), '视图边不应包含 relationType')
})

test('buildViewDocument 包含 transform', () => {
  const view = buildViewDocument(mockLf)
  assert(view.transform != null, 'transform 存在')
  assertEqual(view.transform!.scale, 1.5, 'scale')
  assertEqual(view.transform!.translateX, 50, 'translateX')
})

test('splitToSemanticAndView 一步拆分', () => {
  const { semantic, view } = splitToSemanticAndView(mockLf, '测试链', { chainId: 'chain-001' })
  assertEqual(semantic.chainName, '测试链', 'semantic.chainName')
  assertEqual(view.chainId, 'chain-001', 'view.chainId')
})

test('mergeFromSemanticAndView 往返保留', () => {
  const { semantic, view } = splitToSemanticAndView(mockLf, '测试链', { chainId: 'chain-001' })
  const merged = mergeFromSemanticAndView(semantic, view)

  // 节点
  const n1 = merged.nodes.find((n) => n.id === 'n1')!
  assertEqual(n1.text, 'A 相电压', '往返 text 保留')
  assertEqual(n1.x, 100, '往返 x 保留')
  assertEqual(n1.y, 200, '往返 y 保留')
  assertEqual((n1.properties as any).summary, 'm1:UA', '往返 summary 保留')
  assertEqual((n1.properties as any).icon, '→', '往返 icon 保留')
  assertEqual((n1.properties as any).width, 200, '往返 width 保留')

  // 边
  const e1 = merged.edges[0]
  assertEqual((e1.properties as any).relationType, 'default', '往返 relationType 保留')
  assert((e1 as any).startPoint != null, '往返 startPoint 保留')
  assert((e1 as any).pointsList != null, '往返 pointsList 保留')
})

test('mergeFromSemanticAndView 无 view 时默认布局', () => {
  const sem = buildSemanticDocument(mockLf, '测试链')
  const merged = mergeFromSemanticAndView(sem, null)
  // 无 view 时 x/y 为 0
  assertEqual(merged.nodes[0].x, 0, '无 view 时 x=0')
  assertEqual(merged.nodes[0].y, 0, '无 view 时 y=0')
  // 业务字段仍在
  assertEqual((merged.nodes[0].properties as any).summary, 'm1:UA', '业务字段保留')
})

console.log('\n=== 阶段 4.2: 强校验测试 ===\n')

test('validateSemanticDocument 接受纯语义', () => {
  const sem = buildSemanticDocument(mockLf, '测试链')
  const v = validateSemanticDocument(sem)
  assert(v.valid, `纯语义应通过校验: ${JSON.stringify(v.errors)}`)
})

test('validateSemanticDocument 拒绝含 x/y 的节点', () => {
  const bad = {
    version: '2.0',
    chainId: '',
    chainName: 'x',
    enabled: true,
    root: false,
    evaluationMode: 'all',
    schemaVersion: 1,
    nodes: [{ id: 'n1', type: 'rf-x', x: 100, y: 200, text: 't', properties: {} }],
    edges: [],
  }
  const v = validateSemanticDocument(bad)
  assert(!v.valid, '含 x/y 应被拒绝')
  assert(v.errors.length >= 2, '应有 2 个错误（x + y）')
})

test('validateSemanticDocument 拒绝含 width/height/icon 的 properties', () => {
  const bad = {
    version: '2.0',
    chainId: '',
    chainName: 'x',
    enabled: true,
    root: false,
    evaluationMode: 'all',
    schemaVersion: 1,
    nodes: [
      {
        id: 'n1',
        type: 'rf-x',
        text: 't',
        properties: { width: 200, height: 80, icon: '→', summary: 'ok' },
      },
    ],
    edges: [],
  }
  const v = validateSemanticDocument(bad)
  assert(!v.valid, '含 width/height/icon 应被拒绝')
  assert(v.errors.length >= 3, `应有 3 个错误，实际 ${v.errors.length}`)
})

test('validateSemanticDocument 拒绝含 transform 的顶层', () => {
  const bad = {
    version: '2.0',
    chainId: '',
    chainName: 'x',
    enabled: true,
    root: false,
    evaluationMode: 'all',
    transform: { scale: 1, translateX: 0, translateY: 0 },
    nodes: [],
    edges: [],
  }
  const v = validateSemanticDocument(bad)
  assert(!v.valid, '顶层 transform 应被拒绝')
})

console.log('\n=== 阶段 4.3: ruleId 命名约定测试 ===\n')

test('isValidRuleId 接受合法命名', () => {
  assert(isValidRuleId('rule:001'), 'rule:001')
  assert(isValidRuleId('cond:soc_alert'), 'cond:soc_alert')
  assert(isValidRuleId('act:alarm_001'), 'act:alarm_001')
  assert(isValidRuleId('port:m1_ua'), 'port:m1_ua')
  assert(isValidRuleId('gate:and_001'), 'gate:and_001')
})

test('isValidRuleId 拒绝非法命名', () => {
  assert(!isValidRuleId('rule_001'), '无冒号')
  assert(!isValidRuleId('rule:'), '空后缀')
  assert(!isValidRuleId('RULE:001'), '大写前缀（仅小写允许）')
  assert(!isValidRuleId('xxx:001'), '未知前缀')
  assert(!isValidRuleId(''), '空字符串')
  assert(!isValidRuleId('123:abc'), '数字前缀')
})

test('isValidRuleId 按 type 校验前缀', () => {
  assert(isValidRuleId('rule:001', 'rule'), 'rule 类型 → rule: 前缀')
  assert(isValidRuleId('cond:001', 'condition'), 'condition 类型 → cond: 前缀')
  assert(isValidRuleId('rule:001', 'condition'), 'condition 类型也允许 rule: 前缀')
  assert(!isValidRuleId('port:001', 'condition'), 'condition 类型不允许 port: 前缀')
})

test('generateRuleId 生成符合约定', () => {
  const id = generateRuleId('condition')
  assert(id.startsWith('cond:'), `condition 应生成 cond: 前缀，实际 ${id}`)
  assert(isValidRuleId(id), '生成的 ID 应通过校验')
  assert(isValidRuleId(id, 'condition'), '生成的 ID 类型匹配')
})

test('generateRuleId 不重复', () => {
  const ids = new Set<string>()
  for (let i = 0; i < 100; i++) {
    ids.add(generateRuleId('rule'))
  }
  assert(ids.size === 100, `100 个 ID 应全部唯一，实际 ${ids.size}`)
})

// 输出统计
console.log(`\n=== 测试结果 ===`)
console.log(`通过: ${passed}`)
console.log(`失败: ${failed}`)
if (failed > 0) {
  console.log('\n失败详情:')
  failures.forEach((f) => console.log(`  - ${f}`))
  process.exit(1)
}
console.log('\n所有测试通过 ✓')
