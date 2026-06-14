// Node type categories and items for the sidebar
// v3.0: Aligned with ruleflow backend (builtin/ext/extensions)
// Categories map to backend architecture:
//   - builtin-condition → pkg/ruleflow/builtin/condition
//   - builtin-action    → pkg/ruleflow/builtin/action
//   - ext-nodes         → pkg/ruleflow/ext (conditions + actions)
//   - vpp-nodes         → pkg/ruleflow/extensions (conditions + actions + flow)
//   - flow-nodes        → pkg/ruleflow/extensions/flow

import type { NodeCategory, PortNode, NoteNode, RelationType } from '../types/editor'

/** Node type categories for the sidebar, aligned with ruleflow backend architecture */
export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'builtin-condition',
    name: '内置条件',
    icon: 'GitBranch',
    color: 'var(--rf-node-condition)',
    items: [
      // 无状态条件
      { type: 'device_type', name: '设备类型', icon: 'Cpu' },
      { type: 'device_id', name: '设备ID', icon: 'Hash' },
      { type: 'point_name', name: '测点名称', icon: 'MapPin' },
      { type: 'point_name_pattern', name: '测点名模式', icon: 'Regex' },
      { type: 'fqn_prefix', name: 'FQN前缀', icon: 'FolderTree' },
      { type: 'value_range', name: '值范围', icon: 'Ruler' },
      { type: 'value_in', name: '离散值匹配', icon: 'ListChecks' },
      { type: 'quality', name: '质量码', icon: 'CheckCircle' },
      { type: 'limit_exceeded', name: '越限', icon: 'AlertTriangle' },
      { type: 'time_window', name: '时间窗口', icon: 'Timer' },
      { type: 'bit_mask', name: '位掩码', icon: 'Binary' },
      { type: 'delta_threshold', name: '变化量阈值', icon: 'ArrowUpDown' },
      { type: 'rate_limit', name: '变化速率', icon: 'Gauge' },
      // 有状态条件
      { type: 'state_change', name: '状态变化', icon: 'RefreshCw' },
      { type: 'duration', name: '持续时间', icon: 'Hourglass' },
      { type: 'trend', name: '趋势判断', icon: 'TrendingUp' },
      { type: 'periodic', name: '周期判断', icon: 'Repeat' },
      { type: 'dynamic_threshold', name: '动态阈值', icon: 'SlidersHorizontal' },
      { type: 'rate_limit_window', name: '窗口速率', icon: 'Gauge' },
      { type: 'limit_recovery', name: '越限恢复', icon: 'Undo2' },
    ],
  },
  {
    id: 'builtin-action',
    name: '内置动作',
    icon: 'Play',
    color: 'var(--rf-node-action)',
    items: [
      { type: 'transform', name: '值变换', icon: 'ArrowLeftRight' },
      { type: 'rename', name: '重命名', icon: 'Pencil' },
      { type: 'tag', name: '标签', icon: 'Tag' },
      { type: 'drop', name: '丢弃', icon: 'Trash2' },
      { type: 'route', name: '路由', icon: 'TrafficCone' },
      { type: 'limit_check', name: '越限检测', icon: 'AlertTriangle' },
      { type: 'quality_mark', name: '质量标记', icon: 'BadgeCheck' },
      { type: 'alarm_notify', name: '告警通知', icon: 'Bell' },
      { type: 'delay', name: '延时执行', icon: 'Clock' },
      { type: 'bit_unpack', name: '位解包', icon: 'Box' },
      { type: 'bit_pack', name: '位打包', icon: 'Package' },
    ],
  },
  {
    id: 'ext-nodes',
    name: '扩展节点',
    icon: 'Puzzle',
    color: 'var(--rf-node-ext)',
    items: [
      // 扩展条件
      { type: 'expr_filter', name: '表达式过滤', icon: 'FileCode' },
      { type: 'historical_compare', name: '历史比较', icon: 'History' },
      // 扩展动作 — route_check 类
      { type: 'alarm_notify_ext', name: '扩展告警通知', icon: 'BellRing' },
      { type: 'quality_mark_ext', name: '扩展质量标记', icon: 'BadgeCheck' },
      { type: 'status_change_log', name: '状态变更日志', icon: 'FileText' },
      { type: 'expr_switch', name: '表达式分支', icon: 'GitBranch' },
      { type: 'multi_device_control', name: '多设备联动', icon: 'Network' },
      { type: 'strategy_execute', name: '策略执行', icon: 'Target' },
      // 扩展动作 — data_process 类
      { type: 'calc_node', name: '计算节点', icon: 'Calculator' },
      { type: 'storage_write', name: '存储写入', icon: 'Database' },
      { type: 'aggregation_write', name: '聚合写入', icon: 'BarChart3' },
      { type: 'device_aggregator', name: '设备聚合', icon: 'Layers' },
      // 扩展动作 — 待补充元数据
      { type: 'emit_soe', name: 'SOE事件', icon: 'Zap' },
      { type: 'limit_tracker', name: '越限追踪', icon: 'Activity' },
      { type: 'meter_freeze', name: '电表冻结', icon: 'Snowflake' },
      { type: 'demand_calc', name: '需量计算', icon: 'Sigma' },
    ],
  },
  {
    id: 'vpp-nodes',
    name: 'VPP 专用',
    icon: 'Factory',
    color: 'var(--rf-brand-accent)',
    items: [
      // VPP 条件
      { type: 'soc_monitor', name: 'SOC监控', icon: 'BatteryMedium' },
      { type: 'power_factor_check', name: '功率因数检查', icon: 'Zap' },
      { type: 'frequency_wobble', name: '频率波动', icon: 'Activity' },
      { type: 'ramp_rate_limit', name: '爬坡速率', icon: 'Gauge' },
      { type: 'reverse_power', name: '反向功率', icon: 'ArrowDown' },
      { type: 'time_of_use_price', name: '分时电价', icon: 'Coins' },
      { type: 'demand_response_check', name: '需求响应检查', icon: 'PlugZap' },
      { type: 'soh_estimator', name: 'SOH估算', icon: 'HeartPulse' },
      // VPP 动作
      { type: 'aggregator', name: '聚合器', icon: 'BarChart3' },
      { type: 'dispatch_control', name: '调度控制', icon: 'Radio' },
      { type: 'market_price_query', name: '市场电价查询', icon: 'LineChart' },
      { type: 'carbon_calc', name: '碳排放计算', icon: 'Leaf' },
      { type: 'weather_query', name: '天气查询', icon: 'CloudSun' },
      { type: 'delta_accumulator', name: '差值累加器', icon: 'TrendingUp' },
      { type: 'efficiency_calc', name: '效率计算', icon: 'Percent' },
      { type: 'plant_split', name: '电厂分流', icon: 'Split' },
    ],
  },
  {
    id: 'flow-nodes',
    name: '流程控制',
    icon: 'GitMerge',
    color: 'var(--rf-node-subchain)',
    items: [
      { type: 'sub_chain', name: '子规则链', icon: 'Link' },
      { type: 'msg_generator', name: '消息生成器', icon: 'AlarmClock' },
    ],
  },
  {
    id: 'logic-gates',
    name: '逻辑门',
    icon: 'GitBranch',
    color: 'var(--rf-node-logic-gate)',
    items: [
      { type: 'logic_gate_and', name: 'AND 条件组', icon: 'GitMerge' },
      { type: 'logic_gate_or', name: 'OR 条件组', icon: 'GitMerge' },
      { type: 'logic_gate_not', name: 'NOT 条件组', icon: 'GitMerge' },
    ],
  },
]

