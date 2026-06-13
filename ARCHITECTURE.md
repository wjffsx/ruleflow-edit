# RuleFlow Editor 系统架构设计文档

> 版本: 1.0 | 最后更新: 2026-06-13 | 状态: 开发阶段 (v0.0.0)

---

## 1. 项目概述

**RuleFlow Editor** 是一个面向工业物联网 (IIoT) 和虚拟电厂 (VPP) 场景的可视化规则链编辑器。基于 LogicFlow 流程图引擎，提供拖拽式规则编排、实时调试与可视化执行能力。

| 指标           | 数值                          |
| -------------- | ----------------------------- |
| 源文件数       | ~22 个                        |
| 代码行数       | ~4,437 行                     |
| 自定义节点类型 | 8 种 (共享 Model/View)        |
| 业务节点定义   | 50+ 种                        |
| 关系边类型     | 5 种                          |
| 语言           | 纯 JavaScript (无 TypeScript) |

---

## 2. 技术栈

### 2.1 核心依赖

| 类别       | 技术                        | 版本     | 用途                            |
| ---------- | --------------------------- | -------- | ------------------------------- |
| UI 框架    | Preact                      | ^10.29.1 | 轻量级 React 替代方案           |
| 响应式状态 | @preact/signals             | ^2.9.1   | 细粒度响应式状态管理            |
| 流程图引擎 | @logicflow/core + extension | ^2.2.3   | 画布渲染、节点/边管理、插件体系 |
| 模板语法   | htm                         | ^3.1.1   | Tagged template (实际使用 JSX)  |
| 样式       | Tailwind CSS v4             | ^4.3.1   | 原子化 CSS                      |
| 构建工具   | Vite 8                      | ^8.0.12  | 开发服务器 + 生产构建           |
| 国际化     | i18next                     | ^26.3.1  | 中英文双语支持                  |

### 2.2 辅助依赖

| 技术             | 版本    | 用途                      |
| ---------------- | ------- | ------------------------- |
| lucide-preact    | ^1.18.0 | 图标库                    |
| Fuse.js          | ^7.4.2  | 模糊搜索                  |
| Zod              | ^4.4.3  | 数据校验 (已安装，待集成) |
| sonner           | ^2.0.7  | Toast 通知                |
| chart.js         | ^4.5.1  | 图表 (已安装，待集成)     |
| dagre            | ^0.8.5  | 自动布局算法              |
| @floating-ui/dom | ^1.7.6  | 浮层定位                  |
| hotkeys-js       | ^4.0.4  | 快捷键绑定                |

### 2.3 构建配置要点

```javascript
// vite.config.js
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  css: { modules: { localsConvention: 'dashesOnly' } },
  resolve: {
    alias: {
      'react': 'preact/compat',      // React 兼容层
      'react-dom': 'preact/compat',
    },
  },
})
```

---

## 3. 目录结构

```
src/
├── main.jsx                  # 应用入口: 主题初始化 + 挂载
├── app.jsx                   # 根组件: 透传至 RuleFlowEditor
├── index.css                 # 全局样式 (286 行)
├── assets/                   # 静态资源 (图片、SVG)
├── components/               # UI 组件 (按布局区域分组)
│   ├── navbar/               # 顶部导航栏
│   ├── toolbar/              # 工具栏
│   ├── sidebar/              # 左侧节点面板
│   ├── canvas/               # 画布区域 (5 个组件)
│   │   └── CanvasViewport.jsx # 核心组件: LogicFlow 桥接层
│   ├── panel/                 # 右侧属性/调试/大纲面板
│   ├── nodes/                # LogicFlow 自定义节点与边
│   │   ├── BaseNode.js       # 节点基类 (Model + View)
│   │   └── RelationEdges.js  # 关系边 (5 种颜色)
│   └── statusbar/            # 底部状态栏
├── data/
│   └── nodeRegistry.js       # 节点注册表 (50+ 节点定义)
├── i18n/
│   └── index.js              # 国际化配置 (中/英)
├── layout/
│   └── RuleFlowEditor.jsx    # 编辑器主布局 (CSS Grid)
├── store/
│   └── editorStore.js        # 全局状态 (Signals)
└── theme/
    ├── tokens.css             # Design Token 系统 (302 行, 200+ 变量)
    └── ThemeToggle.jsx        # 主题切换组件
```

