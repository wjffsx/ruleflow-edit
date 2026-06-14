/**
 * Logic gate node model and view for AND/OR/NOT condition group visualization.
 * These nodes represent condition tree nesting in the rule flow graph.
 *
 * Visual design:
 * - Hexagonal shape to differentiate from regular rectangular nodes
 * - Operator label (AND/OR/NOT) prominently displayed
 * - Collapsed state: dashed border, smaller size
 * - Expanded state: solid border, contains child condition nodes
 * - Color: purple/violet accent matching condition category
 */
import { RectNode, RectNodeModel, h } from '@logicflow/core'

/** Logic gate operator types */
export type LogicGateOp = 'AND' | 'OR' | 'NOT'

/** Operator display config */
const OP_CONFIG: Record<LogicGateOp, { symbol: string; color: string; bgColor: string }> = {
  AND: {
    symbol: '∧',
    color: 'var(--rf-status-processing, #7c3aed)',
    bgColor: 'var(--rf-brand-primary-light, #eff6ff)',
  },
  OR: {
    symbol: '∨',
    color: 'var(--rf-brand-primary, #2563eb)',
    bgColor: 'var(--rf-brand-primary-light, #eff6ff)',
  },
  NOT: {
    symbol: '¬',
    color: 'var(--rf-status-danger, #dc2626)',
    bgColor: 'var(--rf-brand-primary-light, #eff6ff)',
  },
}

/** Logic gate node properties */
interface LogicGateProperties {
  collapsed?: boolean
  conditionOp?: LogicGateOp
  childCount?: number
  debugState?: string
  breakpoint?: boolean
  summary?: string
  [key: string]: unknown
}

/** Node data interface for initNodeData */
interface LogicGateInitData {
  properties?: LogicGateProperties
  [key: string]: unknown
}

/** Model props interface - used for type documentation */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _LogicGateModelProps {
  model: {
    id: string
    x: number
    y: number
    width: number
    height: number
    text?: { value: string } | string
    properties?: LogicGateProperties
  }
}

/** Logic gate node model */
export class LogicGateModel extends RectNodeModel {
  initNodeData(data: LogicGateInitData) {
    super.initNodeData(data)
    this.width = data.properties?.collapsed ? 140 : 180
    this.height = data.properties?.collapsed ? 56 : 80
    this.radius = 8
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    const collapsed = this.properties?.collapsed
    style.stroke = 'var(--rf-status-processing, #7c3aed)'
    style.strokeWidth = collapsed ? 1.5 : 2
    style.strokeDasharray = collapsed ? '6 3' : ''
    style.fill = 'var(--rf-bg-primary, #ffffff)'
    style.radius = 8
    return style
  }

  getOutlineStyle() {
    const style = super.getOutlineStyle()
    style.stroke = 'var(--rf-brand-primary, #2563eb)'
    style.strokeDasharray = '3 3'
    return style
  }
}

/** Logic gate node view with hexagonal-style rendering */
export class LogicGateView extends RectNode {
  getShape() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { model } = this.props as any as LogicGateModelProps
    const { x, y, width, height, id } = model
    const op = (model.properties?.conditionOp || 'AND') as LogicGateOp
    const config = OP_CONFIG[op] || OP_CONFIG.AND
    const collapsed = model.properties?.collapsed === true
    const textValue = typeof model.text === 'object' && model.text?.value ? model.text.value : (typeof model.text === 'string' ? model.text : op)
    const childCount = model.properties?.childCount || 0
    const debugState = model.properties?.debugState
    const hasBreakpoint = model.properties?.breakpoint === true

    // Debug state visual overrides
    const debugStroke =
      debugState === 'processing'
        ? 'var(--rf-status-processing, #7c3aed)'
        : debugState === 'success'
          ? 'var(--rf-status-success, #16a34a)'
          : debugState === 'failure'
            ? 'var(--rf-status-danger, #dc2626)'
            : config.color

    const debugStrokeWidth = debugState ? 2.5 : collapsed ? 1.5 : 2