/** Built-in port nodes (always available, not from backend) */
export const PORT_NODES: PortNode[] = [
  { type: 'input_port', name: '输入端口', icon: 'LogIn', color: 'var(--rf-node-input)' },
  { type: 'output_port', name: '输出端口', icon: 'LogOut', color: 'var(--rf-node-output)' },
]

/** Note/annotation node definition (always available) */
export const NOTE_NODE: NoteNode = {
  type: 'note',
  name: '注释',
  icon: 'MessageSquare',
  color: 'var(--rf-node-note)',
}

// Relation type definitions
export const RELATION_TYPES: RelationType[] = [
  {
    key: 'True',
    label: 'True',
    colorVar: '--rf-relation-true',
    lightColorVar: '--rf-relation-true-light',
  },
  {
    key: 'False',
    label: 'False',
    colorVar: '--rf-relation-false',
    lightColorVar: '--rf-relation-false-light',
  },
  {
    key: 'Success',
    label: 'Success',
    colorVar: '--rf-relation-success',
    lightColorVar: '--rf-relation-success-light',
  },
  {
    key: 'Failure',
    label: 'Failure',
    colorVar: '--rf-relation-failure',
    lightColorVar: '--rf-relation-failure-light',
  },
  {
    key: 'Custom',
    label: '自定义',
    colorVar: '--rf-relation-custom',
    lightColorVar: '--rf-relation-custom-light',
  },
]
