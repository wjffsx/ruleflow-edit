# RuleFlow Editor — 代码审查报告

> **审查范围**: `ruleflow-edit` 前端项目全量源码
> **审查日期**: 2026-06-13
> **审查维度**: 性能瓶颈 · 潜在 Bug · 架构设计 · 界面优化 · 综合建议
> **技术栈**: Preact + Signals + LogicFlow + Vite + Tailwind CSS v4

---

## 📊 总体评价

| 维度     | 评分  | 说明                                              |
| -------- | ----- | ------------------------------------------------- |
| 代码组织 | ⭐⭐⭐⭐  | 按布局区域分组，结构清晰，但缺少分层抽象          |
| 设计系统 | ⭐⭐⭐⭐⭐ | 300+ CSS 变量令牌体系完善，支持明暗主题和密度模式 |
| 性能     | ⭐⭐⭐   | 存在明显的渲染和内存瓶颈                          |
| 健壮性   | ⭐⭐    | 大量静默吞错、缺少输入校验、状态不一致风险        |
| 架构     | ⭐⭐⭐   | 单文件 Store 可维护性有限，组件职责边界模糊       |
| UI/UX    | ⭐⭐⭐⭐  | IDE 布局专业，但交互反馈和可用性有改进空间        |

---

## 🔴 一、性能瓶颈

### 1.1 graph:updated 事件导致全量重渲染

**文件**: `CanvasViewport.jsx` L111-121

```js
lf.on('graph:updated', () => {
  const data = lf.getGraphData()
  nodeCount.value = nc
  edgeCount.value = ec
  setIsEmpty(nc === 0)
  setAllNodes(data?.nodes || [])      // ← 每次 graph:updated 都重建数组
  outlineNodes.value = data?.nodes || []  // ← 每次都触发 signal 更新
})
```

**问题**:
- `graph:updated` 在拖拽节点时**高频触发**（每帧一次），每次都调用 `lf.getGraphData()` 全量序列化图数据
- `setAllNodes` 使用 `useState`，每次赋值新引用都会触发 `NodeSearch` 重新构建 Fuse 索引
- `outlineNodes.value = data?.nodes || []` 每次赋值新数组引用，即使内容相同也会触发所有订阅者重渲染
- **每次节点拖动都会导致: 全量序列化 + 状态更新 + OutlineTab 重渲染 + NodeSearch 索引重建**

**建议**:
```js
// 1. 防抖 graph:updated 事件
import { debounce } from 'lodash-es' // 或手写
const debouncedUpdate = debounce(() => {
  const data = lf.getGraphData()
  // 浅比较后再赋值
  const newNodes = data?.nodes || []
  if (newNodes.length !== outlineNodes.value.length) {
    outlineNodes.value = newNodes
  }
}, 100)

// 2. allNodes 和 outlineNodes 合并，避免重复状态
// 3. 节点拖动期间只更新 nodeCount/edgeCount（数字比较代价低），
//    拖动结束后再更新完整节点列表
```

### 1.2 Fuse.js 索引重复创建

**文件**: `Sidebar.jsx` L228-231, `NodeSearch.jsx` L72-78, `CommandPalette.jsx` L120-123

三个组件各自独立创建 Fuse 索引，而侧栏和 NodeSearch 搜索的数据源高度重叠（都是节点列表）。

**问题**:
- `NodeSearch` 的 `fuse` 依赖 `nodes` prop（即 `allNodes` state），每次 `allNodes` 变化就重建索引
- `Sidebar` 的 `fuse` 在 `allItems` 不变时只创建一次（✅ 正确使用 useMemo），但 `allItems` 构建了完整的扁平列表
- `CommandPalette` 搜索命令列表，数据量小影响不大

**建议**:
```js
// 创建全局搜索服务，避免重复索引
// src/services/searchService.js
class SearchService {
  #nodeFuse = null
  #commandFuse = null
  
  updateNodeIndex(nodes) {
    // 仅在节点增删时重建，不在每次 graph:updated 时重建
    this.#nodeFuse = new Fuse(nodes, { keys: [...], threshold: 0.4 })
  }
  
  searchNodes(query) { return this.#nodeFuse?.search(query) || [] }
}
export const searchService = new SearchService()
```

