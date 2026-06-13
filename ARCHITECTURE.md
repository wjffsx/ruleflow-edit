# RuleFlow Editor 系统架构设计文档

> 版本: 2.0 | 最后更新: 2026-06-14 | 状态: v0.1.0

---

## 1. 项目概述

**RuleFlow Editor** 是一个面向工业物联网 (IIoT) 和虚拟电厂 (VPP) 场景的可视化规则链编辑器。基于 LogicFlow 流程图引擎，提供拖拽式规则编排、实时调试与可视化执行能力。同时作为可复用的前端库，通过 `src/index.ts` 对外暴露公共 API。

| 指标           | 数值                            |
| -------------- | ------------------------------- |
| 源文件数       | ~45 个                          |
| 代码行数       | ~6,500 行                       |
| 自定义节点类型 | 8 种 (共享 Model/View)          |
| 业务节点定义   | 67 种                           |
| 关系边类型     | 5 种                            |
| 语言           | TypeScript (strict mode)        |
| 测试覆盖       | 7 suites / 80 tests (Vitest)   |
| 输出格式       | ESM + CJS 双格式                |

---

## 2. 技术栈

### 2.1 核心依赖 (peerDependencies)

| 类别       | 技术                        | 版本      | 用途                            |
| ---------- | --------------------------- | --------- | ------------------------------- |
| UI 框架    | Preact                      | ^10.0.0   | 轻量级 React 替代方案           |
| 响应式状态 | @preact/signals             | ^2.0.0    | 细粒度响应式状态管理            |
| 流程图引擎 | @logicflow/core + extension | ^2.0.0    | 画布渲染、节点/边管理、插件体系 |
| 图标库     | lucide-preact               | ^1.0.0    | Lucide 图标 (Preact 版本)       |

### 2.2 运行时依赖 (dependencies)

| 技术             | 版本    | 用途           |
| ---------------- | ------- | -------------- |
| @floating-ui/dom | ^1.7.6  | 浮层定位       |
| fuse.js          | ^7.4.2  | 模糊搜索       |
| hotkeys-js       | ^4.0.4  | 快捷键绑定     |
| react-hot-toast  | ^2.6.0  | Toast 通知     |

### 2.3 开发依赖 (devDependencies)

| 技术                            | 版本      | 用途                       |
| ------------------------------- | --------- | -------------------------- |
| TypeScript                      | ^6.0.3    | 类型系统 (strict mode)     |
| Vite 8                          | ^8.0.12   | 开发服务器 + 生产构建      |
| vite-plugin-dts                 | ^5.0.2    | 构建时生成 .d.ts 类型声明  |
| Vitest                          | ^4.1.8    | 单元测试框架               |
| @vitest/coverage-v8             | ^4.1.8    | 测试覆盖率 (V8 引擎)       |
| ESLint 10                       | ^10.5.0   | 代码检查 (flat config)     |
| typescript-eslint               | ^8.61.0   | TypeScript ESLint 插件     |
| eslint-config-prettier          | ^10.1.8   | Prettier 兼容配置          |
| Prettier                        | ^3.8.4    | 代码格式化                 |
| @preact/preset-vite             | ^2.10.5   | Preact Vite 预设           |
| @testing-library/preact         | ^3.2.4    | 组件测试工具               |
| jsdom                           | ^29.1.1   | DOM 模拟环境               |
| @changesets/cli                 | ^2.31.0   | 版本管理与发布             |
| husky                           | ^9.1.7    | Git hooks 管理             |
| lint-staged                     | ^17.0.7   | 暂存区代码检查             |