---

## 4. 系统架构

### 4.1 应用入口链

```
index.html → src/main.jsx → src/app.jsx → src/layout/RuleFlowEditor.jsx
```

- `main.jsx`: 加载 Design Token → 全局样式 → 读取持久化主题 → 挂载根组件
- `app.jsx`: 极简透传组件，仅渲染 `<RuleFlowEditor />`
- `RuleFlowEditor.jsx`: 真正的应用入口，CSS Grid 四行三列布局

### 4.2 编辑器布局 (CSS Grid)

```
"navbar  navbar  navbar"      ← 48px
"toolbar toolbar toolbar"     ← 44px
"sidebar canvas  panel"       ← 自适应 (280px / auto / 340px)
"status  status  status"      ← 28px
```

**布局尺寸变量**:
- `--navbar-height: 48px`
- `--toolbar-height: 44px`
- `--sidebar-width: 280px`
- `--panel-width: 340px`
- `--statusbar-height: 28px`

Grid 列根据侧栏/面板/专注模式的折叠状态动态计算。

---

## 5. 核心模块

### 5.1 状态管理 — editorStore.js (233 行)

采用 **@preact/signals** 实现集中式全局状态，按开发阶段分为 4 个 Phase:

#### Phase 1: 基础功能

| Signal                        | 类型         | 用途                                         |
| ----------------------------- | ------------ | -------------------------------------------- |
| `theme`                       | string       | 当前主题 (light/dark/system)                 |
| `densityMode`                 | string       | 布局密度 (comfortable/compact/ultra-compact) |
| `sidebarCollapsed`            | boolean      | 侧栏折叠状态                                 |
| `panelClosed`                 | boolean      | 右侧面板关闭状态                             |
| `focusMode`                   | boolean      | 专注模式                                     |
| `activePanelTab`              | string       | 当前面板标签页                               |
| `canvasZoom`                  | number       | 画布缩放比例                                 |
| `canvasStatus`                | string       | 画布状态 (editing/running/deployed/disabled) |
| `selectedNodeId`              | string/null  | 选中节点 ID                                  |
| `selectedEdgeId`              | string/null  | 选中边 ID                                    |
| `nodeCount` / `edgeCount`     | number       | 画布统计                                     |
| `errorCount` / `warningCount` | number       | 校验统计                                     |
| `isDirty` / `lastSaved`       | boolean/Date | 保存状态                                     |

#### Phase 2: 交互增强

| Signal                       | 用途                   |
| ---------------------------- | ---------------------- |
| `relationSelectorState`      | 关系类型选择器弹出状态 |
| `propertyBubbleState`        | 属性气泡弹出状态       |
| `nodeSearchVisible`          | 节点搜索可见性         |
| `batchToolbarState`          | 批量操作工具栏状态     |
| `sidebarCollapsedCategories` | 侧栏分类折叠状态       |

#### Phase 3: 调试体验

| Signal                             | 用途               |
| ---------------------------------- | ------------------ |
| `isDebugRunning` / `isDebugPaused` | 调试运行/暂停状态  |
| `debugNodeId` / `debugStep`        | 当前调试节点和步数 |
| `debugExecutionPath`               | 执行路径           |
| `debugNodeStates`                  | 各节点调试状态     |
| `debugMessages`                    | 调试日志消息       |
| `debugBreakpoints`                 | 断点列表           |

#### Phase 4: 生态系统

| Signal                  | 用途            |
| ----------------------- | --------------- |
| `commandPaletteVisible` | 命令面板可见性  |
| `searchQuery`           | 搜索关键词      |
| `canUndo` / `canRedo`   | 撤销/重做可用性 |

**Action 函数**: 每个 Signal 都有对应的 action 函数 (如 `setTheme()`, `startDebug()`, `showCommandPalette()` 等)，封装了状态更新和副作用 (如 localStorage 持久化)。