### 1.3 内联样式对象在每次渲染时重建

**全项目范围** — 所有组件使用 `const styleObj = { ... }` 在模块顶层或函数体内定义样式对象。

**问题**:
- **模块顶层定义**（如 `canvasContainerStyle`, `navbarStyle` 等）: ✅ 没问题，只创建一次
- **函数体内定义**（如 `tabStyle(active)`, `ctrlBtnStyle(active, color)`, `statCardStyle(colorVar, lightVar)` 等）: ❌ 每次渲染都创建新对象
- Preact 的 diff 算法会比较 style 对象的属性，但新对象意味着新引用

**建议**:
```js
// 使用 useMemo 或提取为 CSS 类
const tabStyle = useMemo(() => ({
  // 基础样式
  display: 'flex', ...
}), [])

// 或者更好的方案：使用 Tailwind CSS（已安装但未使用）
// 用 className="flex items-center gap-1 px-3.5 py-2.5" 替代内联样式
```

### 1.4 debugMessages 无限增长

**文件**: `editorStore.js` L176-178

```js
export function addDebugMessage(msg) {
  debugMessages.value = [...debugMessages.value, { ...msg, time: Date.now() }]
}
```

**问题**:
- 每次添加消息都创建新数组 + 展开所有旧消息，O(n) 复制开销
- 无上限控制，长时间运行调试会累积大量消息
- 调试面板的 `messages.map()` 渲染所有消息，无虚拟滚动

**建议**:
```js
const MAX_DEBUG_MESSAGES = 500

export function addDebugMessage(msg) {
  const current = debugMessages.value
  const next = [...current, { ...msg, time: Date.now() }]
  debugMessages.value = next.length > MAX_DEBUG_MESSAGES
    ? next.slice(-MAX_DEBUG_MESSAGES)
    : next
}
```

### 1.5 状态栏缩放按钮不驱动画布

**文件**: `StatusBar.jsx` L76-83

```js
<button onClick={() => setZoom(canvasZoom.value - 10)}>
<button onClick={() => setZoom(canvasZoom.value + 10)}>
<button onClick={() => setZoom(100)}>
```

**问题**:
- `setZoom()` 只更新了 signal 值，但**没有驱动 LogicFlow 实际缩放画布**
- 画布缩放只在 `graph:transform` 事件中单向同步（画布→signal），signal→画布方向断裂
- 用户点击状态栏缩放按钮，数字变化但画布不动

**建议**:
```js
export function setZoom(z) {
  const newZoom = Math.min(200, Math.max(25, Math.round(z)))
  canvasZoom.value = newZoom
  // 双向同步：signal → LogicFlow
  if (lfInstance) {
    try {
      const currentTransform = lfInstance.getTransform()
      const currentScale = currentTransform?.SCALE_X || 1
      const targetScale = newZoom / 100
      if (Math.abs(currentScale - targetScale) > 0.01) {
        lfInstance.zoom(targetScale / currentScale)
      }
    } catch (e) { /* ignore */ }
  }
}
```

### 1.6 SVG filter 引用但未定义

**文件**: `BaseNode.js` L87

```js
filter: 'url(#rf-shadow-sm)',
```

**问题**:
- 节点 SVG 渲染中引用了 `#rf-shadow-sm` 滤镜，但项目中**没有定义该 SVG filter**
- 这意味着节点的"卡片阴影"效果**完全失效**，每个节点都缺少视觉层次感
- 可能导致 SVG 渲染性能浪费（浏览器查找不存在的 filter）

**建议**:
```html
<!-- 在 index.html 的 <svg> 定义区或 CanvasViewport 中添加 -->
<svg style="position:absolute;width:0;height:0">
  <defs>
    <filter id="rf-shadow-sm" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.1"/>
    </filter>
  </defs>
</svg>
```

---

## 🟡 二、潜在 Bug

### 2.1 🔴 lfInstance 为普通变量，不触发响应式更新

**文件**: `editorStore.js` L47-48

```js
export let lfInstance = null
export function setLfInstance(lf) { lfInstance = lf }
```