### 2.4 构建配置要点

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    preact(),
    dts({ insertTypesEntry: true, include: ['src'] }),  // 自动生成类型声明
  ],
  css: { modules: { localsConvention: 'dashesOnly' } },
  resolve: {
    alias: {
      'react': 'preact/compat',      // React 兼容层
      'react-dom': 'preact/compat',
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'RuleFlowEditor',
      formats: ['es', 'cjs'],        // ESM + CJS 双格式输出
      fileName: (format) => `ruleflow-edit.${format}.js`,
    },
    rollupOptions: {
      external: ['preact', '@preact/signals', '@logicflow/core', '@logicflow/extension'],
    },
  },
})
```

**package.json 关键字段**:
```json
{
  "main": "dist/ruleflow-edit.cjs.js",
  "module": "dist/ruleflow-edit.es.js",
  "types": "dist/index.d.ts",
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/ruleflow-edit.es.js",
      "require": "./dist/ruleflow-edit.cjs.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

---

## 3. 目录结构

```
src/
├── index.ts                  # 库公共 API 入口 (统一 re-export)
├── main.tsx                  # 应用入口: 主题初始化 + 挂载
├── app.tsx                   # 根组件: ErrorBoundary + Toaster
├── index.css                 # 全局样式
├── types/                    # TypeScript 类型定义
│   ├── editor.ts             # 核心业务类型 (NodeCategory, ThemeMode 等)
│   └── logicflow.d.ts        # LogicFlow 类型扩展 (NodeClickEvent 等)
├── utils/                    # 工具函数
│   ├── index.ts              # Utils barrel
│   ├── validation.ts         # 运行时校验 (safeReadStorage, isValidGraphData 等)
│   └── errors.ts             # 标准错误类 (RuleFlowError + ERROR_CODES)
├── i18n/
│   └── index.ts              # 自研轻量国际化 (替代 i18next)
├── data/                     # 数据层
│   ├── index.ts              # Data barrel
│   ├── nodeData.ts           # 节点分类与条目定义 (67 种节点)
│   ├── nodeMappings.ts       # 节点映射表 (NODE_TYPE_MAP, NODE_VISUAL_MAP 等)
│   ├── nodeRegistry.ts       # 节点注册 barrel (re-export)
│   ├── iconRegistry.ts       # Lucide 图标统一映射 (ICON_MAP)
│   └── demoData.ts           # 示例规则链数据
├── services/                 # 服务层
│   ├── index.ts              # Services barrel
│   ├── searchService.ts      # 全局搜索服务 (Fuse.js 单例)
│   ├── floatingPosition.ts   # 浮层定位服务 (@floating-ui/dom)
│   └── toastService.ts       # Toast 通知服务 (react-hot-toast)
├── store/                    # 状态管理 (6 个独立模块)
│   ├── index.ts              # Store barrel (统一 re-export)
│   ├── themeStore.ts         # 主题与密度状态
│   ├── layoutStore.ts        # 布局状态 (侧栏/面板/专注模式)
│   ├── canvasStore.ts        # 画布状态 (缩放/选中/统计/覆盖层)
│   ├── debugStore.ts         # 调试状态 (执行/断点/日志)
│   ├── commandStore.ts       # 命令面板与搜索状态
│   ├── historyStore.ts       # 撤销/重做状态
│   └── canvasActions.ts      # 画布 UI 操作 (内部 re-export)
├── components/               # UI 组件 (按布局区域分组)
│   ├── common/               # 通用组件
│   │   └── ErrorBoundary.tsx # 错误边界
│   ├── navbar/               # 顶部导航栏
│   ├── toolbar/              # 工具栏
│   ├── sidebar/              # 左侧节点面板
│   ├── canvas/               # 画布区域
│   │   ├── CanvasViewport.tsx # 核心组件: LogicFlow 桥接层
│   │   ├── useLogicFlow.ts   # LogicFlow 实例初始化 hook
│   │   ├── useLogicFlowEvents.ts # LogicFlow 事件处理 hook
│   │   ├── useDragDrop.ts    # 拖放添加节点 hook
│   │   ├── CommandPalette.tsx # 命令面板
│   │   ├── NodeSearch.tsx    # 节点搜索
│   │   ├── PropertyBubble.tsx # 属性气泡
│   │   ├── RelationTypeSelector.tsx # 关系类型选择器
│   │   ├── ZoomControls.tsx  # 缩放控制
│   │   ├── BatchActionToolbar.tsx # 批量操作工具栏
│   │   └── EmptyState.tsx    # 空状态提示
│   ├── panel/                 # 右侧属性/调试/大纲面板
│   │   ├── RightPanel.tsx    # 面板容器
│   │   ├── PropertiesTab.tsx # 属性标签页
│   │   ├── DebugPanel.tsx    # 调试标签页
│   │   ├── OutlineTab.tsx    # 大纲标签页
│   │   ├── debugSimulation.ts # 调试模拟引擎 (纯函数)
│   │   └── EdgeRelations.tsx # 连接关系子组件
│   ├── nodes/                # LogicFlow 自定义节点与边
│   │   ├── BaseNode.ts       # 节点基类 (Model + View)
│   │   └── RelationEdges.ts  # 关系边 (5 种颜色)
│   └── statusbar/            # 底部状态栏
├── layout/
│   └── RuleFlowEditor.tsx    # 编辑器主布局 (CSS Grid + 快捷键)
├── theme/
│   ├── tokens.css             # Design Token 系统 (200+ 变量)
│   └── ThemeToggle.tsx        # 主题切换组件
└── styles/                    # CSS Modules
    └── layout.module.css      # 布局样式
```

---

## 4. 系统架构

### 4.1 应用入口链

```
index.html → src/main.tsx → src/app.tsx → src/layout/RuleFlowEditor.tsx
```

- `main.tsx`: 加载 Design Token → 全局样式 → 挂载根组件到 `#app`
- `app.tsx`: 初始化主题 (从 localStorage 读取) → ErrorBoundary 包裹 → RuleFlowEditor + Toaster
- `RuleFlowEditor.tsx`: 真正的应用入口，CSS Grid 四行三列布局 + 全局快捷键注册 (hotkeys-js)

**库入口**: `src/index.ts` — 统一 re-export 所有公共类型、组件、hooks、stores、数据、服务和工具函数。

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

Grid 列根据侧栏/面板/专注模式的折叠状态动态计算，通过 CSS Module 类名切换 (`colsDefault`, `colsCollapsed`, `colsNoPanel`, `colsCollapsedNoPanel`, `colsFocused`)。

---

## 5. 核心模块

### 5.1 类型系统 — types/

#### editor.ts

定义了所有核心业务类型接口:

| 类型                    | 类别   | 用途                                    |
| ----------------------- | ------ | --------------------------------------- |
| `NodeCategory`          | 接口   | 侧栏节点分类 (`id, name, icon, color, items`) |
| `NodeItem`              | 接口   | 侧栏节点条目 (`type, name, icon, color?`) |
| `VisualCategory`        | 接口   | 视觉样式信息 (`colorVar, icon, hexColor`) |
| `PortNode`              | 接口   | 端口节点 (extends NodeItem + `color`)   |
| `NoteNode`              | 接口   | 注释节点 (extends NodeItem + `color`)   |
| `RelationType`          | 接口   | 关系类型 (`key, label, colorVar, lightColorVar`) |
| `NodeTypeMeta`          | 接口   | LogicFlow 渲染元数据 (`label, icon, colorVar, width, height, lfType, category`) |
| `ThemeMode`             | 类型   | `'light' \| 'dark' \| 'system'`        |
| `DensityMode`           | 类型   | `'comfortable' \| 'compact' \| 'ultra-compact'` |
| `CanvasStatus`          | 类型   | `'editing' \| 'running' \| 'deployed' \| 'disabled'` |
| `PanelTab`              | 类型   | `'properties' \| 'debug' \| 'outline'` |
| `PanelMode`             | 类型   | `'fixed' \| 'floating' \| 'inline'`    |
| `DebugNodeState`        | 类型   | `'success' \| 'failure' \| 'processing' \| 'idle'` |
| `DebugMessage`          | 接口   | 调试日志消息                            |
| `PropertyBubbleState`   | 接口   | 属性气泡状态                            |
| `RelationSelectorState` | 接口   | 关系类型选择器状态                      |
| `SearchItem`            | 接口   | 搜索结果条目                            |
| `CommandItem`           | 接口   | 命令面板条目                            |

#### logicflow.d.ts

为 `@logicflow/core` 补充类型声明，包括:

- **数据接口**: `NodeData`, `EdgeData`, `GraphData`
- **模型接口**: `NodeModel`, `EdgeModel`, `TransformModel`, `EventCenter`, `GraphModel`
- **事件回调类型**: `NodeClickEvent`, `EdgeAddEvent`, `EdgeClickEvent`, `GraphUpdatedEvent`, `SelectionEvent`
- **LogicFlow 类**: 完整方法签名 (render, zoom, undo, redo, on, off, destroy 等)
- **基类**: `RectNodeModel`, `RectNode`, `PolylineEdgeModel`, `PolylineEdge`

### 5.2 错误与校验 — utils/

#### errors.ts — RuleFlowError 标准错误类

```typescript
class RuleFlowError extends Error {
  readonly code: string
  cause?: unknown
  constructor(message: string, code: string, options?: { cause?: unknown })
}
```

**错误码常量** (`ERROR_CODES`):

| 错误码             | 用途               |
| ------------------ | ------------------ |
| `INVALID_GRAPH`    | 无效图数据结构     |
| `INVALID_NODE`     | 无效拖放节点数据   |
| `FILE_OPERATION`   | 文件操作失败       |
| `LF_OPERATION`     | LogicFlow 操作失败 |
| `LAYOUT`           | 布局操作失败       |
| `DEBUG`            | 调试操作失败       |

#### validation.ts — 运行时校验工具

校验外部输入 (localStorage、JSON.parse、拖放数据) — TypeScript 编译时无法保证的部分:

| 函数                  | 签名                                                          | 用途                         |
| --------------------- | ------------------------------------------------------------- | ---------------------------- |
| `safeReadStorage`     | `(key, validValues, fallback) => string`                      | 安全读取 localStorage        |
| `safeJsonParse`       | `(text, validator) => T \| null`                              | 安全 JSON 解析 + 校验        |
| `hasRequiredKeys`     | `(data, keys) => data is Record<string, unknown>`            | 检查必需键                   |
| `isValidGraphData`    | `(data) => data is { nodes, edges }`                          | 校验图数据结构               |
| `isValidNodeItem`     | `(data) => data is { type, name, icon }`                      | 校验拖放节点数据             |
| `safeGetTheme`        | `() => string`                                                | 安全获取主题偏好             |
| `safeGetThemePref`    | `() => string`                                                | 安全获取主题偏好 (备用键)    |
| `safeGetDensity`      | `() => string`                                                | 安全获取密度模式             |
| `safeGetLang`         | `() => string`                                                | 安全获取语言设置             |
| `safeReadJsonStorage` | `(key, fallback, validator?) => T`                            | 安全读取 JSON 格式存储       |
| `isBooleanRecord`     | `(data) => data is Record<string, boolean>`                   | 校验布尔值记录               |
| `safeSetStorage`      | `(key, value) => boolean`                                     | 安全写入 localStorage        |

### 5.3 状态管理 — store/ (6 个独立模块)

采用 **@preact/signals** 实现模块化全局状态，从单一 `editorStore.js` 拆分为 6 个独立 store 模块 + 1 个操作聚合模块:

#### themeStore.ts — 主题与密度

| Signal                      | 类型                          | 用途                                         |
| --------------------------- | ----------------------------- | -------------------------------------------- |
| `theme`                     | `ThemeMode`                   | 当前主题 (light/dark/system)                 |
| `densityMode`               | `DensityMode`                 | 布局密度 (comfortable/compact/ultra-compact) |
| `sidebarCollapsedCategories`| `Record<string, boolean>`     | 侧栏分类折叠状态                             |

**Action 函数**: `setTheme()`, `setDensityMode()`, `cycleDensityMode()`, `toggleCategoryCollapse()`, `isCategoryCollapsed()`

**持久化**: `rf-theme`, `rf-density`, `rf-sidebar-collapsed` (通过 `safeSetStorage` / `safeReadJsonStorage`)

#### layoutStore.ts — 布局

| Signal             | 类型        | 用途               |
| ------------------ | ----------- | ------------------ |
| `sidebarCollapsed` | `boolean`   | 侧栏折叠状态       |
| `panelClosed`      | `boolean`   | 右侧面板关闭状态   |
| `focusMode`        | `boolean`   | 专注模式           |
| `activePanelTab`   | `PanelTab`  | 当前面板标签页     |
| `panelMode`        | `PanelMode` | 面板显示模式       |

**Action 函数**: `toggleSidebar()`, `togglePanel()`, `toggleFocusMode()`, `setActivePanelTab()`, `setPanelMode()`

#### canvasStore.ts — 画布

| Signal                  | 类型                          | 用途                   |
| ----------------------- | ----------------------------- | ---------------------- |
| `canvasZoom`            | `number`                      | 画布缩放比例 (25-200)  |
| `canvasStatus`          | `CanvasStatus`                | 画布状态               |
| `selectedNodeId`        | `string \| null`              | 选中节点 ID            |
| `selectedEdgeId`        | `string \| null`              | 选中边 ID              |
| `selectedNodeIds`       | `string[]`                    | 多选节点 ID 列表       |
| `chainName`             | `string`                      | 规则链名称             |
| `lastSaved`             | `string \| null`              | 最后保存时间           |
| `isDirty`               | `boolean`                     | 是否有未保存更改       |
| `lfInstance`            | `LogicFlow \| null`           | LogicFlow 实例引用     |
| `nodeCount` / `edgeCount`| `number`                     | 画布统计               |
| `errorCount` / `warningCount`| `number`                  | 校验统计               |
| `outlineNodes`          | `NodeData[]`                  | 大纲节点列表           |
| `relationSelectorState` | `RelationSelectorState \| null`| 关系选择器状态        |
| `propertyBubbleState`   | `PropertyBubbleState \| null` | 属性气泡状态           |
| `nodeSearchVisible`     | `boolean`                     | 节点搜索可见性         |
| `batchToolbarState`     | `{ x, y, count } \| null`     | 批量操作工具栏状态     |

**lfInstance 类型安全**: 使用 `signal<LogicFlow | null>(null)` 替代旧版可变外部变量，提供 null 安全保护。

**Action 函数**: `setZoom()`, `setCanvasStatus()`, `setLfInstance()`, `showRelationSelector()`, `hideRelationSelector()`, `showPropertyBubble()`, `hidePropertyBubble()`, `toggleNodeSearch()`, `showBatchToolbar()`, `hideBatchToolbar()`

#### debugStore.ts — 调试

| Signal               | 类型                          | 用途               |
| -------------------- | ----------------------------- | ------------------ |
| `isDebugRunning`     | `boolean`                     | 调试运行状态       |
| `isDebugPaused`      | `boolean`                     | 调试暂停状态       |
| `debugNodeId`        | `string \| null`              | 当前调试节点       |
| `debugStep`          | `number`                      | 当前执行步数       |
| `debugTotalSteps`    | `number`                      | 总步数             |
| `debugExecutionPath` | `string[]`                    | 执行路径           |
| `debugNodeStates`    | `Record<string, DebugNodeState>`| 各节点调试状态   |
| `debugMessages`      | `Array<{ nodeId, type, message, time }>`| 调试日志   |
| `debugBreakpoints`   | `string[]`                    | 断点列表           |

**Action 函数**: `startDebug()`, `pauseDebug()`, `resumeDebug()`, `stopDebug()`, `stepDebug()`, `toggleBreakpoint()`, `setDebugNodeState()`, `addDebugMessage()`

#### commandStore.ts — 命令面板与搜索

| Signal                   | 类型       | 用途           |
| ------------------------ | ---------- | -------------- |
| `commandPaletteVisible`  | `boolean`  | 命令面板可见性 |
| `searchQuery`            | `string`   | 搜索关键词     |

**Action 函数**: `toggleCommandPalette()`, `showCommandPalette()`, `hideCommandPalette()`

#### historyStore.ts — 撤销/重做

| Signal     | 类型       | 用途           |
| ---------- | ---------- | -------------- |
| `canUndo`  | `boolean`  | 撤销可用性     |
| `canRedo`  | `boolean`  | 重做可用性     |

**Action 函数**: `undo()`, `redo()`, `syncHistoryState()` — 委托 LogicFlow 内置 history API，错误通过 `RuleFlowError` 包装。

#### canvasActions.ts — 画布 UI 操作聚合

内部 re-export 模块，将 `canvasStore` 中的覆盖层控制函数统一导出，供画布组件便捷消费。标记为 `@internal`。

### 5.4 数据层 — data/

从单一 `nodeRegistry.js` 拆分为 4 个职责清晰的模块:

#### nodeData.ts — 节点分类与条目定义

定义了 **67 种节点类型**，分为 5 大类别 + 2 个固定类型:

| 类别 ID             | 名称     | 节点数 | 后端路径                         |
| ------------------- | -------- | ------ | -------------------------------- |
| `builtin-condition` | 内置条件 | 20     | `pkg/ruleflow/builtin/condition` |
| `builtin-action`    | 内置动作 | 11     | `pkg/ruleflow/builtin/action`    |
| `ext-nodes`         | 扩展节点 | 16     | `pkg/ruleflow/ext`               |
| `vpp-nodes`         | VPP 专用 | 16     | `pkg/ruleflow/extensions`        |
| `flow-nodes`        | 流程控制 | 2      | `pkg/ruleflow/extensions/flow`   |
| (固定)              | 端口节点 | 2      | —                                |
| (固定)              | 注释节点 | 1      | —                                |

导出: `NODE_CATEGORIES`, `PORT_NODES`, `NOTE_NODE`, `RELATION_TYPES`

#### nodeMappings.ts — 节点映射表

核心映射表:

1. **`NODE_TYPE_MAP`** — 7 种视觉类型到 LogicFlow 自定义类型的映射 (含 `label, icon, colorVar, width, height, lfType, category`)
2. **`NODE_VISUAL_MAP`** — 策略模式: 将 67 种具体节点类型映射到 7 种视觉类别 (自动从 `NODE_CATEGORIES` 生成)
3. **`NODE_STYLE_MAP`** — 统一样式查找: 视觉类别 → `{ colorVar, icon, hexColor }`
4. **`CATEGORY_TO_LF_TYPE`** — 视觉类别 → LogicFlow 自定义类型
5. **`TYPE_ORDER`** — 节点类型规范排序 `['port', 'condition', 'action', 'ext', 'flow', 'note']`
6. **`getNodeStyle()`** — 根据视觉类别获取样式信息

#### iconRegistry.ts — 图标统一映射

`ICON_MAP`: Lucide 图标名 → Lucide Preact 组件的统一映射表，涵盖所有节点和分类图标 (~50 个条目)。

#### demoData.ts — 示例数据

默认加载的示例规则链数据。

### 5.5 服务层 — services/

#### searchService.ts — 全局搜索服务

基于 Fuse.js 的单例搜索服务，消除跨组件重复创建索引:

- `updateNodeIndex(nodes)` / `searchNodes(query)` — 画布节点搜索
- `updateSidebarItemIndex(items)` / `searchSidebarItems(query)` — 侧栏条目搜索
- `updateCommandIndex(commands)` / `searchCommands(query)` — 命令搜索

内置变更检测，仅当数据实际变化时重建索引。

#### floatingPosition.ts — 浮层定位服务

封装 `@floating-ui/dom` 的 `computePosition`, `flip`, `shift`, `offset`, `autoUpdate`。

提供 `calculateSimplePosition()` 同步视口感知定位函数，用于不需要异步 API 的场景。

#### toastService.ts — Toast 通知服务

封装 `react-hot-toast`:
- `showSuccess(message)` — 成功通知 (3s)
- `showError(message)` — 错误通知 (4s)
- `showWarning(message)` — 警告通知 (3.5s)
- `showInfo(message)` — 信息通知 (3s)

### 5.6 自定义节点 — BaseNode.ts

#### 类继承关系

```
LogicFlow                    项目
──────────                   ──────────
RectNodeModel  ←──────────  RuleFlowBaseModel
RectNode       ←──────────  RuleFlowBaseView
```

#### RuleFlowBaseModel (模型层)

- `initNodeData()`: 根据 `properties.nodeType` 设置节点尺寸 (默认 200×80, radius=8)
- `getNodeStyle()`: 根据 `getNodeStyle(nodeType)` 映射设置节点边框颜色，填充使用 CSS 变量 `var(--rf-bg-primary)`
- `getOutlineStyle()`: 选中时虚线描边 (`strokeDasharray: '3 3'`)

#### RuleFlowBaseView (视图层 — SVG 渲染)

自定义 `getShape()` 方法渲染以下元素:
- 卡片背景 (圆角矩形 + 阴影滤镜)
- 顶部 4px 颜色条 (类型标识，使用 clipPath)
- Unicode 图标 (替代 Emoji，如 → ◇ ▶ 等)
- 节点标签
- 优先级徽章 (P:N)
- 摘要行
- 启用指示器 (圆形 + 对勾/叉号双编码，色盲友好)

#### Flyweight 共享模式

8 种 LogicFlow 自定义节点类型**共享同一对 Model/View**:
```
rf-input-port, rf-output-port, rf-rule, rf-condition,
rf-action, rf-ext-action, rf-sub-chain, rf-note
```
通过 `properties.nodeType` 区分渲染行为，实现了类型数量与类数量的解耦。

### 5.7 关系边 — RelationEdges.ts

继承 `PolylineEdgeModel` / `PolylineEdge`，根据 `properties.relationType` 动态着色:

| 关系类型 | 颜色   | 色值      |
| -------- | ------ | --------- |
| True     | 绿色   | `#16a34a` |
| False    | 红色   | `#dc2626` |
| Success  | 蓝色   | `#2563eb` |
| Failure  | 琥珀色 | `#d97706` |
| Custom   | 紫色   | `#7c3aed` |
| default  | 灰色   | `#9ca3af` |

`TargetRoute` 类型使用虚线 (`strokeDasharray: '8 4'`)。

导出 `getRelationColor()` 供外部使用。

### 5.8 画布 Hooks

#### useLogicFlow.ts — LogicFlow 实例初始化

参数: `containerRef`, `lfRef`, `setIsEmpty`, `setAllNodes`, `demoData`

职责:
1. 创建 LogicFlow 实例 (配置网格、键盘、插件)
2. 注册自定义节点类型 (`CUSTOM_NODE_TYPES` + `RELATION_EDGE_TYPE`)
3. 渲染 demo 数据 + fitView
4. 设置 `lfInstance` signal
5. 调用 `setupLogicFlowEvents()` 注册事件
6. 返回清理函数 (destroy + null 化)

开发模式下将 `lf` 挂载到 `window.__lf` 用于调试。

#### useLogicFlowEvents.ts — LogicFlow 事件处理

| LogicFlow 事件       | Signal 更新                               |
| -------------------- | ----------------------------------------- |
| `graph:updated`      | `nodeCount` / `edgeCount` + `syncHistoryState()` + 防抖更新 `outlineNodes` |
| `node:click`         | `selectedNodeId` + `showPropertyBubble()` |
| `blank:click`        | 清除选中状态 + `hidePropertyBubble()` + `hideBatchToolbar()` |
| `edge:add`           | `showRelationSelector()` (中点定位)       |
| `edge:click`         | 清除节点选中                              |
| `graph:transform`    | `canvasZoom` 同步                         |
| `selection:selected` | 批量操作工具栏 (2+ 节点时)               |

返回清理函数。所有事件处理均有 try-catch 保护，开发模式下输出警告。

#### useDragDrop.ts — 拖放添加节点

返回 `handleDrop` 和 `handleDragOver` 两个事件处理器:

- `handleDrop`: 从 `dataTransfer` 读取节点数据 → `safeJsonParse` + `isValidNodeItem` 校验 → `NODE_VISUAL_MAP` 确定视觉类型 → `CATEGORY_TO_LF_TYPE` 确定 lfType → `lf.addNode()`
- `handleDragOver`: 设置 `dropEffect = 'copy'`

### 5.9 调试模拟 — debugSimulation.ts

纯函数模块，无 Preact/UI 依赖，所有状态变更通过 store signals:

- `simulateDebug()`: 读取当前图数据 → 按 `TYPE_ORDER` 排序节点 → `setInterval` 逐步执行 (800ms 间隔) → 更新 `debugStep`, `debugExecutionPath`, `debugNodeStates`, `debugMessages`
- `countStates()`: 统计各状态节点数量
- `clearSimulationInterval()`: 清除定时器

错误通过 `RuleFlowError(ERROR_CODES.LF_OPERATION)` 包装。

### 5.10 连接关系 — EdgeRelations.tsx

右侧面板中的子组件，显示选中节点的出边连接关系:
- 读取 `lfInstance` 获取图数据
- 过滤 `sourceNodeId === nodeId` 的出边
- 按关系类型着色显示 (使用 CSS 变量)
- 提供"添加关系"按钮

### 5.11 国际化 — i18n/index.ts

**自研轻量方案**，替代 i18next (~7KB → ~0KB):

- 语言: 中文 (zh, 90 键) + 英文 (en, 90 键) — **完整双语覆盖**
- 响应式: `currentLang` signal，语言切换自动触发 UI 更新
- 持久化: `rf-lang` 键 (通过 `safeSetStorage`)
- 回退链: `LOCALES[lang][key]` → `LOCALES.zh[key]` → `key` 本身

API: `t(key)`, `getLang()`, `setLang(lang)`

---

## 6. 数据流分析

### 6.1 核心架构模式

```
┌──────────────────────────────────────────────────────────────────┐
│              store/ (6 个独立 Signal 模块)                        │
│  themeStore │ layoutStore │ canvasStore │ debugStore │ ...       │
└──────┬──────────────────────────────────────────┬────────────────┘
       │ 读取 (.value)                             │ 写入 (actions)
       ▼                                           ▼
┌──────────────────┐                      ┌──────────────────────┐
│   UI 组件        │  ─── 用户交互 ──▶    │   Action 函数        │
│   (渲染)         │                      │   (状态更新+副作用)   │
└────────┬─────────┘                      └──────────────────────┘
         │ 事件回调 (hooks)
         ▼
┌──────────────────┐
│   LogicFlow      │  ←─── lfInstance (signal<LogicFlow | null>)
│   (画布引擎)     │
└──────────────────┘
```

### 6.2 关键数据流路径

#### 路径 1: 拖拽添加节点

```
Sidebar (dragStart) → useDragDrop.handleDrop()
  → safeJsonParse(nodeData, isValidNodeItem)  // 运行时校验
  → NODE_VISUAL_MAP[type] 确定 visualCategory
  → CATEGORY_TO_LF_TYPE[visualCategory] 确定 lfType
  → lf.addNode() 添加到画布
  → graph:updated 事件 → useLogicFlowEvents → 更新 nodeCount/edgeCount signals
```

#### 路径 2: 节点选择

```
useLogicFlowEvents (node:click 事件)
  → selectedNodeId.value = data.id
  → showPropertyBubble() 显示属性气泡
  → RightPanel/PropertiesTab 读取 selectedNodeId.value 渲染属性
  → EdgeRelations 读取 lfInstance 获取出边连接
```

#### 路径 3: 边创建与关系选择

```
useLogicFlowEvents (edge:add 事件)
  → showRelationSelector(x, y, edgeId)  // 中点坐标转换
  → RelationTypeSelector 弹出
  → 用户选择 → handleRelationSelect()
  → edgeModel.setProperties({ relationType })
  → hideRelationSelector()
```

#### 路径 4: 调试执行

```
DebugPanel / Toolbar.运行按钮
  → startDebug() (更新 isDebugRunning/canvasStatus signals)
  → simulateDebug() 读取 lfInstance 获取图数据
  → setInterval 模拟逐步执行 (800ms)
  → 每步: setDebugNodeState(), addDebugMessage()
  → DebugPanel 读取 debugNodeStates/debugMessages signals 渲染
```

#### 路径 5: 主题切换

```
ThemeToggle → setTheme(key)
  → theme.value = key
  → safeSetStorage('rf-theme', key)
  → document.documentElement.setAttribute('data-theme', key)
  → CSS 变量自动切换 (tokens.css 中 [data-theme="dark"] 选择器)
```

---

## 7. 设计模式总结

### 7.1 Signal-based 响应式状态 (观察者模式变体)

`@preact/signals` 实现细粒度响应式，信号变化自动触发依赖组件重渲染:
- **模块化**: 6 个独立 store 模块，职责单一
- **去中心化**: 没有单一 reducer/dispatch，每个 signal 独立
- **直接修改**: 不需要 action creator，直接 `.value = xxx`
- **细粒度更新**: 只有读取特定 signal 的组件会重渲染

### 7.2 事件驱动架构 (LogicFlow 集成)

`useLogicFlowEvents` hook 作为**事件桥接层**，将 LogicFlow 事件转换为 Signals 更新:
```typescript
lf.on('node:click', ({ data, e }: NodeClickEvent) => { selectedNodeId.value = data.id })
lf.on('edge:add', ({ data }: EdgeAddEvent) => { showRelationSelector(...) })
```

类型安全的事件回调通过 `logicflow.d.ts` 中的接口定义保证。

### 7.3 Strategy Pattern (节点视觉分类)

通过 `NODE_VISUAL_MAP` 将 67 种具体节点类型映射到 7 种视觉类别，使渲染逻辑与业务类型解耦。

### 7.4 Flyweight Pattern (共享 Model/View)

8 种 LogicFlow 自定义节点类型共享同一对 `RuleFlowBaseModel` / `RuleFlowBaseView`，通过 `properties.nodeType` 区分渲染。

### 7.5 Service Locator (lfInstance signal)

```typescript
export const lfInstance = signal<LogicFlow | null>(null)
export function setLfInstance(lf: LogicFlow): void { lfInstance.value = lf }
```
LogicFlow 实例作为类型安全的 signal，由 `useLogicFlow` hook 设置，其他组件通过 `lfInstance.value` 访问，提供 null 安全保护。

### 7.6 Singleton Pattern (searchService)

`searchService` 作为全局单例，避免跨组件重复创建 Fuse.js 索引。

### 7.7 Design Token 系统 (CSS 变量抽象)

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
└── ErrorBoundary
    ├── RuleFlowEditor (CSS Grid 布局, 全局快捷键注册)
    │   ├── Navbar
    │   │   ├── 品牌标识
    │   │   ├── 规则链选择器
    │   │   ├── 搜索按钮 → showCommandPalette
    │   │   ├── ThemeToggle (浅色/深色/系统)
    │   │   ├── 通知按钮
    │   │   └── 用户头像
    │   ├── Toolbar
    │   │   ├── FileGroup: 新建/打开/保存
    │   │   ├── EditGroup: 撤销/重做
    │   │   ├── RunGroup: 运行/停止/重置
    │   │   ├── ViewGroup: 全屏/大纲/小地图
    │   │   ├── LayoutGroup: 自动布局
    │   │   └── ContextActions: 复制/删除/启用 (选中节点时)
    │   ├── Sidebar
    │   │   ├── 搜索框 (searchService)
    │   │   ├── 常用: 端口节点 + 注释
    │   │   └── 分类: 5 大类可折叠 (CategorySection)
    │   │       └── SidebarItem (draggable)
    │   ├── CanvasViewport
    │   │   ├── useLogicFlow (实例初始化)
    │   │   ├── useLogicFlowEvents (事件桥接)
    │   │   ├── useDragDrop (拖放处理)
    │   │   ├── LogicFlow 实例
    │   │   ├── EmptyState (空画布提示)
    │   │   ├── RelationTypeSelector (弹出)
    │   │   ├── PropertyBubble (弹出)
    │   │   ├── NodeSearch (Ctrl+F)
    │   │   ├── BatchActionToolbar (多选时)
    │   │   └── ZoomControls (缩放控制)
    │   ├── RightPanel (可关闭)
    │   │   ├── Tab: 属性 (PropertiesTab)
    │   │   │   └── EdgeRelations (连接关系子组件)
    │   │   ├── Tab: 调试 (DebugPanel)
    │   │   │   └── debugSimulation (模拟引擎)
    │   │   └── Tab: 大纲 (OutlineTab)
    │   ├── StatusBar
    │   │   ├── 画布状态
    │   │   ├── 缩放控制
    │   │   ├── 节点/连接计数
    │   │   └── 保存状态
    │   └── CommandPalette (全局覆盖层, Ctrl+K)
    └── Toaster (react-hot-toast, bottom-right)
```

---

## 9. 数据模型

### 9.1 节点数据 (LogicFlow 格式)

```typescript
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

```typescript
{
  id: 'e3',
  type: 'relation-edge',                   // 自定义关系边类型
  sourceNodeId: 'cond_soc',
  targetNodeId: 'action_transform',
  text: 'True',
  properties: { relationType: 'True' }     // 关系类型 (决定颜色)
}
```

### 9.3 节点注册表条目

```typescript
// NodeItem (来自 nodeData.ts)
{
  type: 'device_type',       // 业务类型标识
  name: '设备类型条件',       // 显示名称
  icon: 'Cpu',               // Lucide 图标名
}

// NodeTypeMeta (来自 nodeMappings.ts)
{
  label: '条件节点',
  icon: 'GitBranch',
  colorVar: '--rf-node-condition',
  width: 200,
  height: 72,
  lfType: 'rf-condition',
  category: 'condition',
}
```

---

## 10. 国际化

**文件**: `src/i18n/index.ts` (190 行)

- 框架: 自研轻量方案 (替代 i18next ~7KB)
- 语言: 中文 (zh, 90 键) + 英文 (en, 90 键) — **完整双语覆盖**
- 默认: 中文
- 响应式: `currentLang` signal，语言切换自动触发 UI 更新
- 持久化: `rf-lang` 键 (通过 `safeSetStorage` / `safeGetLang`)
- 回退链: `LOCALES[lang][key]` → `LOCALES.zh[key]` → `key` 本身

---

## 11. 服务层

| 服务              | 文件                  | 用途                                       |
| ----------------- | --------------------- | ------------------------------------------ |
| searchService     | searchService.ts      | 全局 Fuse.js 搜索单例 (节点/侧栏/命令)    |
| floatingPosition  | floatingPosition.ts   | 浮层定位 (@floating-ui/dom + 同步回退)     |
| toastService      | toastService.ts       | Toast 通知 (react-hot-toast 封装)          |

---

## 12. 全局快捷键

| 快捷键       | 功能             |
| ------------ | ---------------- |
| `Ctrl+K`     | 打开命令面板     |
| `Ctrl+S`     | 保存规则链       |
| `Ctrl+B`     | 切换侧栏         |
| `Ctrl+J`     | 切换面板         |
| `Ctrl+.`     | 切换布局密度     |
| `Ctrl+0`     | 重置缩放         |
| `Ctrl+=/+`   | 放大             |
| `Ctrl+-`     | 缩小             |
| `F5`         | 启动调试         |
| `Shift+F5`   | 停止调试         |
| `F11`        | 专注模式         |

---

## 13. 工程化配置

### 13.1 TypeScript 配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "paths": {
      "react": ["./node_modules/preact/compat"],
      "react-dom": ["./node_modules/preact/compat"]
    }
  }
}
```

### 13.2 ESLint 配置 (eslint.config.js)

ESLint 10 flat config + typescript-eslint:
- 继承: `js.configs.recommended` + `tseslint.configs.recommended` + `eslint-config-prettier`
- 规则: `no-unused-vars: off`, `@typescript-eslint/no-unused-vars: warn` (忽略 `_` 前缀和 `h`), `@typescript-eslint/no-explicit-any: warn`
- 忽略: `dist/`, `node_modules/`, `*.config.js`

### 13.3 测试 (Vitest)

- 框架: Vitest 4 + @testing-library/preact + jsdom
- 覆盖率: @vitest/coverage-v8
- 命令: `npm test` (单次), `npm run test:watch` (监听), `npm run test:coverage` (覆盖率)
- 规模: 7 suites / 80 tests

### 13.4 CI/CD (GitHub Actions)

- 矩阵: Node 18 / 20 / 22
- 步骤: typecheck → lint → test → build

### 13.5 Pre-commit Hook (husky + lint-staged)

```json
{
  "lint-staged": {
    "src/**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "src/**/*.{css,json}": ["prettier --write"]
  }
}
```

### 13.6 版本管理 (@changesets/cli)

- `npm run changeset` — 创建变更集
- `npm run version` — 更新版本号
- `npm run release` — 构建 + 发布

---

## 14. 架构评估

### 14.1 架构优势

1. **TypeScript strict mode**: 全量类型覆盖，核心数据模型通过接口定义，编译时捕获错误
2. **模块化状态管理**: 6 个独立 store 模块，职责单一，避免单一巨型 store
3. **类型安全的 LogicFlow 集成**: `logicflow.d.ts` 补充事件类型，`lfInstance` signal 提供 null 安全
4. **运行时校验体系**: `validation.ts` + `RuleFlowError` + `ERROR_CODES`，防御外部不可信输入
5. **轻量高效**: Preact + Signals 体积远小于 React + Redux，且实现真正的细粒度按需更新
6. **Design Token 体系完善**: 200+ 语义化变量，明暗主题一键切换，符合 IEC/DL/T 工业标准
7. **Flyweight 模式**: 8 种节点类型共享一对 Model/View，减少代码重复
8. **Strategy 模式**: NODE_VISUAL_MAP 解耦业务类型与视觉呈现
9. **工程化完善**: ESLint + Prettier + Vitest + husky + lint-staged + changesets + CI/CD
10. **库化输出**: ESM + CJS 双格式 + 类型声明 + peerDependencies + sideEffects: false

### 14.2 架构待改进

| 问题                    | 严重度 | 建议                                        |
| ----------------------- | ------ | ------------------------------------------- |
| API 层缺失              | 中     | 设计 API 层，可利用 RuleFlowError 体系做错误处理 |
| 国际化 key 硬编码       | 低     | 考虑类型化的 i18n key，编译时检查缺失翻译   |
| CSS Modules 覆盖不完整  | 低     | 部分组件仍有内联样式，逐步迁移至 CSS Modules |

---

## 附录 A: 技术决策记录

| 决策     | 选择                        | 理由                                            |
| -------- | --------------------------- | ----------------------------------------------- |
| 语言     | TypeScript (strict mode)    | 编译时类型安全，接口定义核心数据模型            |
| UI 框架  | Preact (非 React)           | 体积小 (3KB vs 42KB)，Signals 内置响应式        |
| 状态管理 | @preact/signals (模块化)    | 细粒度更新，6 个独立 store 职责单一             |
| 画布引擎 | LogicFlow                   | 国产开源，支持自定义节点/边，插件体系完善       |
| 构建工具 | Vite                        | 开发体验优秀，HMR 快速                          |
| CSS 方案 | CSS Modules + CSS Variables | 模块化 + 语义化双模式                           |
| 国际化   | 自研轻量 i18n               | 替代 i18next (~7KB)，简单键值存储，完整双语覆盖 |
| 测试     | Vitest                      | 与 Vite 共享配置，ESM 原生支持                  |
| 代码规范 | ESLint 10 flat config       | 现代化配置格式，typescript-eslint 原生支持       |
| 版本管理 | @changesets/cli             | 语义化版本，自动生成 CHANGELOG                   |
| 错误处理 | RuleFlowError + ERROR_CODES | 结构化错误信息，错误码可编程处理                |
| 运行时校验 | validation.ts 工具集       | 防御 localStorage/JSON/拖放等外部不可信输入     |

---

## 附录 B: 命名规范

| 类别             | 规范             | 示例                                               | 说明                                     |
| ---------------- | ---------------- | -------------------------------------------------- | ---------------------------------------- |
| 类 / 接口 / 类型 | PascalCase       | `RuleFlowError`, `NodeCategory`, `ThemeMode`       | —                                        |
| 函数             | camelCase        | `safeReadStorage`, `getNodeStyle`, `toggleSidebar` | —                                        |
| 常量（不可变）   | UPPER_SNAKE_CASE | `NODE_CATEGORIES`, `ERROR_CODES`, `DEMO_DATA`      | 模块级 `const` 且运行时不可变            |
| Signal 导出      | camelCase        | `canvasZoom`, `selectedNodeId`, `theme`            | 响应式状态容器，运行时值可变，非传统常量 |
| 单例实例         | camelCase        | `searchService`                                    | 允许豁免全大写，与 Service 类命名一致    |
| 错误码           | UPPER_SNAKE_CASE | `INVALID_GRAPH`, `LF_OPERATION`                    | `ERROR_CODES` 对象的键                   |
| Hook 函数        | camelCase + use  | `useLogicFlow`, `useDragDrop`                      | Preact hooks 命名约定                    |
| CSS 变量         | --kebab-case     | `--rf-brand-primary`, `--rf-status-success`        | `--rf-` 前缀                             |
| CSS Module 类名  | kebab-case       | `.sidebarItem`, `.categoryHeader`                  | CSS Modules 自动转换                     |
