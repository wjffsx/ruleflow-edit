# RuleFlow 保存的 JSON 文件结构说明

> **版本**: v0.4.0（语义/视图分离架构） · **最后更新**: 2026-06-24
> **代码位置**: [ruleflowDocument.ts](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts), [ruleflowSerializer.ts](file:///e:/VPPTU-06/ruleflow-edit/src/utils/ruleflowSerializer.ts)
> **保存触发**: `Ctrl+S` 或工具栏"保存"按钮
> **架构变更**: v0.4.0 起，规则链数据拆分为 `SemanticDocument`（后端使用，纯语义）和 `ViewDocument`（前端使用，纯视图）两份

---

## 1. 概述

RuleFlow 编辑器通过 `Ctrl+S` 或工具栏"保存"按钮触发 `onSave(doc)` 回调，传递 [`RuleFlowDocument`](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L128-L148) 格式对象。该格式是**前后端、文件存储、调试引擎的统一数据格式**。

**统一序列化模块**: [ruleflowSerializer.ts](file:///e:/VPPTU-06/ruleflow-edit/src/utils/ruleflowSerializer.ts) 提供 `buildRuleflowDocument()` / `applyDocumentToLf()` / `downloadAsJsonFile()` / `readJsonFile()` 四个函数，**两条保存路径走相同代码，字节级一致**。

设计原则:

- **单一数据源**: 前端编辑器、后端 API、文件存储、调试引擎共用同一格式，零转换
- **节点 ID 自然对齐**: 调试引擎消息流中的 `sourceNodeId/targetNodeId` 与编辑器节点 ID 直接对应
- **双命名兼容**: 同时支持 camelCase（前端）和 snake_case（Go 引擎），自动归一化
- **路径统一**: 序列化与反序列化走同一模块，杜绝分歧

### 1.1 架构演进：v0.4.0 语义/视图分离

| 版本           | 架构                                     | 后端使用           | 视图状态       | 状态   |
| -------------- | ---------------------------------------- | ------------------ | -------------- | ------ |
| v0.3.x 及之前  | 单文件 `RuleFlowDocument`                | 含视图字段（冗余） | 耦合           | 已废弃 |
| v0.4.0（当前） | 拆分 `SemanticDocument` + `ViewDocument` | 纯语义（11 字段）  | 纯视图（独立） | ✅ 推荐 |

**v0.4.0 核心变更**：

1. **后端只解析 `SemanticDocument`** —— 严格不含 x/y/width/height/icon/pointsList 等任何视图字段
2. **视图态独立存储** —— 可下载为 `*.view.json` 或自动存到 `localStorage`
3. **字段强校验** —— `validateSemanticDocument()` 拒绝任何视图字段混入
4. **ruleId 命名约定** —— 强制 `rule:001` / `cond:001` / `act:001` 等类型前缀

### 1.2 保存路径

| 路径 | 触发方式         | 实现位置                                                                                                           | 输出格式                                                                     |
| ---- | ---------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| A    | `Ctrl+S`         | [RuleFlowEditor.tsx:364](file:///e:/VPPTU-06/ruleflow-edit/src/layout/RuleFlowEditor.tsx#L364) `bind('save', ...)` | `SemanticDocument` → 触发 `props.onSave(semantic)` 回调（v0.4.0 起改为语义） |
| B    | 工具栏"保存"按钮 | [FileGroup.tsx:72](file:///e:/VPPTU-06/ruleflow-edit/src/components/toolbar/FileGroup.tsx#L72)                     | `SemanticDocument` + `ViewDocument` 同时生成；单文件下载（兼容期）           |

**两条路径调用同一个函数** [`buildSemanticDocument(lf, chainName)`](file:///e:/VPPTU-06/ruleflow-edit/src/utils/ruleflowSerializer.ts#L278)，保证输出格式字节级一致。

**关键调用**（[FileGroup.tsx:80-98](file:///e:/VPPTU-06/ruleflow-edit/src/components/toolbar/FileGroup.tsx#L80-L98)）：

```typescript
const semantic = buildSemanticDocument(lf, name)  // ← 后端使用
const view = buildViewDocument(lf, name)          // ← 前端使用
validateSemanticDocument(semantic)                 // ← 强校验
saveViewToLocalStorage(view, name)                 // ← 视图本地化
downloadAsJsonFile(buildRuleflowDocument(lf, name)) // ← 兼容期单文件
```

### 1.3 后端解析建议

- **优先按 `SemanticDocument` 解析**（v0.4.0 推荐格式）
- **兼容 v0.3.x 单文件**：`buildRuleflowDocument()` 仍可用，输出含视图字段（迁移期）
- **`text` 字段统一为字符串**：`flattenText()` 已拍扁，无 `{x, y, value}` 嵌套
- **强校验前置**：`validateSemanticDocument()` 在保存前调用，开发环境输出警告
- **ruleId 必须符合命名约定**：`(rule|node|cond|act|gate|port|io):[a-z0-9_-]{1,64}`

---

## 2. JSON 顶层结构（v0.4.0 双文档架构）

v0.4.0 起，规则链数据拆分为**两个独立文档**：

### 2.1 SemanticDocument（后端使用）

```typescript
interface SemanticDocument {
  // ── 元数据 ──
  version: string              // 文档 schema 版本，固定 "2.0"
  chainId: string              // 规则链 ID（新建时为空，由后端分配）
  chainName: string            // 规则链名称
  enabled: boolean             // 是否启用，默认 true
  root: boolean                // 是否根规则链，默认 false
  evaluationMode: 'all' | 'any'  // 评估模式
  description?: string         // 描述
  schemaVersion: number        // 文档语义版本号
  status?: 'draft' | 'published' | 'archived'
  pipelineType?: 'standard' | 'fast' | 'batch'

  // ── 输入/输出定义 ──
  inputs?: Array<Record<string, unknown>>   // 输入数据点
  outputs?: Array<Record<string, unknown>>  // 输出数据点

  // ── 图数据（纯语义，不含任何视图字段）──
  nodes: SemanticNode[]   // 节点（见 §4）
  edges: SemanticEdge[]   // 边（见 §5）
}
```

### 2.2 ViewDocument（前端使用）

```typescript
interface ViewDocument {
  version: string              // 视图层 schema 版本，固定 "2.0"
  chainId?: string             // 关联的规则链 ID（用于多链区分）

  // ── 画布 transform ──
  transform?: {
    scale: number              // 缩放比例
    translateX: number         // X 偏移
    translateY: number         // Y 偏移
  }

  // ── UI 状态 ──
  gridVisible?: boolean        // 网格显示
  selectedNodeId?: string | null  // 选中节点 ID

  // ── 节点视图状态 ──
  nodes: ViewNode[]   // 节点（仅 x/y/width/height/icon/collapsed）

  // ── 边视图状态 ──
  edges: ViewEdge[]   // 边（仅锚点/几何/标签）
}
```

### 2.3 RuleFlowDocument（兼容期单文件）

```typescript
// 旧版单文件结构（v0.3.x），仍在 `buildRuleflowDocument()` 中输出（迁移期）
// 节点顶层保留 x/y=0（兼容），视图字段从 properties 中剥离
interface RuleFlowDocument {
  chainId: string
  chainName: string
  enabled: boolean
  root: boolean
  evaluationMode: 'all' | 'any'
  description?: string
  version?: number
  status?: string
  pipelineType?: string
  inputs?: RuleChainInput[]
  outputs?: RuleChainOutput[]
  nodes: RuleFlowNode[]   // properties 已剥离 width/height/icon/collapsed
  edges: RuleFlowEdge[]
}
```

### 2.4 SemanticDocument 字段对照表

| 字段             | 类型    | 必填 | 默认值       | 说明                                           |
| ---------------- | ------- | ---- | ------------ | ---------------------------------------------- |
| `version`        | string  | ✓    | `"2.0"`      | 文档 schema 版本（用于后端兼容性判断）         |
| `chainId`        | string  | ✓    | `""`         | 规则链 ID。新建时为空，由后端分配。            |
| `chainName`      | string  | ✓    | `""`         | 规则链显示名                                   |
| `enabled`        | boolean | ✓    | `true`       | 是否启用该规则链                               |
| `root`           | boolean | ✓    | `false`      | 是否根规则链（子规则链通过 subchain 节点引用） |
| `evaluationMode` | enum    | ✓    | `"all"`      | `"all"` = 全量评估, `"any"` = 任一通过         |
| `description`    | string  |      | -            | 规则链描述                                     |
| `schemaVersion`  | number  | ✓    | `1`          | 文档语义版本号（区别于 `version` 业务版本）    |
| `status`         | enum    |      | `"draft"`    | `draft` / `published` / `archived`             |
| `pipelineType`   | enum    |      | `"standard"` | `standard` / `fast` / `batch`                  |
| `inputs`         | array   |      | `[]`         | 输入数据点定义列表                             |
| `outputs`        | array   |      | `[]`         | 输出数据点定义列表                             |
| `nodes`          | array   | ✓    | `[]`         | 语义节点数组（见 §4）                          |
| `edges`          | array   | ✓    | `[]`         | 语义边数组（见 §5）                            |

### 2.5 ViewDocument 字段对照表

| 字段                   | 类型    | 必填 | 默认值  | 说明                                   |
| ---------------------- | ------- | ---- | ------- | -------------------------------------- |
| `version`              | string  | ✓    | `"2.0"` | 视图层 schema 版本                     |
| `chainId`              | string  |      | -       | 关联的规则链 ID（localStorage key 用） |
| `transform`            | object  |      | -       | 画布缩放/平移                          |
| `transform.scale`      | number  |      | `1`     | 缩放比例                               |
| `transform.translateX` | number  |      | `0`     | X 偏移                                 |
| `transform.translateY` | number  |      | `0`     | Y 偏移                                 |
| `gridVisible`          | boolean |      | `true`  | 网格显示                               |
| `selectedNodeId`       | string  |      | -       | 选中节点 ID（用于恢复选中状态）        |
| `nodes`                | array   | ✓    | `[]`    | 视图节点数组（见 §6）                  |
| `edges`                | array   | ✓    | `[]`    | 视图边数组（见 §7）                    |

---

## 3. 完整 JSON 示例

```json
{
  "chainId": "chain-001",
  "chainName": "储能调度策略",
  "enabled": true,
  "root": true,
  "evaluationMode": "all",
  "description": "储能充放电调度规则链",
  "version": 1,
  "status": "draft",
  "pipelineType": "standard",
  "inputs": [
    {
      "pointName": "soc_monitor",
      "displayName": "SOC 监控",
      "pointType": "analog",
      "dataType": "double",
      "unit": "%",
      "group": "battery",
      "description": "电池 SOC"
    }
  ],
  "outputs": [
    {
      "pointName": "dispatch_command",
      "displayName": "调度指令",
      "pointType": "virtual",
      "dataType": "float64",
      "unit": "kW",
      "group": "control",
      "scope": "per_device",
      "inputPoints": ["soc_monitor", "active_power"],
      "description": "调度控制输出"
    }
  ],
  "nodes": [
    {
      "id": "input_soc",
      "type": "rf-input-port",
      "x": 200,
      "y": 150,
      "text": "SOC 数据",
      "properties": {
        "nodeType": "input_port",
        "icon": "→",
        "enabled": true,
        "summary": "soc_monitor",
        "ruleId": "rule_001",
        "roleInRule": "input",
        "width": 200,
        "height": 80
      }
    },
    {
      "id": "input_m1ua_1782306682469",
      "type": "rf-input-port",
      "x": 1100,
      "y": 500,
      "text": "输入端口-A相电压",
      "properties": {
        "nodeType": "input_port",
        "icon": "→",
        "priority": 0,
        "enabled": true,
        "summary": "m1:UA",
        "ruleId": "rule_demo_01",
        "roleInRule": "input"
      }
    },
    {
      "id": "cond_soc_001",
      "type": "rf-condition",
      "x": 480,
      "y": 150,
      "text": "SOC 监控",
      "properties": {
        "nodeType": "condition",
        "icon": "GitBranch",
        "enabled": true,
        "ruleId": "rule_001",
        "roleInRule": "condition",
        "priority": 1,
        "conditionOp": "leaf",
        "leafType": "value_range",
        "leafConfig": {
          "min": 20,
          "max": 80,
          "inclusive": true
        },
        "summary": "SOC ∈ [20%, 80%]"
      }
    },
    {
      "id": "act_alarm_001",
      "type": "rf-action",
      "x": 760,
      "y": 150,
      "text": "告警通知",
      "properties": {
        "nodeType": "action",
        "icon": "Bell",
        "enabled": true,
        "ruleId": "rule_001",
        "roleInRule": "action",
        "actionType": "alarm_notify_ext",
        "actionConfig": {
          "level": "warning",
          "channel": "sms",
          "template": "battery_soc_alert"
        },
        "actionOrder": 1,
        "summary": "SOC 越限告警"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_001",
      "type": "polyline",
      "sourceNodeId": "input_soc",
      "targetNodeId": "cond_soc_001",
      "properties": {
        "relationType": "default"
      }
    },
    {
      "id": "edge_002",
      "type": "polyline",
      "sourceNodeId": "cond_soc_001",
      "targetNodeId": "act_alarm_001",
      "properties": {
        "relationType": "True"
      }
    }
  ]
}
```

---

## 4. 节点结构（RuleFlowNode）

定义位置: [ruleflowDocument.ts:51-114](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L51-L114)

### 4.1 节点必填字段

| 字段         | 类型                 | 说明                                             |
| ------------ | -------------------- | ------------------------------------------------ |
| `id`         | string               | 节点唯一 ID（如 `input_soc`、`cond_xxx`）        |
| `type`       | string               | LogicFlow 节点类型，五个枚举值之一               |
| `x`          | number               | 画布 X 坐标（前端展示，后端运行时忽略）          |
| `y`          | number               | 画布 Y 坐标                                      |
| `text`       | string \| TextObject | 节点显示文本（序列化时统一为 string，见 §4.1.1） |
| `properties` | object               | 节点业务属性（见 §4.3）                          |

#### 4.1.1 text 字段形态

`text` 字段支持两种形态，**序列化时统一拍扁为 string**：

| 形态                             | 形态定义                                              | 用途                        | 出现位置                   |
| -------------------------------- | ----------------------------------------------------- | --------------------------- | -------------------------- |
| **string（推荐）**               | `"text": "SOC 数据"`                                  | 已序列化的 RuleFlowDocument | 保存文件、API 交互         |
| **TextObject（LogicFlow 内部）** | `"text": { "x": 200, "y": 150, "value": "SOC 数据" }` | LogicFlow 内部 SVG 渲染     | lf.getGraphData() 原始输出 |

**特殊边界 case**: 通过 `lf.addNode()` API 直接创建节点时，`text.x/y` 可能为 `null`（尚未渲染）。

**修复机制**: [ruleflowSerializer.ts:90-99](file:///e:/VPPTU-06/ruleflow-edit/src/utils/ruleflowSerializer.ts#L90-L99) `flattenText()` 在序列化时统一把 `{x, y, value}` 拍扁为 string，**不依赖 `getGraphData()` 返回的 `text.x/y` 是否为 null**。这意味着无论 LogicFlow 内部如何存储，序列化输出永远是 string。

**后端解析建议**: 无论遇到哪种形态，**取 `.value` 字段**（string 形态直接是值，object 形态是 `.value`）：

```typescript
function getNodeText(node: any): string {
  if (typeof node.text === 'string') return node.text
  if (node.text && typeof node.text === 'object') return node.text.value || ''
  return ''
}
```

### 4.2 节点 type 枚举

| 值               | 含义     | 对应侧栏组件      |
| ---------------- | -------- | ----------------- |
| `rf-input-port`  | 输入端口 | "输入端口"        |
| `rf-output-port` | 输出端口 | "输出端口"        |
| `rf-condition`   | 条件节点 | 各"内置条件"      |
| `rf-action`      | 动作节点 | 各"内置动作"      |
| `rf-logic-gate`  | 逻辑门   | AND/OR/NOT 条件组 |

### 4.3 properties 字段详解

#### 4.3.1 通用字段（所有节点类型）

| 字段         | 类型    | 必填 | 说明                                         |
| ------------ | ------- | ---- | -------------------------------------------- |
| `nodeType`   | string  | ✓    | 视觉分类（见下表）                           |
| `icon`       | string  | ✓    | 图标字符或名称（→/←/GitBranch/Play/Bell...） |
| `enabled`    | boolean |      | 是否启用，默认 `true`                        |
| `summary`    | string  |      | **数据点 FQN**（如 `m1:UA`）或条件摘要       |
| `ruleId`     | string  |      | 所属规则 ID（**后端路由必需**）              |
| `roleInRule` | enum    |      | 节点在规则中的角色（见下表）                 |
| `width`      | number  |      | 节点宽度（仅前端，默认 200）                 |
| `height`     | number  |      | 节点高度（仅前端，默认 80）                  |

**`nodeType` 枚举值**:

| 值            | 含义     |
| ------------- | -------- |
| `input_port`  | 输入端口 |
| `output_port` | 输出端口 |
| `condition`   | 条件节点 |
| `action`      | 动作节点 |
| `logic_gate`  | 逻辑门   |

**`summary` 字段生成规则**（参考 [demoData.ts](file:///e:/VPPTU-06/ruleflow-edit/src/data/demoData.ts)）:

`summary` 是画布摘要，用于**列表/概览/调试**快速识别节点。生成规则按节点类型：

| 节点类型      | summary 模板                             | demoData 示例                                          |
| ------------- | ---------------------------------------- | ------------------------------------------------------ |
| `input_port`  | `{dataPointFQN}`                         | `soc_monitor` / `active_power` / `m1:UA`               |
| `output_port` | `{dataPointFQN}`                         | `dispatch_order`                                       |
| `condition`   | `条件: {opLabel}` 或 `{leafDescription}` | `条件: AND` / `SOC ∈ [20%, 80%]`                       |
| `action`      | `{actionTypeLabel}: {targetLabel}`       | `变换: 单位转换` / `通知: 运维人员` / `目标: 储能系统` |
| `logic_gate`  | `{opLabel} ({childCount} 子条件)`        | `AND (3 子条件)`                                       |

**关键设计**:

- **input/output 节点**: summary 就是数据点 FQN，与后端测点一一对应
- **condition/action 节点**: summary 是**业务语义摘要**（中文友好），便于人工排查
- **运行时路由**: 实际数据流仍按 `properties` 中的 `ruleId/roleInRule/leafType/actionType` 路由，summary 仅用于显示
- **可空性**: summary 是可选字段（不强制），但建议填，便于调试面板快速识别

**`roleInRule` 枚举值**:

| 值           | 含义     |
| ------------ | -------- |
| `input`      | 输入端口 |
| `output`     | 输出端口 |
| `condition`  | 条件节点 |
| `action`     | 动作节点 |
| `logic_gate` | 逻辑门   |

#### 4.3.2 条件节点专用字段（roleInRule = `condition`）

| 字段          | 类型   | 必填               | 说明                                                                                                                 |
| ------------- | ------ | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `priority`    | number |                    | 规则优先级（数字越大越靠前）                                                                                         |
| `conditionOp` | enum   | ✓                  | `AND` / `OR` / `NOT` / `leaf`                                                                                        |
| `leafType`    | string | 条件为 leaf 时必填 | 子条件类型: `value_range` / `expr_filter` / `quality` / `fqn_prefix` / `point_name` / `time_window` / `bit_mask` ... |
| `leafConfig`  | object |                    | 子条件配置（任意键值对，结构由 `leafType` 决定）                                                                     |

**`leafConfig` 示例**:

```json
// value_range
{ "min": 20, "max": 80, "inclusive": true }

// expr_filter
{ "expression": "value > 0 && value < 100", "variables": ["value"] }

// point_name
{ "pattern": "m1:*", "exact": false }

// time_window
{ "start": "08:00", "end": "18:00", "daysOfWeek": [1,2,3,4,5] }
```

#### 4.3.3 动作节点专用字段（roleInRule = `action`）

| 字段           | 类型   | 必填 | 说明                              |
| -------------- | ------ | ---- | --------------------------------- |
| `actionType`   | string | ✓    | 动作类型（见下表）                |
| `actionConfig` | object |      | 动作配置                          |
| `actionOrder`  | number |      | 同规则内动作执行顺序（从 1 开始） |

**`actionType` 常见值**:

| 值                     | 含义         |
| ---------------------- | ------------ |
| `transform`            | 值变换       |
| `rename`               | 重命名       |
| `tag`                  | 标签         |
| `drop`                 | 丢弃         |
| `route`                | 路由         |
| `alarm_notify_ext`     | 扩展告警通知 |
| `quality_mark_ext`     | 扩展质量标记 |
| `storage_write`        | 存储写入     |
| `calc_node`            | 计算节点     |
| `policy_execute`       | 策略执行     |
| `multi_device_linkage` | 多设备联动   |
| `state_change_log`     | 状态变更日志 |
| `dispatch_control`     | 调度控制     |
| `demand_calc`          | 需量计算     |

#### 4.3.4 逻辑门专用字段（roleInRule = `logic_gate`）

| 字段          | 类型    | 必填 | 说明                      |
| ------------- | ------- | ---- | ------------------------- |
| `conditionOp` | enum    | ✓    | `AND` / `OR` / `NOT`      |
| `collapsed`   | boolean |      | UI 折叠状态，默认 `false` |
| `childCount`  | number  |      | 子条件数量                |

#### 4.3.5 根条件节点专用字段（rule 级别元数据）

挂在每个规则的"根 condition 节点"上，描述整个 rule 而非单个条件:

| 字段              | 类型     | 说明                            |
| ----------------- | -------- | ------------------------------- |
| `ruleDescription` | string   | 规则描述                        |
| `inputBindings`   | string[] | 输入绑定数据点列表              |
| `inputMode`       | enum     | `single` / `multi`              |
| `targets`         | string[] | 路由目标（输出数据点 FQN 列表） |

---

## 5. 边结构（RuleFlowEdge）

定义位置: [ruleflowDocument.ts:116-126](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L116-L126)

```typescript
interface RuleFlowEdge {
  id: string
  type: string                  // 'polyline' | 'condition-tree-edge'
  sourceNodeId: string          // 起始节点 ID
  targetNodeId: string          // 目标节点 ID
  properties: {
    relationType: RelationType  // 'default' | 'True' | 'False' | 'Success' | 'Failure' | 'Custom'
  }
}
```

### 5.1 边字段对照表

| 字段                      | 类型   | 必填 | 说明                |
| ------------------------- | ------ | ---- | ------------------- |
| `id`                      | string | ✓    | 边唯一 ID           |
| `type`                    | string | ✓    | 边类型（见 §5.2）   |
| `sourceNodeId`            | string | ✓    | 起始节点 ID         |
| `targetNodeId`            | string | ✓    | 目标节点 ID         |
| `properties.relationType` | enum   | ✓    | 关系类型（见 §5.3） |

### 5.2 边 type 枚举

| 值                    | 用途                                  |
| --------------------- | ------------------------------------- |
| `polyline`            | 普通顺序流转边（输入→条件→动作→输出） |
| `condition-tree-edge` | 逻辑门与子条件之间的树形边            |

### 5.3 relationType 枚举

| 值        | 含义                                     |
| --------- | ---------------------------------------- |
| `default` | 默认流转（无条件判断）                   |
| `True`    | 条件为真时流转（if 条件 true 走这条边）  |
| `False`   | 条件为假时流转（if 条件 false 走这条边） |
| `Success` | 动作执行成功后流转                       |
| `Failure` | 动作执行失败后流转                       |
| `Custom`  | 自定义关系（用户自定义语义）             |

### 5.4 边示例

```json
// 输入端口 → 条件（默认流转）
{ "id": "e1", "type": "polyline", "sourceNodeId": "input_a", "targetNodeId": "cond_1", "properties": { "relationType": "default" } }

// 条件 True 分支 → 动作
{ "id": "e2", "type": "polyline", "sourceNodeId": "cond_1", "targetNodeId": "act_alarm", "properties": { "relationType": "True" } }

// 条件 False 分支 → 下一条件
{ "id": "e3", "type": "polyline", "sourceNodeId": "cond_1", "targetNodeId": "cond_2", "properties": { "relationType": "False" } }

// 动作成功 → 输出端口
{ "id": "e4", "type": "polyline", "sourceNodeId": "act_alarm", "targetNodeId": "output_x", "properties": { "relationType": "Success" } }

// AND 逻辑门 → 子条件 1
{ "id": "e5", "type": "condition-tree-edge", "sourceNodeId": "gate_and_1", "targetNodeId": "cond_child_1", "properties": { "relationType": "default" } }
```

### 5.5 边附加字段（LogicFlow 内部，序列化时丢弃）

LogicFlow 内部存储的边含有 UI 渲染所需的附加字段，**序列化时全部丢弃**（不影响语义）。但若从原始 `lf.getGraphData()` 读取时会看到这些字段：

| 字段             | 类型            | 说明                                                |
| ---------------- | --------------- | --------------------------------------------------- |
| `sourceAnchorId` | string          | 源锚点 ID（如 `input_soc_1`，表示从哪个连接点出发） |
| `targetAnchorId` | string          | 目标锚点 ID（如 `cond_soc_3`）                      |
| `startPoint`     | `{x, y}`        | 起始点坐标（画布坐标系）                            |
| `endPoint`       | `{x, y}`        | 结束点坐标                                          |
| `pointsList`     | `Array<{x, y}>` | 路径拐点列表（折线/曲线）                           |
| `text`           | `{x, y, value}` | 边标签（True/False/Success/Failure 等）             |

**完整 LogicFlow 内部边示例**（含几何信息）：

```json
{
  "id": "e1",
  "type": "polyline",
  "sourceNodeId": "input_soc",
  "targetNodeId": "cond_soc",
  "sourceAnchorId": "input_soc_1",
  "targetAnchorId": "cond_soc_3",
  "startPoint": { "x": 300, "y": 150 },
  "endPoint": { "x": 400, "y": 200 },
  "pointsList": [
    { "x": 300, "y": 150 },
    { "x": 350, "y": 150 },
    { "x": 350, "y": 200 },
    { "x": 400, "y": 200 }
  ],
  "properties": { "relationType": "default" }
}
```

**序列化行为**（[ruleflowSerializer.ts:95-103](file:///e:/VPPTU-06/ruleflow-edit/src/utils/ruleflowSerializer.ts#L95-L103)）：

```typescript
function serializeEdge(e: LfEdge): RuleFlowEdge {
  return {
    id: e.id,
    type: e.type ?? 'polyline',
    sourceNodeId: e.sourceNodeId,
    targetNodeId: e.targetNodeId,
    properties: e.properties ?? {},
    // 几何信息全部丢弃：sourceAnchorId/targetAnchorId/startPoint/endPoint/pointsList/text
  }
}
```

**反序列化行为**（`applyDocumentToLf`）: 加载文件时 LogicFlow 会自动重算这些几何字段，无需手动设置。

---

## 6. SemanticNode 结构（语义节点，纯后端使用）

### 6.1 字段定义

| 字段         | 类型                    | 必填 | 说明                                             |
| ------------ | ----------------------- | ---- | ------------------------------------------------ |
| `id`         | string                  | ✓    | 节点唯一 ID（如 `n1`、`cond_soc_alert`）         |
| `type`       | string                  | ✓    | 节点类型（`rf-input-port` / `rf-condition` 等）  |
| `text`       | string                  | ✓    | 节点显示文本（已拍扁，无嵌套对象）               |
| `properties` | Record<string, unknown> | ✓    | 业务属性（**不含** width/height/icon/collapsed） |

### 6.2 关键差异

**与 v0.3.x RuleFlowNode 区别**：

- ❌ **无顶层 `x`/`y`** —— 坐标属于视图态，已剥离
- ❌ **`properties` 中无 `width`/`height`/`icon`/`collapsed`** —— 全部剥离
- ✅ **`text` 一律为 string** —— `flattenText()` 拍扁后无嵌套

### 6.3 完整示例

```json
{
  "id": "cond_soc",
  "type": "rf-condition",
  "text": "SOC 监控",
  "properties": {
    "nodeType": "condition",
    "summary": "条件: AND",
    "ruleId": "cond:soc_alert_001",
    "roleInRule": "condition",
    "priority": 1,
    "enabled": true,
    "conditionOp": "leaf",
    "leafType": "value_range",
    "leafConfig": { "min": 20, "max": 80, "inclusive": true }
  }
}
```

### 6.4 properties 业务字段白名单

**保留**（后端需要）：

| 字段              | 类型     | 说明                                                                   |
| ----------------- | -------- | ---------------------------------------------------------------------- |
| `nodeType`        | enum     | 视觉分类（input_port / condition / action / output_port / logic_gate） |
| `summary`         | string   | 数据点 FQN 或条件摘要                                                  |
| `ruleId`          | string   | 所属规则 ID（**必须符合命名约定**，见 §10）                            |
| `roleInRule`      | enum     | condition / action / input / output / logic_gate                       |
| `priority`        | number   | 规则优先级                                                             |
| `enabled`         | boolean  | 是否启用                                                               |
| `conditionOp`     | enum     | AND / OR / NOT / leaf                                                  |
| `leafType`        | string   | 子条件类型                                                             |
| `leafConfig`      | object   | 子条件配置                                                             |
| `actionType`      | string   | 动作类型                                                               |
| `actionConfig`    | object   | 动作配置                                                               |
| `actionOrder`     | number   | 动作顺序                                                               |
| `ruleDescription` | string   | 规则描述                                                               |
| `inputBindings`   | string[] | 输入绑定列表                                                           |
| `inputMode`       | enum     | single / multi                                                         |
| `targets`         | string[] | 路由目标                                                               |
| `childCount`      | number   | 逻辑门子条件数                                                         |

**剥离**（视图态字段，v0.4.0 起不出现）：

| 字段        | 原因       |
| ----------- | ---------- |
| `width`     | 视图层尺寸 |
| `height`    | 视图层尺寸 |
| `icon`      | 视图层装饰 |
| `collapsed` | 视图层状态 |

---

## 7. SemanticEdge 结构（语义边，纯后端使用）

### 7.1 字段定义

| 字段           | 类型                    | 必填 | 说明                               |
| -------------- | ----------------------- | ---- | ---------------------------------- |
| `id`           | string                  | ✓    | 边唯一 ID                          |
| `type`         | string                  | ✓    | `polyline` / `condition-tree-edge` |
| `sourceNodeId` | string                  | ✓    | 源节点 ID                          |
| `targetNodeId` | string                  | ✓    | 目标节点 ID                        |
| `properties`   | Record<string, unknown> | ✓    | 业务属性（仅含 `relationType` 等） |

### 7.2 关键差异

**与 v0.3.x RuleFlowEdge 区别**：

- ❌ **无 `sourceAnchorId` / `targetAnchorId`** —— 锚点属于视图
- ❌ **无 `startPoint` / `endPoint` / `pointsList`** —— 几何属于视图
- ❌ **无 `text`** —— 边标签属于视图
- ✅ **`properties` 仅含业务字段**（如 `relationType`）

### 7.3 完整示例

```json
{
  "id": "e1",
  "type": "polyline",
  "sourceNodeId": "n1",
  "targetNodeId": "n2",
  "properties": {
    "relationType": "default"
  }
}
```

### 7.4 relationType 枚举

| 值        | 含义               |
| --------- | ------------------ |
| `default` | 默认流转           |
| `True`    | 条件为真时流转     |
| `False`   | 条件为假时流转     |
| `Success` | 动作执行成功后流转 |
| `Failure` | 动作执行失败后流转 |
| `Custom`  | 自定义关系         |

---

## 8. ViewNode 结构（视图节点，纯前端使用）

| 字段        | 类型    | 必填 | 默认值 | 说明                                   |
| ----------- | ------- | ---- | ------ | -------------------------------------- |
| `id`        | string  | ✓    | -      | 节点唯一 ID（与 SemanticNode.id 对齐） |
| `x`         | number  | ✓    | `0`    | 画布 X 坐标                            |
| `y`         | number  | ✓    | `0`    | 画布 Y 坐标                            |
| `width`     | number  |      | -      | 节点宽度（可选）                       |
| `height`    | number  |      | -      | 节点高度（可选）                       |
| `icon`      | string  |      | -      | 节点图标字符（→/←/◇/▶/...）            |
| `collapsed` | boolean |      | -      | 逻辑门是否折叠                         |

### 8.1 完整示例

```json
{
  "id": "n1",
  "x": 200,
  "y": 150,
  "width": 200,
  "height": 80,
  "icon": "→"
}
```

---

## 9. ViewEdge 结构（视图边，纯前端使用）

| 字段             | 类型                                    | 必填 | 说明                        |
| ---------------- | --------------------------------------- | ---- | --------------------------- |
| `id`             | string                                  | ✓    | 边唯一 ID                   |
| `sourceAnchorId` | string                                  |      | 源锚点 ID（连接点）         |
| `targetAnchorId` | string                                  |      | 目标锚点 ID                 |
| `startPoint`     | `{x: number, y: number}`                |      | 起始点坐标                  |
| `endPoint`       | `{x: number, y: number}`                |      | 结束点坐标                  |
| `pointsList`     | `Array<{x: number, y: number}>`         |      | 路径拐点列表                |
| `text`           | `{x: number, y: number, value: string}` |      | 边标签（如 "True"/"False"） |

### 9.1 完整示例

```json
{
  "id": "e1",
  "sourceAnchorId": "n1_1",
  "targetAnchorId": "n2_3",
  "startPoint": { "x": 300, "y": 150 },
  "endPoint": { "x": 400, "y": 200 },
  "pointsList": [
    { "x": 300, "y": 150 },
    { "x": 350, "y": 150 },
    { "x": 350, "y": 200 },
    { "x": 400, "y": 200 }
  ],
  "text": { "x": 350, "y": 130, "value": "True" }
}
```

---

## 10. ruleId 命名约定（v0.4.0 新增）

**v0.4.0 起强制类型前缀**，避免命名空间冲突。

### 10.1 命名规则

正则: `^(rule|node|cond|act|gate|port|io):[a-z0-9_-]{1,64}$`

- **前缀**（必填，小写）：7 种之一
- **分隔符**：冒号 `:`
- **后缀**（必填，小写字母/数字/下划线/连字符）：1-64 字符

### 10.2 类型前缀映射

| 节点类型       | 推荐前缀 | 可选前缀 |
| -------------- | -------- | -------- |
| `rule`（根）   | `rule:`  | -        |
| `condition`    | `cond:`  | `rule:`  |
| `action`       | `act:`   | `rule:`  |
| `node`（通用） | `node:`  | -        |
| `logic_gate`   | `gate:`  | `rule:`  |
| `input_port`   | `port:`  | `io:`    |
| `output_port`  | `port:`  | `io:`    |

### 10.3 命名示例

```typescript
// ✅ 推荐命名
'rule:001'
'cond:soc_alert_001'
'act:alarm_001'
'port:m1_ua'                  // 数据点 ID 中的冒号替换为下划线
'gate:and_001'

// ❌ 非法命名
'rule_001'                    // 缺冒号
'rule:'                       // 空后缀
'RULE:001'                    // 大写前缀
'xxx:001'                     // 未知前缀
'port:m1:UA'                  // 后缀含冒号（应用下划线替代）
'port:M1_UA'                  // 后缀含大写
''                            // 空字符串
```

### 10.4 工具函数

- `isValidRuleId(ruleId, type?)` — 校验是否符合约定，可选传入 type 进一步校验前缀
- `generateRuleId(type)` — 自动生成符合约定的 ID（时间戳 + 随机后缀）

### 10.5 自动生成示例

```typescript
generateRuleId('condition')   // → "cond:ln8j3k_a4f2"
generateRuleId('action')      // → "act:ln8j3k_b7e1"
generateRuleId('rule')        // → "rule:ln8j3k_c9d3"
```

100 次调用全部唯一（已通过单元测试验证）。

---

## 11. 强校验：validateSemanticDocument

v0.4.0 起，保存前会自动调用 [`validateSemanticDocument()`](file:///e:/VPPTU-06/ruleflow-edit/src/utils/ruleflowSerializer.ts#L475) 校验语义文档**严格不含**视图字段。

### 11.1 禁止字段清单

| 字段               | 位置                    | 原因     |
| ------------------ | ----------------------- | -------- |
| `x` / `y`          | SemanticNode 顶层       | 视图坐标 |
| `width` / `height` | SemanticNode.properties | 视图尺寸 |
| `icon`             | SemanticNode.properties | 视图装饰 |
| `collapsed`        | SemanticNode.properties | 视图状态 |
| `sourceAnchorId`   | SemanticEdge 顶层       | 视图锚点 |
| `targetAnchorId`   | SemanticEdge 顶层       | 视图锚点 |
| `startPoint`       | SemanticEdge 顶层       | 视图几何 |
| `endPoint`         | SemanticEdge 顶层       | 视图几何 |
| `pointsList`       | SemanticEdge 顶层       | 视图几何 |
| `text`             | SemanticEdge 顶层       | 视图标签 |
| `transform`        | SemanticDocument 顶层   | 视图状态 |
| `gridVisible`      | SemanticDocument 顶层   | 视图状态 |
| `selectedNodeId`   | SemanticDocument 顶层   | 视图状态 |

### 11.2 校验示例

```typescript
import { validateSemanticDocument } from './utils/ruleflowSerializer'

const result = validateSemanticDocument(semanticDoc)
if (!result.valid) {
  console.warn('语义校验失败:', result.errors)
  // [
  //   { field: 'x', path: '$.nodes[0]', message: '语义节点禁止包含视图字段 "x"' },
  //   { field: 'width', path: '$.nodes[0].properties.width', message: '...' }
  // ]
}
```

### 11.3 失败示例

```json
// ❌ 校验失败：节点顶层含 x/y
{
  "version": "2.0",
  "nodes": [
    { "id": "n1", "type": "rf-x", "x": 100, "y": 200, "text": "t", "properties": {} }
  ]
}
// 错误: $.nodes[0] 包含禁止字段 "x" 和 "y"
```

### 11.4 成功示例

```json
// ✅ 校验通过
{
  "version": "2.0",
  "nodes": [
    { "id": "n1", "type": "rf-input-port", "text": "SOC", "properties": { "summary": "soc_monitor" } }
  ]
}
```

---

## 12. 视图态本地化（localStorage）

v0.4.0 起，视图态可自动保存到 `localStorage`，无需用户手动下载。

### 12.1 存储键

```
ruleflow:view:{chainId}     // 指定链
ruleflow:view:default       // 默认（无 chainId）
```

### 12.2 工具函数

| 函数                                     | 说明                           |
| ---------------------------------------- | ------------------------------ |
| `saveViewToLocalStorage(view, chainId?)` | 保存视图态                     |
| `loadViewFromLocalStorage(chainId?)`     | 读取视图态（返回 null 表示无） |
| `clearViewFromLocalStorage(chainId?)`    | 清除指定链的视图态             |

### 12.3 工作流程

```
用户编辑画布
  ↓
Ctrl+S / 工具栏保存
  ↓
buildViewDocument() → ViewDocument
  ↓
saveViewToLocalStorage(view, chainName)  ← 自动持久化
  ↓
下次加载同链时
  ↓
loadViewFromLocalStorage(chainName) → 自动恢复画布布局
```

### 12.4 隐私模式

隐私模式下 `localStorage.setItem` 会抛错，函数静默忽略。不会影响保存流程。

---

## 13. 输入/输出数据点定义

### 13.1 RuleChainInput（输入数据点）

定义位置: [ruleflowDocument.ts:41-49](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L41-L49)

```typescript
interface RuleChainInput {
  pointName: string        // 必填
  displayName?: string
  pointType: string        // 必填
  dataType: string         // 必填
  unit?: string
  group?: string
  description?: string
}
```

| 字段          | 类型   | 必填 | 说明                                                         |
| ------------- | ------ | ---- | ------------------------------------------------------------ |
| `pointName`   | string | ✓    | 数据点 FQN（如 `m1:UA`），运行时数据路由键                   |
| `displayName` | string |      | 画布/UI 显示名                                               |
| `pointType`   | enum   | ✓    | `analog` / `digital` / `counter` / `virtual`                 |
| `dataType`    | enum   | ✓    | `double` / `float32` / `int32` / `int64` / `bool` / `string` |
| `unit`        | string |      | 物理单位（V / A / kW / % / Hz / ℃ ...）                      |
| `group`       | string |      | 分组标签，用于分类管理                                       |
| `description` | string |      | 数据点说明                                                   |

### 13.2 RuleChainOutput（输出数据点）

定义位置: [ruleflowDocument.ts:27-38](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L27-L38)

新增字段（相对 Input）:

| 字段          | 类型     | 必填 | 说明                             |
| ------------- | -------- | ---- | -------------------------------- |
| `scope`       | enum     |      | `per_device` / `global` — 作用域 |
| `inputPoints` | string[] |      | 该输出依赖的输入数据点 FQN 列表  |

完整字段:

```typescript
interface RuleChainOutput {
  pointName: string
  displayName: string        // 注意：output 此字段为必填
  pointType: string
  dataType: string
  unit?: string
  group?: string
  scope?: 'per_device' | 'global'
  inputPoints?: string[]
  description?: string
}
```

### 13.3 输入/输出示例

```json
"inputs": [
  {
    "pointName": "m1:UA",
    "displayName": "A 相电压",
    "pointType": "analog",
    "dataType": "double",
    "unit": "V",
    "group": "measurement",
    "description": "电表 1 的 A 相电压"
  },
  {
    "pointName": "m1:IA",
    "displayName": "A 相电流",
    "pointType": "analog",
    "dataType": "double",
    "unit": "A",
    "group": "measurement"
  }
],
"outputs": [
  {
    "pointName": "dispatch_command",
    "displayName": "调度指令",
    "pointType": "virtual",
    "dataType": "float64",
    "unit": "kW",
    "group": "control",
    "scope": "per_device",
    "inputPoints": ["m1:UA", "m1:IA", "soc_monitor"],
    "description": "储能充放电调度控制输出"
  }
]
```

---

## 14. 字段命名约定（camelCase 与 snake_case 互转）

文档支持**两种字段命名风格**，自动检测并归一化:

| 来源                           | 风格                     | 示例                                                        |
| ------------------------------ | ------------------------ | ----------------------------------------------------------- |
| **前端编辑器 / Web 后端 JSON** | **camelCase（驼峰）**    | `pointName`, `dataType`, `evaluationMode`, `leafConfig`     |
| **Go 引擎 / YAML 文件**        | **snake_case（下划线）** | `point_name`, `data_type`, `evaluation_mode`, `leaf_config` |

### 14.1 常见字段对照

| camelCase（前端） | snake_case（Go/YAML）       |
| ----------------- | --------------------------- |
| `chainId`         | `chain_id`                  |
| `chainName`       | `chain_name`                |
| `evaluationMode`  | `evaluation_mode`           |
| `pipelineType`    | `pipeline_type`             |
| `pointName`       | `point_name`                |
| `pointType`       | `point_type`                |
| `dataType`        | `data_type`                 |
| `displayName`     | `display_name`              |
| `ruleDescription` | `rule_description`          |
| `inputBindings`   | `input_bindings`            |
| `inputMode`       | `input_mode`                |
| `inputPoints`     | `input_points`              |
| `actionType`      | `action_type` 或 `type`     |
| `actionConfig`    | `action_config` 或 `config` |
| `actionOrder`     | `action_order`              |
| `leafType`        | `leaf_type`                 |
| `leafConfig`      | `leaf_config`               |
| `conditionOp`     | `op` 或 `operator`          |
| `relationType`    | `relation_type`             |
| `sourceNodeId`    | `source_node_id`            |
| `targetNodeId`    | `target_node_id`            |

### 14.2 条件操作符别名

`conditionOp` 字段在历史数据中有多种命名:

- `op`（YAML 旧格式）
- `operator`（统一规范）
- `conditionOp`（前端内部）

归一化逻辑（[ruleflowDocument.ts:464-470](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L464-L470)）:

```typescript
const op = (condition.op || condition.operator || condition.conditionOp || 'leaf').toLowerCase()
```

- **YAML 输入**（大写）→ 内部存储大写 `AND` / `OR` / `NOT`
- **YAML 输出**（小写）→ 兼容 Go 引擎

### 14.3 条件子节点别名

`childConditions` 字段:

- `conditions`（YAML 旧格式）
- `children`（统一规范）

归一化逻辑（[ruleflowDocument.ts:467](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L467)）:

```typescript
const childConditions = condition.conditions || condition.children || []
```

### 14.4 导入导出处理

**导入**（[fromDefinitionJSON](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L826-L884)）: 自动归一化 snake_case → camelCase，调用 fromYAML 处理。

**导出**: 编辑器默认输出 camelCase；toYAML 函数输出 snake_case 兼容 Go 引擎。

---

## 15. 保存触发流程（v0.4.0 语义/视图分离）

```
v0.4.0 流程：用户按 Ctrl+S / 工具栏"保存"
    ↓
RuleFlowEditor.tsx: bind('save', ...) 处理器触发（路径 A）
FileGroup.tsx: 工具栏按钮点击（路径 B）
    ↓
buildSemanticDocument(lf, chainName) → SemanticDocument
├─ 节点：stripViewFromProperties (剥离 width/height/icon/collapsed)
├─ 节点：text 拍扁为 string (flattenText)
├─ 边：仅保留 id/type/sourceNodeId/targetNodeId/properties
└─ 不含任何 x/y/width/height/icon/pointsList 字段
    ↓
[路径 B 额外] buildViewDocument(lf, name) → ViewDocument
    ↓
[路径 B 额外] validateSemanticDocument(semantic) → 强校验
    ↓
[路径 B 额外] saveViewToLocalStorage(view, name) → 视图本地化
    ↓
[路径 A] 调用 props.onSave(semantic) ← 业务层接管
[路径 B] downloadAsJsonFile(buildRuleflowDocument(lf, name)) → 兼容期单文件
    ↓
通常: api.saveRuleChain(semantic) → HTTP POST → 后端
```

### 15.1 关键代码

**路径 A**（`Ctrl+S`）— [RuleFlowEditor.tsx:364-385](file:///e:/VPPTU-06/ruleflow-edit/src/layout/RuleFlowEditor.tsx#L364-L385)：

```typescript
bind('save', (e) => {
  e.preventDefault()
  if (onSave) {
    try {
      const lf = (window as unknown as Record<string, unknown>).__lf as
        | import('@logicflow/core').LogicFlow
        | undefined
      if (lf) {
        // v0.4.0: 传递纯语义给后端
        const semantic = buildSemanticDocument(lf, '')
        onSave(semantic as unknown as RuleFlowDocument)
      }
    } catch (_e) {
      toast('error', '保存失败')
    }
  } else {
    toast('success', '规则链已保存')
  }
})
```

**路径 B**（工具栏"保存"）— [FileGroup.tsx:80-98](file:///e:/VPPTU-06/ruleflow-edit/src/components/toolbar/FileGroup.tsx#L80-L98)：

```typescript
const lf = lfInstance.value
if (!lf) return
try {
  const name = chainName.value || '未命名规则链'
  // 拆分语义/视图
  const semantic = buildSemanticDocument(lf, name)
  const view = buildViewDocument(lf, name)
  // 强校验
  if (import.meta.env.DEV) {
    const v = validateSemanticDocument(semantic)
    if (!v.valid) console.warn('[RuleFlow] 语义校验失败:', v.errors)
  }
  // 视图本地化
  saveViewToLocalStorage(view, name)
  // 兼容期：仍用 buildRuleflowDocument 产生单文件
  const doc = buildRuleflowDocument(lf, name)
  downloadAsJsonFile(doc)
  showSuccess('规则链已保存（语义+视图）')
} catch (err) {
  // ...
}
```

### 15.2 回调签名

```typescript
// v0.4.0 推荐：纯语义
onSave?: (semantic: SemanticDocument) => void

// 兼容方式：开发者可把 semantic 强制为 RuleFlowDocument（字段子集）
onSave?: (doc: RuleFlowDocument) => void
```

### 15.3 加载流程

```typescript
// 加载 JSON 文件
const semantic = await readJsonFile(file) as SemanticDocument
// 可选：从 localStorage 恢复视图
const view = loadViewFromLocalStorage(semantic.chainName)
// 合并
const doc = mergeFromSemanticAndView(semantic, view)
// 应用到 LogicFlow
applyDocumentToLf(lf, doc)
```

业务层实现示例:

```typescript
<RuleFlowEditor
  onSave={async (doc) => {
    const result = await api.post('/api/rulechain/save', doc)
    if (result.success) {
      toast.success(`已保存 v${result.version}`)
    } else {
      toast.error('保存失败: ' + result.error)
    }
  }}
/>
```

---

## 16. 关键设计差异点

| 关注点                                   | 说明                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **`text` vs `properties.summary`**       | `text` 是画布显示文本（中文友好），`summary` 是数据点 FQN（与后端对应）。前者给人看，后者给机器路由。 |
| **`x`, `y` 坐标**                        | 画布坐标，后端存储但运行时忽略（重新加载时位置可能微调）。                                            |
| **`width`, `height`**                    | UI 尺寸，可选；保存时 LogicFlow 会自动附加，建议后端解析时忽略。                                      |
| **`evaluationMode`**                     | `'all'` = 全量评估（默认，所有条件通过才触发动作），`'any'` = 任一通过。                              |
| **`roleInRule`**                         | 后端路由关键字段，必须为五个枚举值之一。                                                              |
| **`ruleId`**                             | 节点所属规则 ID；多个节点共享同一 ruleId 表示它们在同一规则内。                                       |
| **`conditionOp` 大小写**                 | 内部存储大写（`AND` / `OR` / `NOT`），YAML 输出小写（`and` / `or` / `not`）。                         |
| **`relationType` 与 `conditionOp` 配合** | 条件节点的 True/False 边决定分支流向；动作节点的 Success/Failure 边决定下一步。                       |

### 16.1 规则路由机制

```
[input_port] --(default)--> [condition root] --(True)--> [action 1] --(Success)--> [action 2] --(Success)--> [output_port]
                                          \--(False)--> [output_port 或下一条件]
```

### 16.2 逻辑门嵌套

逻辑门（AND/OR/NOT）是特殊的 condition 节点，通过 `condition-tree-edge` 类型的边连接子条件:

```json
{
  "nodes": [
    { "id": "gate_and", "type": "rf-logic-gate", "text": "AND 条件组",
      "properties": { "roleInRule": "logic_gate", "conditionOp": "AND", "childCount": 2 } },
    { "id": "sub_1", "type": "rf-condition", "text": "条件 1",
      "properties": { "roleInRule": "condition", "conditionOp": "leaf", "leafType": "value_range" } },
    { "id": "sub_2", "type": "rf-condition", "text": "条件 2",
      "properties": { "roleInRule": "condition", "conditionOp": "leaf", "leafType": "expr_filter" } }
  ],
  "edges": [
    { "id": "e1", "type": "condition-tree-edge", "sourceNodeId": "gate_and", "targetNodeId": "sub_1", "properties": { "relationType": "default" } },
    { "id": "e2", "type": "condition-tree-edge", "sourceNodeId": "gate_and", "targetNodeId": "sub_2", "properties": { "relationType": "default" } }
  ]
}
```

---

## 17. 版本与兼容性

### 17.1 文档版本

| 版本          | 字段     | 说明                                                                                                  |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `version: 1`  | 初始版本 | [createEmptyDocument](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L779-L793) 默认 |
| `version: 2+` | 未来扩展 | 预留版本号机制用于向后兼容                                                                            |

### 17.2 状态字段

| 值          | 含义                 |
| ----------- | -------------------- |
| `draft`     | 草稿（编辑中）       |
| `published` | 已发布（运行时生效） |
| `archived`  | 已归档（不再使用）   |

### 17.3 管道类型

| 值         | 含义                     |
| ---------- | ------------------------ |
| `standard` | 标准管道（默认）         |
| `fast`     | 快速管道（低延迟优化）   |
| `batch`    | 批处理管道（高吞吐优化） |

### 17.4 向后兼容保证

[fromDefinitionJSON](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts#L826) 同时接受:

- ✅ 纯 camelCase（前端新格式）
- ✅ 纯 snake_case（Go 引擎旧格式）
- ✅ 混合格式（部分字段 camelCase + 部分 snake_case）
- ✅ 字段别名（`op` / `operator` / `conditionOp`）

---

## 18. 实际测试捕获的 doc 结构

在浏览器中通过 `lf.getGraphData()` + save 处理器代码执行的 doc 实际形态:

```json
{
  "chainId": "",
  "chainName": "",
  "enabled": true,
  "root": false,
  "evaluationMode": "all",
  "nodes": [
    { "id": "input_soc", "type": "rf-input-port", "x": 200, "y": 150,
      "text": "SOC 数据",
      "properties": {
        "nodeType": "input_port", "icon": "→", "priority": 0,
        "enabled": true, "summary": "soc_monitor",
        "width": 200, "height": 80
      }
    },
    { "id": "input_pw", "type": "rf-input-port", "x": 200, "y": 280,
      "text": "有功功率",
      "properties": { "nodeType": "input_port", "icon": "→", "summary": "active_power" } },
    { "id": "cond_soc", "type": "rf-condition", "x": 480, "y": 150,
      "text": "SOC 监控",
      "properties": { "nodeType": "condition", "icon": "GitBranch", "summary": "SOC 监控 (P:1)" } },
    { "id": "act_transform", "type": "rf-action", "x": 760, "y": 150,
      "text": "值变换",
      "properties": { "nodeType": "action", "icon": "Play", "summary": "值变换" } },
    { "id": "act_alarm", "type": "rf-action", "x": 900, "y": 150,
      "text": "告警通知",
      "properties": { "nodeType": "action", "icon": "Bell", "summary": "告警通知" } },
    { "id": "act_dispatch", "type": "rf-action", "x": 1040, "y": 200,
      "text": "调度下发",
      "properties": { "nodeType": "action", "icon": "Send", "summary": "调度下发" } },
    { "id": "output_dispatch", "type": "rf-output-port", "x": 1240, "y": 200,
      "text": "调度指令",
      "properties": { "nodeType": "output_port", "icon": "←", "summary": "dispatch_command" } }
  ],
  "edges": [
    { "id": "e1", "type": "polyline", "sourceNodeId": "input_soc", "targetNodeId": "cond_soc", "properties": { "relationType": "default" } },
    { "id": "e2", "type": "polyline", "sourceNodeId": "cond_soc", "targetNodeId": "act_transform", "properties": { "relationType": "True" } },
    { "id": "e3", "type": "polyline", "sourceNodeId": "act_transform", "targetNodeId": "act_alarm", "properties": { "relationType": "Success" } },
    { "id": "e4", "type": "polyline", "sourceNodeId": "act_alarm", "targetNodeId": "act_dispatch", "properties": { "relationType": "Success" } },
    { "id": "e5", "type": "polyline", "sourceNodeId": "act_dispatch", "targetNodeId": "output_dispatch", "properties": { "relationType": "Success" } },
    { "id": "e6", "type": "polyline", "sourceNodeId": "input_pw", "targetNodeId": "act_alarm", "properties": { "relationType": "default" } }
  ]
}
```

### 18.1 注意事项

浏览器自动加载的 `demoData` 在 save 时**未填入** `ruleId` / `roleInRule`（这些是业务必需字段，由后端或规则管理面板补齐）。编辑器原生只生成画布表示所需的字段。

完整字段集需通过以下方式补齐:
- **导入 YAML**: 走 fromYAML，自动补全所有业务字段
- **后端规则管理面板**: 通过 API 设置 ruleId / roleInRule / actionOrder 等
- **手动编辑 JSON**: 导入后修改 properties 字段

### 18.2 字段补全映射

| 字段          | 补全来源         | 默认值               |
| ------------- | ---------------- | -------------------- |
| `chainId`     | 后端分配         | `""`                 |
| `chainName`   | 用户输入         | `""`                 |
| `ruleId`      | 规则管理面板分配 | `""`                 |
| `roleInRule`  | 节点类型推导     | 由 `type` 字段决定   |
| `actionOrder` | 自动递增         | `1, 2, 3, ...`       |
| `actionType`  | 节点类型推导     | 由 `type` 字段决定   |
| `leafType`    | 节点类型推导     | `expr_filter` (默认) |
| `conditionOp` | 节点类型推导     | `leaf` (默认)        |

---

## 19. 常见问题 FAQ

### Q1: `text` 和 `summary` 填什么？

- `text`: 给画布显示用的文本，可以是中文，如 "SOC 数据"、"A 相电压"
- `summary`: 数据点 FQN，与后端测点对应，如 `m1:UA`、`soc_monitor`

两者**必须分别配置**：前者用于视觉识别，后者用于运行时数据路由。

### Q2: `x`, `y` 是必需的吗？

是的，编辑器原生必填，但后端运行时可以忽略（仅用于画布位置持久化）。

### Q3: 导入旧 YAML 文件会丢失数据吗？

不会。`fromYAML` 完整解析所有字段并映射到 `RuleFlowDocument`，零数据丢失。

### Q4: 导出 JSON 给后端，后端能直接解析吗？

可以。`RuleFlowDocument` 是前后端统一格式，后端 Go 引擎自动归一化 camelCase ↔ snake_case。

### Q5: `conditionOp` 用大写还是小写？

- **JSON 内部存储**: 大写（`AND` / `OR` / `NOT`）
- **YAML 文件**: 小写（`and` / `or` / `not`），兼容 Go 引擎

导入时自动转换，导出时也自动转换，无需手动处理。

### Q6: 逻辑门的子条件怎么存？

逻辑门是 `rf-logic-gate` 节点，子条件是普通 `rf-condition` 节点，通过 `condition-tree-edge` 类型的边连接。

```json
{ "type": "condition-tree-edge", "sourceNodeId": "gate_and", "targetNodeId": "sub_1" }
```

### Q7: 多个 rule 怎么组织？

通过 `ruleId` 字段分组。所有具有相同 `ruleId` 的节点属于同一规则。规则之间通常通过共享的 input_port 或 output_port 串联。

### Q8: 调试时如何定位节点？

使用 `id` 字段。调试消息流中的 `sourceNodeId` / `targetNodeId` 直接对应编辑器节点 ID，可在右侧"大纲"面板快速跳转。

---

## 20. 相关代码索引

| 模块          | 文件                                                                                   | 关键行  |
| ------------- | -------------------------------------------------------------------------------------- | ------- |
| 类型定义      | [ruleflowDocument.ts](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts) | 1-150   |
| 节点类型      | [ruleflowDocument.ts](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts) | 51-114  |
| 边类型        | [ruleflowDocument.ts](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts) | 116-126 |
| 文档类型      | [ruleflowDocument.ts](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts) | 128-148 |
| YAML 导入     | [ruleflowDocument.ts](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts) | 215-447 |
| YAML 导出     | [ruleflowDocument.ts](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts) | 566-734 |
| JSON 导入     | [ruleflowDocument.ts](file:///e:/VPPTU-06/ruleflow-edit/src/types/ruleflowDocument.ts) | 826-884 |
| 保存处理器    | [RuleFlowEditor.tsx](file:///e:/VPPTU-06/ruleflow-edit/src/layout/RuleFlowEditor.tsx)  | 363-403 |
| Props 定义    | [RuleFlowEditor.tsx](file:///e:/VPPTU-06/ruleflow-edit/src/layout/RuleFlowEditor.tsx)  | 118-130 |
| demoData 示例 | [demoData.ts](file:///e:/VPPTU-06/ruleflow-edit/src/data/demoData.ts)                  | 1-100   |

---

## 21. 版本历史

| 版本   | 日期         | 变更                                                                                                                                                                                                                              |
| ------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.4.0 | 2026-06-24   | **语义/视图分离架构**。新增 `SemanticDocument` / `ViewDocument` 双文档；`buildSemanticDocument()` 严格剥离视图字段；`validateSemanticDocument()` 强校验；`saveViewToLocalStorage()` 视图本地化；ruleId 强制 `rule:xxx` 命名约定。 |
| v0.3.0 | 2026-06-24   | 完成 P0-P3 优化，统一为 device_address 字段。                                                                                                                                                                                     |
| v0.2.x | 2026-06 之前 | 初版文档结构，支持 80+ 节点类型。                                                                                                                                                                                                 |