**问题**:
- `lfInstance` 是普通 `let` 变量，**不是 signal**
- `RightPanel.jsx` L156: `const lf = lfInstance` — 直接读取，组件不会在 lfInstance 变化时重新渲染
- `DebugPanel.jsx` L92: `const lf = lfInstance` — 同样问题
- 如果 LogicFlow 实例在组件首次渲染后才设置（实际确实如此），这些组件将读到 `null`

**建议**:
```js
// 方案一：改为 signal（推荐）
export const lfInstance = signal(null)

// 方案二：如果不想改为 signal，使用 ref 模式
// 但需要确保所有使用 lfInstance 的组件在 lf 就绪后重新渲染
```

### 2.2 🔴 ThemeToggle 的 "system" 选项判断逻辑错误

**文件**: `ThemeToggle.jsx` L91

```js
background: theme.value === key || (key === 'system' && !localStorage.getItem('rf-theme-pref'))
  ? 'var(--rf-brand-primary-light)' : 'transparent',
```

**问题**:
- 当 `theme.value === 'light'` 时，`key === 'light'` 条件为 true，所以 light 按钮高亮
- 但 `key === 'system'` 且 `rf-theme-pref` 不存在时也高亮 system 按钮
- 导致**首次使用时 light 和 system 同时高亮**
- 此外，`rf-theme-pref` 只在此处读取，`setTheme()` 保存的是 `rf-theme`，两者不一致

**建议**:
```js
// 统一偏好存储键，修复逻辑
const themePref = localStorage.getItem('rf-theme-pref') || 'light'
const isCurrent = themePref === key
```

### 2.3 🔴 全局快捷键冲突与缺失

**文件**: `RuleFlowEditor.jsx` L49-63, `CanvasViewport.jsx` L63-73

**问题**:
- **Ctrl+F 冲突**: `CanvasViewport` 注册了 Ctrl+F 打开 NodeSearch，但浏览器原生 Ctrl+F 也被阻止了（`e.preventDefault()`），用户无法使用浏览器搜索
- **Ctrl+K 注册位置**: 在 `RuleFlowEditor` 中，但 `CommandPalette` 自身没有注册 Escape 关闭的全局快捷键（仅面板内 keydown 处理）
- **缺少 Ctrl+S**: 命令面板定义了保存命令，但没有实际绑定快捷键
- **多处注册全局 keydown**: `RuleFlowEditor` 和 `CanvasViewport` 各自注册，可能产生事件竞争

**建议**:
```js
// 统一快捷键管理器
// src/services/shortcutManager.js
class ShortcutManager {
  #handlers = new Map()
  
  register(key, handler) { this.#handlers.set(key, handler) }
  unregister(key) { this.#handlers.delete(key) }
  
  handleKeyDown(e) {
    const combo = this.#buildCombo(e)
    const handler = this.#handlers.get(combo)
    if (handler) { e.preventDefault(); handler() }
  }
}
```

### 2.4 🟡 自定义节点注册方式可能导致引用共享

**文件**: `BaseNode.js` L183-192, `CanvasViewport.jsx` L96-98

```js
export const CUSTOM_NODE_TYPES = {
  'rf-input-port': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  // ...所有类型共享同一个 Model 和 View 类
}

Object.entries(CUSTOM_NODE_TYPES).forEach(([type, { model, view }]) => {
  lf.register(type, () => ({ model, view }))
})
```

**问题**:
- 所有 7 种节点类型共享 `RuleFlowBaseModel` 和 `RuleFlowBaseView`，通过 `properties.nodeType` 区分外观
- 这种方式能工作，但 LogicFlow 的 `register` 回调 `() => ({ model, view })` 每次返回相同的类引用
- 如果 LogicFlow 内部对 Model/View 做原型修改，不同类型之间可能相互影响
- 所有注册类型在 LogicFlow 的节点面板中显示相同名称

**建议**:
- 确认 LogicFlow 是否支持同一 Model/View 注册多种类型
- 如果需要类型特定行为（如端口节点不允许添加出边），应创建子类

### 2.5 🟡 主题切换后 SVG 节点颜色不更新

**文件**: `BaseNode.js` L50, L84, L87

```js
style.fill = 'var(--rf-bg-primary, #ffffff)'  // ← getNodeStyle()
fill: 'var(--rf-bg-primary, #ffffff)',          // ← getShape()
```