**LogicFlow 实例引用**:
```javascript
export let lfInstance = null
export function setLfInstance(lf) { lfInstance = lf }
```
这是**可变外部变量** (非 signal)，由 CanvasViewport 设置，全局共享。其他组件通过 `lfInstance` 直接操控画布。

**持久化策略**: 部分状态通过 localStorage 持久化:
- `rf-theme` — 主题偏好
- `rf-density` — 密度模式
- `rf-sidebar-collapsed` — 侧栏分类折叠状态

---

### 5.2 节点注册系统 — nodeRegistry.js (205 行)

定义了 **50+ 节点类型**，分为 5 大类别 + 2 个固定类型:

| 类别 ID             | 名称     | 节点数 | 后端路径                         |
| ------------------- | -------- | ------ | -------------------------------- |
| `builtin-condition` | 内置条件 | 19     | `pkg/ruleflow/builtin/condition` |
| `builtin-action`    | 内置动作 | 11     | `pkg/ruleflow/builtin/action`    |
| `ext-nodes`         | 扩展节点 | 16     | `pkg/ruleflow/ext`               |
| `vpp-nodes`         | VPP 专用 | 16     | `pkg/ruleflow/extensions`        |
| `flow-nodes`        | 流程控制 | 2      | `pkg/ruleflow/extensions/flow`   |
| (固定)              | 端口节点 | 2      | —                                |
| (固定)              | 注释节点 | 1      | —                                |

**核心映射表**:

1. **`NODE_CATEGORIES`** — 侧栏展示用: 按类别分组，每项包含 `{ type, name, icon }`
2. **`NODE_TYPE_MAP`** — 逻辑类型映射: 将 7 种视觉类型映射到 LogicFlow 自定义类型
3. **`NODE_VISUAL_MAP`** — 策略模式: 将 50+ 具体节点类型映射到 7 种视觉类别

**关系类型** (`RELATION_TYPES`): True (绿), False (红), Success (蓝), Failure (琥珀), Custom (紫)

---

### 5.3 自定义节点 — BaseNode.js (194 行)

#### 类继承关系

```
LogicFlow                    项目
──────────                   ──────────
RectNodeModel  ←──────────  RuleFlowBaseModel
RectNode       ←──────────  RuleFlowBaseView
```

#### RuleFlowBaseModel (模型层)

- `initNodeData()`: 根据 `properties.nodeType` 设置节点尺寸 (默认 200×80)
- `getNodeStyle()`: 根据 `NODE_COLORS` 映射设置节点边框颜色
- `getOutlineStyle()`: 选中时虚线描边

#### RuleFlowBaseView (视图层 — SVG 渲染)

自定义 `getShape()` 方法渲染以下元素:
- 卡片背景 (圆角矩形 + 阴影)
- 顶部 4px 颜色条 (类型标识)
- Unicode 图标 (替代 Emoji)
- 节点标签
- 优先级徽章 (P:1)
- 摘要行
- 启用指示器 (颜色 + 对勾/叉号双编码)

#### Flyweight 共享模式

8 种 LogicFlow 自定义节点类型**共享同一对 Model/View**:
```
rf-input-port, rf-output-port, rf-rule, rf-condition,
rf-action, rf-ext-action, rf-sub-chain, rf-note
```
通过 `properties.nodeType` 区分渲染行为，实现了类型数量与类数量的解耦。

---

### 5.4 关系边 — RelationEdges.js (88 行)

继承 `PolylineEdgeModel` / `PolylineEdge`，根据 `properties.relationType` 动态着色:

| 关系类型 | 颜色   | 色值      |
| -------- | ------ | --------- |
| True     | 绿色   | `#16a34a` |
| False    | 红色   | `#dc2626` |
| Success  | 蓝色   | `#2563eb` |
| Failure  | 琥珀色 | `#d97706` |
| Custom   | 紫色   | `#7c3aed` |
| default  | 灰色   | `#9ca3af` |

---

### 5.5 画布视口 — CanvasViewport.jsx (390 行)

**项目最核心的组件**，承担以下职责:

