# RuleFlow JSON 输出文件结构 v2

> **版本**: v2.0  ·  **用途**: 后端解析 / 存档参考
> **完整文档**: [JSON_FORMAT.md](file:///e:/VPPTU-06/ruleflow-edit/JSON_FORMAT.md)

---

## 1. SemanticDocument（后端使用，纯语义）

```typescript
{
  version: "2.0",
  chainId: string,                  // 规则链 ID
  chainName: string,                // 规则链名称
  enabled: boolean,                 // 是否启用
  root: boolean,                    // 是否根规则链
  evaluationMode: "all" | "any",
  description?: string,
  schemaVersion: number,
  status?: "draft" | "published" | "archived",
  pipelineType?: "standard" | "fast" | "batch",
  inputs?: Input[],
  outputs?: Output[],
  nodes: SemanticNode[],           // 见 §3
  edges: SemanticEdge[]            // 见 §4
}
```

完整示例：

```json
{
  "version": "2.0",
  "chainId": "chain-001",
  "chainName": "储能调度",
  "enabled": true,
  "root": true,
  "evaluationMode": "all",
  "description": "储能充放电调度",
  "schemaVersion": 1,
  "status": "draft",
  "pipelineType": "standard",
  "inputs": [
    {
      "pointName": "m1:UA",
      "displayName": "A 相电压",
      "pointType": "analog",
      "dataType": "double",
      "unit": "V",
      "group": "measurement"
    }
  ],
  "outputs": [
    {
      "pointName": "dispatch_order",
      "displayName": "调度指令",
      "pointType": "virtual",
      "dataType": "float64",
      "unit": "kW",
      "scope": "per_device",
      "inputPoints": ["m1:UA"]
    }
  ],
  "nodes": [],
  "edges": []
}
```

---

## 2. ViewDocument（前端使用，纯视图）

```typescript
{
  version: "2.0",
  chainId?: string,
  transform?: { scale: number, translateX: number, translateY: number },
  gridVisible?: boolean,
  selectedNodeId?: string | null,
  nodes: ViewNode[],               // 见 §5
  edges: ViewEdge[]                // 见 §6
}
```

---

## 3. SemanticNode（语义节点）

```typescript
{
  id: string,                      // 节点唯一 ID
  type: string,                    // rf-input-port | rf-condition | rf-action | rf-output-port | rf-logic-gate
  text: string,                    // 显示文本（已拍扁）
  properties: {                    // 业务属性（不含视图字段）
    nodeType: "input_port" | "condition" | "action" | "output_port" | "logic_gate",
    icon?: string,
    enabled: boolean,
    summary: string,               // 数据点 FQN 或条件摘要
    ruleId: string,                // 命名: (rule|cond|act|port|gate|node|io):[a-z0-9_-]+
    roleInRule: "condition" | "action" | "input" | "output" | "logic_gate",
    priority?: number,
    conditionOp?: "AND" | "OR" | "NOT" | "leaf",
    leafType?: string,
    leafConfig?: object,
    actionType?: string,
    actionConfig?: object,
    actionOrder?: number,
    ruleDescription?: string,
    inputBindings?: string[],
    inputMode?: "single" | "multi",
    targets?: string[],
    childCount?: number
  }
}
```

**禁止字段**（出现在 SemanticNode 即视为非法）：`x` / `y`（顶层）、`width` / `height` / `icon` / `collapsed`（properties 内）

---

## 4. SemanticEdge（语义边）

```typescript
{
  id: string,
  type: "polyline" | "condition-tree-edge",
  sourceNodeId: string,
  targetNodeId: string,
  properties: {
    relationType: "default" | "True" | "False" | "Success" | "Failure" | "Custom"
  }
}
```

**禁止字段**（出现在 SemanticEdge 即视为非法）：`sourceAnchorId` / `targetAnchorId` / `startPoint` / `endPoint` / `pointsList` / `text`

---

## 5. ViewNode（视图节点）

```typescript
{
  id: string,
  x: number,
  y: number,
  width?: number,
  height?: number,
  icon?: string,
  collapsed?: boolean
}
```

---

## 6. ViewEdge（视图边）

```typescript
{
  id: string,
  sourceAnchorId?: string,
  targetAnchorId?: string,
  startPoint?: { x: number, y: number },
  endPoint?: { x: number, y: number },
  pointsList?: Array<{ x: number, y: number }>,
  text?: { x: number, y: number, value: string }
}
```

---

## 7. Input / Output

```typescript
// Input
{
  pointName: string,               // FQN，如 "m1:UA"
  displayName?: string,
  pointType: "analog" | "digital" | "counter" | "virtual",
  dataType: "double" | "float32" | "int32" | "bool" | "string",
  unit?: string,
  group?: string,
  description?: string
}

// Output（继承 Input 全部字段，扩展）
{
  ...Input,
  scope?: "per_device" | "global",
  inputPoints?: string[]
}
```

---

## 8. ruleId 命名约定

```
^(rule|cond|act|port|gate|node|io):[a-z0-9_-]{1,64}$
```

| 节点类型                 | 推荐前缀 | 示例                 |
| ------------------------ | -------- | -------------------- |
| condition                | `cond:`  | `cond:soc_alert_001` |
| action                   | `act:`   | `act:alarm_001`      |
| input_port / output_port | `port:`  | `port:m1_ua`         |
| logic_gate               | `gate:`  | `gate:and_001`       |
| rule（根）               | `rule:`  | `rule:001`           |

> 数据点 ID 中的冒号用下划线替代：`m1:UA` → `port:m1_ua`

---

## 9. 字段对照

| 类别                          | 字段                                                                                             | 来源                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| 语义（必）                    | `id`, `type`, `text`, `properties.{nodeType,summary,ruleId,roleInRule,enabled}`                  | 编辑器生成             |
| 语义（选）                    | `properties.{conditionOp,leafType,leafConfig,actionType,actionConfig,priority,actionOrder,...}`  | 规则配置               |
| 视图（不持久化到 semantic）   | `x`, `y`, `width`, `height`, `icon`, `collapsed`                                                 | 仅 ViewDocument        |
| 边几何（不持久化到 semantic） | `sourceAnchorId`, `targetAnchorId`, `startPoint`, `endPoint`, `pointsList`, `text`               | 仅 ViewDocument        |
| 元数据                        | `chainId`, `chainName`, `enabled`, `root`, `evaluationMode`, `version`, `status`, `pipelineType` | 规则链属性             |
| 双向兼容                      | `pointName` ↔ `point_name`, `dataType` ↔ `data_type`                                             | camelCase / snake_case |

---

## 10. 后端最小解析示例

```python
# Python 示例
import json

with open("rule_chain.json") as f:
    doc = json.load(f)

# 仅解析语义部分
chain = {
    "id": doc["chainId"],
    "name": doc["chainName"],
    "enabled": doc["enabled"],
    "rules": []
}

# 节点直接使用
for node in doc["nodes"]:
    props = node["properties"]
    rule = {
        "id": props["ruleId"],
        "type": props["nodeType"],
        "summary": props["summary"],
        "enabled": props["enabled"],
    }
    chain["rules"].append(rule)

# 边直接使用
for edge in doc["edges"]:
    # 业务路由
    relation = edge["properties"]["relationType"]
    print(f"{edge['sourceNodeId']} --[{relation}]--> {edge['targetNodeId']}")
```

```go
// Go 示例
type SemanticDocument struct {
    Version         string          `json:"version"`
    ChainID         string          `json:"chainId"`
    ChainName       string          `json:"chainName"`
    Enabled         bool            `json:"enabled"`
    EvaluationMode  string          `json:"evaluationMode"`
    Nodes           []SemanticNode  `json:"nodes"`
    Edges           []SemanticEdge  `json:"edges"`
}

type SemanticNode struct {
    ID         string                 `json:"id"`
    Type       string                 `json:"type"`
    Text       string                 `json:"text"`
    Properties map[string]interface{} `json:"properties"`
}

type SemanticEdge struct {
    ID           string                 `json:"id"`
    Type         string                 `json:"type"`
    SourceNodeID string                 `json:"sourceNodeId"`
    TargetNodeID string                 `json:"targetNodeId"`
    Properties   map[string]interface{} `json:"properties"`
}
```

---

## 11. 一句话总结

- **SemanticDocument** = 元数据 + 节点业务属性 + 边业务关系（**后端**使用）
- **ViewDocument** = 画布坐标 + 边几何 + UI 状态（**前端**使用，可存 localStorage）
- **ruleId** 必须带类型前缀（`cond:001` / `act:001` / `port:m1_ua` 等）
- **禁止混入**：x/y/width/height/icon/pointsList 等视图字段不得出现在 SemanticDocument