**问题**:
- SVG 元素中使用了 CSS 变量（如 `var(--rf-bg-primary)`），但 SVG 内联元素的 `fill` 和 `stroke` 属性**不一定能响应 CSS 变量变化**
- 这取决于 LogicFlow 的渲染方式：如果 SVG 是通过 `h()` 直接创建的内联元素，`var()` 引用**可以**工作（因为 DOM 元素会继承 CSS 变量）
- 但如果 LogicFlow 对 SVG 属性做了序列化/缓存，CSS 变量可能**不会自动更新**
- **暗色模式下节点背景可能仍然是白色**，导致不可读

**建议**:
```js
// 测试暗色模式下的节点渲染，如果颜色不更新：
// 方案一：主题切换时调用 lf.render() 强制刷新
// 方案二：在 getNodeStyle/getShape 中读取计算后的颜色值
const computedBg = getComputedStyle(document.documentElement)
  .getPropertyValue('--rf-bg-primary').trim()
```

### 2.6 🟡 属性面板 Toggle 开关无法交互

**文件**: `RightPanel.jsx` L259-272

```jsx
<div style={{
  width: 32, height: 18, ...,
  background: nodeData.enabled ? 'var(--rf-status-success)' : 'var(--rf-text-tertiary)',
  position: 'relative', cursor: 'pointer',
}}>
  <div style={{ ... position: 'absolute', top: 2, ... }} />
</div>
```

**问题**:
- Toggle 开关只是一个 `div`，没有 `onClick` 事件处理
- 用户看到可点击的样式（`cursor: 'pointer'`），但点击无任何反应
- 没有更新 LogicFlow 节点的 `properties.enabled` 属性

**建议**:
```jsx
<div onClick={() => {
  if (lf && nodeId) {
    const model = lf.getNodeModelById(nodeId)
    if (model) {
      model.setProperties({
        ...model.properties,
        enabled: !nodeData.enabled
      })
    }
  }
}} style={{ ... }}>
```

### 2.7 🟡 NodeSearch 中 handleInput 双重搜索

**文件**: `NodeSearch.jsx` L98-106

```js
const handleInput = (e) => {
  setQuery(e.target.value)
  setCurrentIndex(0)
  if (results.length > 0 && fuse) {
    const newResults = fuse.search(e.target.value).map(r => r.item)  // ← 手动搜索
    if (newResults.length > 0) onLocateNode?.(newResults[0].id)
  }
}
```

**问题**:
- `setQuery(e.target.value)` 触发重渲染，`results` useMemo 会自动重新计算
- 但 `handleInput` 中又手动调用 `fuse.search(e.target.value)` 执行了**第二次搜索**
- 每次 input 事件触发两次 Fuse 搜索，浪费性能

**建议**:
```js
const handleInput = (e) => {
  const newQuery = e.target.value
  setQuery(newQuery)
  setCurrentIndex(0)
  // 依赖 useMemo 的 results 即可，不需要手动搜索
  // 如果需要即时定位，使用 ref 缓存最新 results
}
```

### 2.8 🟡 edge:click 事件处理不完整

**文件**: `CanvasViewport.jsx` L167-169

```js
lf.on('edge:click', ({ data }) => {
  selectedNodeId.value = null
})
```

**问题**:
- 点击边时只清除了节点选中，但**没有设置 `selectedEdgeId`**
- `selectedEdgeId` signal 存在于 store 中但从未被赋值使用
- 属性面板无法展示边的属性

### 2.9 🟡 命令面板 flatIdx 闭包陷阱

**文件**: `CommandPalette.jsx` L159

```jsx
let flatIdx = -1
// ...
{Object.entries(grouped).map(([category, cmds]) => (
  <div key={category}>
    {cmds.map((cmd) => {
      flatIdx++
      const isCurrent = flatIdx === activeIndex
      // ...
    })}
  </div>
))}
```

**问题**:
- `flatIdx` 在 JSX 渲染循环中递增，依赖渲染顺序来计算索引
- 这不是标准的 React/Preact 模式，可能在并发渲染或 StrictMode 下行为不一致
- 如果分组为空对象，`flatIdx` 不会递增但 `activeIndex` 可能超出范围