1. **LogicFlow 实例初始化**: 配置网格、键盘、插件 (MiniMap, Snapshot, SelectionSelect)
2. **自定义节点注册**: 遍历 `CUSTOM_NODE_TYPES` 和 `RELATION_EDGE_TYPE`
3. **Demo 数据渲染**: 默认加载示例规则链 (SOC 监控 → 值变换 → 调度下发)
4. **事件处理** (LogicFlow → Signals 桥接):

| LogicFlow 事件       | Signal 更新                               |
| -------------------- | ----------------------------------------- |
| `graph:updated`      | `nodeCount` / `edgeCount`                 |
| `node:click`         | `selectedNodeId` + `showPropertyBubble()` |
| `blank:click`        | 清除选中状态                              |
| `edge:add`           | `showRelationSelector()`                  |
| `graph:transform`    | `canvasZoom`                              |
| `selection:selected` | 批量操作工具栏                            |

5. **拖放添加节点**: 从侧栏拖入时，根据 `NODE_VISUAL_MAP` 确定视觉类型
6. **覆盖层组件**: RelationTypeSelector, PropertyBubble, NodeSearch, BatchActionToolbar
7. **缩放控制**: 左下角缩放按钮

---

## 6. 数据流分析

### 6.1 核心架构模式

```
┌──────────────────────────────────────────────────────────────┐
│                    editorStore (Signals)                      │
│  theme │ layout │ selection │ canvas │ debug │ commands       │
└──────────┬────────────────────────────────────┬──────────────┘
           │ 读取 (.value)                       │ 写入 (actions)
           ▼                                     ▼
┌──────────────────┐                    ┌──────────────────────┐
│   UI 组件        │  ─── 用户交互 ──▶  │   Action 函数        │
│   (渲染)         │                    │   (状态更新+副作用)   │
└────────┬─────────┘                    └──────────────────────┘
         │ 事件回调
         ▼
┌──────────────────┐
│   LogicFlow      │  ←─── lfInstance (全局可变引用)
│   (画布引擎)     │
└──────────────────┘
```

### 6.2 关键数据流路径

#### 路径 1: 拖拽添加节点

```
Sidebar (dragStart) → CanvasViewport (onDrop)
  → NODE_VISUAL_MAP[type] 确定 lfType
  → lf.addNode() 添加到画布
  → graph:updated 事件 → 更新 nodeCount/edgeCount signals
```

#### 路径 2: 节点选择

```
CanvasViewport (node:click 事件)
  → selectedNodeId.value = data.id
  → showPropertyBubble() 显示属性气泡
  → RightPanel/PropertiesTab 读取 selectedNodeId.value 渲染属性
```

#### 路径 3: 边创建与关系选择

```
LogicFlow (edge:add 事件)
  → showRelationSelector(x, y, edgeId)
  → RelationTypeSelector 弹出
  → 用户选择 → handleRelationSelect()
  → edgeModel.setProperties({ relationType })
  → hideRelationSelector()
```

#### 路径 4: 调试执行

```
DebugPanel.simulateDebug() / Toolbar.运行按钮
  → startDebug() (更新 isDebugRunning/canvasStatus signals)
  → setInterval 模拟逐步执行
  → 每步: setDebugNodeState(), addDebugMessage()
  → DebugPanel 读取 debugNodeStates/debugMessages signals 渲染
```

#### 路径 5: 主题切换

```
ThemeToggle → setTheme(key)
  → theme.value = key
  → localStorage.setItem('rf-theme', key)
  → document.documentElement.setAttribute('data-theme', key)
  → CSS 变量自动切换 (tokens.css 中 [data-theme="dark"] 选择器)
```

---

## 7. 设计模式总结

### 7.1 Signal-based 响应式状态 (观察者模式变体)

`@preact/signals` 实现细粒度响应式，信号变化自动触发依赖组件重渲染:
- **去中心化**: 没有单一 reducer/dispatch，每个 signal 独立
- **直接修改**: 不需要 action creator，直接 `.value = xxx`
- **细粒度更新**: 只有读取特定 signal 的组件会重渲染

### 7.2 事件驱动架构 (LogicFlow 集成)

