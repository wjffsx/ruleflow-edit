// Node type mappings and visual style logic
// Derived from nodeData constants

import type { NodeTypeMeta, VisualCategory } from '../types/editor'

import { NODE_CATEGORIES, PORT_NODES, NOTE_NODE } from './nodeData'

// Map node type key → LogicFlow custom type + visual category
// Each node maps to one of the visual node types rendered on canvas
export const NODE_TYPE_MAP: Record<string, NodeTypeMeta> = {
  // Ports (UI concept)
  input_port: {
    label: '输入端口',
    icon: 'LogIn',
    colorVar: '--rf-node-input',
    width: 160,
    height: 56,
    lfType: 'rf-input-port',
    category: 'port',
  },
  output_port: {
    label: '输出端口',
    icon: 'LogOut',
    colorVar: '--rf-node-output',
    width: 160,
    height: 56,
    lfType: 'rf-output-port',
    category: 'port',
  },
  // Condition nodes
  condition: {
    label: '条件节点',
    icon: 'GitBranch',
    colorVar: '--rf-node-condition',
    width: 200,
    height: 72,
    lfType: 'rf-condition',
    category: 'condition',
  },
  // Action nodes
  action: {
    label: '动作节点',
    icon: 'Play',
    colorVar: '--rf-node-action',
    width: 180,
    height: 64,
    lfType: 'rf-action',
    category: 'action',
  },
  // Ext nodes (use action visual style with different accent)
  ext_action: {
    label: '扩展动作',
    icon: 'Puzzle',
    colorVar: '--rf-node-ext',
    width: 180,
    height: 64,
    lfType: 'rf-ext-action',
    category: 'ext',
  },
  // Flow nodes
  sub_chain: {
    label: '子规则链',
    icon: 'GitMerge',
    colorVar: '--rf-node-subchain',
    width: 180,
    height: 64,
    lfType: 'rf-sub-chain',
    category: 'flow',
  },
  // Note
  note: {
    label: '注释',
    icon: 'MessageSquare',
    colorVar: '--rf-node-note',
    width: 160,
    height: 40,
    lfType: 'rf-note',
    category: 'note',
  },
}

// Category ID → visual category mapping
const CATEGORY_TO_VISUAL: Record<string, string> = {
  'builtin-condition': 'condition',
  'builtin-action': 'action',
  'ext-nodes': 'ext',
  'vpp-nodes': 'action',
  'flow-nodes': 'flow',
}

/** Auto-generated mapping from node type to visual category */
export const NODE_VISUAL_MAP: Record<string, string> = {}
NODE_CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    NODE_VISUAL_MAP[item.type] = CATEGORY_TO_VISUAL[cat.id] || 'action'
  })
})
PORT_NODES.forEach((item) => {
  NODE_VISUAL_MAP[item.type] = 'port'
})
NODE_VISUAL_MAP[NOTE_NODE.type] = 'note'

// Unified node style lookup — single source of truth for node colors and icons
export const NODE_STYLE_MAP: Record<string, VisualCategory> = {
  input_port: { colorVar: '--rf-node-input', icon: 'LogIn', hexColor: '#f97316' },
  output_port: { colorVar: '--rf-node-output', icon: 'LogOut', hexColor: '#dc2626' },
  condition: { colorVar: '--rf-node-condition', icon: 'GitBranch', hexColor: '#8b5cf6' },
  action: { colorVar: '--rf-node-action', icon: 'Play', hexColor: '#16a34a' },
  ext: { colorVar: '--rf-node-ext', icon: 'Puzzle', hexColor: '#0891b2' },
  flow: { colorVar: '--rf-node-subchain', icon: 'Link', hexColor: '#7c3aed' },
  note: { colorVar: '--rf-node-note', icon: 'MessageSquare', hexColor: '#9ca3af' },
  rule: { colorVar: '--rf-node-condition', icon: 'GitBranch', hexColor: '#2563eb' },
}

/**
 * Get node style info by visual category
 */
export function getNodeStyle(category: string | undefined): VisualCategory {
  return NODE_STYLE_MAP[category || ''] || NODE_STYLE_MAP.rule
}

// Category → LogicFlow custom type mapping
export const CATEGORY_TO_LF_TYPE: Record<string, string> = {
  condition: 'rf-condition',
  action: 'rf-action',
  ext: 'rf-ext-action',
  flow: 'rf-sub-chain',
  port: 'rf-input-port',
  note: 'rf-note',
}

/** Canonical order for node type categories */
export const TYPE_ORDER: string[] = ['port', 'condition', 'action', 'ext', 'flow', 'note']