**建议**:
```js
// 预计算扁平列表
const flatList = useMemo(() => {
  const list = []
  Object.entries(grouped).forEach(([cat, cmds]) => {
    cmds.forEach(cmd => list.push({ ...cmd, category: cat }))
  })
  return list
}, [grouped])
```

### 2.10 🟡 调试模拟的 setInterval 未在组件卸载时清理

**文件**: `DebugPanel.jsx` L91-153

```js
function simulateDebug() {
  // ...
  const interval = setInterval(() => {
    if (i >= steps.length || !isDebugRunning.value) {
      clearInterval(interval)
      // ...
    }
    // ...
  }, 800)
}
```

**问题**:
- `simulateDebug` 使用 `setInterval` 但没有返回清理函数
- 如果组件在调试运行期间被卸载（如关闭面板），`setInterval` 继续运行
- 内部通过 `!isDebugRunning.value` 检查来终止，但这依赖于 store 状态而非组件生命周期

**建议**:
```js
// 使用 ref 存储 interval ID，在 useEffect cleanup 中清除
const intervalRef = useRef(null)

useEffect(() => {
  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }
}, [])
```

### 2.11 🟡 侧栏搜索 colorVar 解析逻辑脆弱

**文件**: `Sidebar.jsx` L203

```js
colorVar={category.color?.replace('var(', '').replace(')', '') || '--rf-brand-primary'}
```

**问题**:
- `category.color` 的值是 `'var(--rf-node-condition)'` 这种格式
- `.replace('var(', '')` 后变成 `'--rf-node-condition)'`，还需要第二次 replace
- 但 `.replace(')', '')` 再去掉右括号，结果正确 `'--rf-node-condition'`
- 然而，如果 `color` 值不是 `var()` 格式（如纯色值 `'#8b5cf6'`），结果将是 `'8b5cf6'`，导致后续 `var(8b5cf6)` 无效

**建议**:
```js
// 提取 CSS 变量名的工具函数
function extractVarName(cssVar) {
  const match = cssVar?.match(/var\(([^)]+)\)/)
  return match ? match[1] : '--rf-brand-primary'
}
```

---

## 🏗️ 三、架构设计评价

### 3.1 单文件 Store 的问题

**文件**: `editorStore.js`（234 行，导出 40+ signal 和 30+ 函数）

**问题**:
- **所有状态集中在一个文件**，随着功能增长将变得难以维护
- **缺乏关注点分离**: 布局状态、画布状态、调试状态、UI 交互状态混在一起
- **导出粒度过细**: 40+ 个命名导出，消费方需要精确知道每个 signal 的名称
- **缺乏状态机**: 调试状态（idle→running→paused→stopped）应该是有限状态机，目前用多个独立 boolean 表示

**建议**:
```
src/store/
├── layoutStore.js     # 布局相关: sidebar, panel, focus mode, density
├── canvasStore.js     # 画布相关: zoom, status, selection, graph data
├── debugStore.js      # 调试相关: 运行状态、节点状态、执行日志、断点
├── uiStore.js         # UI 交互: 命令面板、搜索、气泡、批量操作
└── index.js           # 统一导出 + 跨 store 协调逻辑
```

### 3.2 组件职责过重

**文件**: `CanvasViewport.jsx`（391 行）

该组件承担了过多职责:
1. LogicFlow 实例化和配置
2. 自定义节点注册
3. 事件桥接（8 个事件监听器）
4. 拖放处理
5. 缩放控制
6. 渲染 4 个覆盖层组件
7. 管理 `isEmpty` 和 `allNodes` 本地状态

**建议**:
```
src/components/canvas/
├── CanvasViewport.jsx      # 布局容器
├── useLogicFlow.js         # 自定义 Hook: 实例化 + 配置
├── useGraphEvents.js       # 自定义 Hook: 事件桥接
├── useDragDrop.js          # 自定义 Hook: 拖放逻辑
├── ZoomControls.jsx        # 缩放控制组件
├── EmptyState.jsx          # 空状态提示
├── CommandPalette.jsx
├── NodeSearch.jsx
├── RelationTypeSelector.jsx
├── PropertyBubble.jsx
└── BatchActionToolbar.jsx
```

### 3.3 样式方案不一致