CanvasViewport 作为**唯一的事件桥接层**，将 LogicFlow 事件转换为 Signals 更新:
```javascript
lf.on('node:click', ({ data, e }) => { selectedNodeId.value = data.id })
lf.on('edge:add', ({ data }) => { showRelationSelector(...) })
```

### 7.3 Strategy Pattern (节点视觉分类)

通过 `NODE_VISUAL_MAP` 将 50+ 具体节点类型映射到 7 种视觉类别，使渲染逻辑与业务类型解耦。

### 7.4 Flyweight Pattern (共享 Model/View)

8 种 LogicFlow 自定义节点类型共享同一对 `RuleFlowBaseModel` / `RuleFlowBaseView`，通过 `properties.nodeType` 区分渲染。

### 7.5 Service Locator (lfInstance)

```javascript
export let lfInstance = null
export function setLfInstance(lf) { lfInstance = lf }
```
LogicFlow 实例作为可变外部变量，由 CanvasViewport 设置，其他组件直接访问。

### 7.6 Design Token 系统 (CSS 变量抽象)

`tokens.css` 定义 200+ 语义化 CSS 变量，涵盖:
- 品牌、状态、关系、节点类型颜色
- 告警色阶 (IEC 62682) / 设备状态色 (DL/T 799)
- 电压等级色、能源类型色
- 色盲友好替代色板 (Okabe-Ito)
- 排版、间距、圆角、阴影、动画、Z-index

明暗主题通过 `[data-theme="dark"]` 选择器一键切换全部 token 值。

---

## 8. 组件层次结构

```
App
└── RuleFlowEditor (CSS Grid 布局, 全局快捷键注册)
    ├── Navbar
    │   ├── 品牌标识
    │   ├── 规则链选择器
    │   ├── 面包屑导航
    │   ├── 搜索按钮 → showCommandPalette
    │   ├── ThemeToggle (浅色/深色/系统)
    │   ├── 通知按钮
    │   ├── 连接状态指示器
    │   └── 用户头像
    ├── Toolbar
    │   ├── 文件组: 新建/打开/保存
    │   ├── 编辑组: 撤销/重做
    │   ├── 运行组: 运行/停止/重置
    │   ├── 视图组: 全屏/大纲/小地图
    │   ├── 布局组: 自动布局/对齐网格/显示网格
    │   └── 上下文操作: 复制/删除/启用 (选中节点时)
    ├── Sidebar
    │   ├── 搜索框 (Fuse.js)
    │   ├── 常用: 端口节点 + 注释
    │   └── 分类: 5 大类可折叠 (CategorySection)
    │       └── SidebarItem (draggable)
    ├── CanvasViewport
    │   ├── LogicFlow 实例
    │   ├── 空状态提示
    │   ├── RelationTypeSelector (弹出)
    │   ├── PropertyBubble (弹出)
    │   ├── NodeSearch (Ctrl+F)
    │   ├── BatchActionToolbar (多选时)
    │   └── 缩放控制按钮
    ├── RightPanel (可关闭)
    │   ├── Tab: 属性 (PropertiesTab)
    │   ├── Tab: 调试 (DebugPanel)
    │   └── Tab: 大纲 (OutlineTab)
    ├── StatusBar
    │   ├── 画布状态
    │   ├── 缩放控制
    │   ├── 节点/连接计数
    │   ├── 错误/警告计数
    │   └── 保存状态
    └── CommandPalette (全局覆盖层, Ctrl+K)
```

---

## 9. 数据模型

项目无 TypeScript 类型定义，以下是从代码中提取的核心数据结构:

### 9.1 节点数据 (LogicFlow 格式)

```javascript
{
  id: 'input_soc',           // 唯一标识
  type: 'rf-input-port',     // LogicFlow 自定义类型
  x: 200,                    // 画布 X 坐标
  y: 150,                    // 画布 Y 坐标
  text: 'SOC 数据',           // 节点标签
  properties: {
    nodeType: 'input_port',  // 视觉类别 (决定颜色/图标)
    icon: '→',               // Unicode 图标
    priority: 0,              // 优先级
    enabled: true,            // 启用状态
    summary: 'soc_monitor'   // 摘要描述
  }
}
```