    // Hexagonal clip path — create a hex-like shape
    const hw = width / 2
    const hh = height / 2
    const indent = 16 // horizontal indent for hex shape
    const hexPoints = [
      `${x - hw + indent},${y - hh}`, // top-left
      `${x + hw - indent},${y - hh}`, // top-right
      `${x + hw},${y}`, // right
      `${x + hw - indent},${y + hh}`, // bottom-right
      `${x - hw + indent},${y + hh}`, // bottom-left
      `${x - hw},${y}`, // left
    ].join(' ')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [
      // Hexagonal background shape
      h('polygon', {
        points: hexPoints,
        fill: 'var(--rf-bg-primary, #ffffff)',
        stroke: debugState ? debugStroke : config.color,
        strokeWidth: debugStrokeWidth,
        strokeDasharray: collapsed ? '6 3' : '',
        filter: debugState
          ? debugState === 'processing'
            ? 'url(#rf-debug-pulse)'
            : debugState === 'success'
              ? 'url(#rf-debug-success-glow)'
              : 'url(#rf-debug-failure-glow)'
          : 'url(#rf-shadow-sm)',
      }),
      // Operator badge (circle with symbol)
      h('circle', {
        cx: x - hw + 24,
        cy: y - hh + 20,
        r: 12,
        fill: debugState ? debugStroke : config.color,
        stroke: 'var(--rf-bg-primary, #ffffff)',
        strokeWidth: 2,
      }),
      h(
        'text',
        {
          x: x - hw + 24,
          y: y - hh + 24,
          fontSize: 14,
          fill: '#ffffff',
          textAnchor: 'middle',
          fontFamily: 'var(--rf-font-sans, sans-serif)',
          fontWeight: 700,
        },
        config.symbol,
      ),
      // Operator label
      h(
        'text',
        {
          x: x - hw + 44,
          y: y - hh + 24,
          fontSize: 13,
          fill: 'var(--rf-text-primary, #111827)',
          fontFamily: 'var(--rf-font-sans, sans-serif)',
          fontWeight: 600,
        },
        textValue,
      ),
      // Collapse/expand indicator
      h(
        'text',
        {
          x: x + hw - 16,
          y: y - hh + 22,
          fontSize: 12,
          fill: 'var(--rf-text-secondary, #6b7280)',
          textAnchor: 'middle',
          fontFamily: 'var(--rf-font-sans, sans-serif)',
          cursor: 'pointer',
        },
        collapsed ? '▸' : '▾',
      ),
    ]

    // Child count badge (when collapsed)
    if (collapsed && childCount > 0) {
      children.push(
        h('rect', {
          x: x + hw - 36,
          y: y + hh - 24,
          width: 28,
          height: 16,
          rx: 4,
          fill: config.bgColor,
        }),
        h(
          'text',
          {
            x: x + hw - 22,
            y: y + hh - 12,
            fontSize: 9,
            fill: debugState ? debugStroke : config.color,
            fontWeight: 600,
            fontFamily: 'var(--rf-font-data, var(--rf-font-sans, sans-serif))',
            textAnchor: 'middle',
          },
          `${childCount}`,
        ),
      )
    }

    // Summary line (when expanded)
    if (!collapsed) {
      const summary = model.properties?.summary || `${childCount} 个子条件`
      children.push(
        h(
          'text',
          {
            x: x - hw + 24,
            y: y + hh - 16,
            fontSize: 10,
            fill: 'var(--rf-text-secondary, #6b7280)',
            fontFamily: 'var(--rf-font-sans, sans-serif)',
          },
          summary,
        ),
      )
    }

    // Breakpoint marker (red circle at top-left corner)
    if (hasBreakpoint) {
      children.push(
        h('circle', {
          cx: x - hw + 8,
          cy: y - hh + 8,
          r: 5,
          fill: 'var(--rf-status-danger, #dc2626)',
          stroke: '#ffffff',
          strokeWidth: 1.5,
        }),
      )
    }

    // Debug state overlay indicator (bottom-right)
    if (debugState && debugState !== 'idle') {
      const stateIcon =
        debugState === 'processing' ? '\u23F3' : debugState === 'success' ? '\u2713' : '\u2717'

      children.push(
        h('circle', {
          cx: x + hw - 8,
          cy: y + hh - 8,
          r: 7,
          fill: debugStroke,
          stroke: 'var(--rf-bg-primary, #ffffff)',
          strokeWidth: 1.5,
        }),
        h(
          'text',
          {
            x: x + hw - 8,
            y: y + hh - 5,
            fontSize: 9,
            fill: '#ffffff',
            textAnchor: 'middle',
            fontFamily: 'var(--rf-font-sans, sans-serif)',
            fontWeight: 700,
          },
          stateIcon,
        ),
      )
    }

    return h('g', {}, children)
  }
}

/** Logic gate node type registration */
export const LOGIC_GATE_NODE_TYPE = 'rf-logic-gate'