项目同时存在三种样式方案，但只使用了一种:
1. **内联样式对象** — 实际使用（95%+ 的样式）
2. **Tailwind CSS v4** — 已安装并配置 Vite 插件，但**几乎没有使用**
3. **CSS Modules** — Vite 配置中启用了 `localsConvention: 'dashesOnly'`，但**未使用**

**问题**:
- 安装了 Tailwind CSS 但不使用，增加了 `node_modules` 体积
- 内联样式无法利用 CSS 的级联、媒体查询、伪类、伪元素能力
- 伪类交互（`:hover`, `:focus`, `:active`）全部通过 `onMouseEnter/Leave` 内联事件模拟
- 响应式设计只能通过 CSS 变量间接实现

**建议**:
- **短期**: 移除未使用的 Tailwind 和 CSS Modules 配置，减少认知负担
- **中期**: 统一为 Tailwind CSS 或 CSS Modules + 设计令牌方案
- 内联样式仅用于动态计算的位置/尺寸（如覆盖层定位）

### 3.4 缺乏类型安全

项目使用纯 JavaScript，没有任何类型检查:
- `nodeData` 的结构在 `PropertyBubble`、`RightPanel`、`CanvasViewport` 中各自解构，字段名靠约定
- `properties.nodeType` 可能为任何值，没有枚举约束
- 已安装 `zod` 但未使用

**建议**:
```js
// 至少添加 JSDoc 类型注解
/**
 * @typedef {'input_port'|'output_port'|'condition'|'action'|'ext'|'flow'|'note'} NodeType
 * @typedef {{ nodeType: NodeType, icon: string, priority: number, enabled: boolean, summary?: string }} NodeProperties
 */
```

### 3.5 数据流不清晰

当前数据流混合了多种模式:
- **Signal 单向流**: store → 组件（正确）
- **命令式 API 调用**: `lf.addNode()`, `lf.deleteNode()` 直接操作（绕过状态管理）
- **DOM 事件模拟**: `onMouseEnter/Leave` 修改 `style.background`（绕过状态管理）
- **全局变量读取**: `lfInstance` 不是响应式的，直接读取可能读到 null

**建议**:
- 确立"状态变更必须通过 store"的原则
- LogicFlow 操作通过 action 函数封装
- DOM 交互样式改用 CSS 伪类

---

## 🎨 四、界面设计优化建议

### 4.1 节点视觉层次不足

**当前问题**:
- SVG filter `#rf-shadow-sm` 未定义，节点没有阴影效果，视觉上"贴"在画布上
- 所有节点都是圆角矩形 + 顶部色条，区分度不够
- 7 种节点类型的差异仅靠顶部色条颜色和 Unicode 图标区分

**建议**:
```
视觉增强方案:
┌──────────────────────┐
│ ■ SOC 监控      P:1 ✓│  ← 现状：扁平卡片
│   条件: AND           │
└──────────────────────┘

┌─ ◇ ──────────────────┐  ← 改进：节点类型用形状区分
│  SOC 监控       P:1  │     菱形边框 = 条件
│  条件: AND       ●   │     圆角矩形 = 动作
└──────────────────────┘     六边形 = 扩展节点
```

- 定义 SVG filter 实现卡片阴影
- 条件节点使用菱形或切角边框
- 端口节点使用半圆端头
- 使用 Lucide SVG 图标替代 Unicode 符号

### 4.2 覆盖层定位使用 window 尺寸不准确

**文件**: `PropertyBubble.jsx` L81-82, `BatchActionToolbar.jsx` L43-44, `RelationTypeSelector.jsx` L74-75

```js
const adjustedX = Math.min(x + 20, window.innerWidth - 280)
const adjustedY = Math.min(y - 40, window.innerHeight - 200)
```

**问题**:
- 使用 `window.innerWidth/Height` 而非画布容器尺寸
- 如果浏览器有侧边书签栏或 DevTools，计算会不准确
- 没有考虑滚动偏移
- 已安装 `@floating-ui/dom` 但**未使用**

**建议**:
```js
// 使用 @floating-ui/dom（已安装）
import { computePosition, flip, shift, offset } from '@floating-ui/dom'

const { x, y } = await computePosition(referenceEl, floatingEl, {
  middleware: [flip(), shift({ padding: 8 }), offset(8)],
})
```

