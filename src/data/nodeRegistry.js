// Node type categories and items for the sidebar
// v2.0: Emoji replaced with Lucide icon names per VPPTU design spec
export const NODE_CATEGORIES = [
  {
    id: 'input-ports',
    name: '输入端口',
    icon: 'LogIn',
    color: 'var(--rf-node-input)',
    items: [
      { type: 'device_type', name: '设备类型', icon: 'Cpu' },
      { type: 'device_id', name: '设备ID', icon: 'Hash' },
      { type: 'point_name', name: '测点名称', icon: 'MapPin' },
      { type: 'value_range', name: '值范围', icon: 'Ruler' },
      { type: 'quality_code', name: '质量码', icon: 'CheckCircle' },
      { type: 'time_window', name: '时间窗口', icon: 'Timer' },
    ],
  },
  {
    id: 'condition-nodes',
    name: '条件节点',
    icon: 'GitBranch',
    color: 'var(--rf-node-condition)',
    items: [
      { type: 'js_filter', name: 'JS 过滤器', icon: 'FileCode' },
      { type: 'value_range_cond', name: '值范围', icon: 'Ruler' },
      { type: 'state_change', name: '状态变化', icon: 'RefreshCw' },
      { type: 'duration_cond', name: '持续时间', icon: 'Hourglass' },
      { type: 'trend_cond', name: '趋势判断', icon: 'TrendingUp' },
      { type: 'soc_monitor', name: 'SOC 监控', icon: 'BatteryMedium' },
      { type: 'power_factor', name: '功率因数检查', icon: 'Zap' },
      { type: 'price_threshold', name: '分时电价', icon: 'Coins' },
    ],
  },
  {
    id: 'action-nodes',
    name: '动作节点',
    icon: 'Play',
    color: 'var(--rf-node-action)',
    items: [
      { type: 'transform', name: '值变换', icon: 'ArrowLeftRight' },
      { type: 'rename', name: '重命名', icon: 'Pencil' },
      { type: 'tag_action', name: '标签', icon: 'Tag' },
      { type: 'drop', name: '丢弃', icon: 'Trash2' },
      { type: 'route', name: '路由', icon: 'TrafficCone' },
      { type: 'alert', name: '告警通知', icon: 'Bell' },
      { type: 'rest_call', name: 'REST 调用', icon: 'Globe' },
      { type: 'dispatch_control', name: '调度下发', icon: 'Radio' },
      { type: 'aggregator', name: '聚合器', icon: 'BarChart3' },
    ],
  },
  {
    id: 'flow-nodes',
    name: '流程节点',
    icon: 'GitMerge',
    color: 'var(--rf-node-subchain)',
    items: [
      { type: 'sub_chain', name: '子规则链', icon: 'Link' },
      { type: 'msg_generator', name: '定时消息生成', icon: 'AlarmClock' },
    ],
  },
  {
    id: 'vpp-nodes',
    name: 'VPP 专用',
    icon: 'Factory',
    color: 'var(--rf-brand-accent)',
    items: [
      { type: 'vpp_soc_monitor', name: 'SOC 监控', icon: 'BatteryMedium' },
      { type: 'vpp_price', name: '分时电价', icon: 'Coins' },
      { type: 'vpp_dispatch', name: '调度指令下发', icon: 'Radio' },
      { type: 'vpp_aggregator', name: '负荷聚合', icon: 'BarChart3' },
      { type: 'vpp_battery', name: '储能控制', icon: 'BatteryCharging' },
      { type: 'vpp_grid', name: '电网交互', icon: 'Cable' },
    ],
  },
]

// Built-in port and note nodes (always available)
export const PORT_NODES = [
  { type: 'input_port', name: '输入端口', icon: 'LogIn', color: 'var(--rf-node-input)' },
  { type: 'output_port', name: '输出端口', icon: 'LogOut', color: 'var(--rf-node-output)' },
]

export const NOTE_NODE = { type: 'note', name: '注释', icon: 'MessageSquare', color: 'var(--rf-node-note)' }

// Map node type to visual properties
export const NODE_TYPE_MAP = {
  input_port:   { label: '输入端口', icon: 'LogIn',          colorVar: '--rf-node-input',    width: 160, height: 56 },
  output_port:  { label: '输出端口', icon: 'LogOut',         colorVar: '--rf-node-output',   width: 160, height: 56 },
  rule:         { label: '规则节点', icon: 'ClipboardList',  colorVar: '--rf-node-rule',      width: 200, height: 80 },
  condition:    { label: '条件节点', icon: 'GitBranch',      colorVar: '--rf-node-condition', width: 200, height: 72 },
  action:       { label: '动作节点', icon: 'Play',           colorVar: '--rf-node-action',    width: 180, height: 64 },
  sub_chain:    { label: '子规则链', icon: 'GitMerge',       colorVar: '--rf-node-subchain',  width: 180, height: 64 },
  note:         { label: '注释',     icon: 'MessageSquare',  colorVar: '--rf-node-note',      width: 160, height: 40 },
}

// Relation type definitions
export const RELATION_TYPES = [
  { key: 'True',    label: 'True',    colorVar: '--rf-relation-true',    lightColorVar: '--rf-relation-true-light' },
  { key: 'False',   label: 'False',   colorVar: '--rf-relation-false',   lightColorVar: '--rf-relation-false-light' },
  { key: 'Success', label: 'Success', colorVar: '--rf-relation-success', lightColorVar: '--rf-relation-success-light' },
  { key: 'Failure', label: 'Failure', colorVar: '--rf-relation-failure', lightColorVar: '--rf-relation-failure-light' },
  { key: 'Custom',  label: '自定义',   colorVar: '--rf-relation-custom',  lightColorVar: '--rf-relation-custom-light' },
]