### 9.2 边数据

```javascript
{
  id: 'e3',
  type: 'polyline',                        // 折线
  sourceNodeId: 'cond_soc',
  targetNodeId: 'action_transform',
  text: 'True',
  properties: { relationType: 'True' }     // 关系类型 (决定颜色)
}
```

### 9.3 节点注册表条目

```javascript
{
  type: 'device_type',       // 业务类型标识
  name: '设备类型条件',       // 显示名称
  icon: '◆',                 // Unicode 图标
  category: 'builtin-condition', // 所属类别
  backendPath: 'pkg/ruleflow/builtin/condition' // 后端路径
}
```

---

## 10. 国际化

**文件**: `src/i18n/index.js` (125 行)

- 框架: i18next
- 语言: 中文 (zh, 83 键) + 英文 (en, 35 键)
- 默认: 中文
- 持久化: `rf-lang` 键

**已知问题**: 英文翻译不完整，部分组件中存在硬编码中文。

---

## 11. API/服务层

**当前状态: 无 API 层**。所有数据均为本地生成:
- Demo 数据在 `CanvasViewport.jsx` 中硬编码
- 节点定义在 `nodeRegistry.js` 中静态定义
- 调试功能通过 `setInterval` 模拟执行
- 无 HTTP 客户端配置

Zod 依赖已安装但未使用，可能为未来 API 响应校验预留。

---

## 12. 全局快捷键

| 快捷键   | 功能         |
| -------- | ------------ |
| `Ctrl+K` | 打开命令面板 |
| `Ctrl+.` | 切换布局密度 |
| `Ctrl+F` | 节点搜索     |

---

## 13. 架构评估

### 13.1 架构优势

1. **轻量高效**: Preact + Signals 体积远小于 React + Redux，且实现真正的细粒度按需更新
2. **Design Token 体系完善**: 200+ 语义化变量，明暗主题一键切换，符合 IEC/DL/T 工业标准
3. **LogicFlow 集成良好**: 自定义节点/边 + 事件桥接，实现流程图引擎与 UI 框架的优雅结合
4. **领域驱动设计**: 节点分类与后端 Go 项目 (ruleflow) 架构对齐，前后端概念统一
5. **Flyweight 模式**: 8 种节点类型共享一对 Model/View，减少代码重复
6. **Strategy 模式**: NODE_VISUAL_MAP 解耦业务类型与视觉呈现

### 13.2 架构待改进

| 问题                    | 严重度 | 建议                                        |
| ----------------------- | ------ | ------------------------------------------- |
| 无 TypeScript 类型系统  | 高     | 引入 TypeScript，定义核心数据模型接口       |
| 无测试覆盖              | 高     | 配置 Vitest，优先覆盖 store 和节点注册逻辑  |
| 无代码规范              | 中     | 配置 ESLint + Prettier                      |
| API 层缺失              | 中     | 设计 API 层，Zod 已安装可用于响应校验       |
| lfInstance 全局可变引用 | 中     | 引入 null 安全保护，考虑 Context 或 DI 模式 |
| 国际化不完整            | 低     | 补全英文翻译，消除硬编码中文                |
| 内联样式过多            | 低     | 迁移至 CSS Modules 或 Tailwind 类           |
| 未使用依赖              | 低     | 清理 Zod/dagre/chart.js 或完成集成          |

---

## 附录 A: 技术决策记录

| 决策     | 选择                        | 理由                                       |
| -------- | --------------------------- | ------------------------------------------ |
| UI 框架  | Preact (非 React)           | 体积小 (3KB vs 42KB)，Signals 内置响应式   |
| 状态管理 | @preact/signals             | 细粒度更新，无需 reducer/selector 样板代码 |
| 画布引擎 | LogicFlow                   | 国产开源，支持自定义节点/边，插件体系完善  |
| 构建工具 | Vite                        | 开发体验优秀，HMR 快速                     |
| CSS 方案 | Tailwind v4 + CSS Variables | 原子化 + 语义化双模式                      |
| 国际化   | i18next                     | 成熟方案，支持命名空间和懒加载             |