### 4.3 侧栏折叠后功能丢失

**当前问题**:
- 侧栏折叠后只显示一个"展开"按钮，无法快速添加节点
- 没有"最近使用"或"收藏"的快速访问

**建议**:
```
折叠侧栏改进方案:
┌────┐
│ ◀ │  ← 展开按钮
├────┤
│ → │  ← 快速添加输入端口
│ ← │  ← 快速添加输出端口
│ ◇ │  ← 快速添加条件
│ ▶ │  ← 快速添加动作
│ 🔍│  ← 搜索组件
└────┘
```

### 4.4 暗色模式适配不完整

**文件**: `BaseNode.js` L84, L87, L116, L123

**问题**:
- 节点 SVG 中的 `fill` 和 `stroke` 使用了 CSS 变量回退硬编码白色（`var(--rf-bg-primary, #ffffff)`）
- 暗色模式下节点背景可能仍为白色（取决于 CSS 变量是否在 SVG 上下文中生效）
- 边文本背景硬编码 `fill: '#ffffff'`（`RelationEdges.js` L44）
- PropertyBubble 和 CommandPalette 的背景也使用回退值

**建议**:
- 全面测试暗色模式下的 SVG 渲染效果
- 如 CSS 变量在 SVG 中不生效，需要通过 JavaScript 读取计算样式
- 移除所有硬编码的颜色回退值

### 4.5 缺少关键交互反馈

| 场景         | 当前行为              | 建议改进                           |
| ------------ | --------------------- | ---------------------------------- |
| 节点拖入画布 | 无动画反馈            | 添加 drop zone 高亮 + 节点出现动画 |
| 删除节点     | 静默删除              | 添加确认对话框（已安装 sonner）    |
| 保存         | 功能未实现            | 添加 Ctrl+S 保存 + 状态指示        |
| 连接创建     | 仅显示关系选择器      | 添加连接线动画（流动效果）         |
| 批量选择     | 浮动工具栏            | 添加选中节点的统一高亮边框         |
| 错误发生     | 大量 `catch` 静默吞错 | 添加错误提示 toast                 |

### 4.6 响应式设计断点过于简单

**文件**: `index.css` L266-287

```css
@media (max-width: 768px) {
  :root {
    --sidebar-width: 0px;
    --panel-width: 0px;
  }
}
```

**问题**:
- 768px 以下直接将侧栏和面板宽度设为 0，用户无法访问
- 没有提供替代的访问方式（如浮动面板、底部抽屉）
- IDE 类应用通常不在移动端使用，但平板横屏需要考虑

**建议**:
- 768px 以下改为浮动面板模式
- 添加侧栏/面板的触控手势支持
- 考虑平板横屏 (1024px) 的优化布局

---

## ✅ 五、代码亮点

值得肯定的设计决策:

1. **🎨 设计令牌体系** — 300+ CSS 变量，支持明暗主题和密度模式，专业级设计系统
2. **🧩 节点映射架构** — 50+ 业务节点通过两级映射（`NODE_VISUAL_MAP` → `NODE_TYPE_MAP`）转为 7 种视觉类型，解耦了业务与渲染
3. **🔍 Fuse.js 模糊搜索** — 侧栏、命令面板、节点搜索都使用 Fuse.js，搜索体验良好
4. **♿ 无障碍设计** — 大量 `aria-label`、`role` 属性、键盘导航支持
5. **🔄 双重编码** — 调试状态使用颜色 + 图标双重编码，考虑了色盲用户
6. **📐 CSS Grid 布局** — IDE 布局使用 Grid + 命名区域，清晰且灵活
7. **🌍 国际化** — i18next 中英双语支持
8. **🎯 减少动画** — `prefers-reduced-motion` 媒体查询，尊重用户偏好

---

## 📋 六、综合优化优先级路线图

### P0 — 必须修复（影响功能正确性）

| #   | 问题                                            | 文件                           | 预计工时 |
| --- | ----------------------------------------------- | ------------------------------ | -------- |
| 1   | lfInstance 非响应式，属性面板/调试面板读到 null | editorStore.js                 | 1h       |
| 2   | 状态栏缩放按钮不驱动画布                        | editorStore.js + StatusBar.jsx | 2h       |
| 3   | SVG filter 未定义，节点无阴影                   | BaseNode.js + index.html       | 0.5h     |
| 4   | 属性面板 Toggle 开关无法交互                    | RightPanel.jsx                 | 1h       |
| 5   | graph:updated 高频触发导致性能问题              | CanvasViewport.jsx             | 2h       |

### P1 — 应该修复（影响用户体验和健壮性）

| #   | 问题                                  | 文件             | 预计工时 |
| --- | ------------------------------------- | ---------------- | -------- |
| 6   | debugMessages 无限增长                | editorStore.js   | 0.5h     |
| 7   | 主题切换后 SVG 节点颜色可能不更新     | BaseNode.js      | 2h       |
| 8   | ThemeToggle "system" 选项高亮逻辑错误 | ThemeToggle.jsx  | 1h       |
| 9   | NodeSearch handleInput 双重搜索       | NodeSearch.jsx   | 0.5h     |
| 10  | 调试 setInterval 未绑定组件生命周期   | DebugPanel.jsx   | 1h       |
| 11  | 暗色模式下边文本背景硬编码白色        | RelationEdges.js | 0.5h     |
| 12  | 统一快捷键管理，解决冲突              | 全局             | 3h       |

### P2 — 建议优化（提升代码质量和可维护性）

| #   | 问题                                       | 预计工时 |
| --- | ------------------------------------------ | -------- |
| 13  | 拆分 editorStore.js 为多个子 Store         | 4h       |
| 14  | 拆分 CanvasViewport.jsx 为多个自定义 Hook  | 4h       |
| 15  | 统一样式方案（选 Tailwind 或 CSS Modules） | 16h      |
| 16  | 添加 JSDoc 类型注解或迁移 TypeScript       | 8h       |
| 17  | 使用 @floating-ui/dom 替代手动定位计算     | 3h       |
| 18  | 创建全局搜索服务，消除 Fuse 索引重复       | 2h       |

### P3 — 界面增强（提升 UI/UX 品质）

| #   | 问题                           | 预计工时 |
| --- | ------------------------------ | -------- |
| 19  | 节点视觉差异化（形状区分类型） | 8h       |
| 20  | 侧栏折叠模式增强               | 4h       |
| 21  | 交互反馈动画（拖入/删除/连接） | 6h       |
| 22  | 响应式断点改进（平板浮动面板） | 4h       |
| 23  | 集成 sonner toast 通知         | 2h       |
| 24  | 集成 hotkeys-js 快捷键系统     | 2h       |

---

## 📌 附录：依赖审计

### 已安装但未使用的依赖

| 包名               | 版本   | 大小影响 | 建议                       |
| ------------------ | ------ | -------- | -------------------------- |
| `chart.js`         | ^4.5.1 | ~200KB   | 如近期不用可移除           |
| `dagre`            | ^0.8.5 | ~50KB    | 自动布局功能需要，建议集成 |
| `zod`              | ^4.4.3 | ~12KB    | 建议用于节点属性校验       |
| `sonner`           | ^2.0.7 | ~5KB     | 建议用于错误/成功提示      |
| `hotkeys-js`       | ^4.0.4 | ~4KB     | 建议用于统一快捷键管理     |
| `@floating-ui/dom` | ^1.7.6 | ~3KB     | 建议用于覆盖层定位         |
| `tailwindcss`      | ^4.3.1 | 0 (dev)  | 如不用可移除 Vite 插件配置 |

### 依赖版本风险

| 包名                   | 版本     | 风险                     |
| ---------------------- | -------- | ------------------------ |
| `@logicflow/core`      | ^2.2.3   | API 可能变化，锁定小版本 |
| `@logicflow/extension` | ^2.2.3   | 须与 core 版本一致       |
| `preact`               | ^10.29.1 | 稳定，无明显风险         |
| `i18next`              | ^26.3.1  | 大版本号高，检查迁移指南 |

---

> **审查总结**: RuleFlow Editor 具备专业级的设计系统和清晰的组件结构，但在**状态管理健壮性**、**性能优化**和**交互完善度**方面还有显著提升空间。建议按 P0→P3 优先级路线图逐步改进，预计总优化工时约 **70 小时**。
