/**
 * Base node model and view for RuleFlow custom LogicFlow nodes.
 * LogicFlow uses class-based extension for custom nodes.
 * We define a common base that all 7 node types extend.
 * v2.0: Emoji replaced with Lucide icon names per VPPTU design spec
 */
import { RectNode, RectNodeModel, h } from '@logicflow/core'
import { getNodeStyle } from '../../data'
import { LogicGateModel, LogicGateView, LOGIC_GATE_NODE_TYPE } from './LogicGateNode'

// v2.0: Lucide icon names replacing Emoji — these are rendered as SVG text symbols
// For LogicFlow SVG rendering, we use simple Unicode symbols that approximate the icon
const NODE_ICONS: Record<string, string> = {
  input_port: '\u2192', // → arrow right
  output_port: '\u2190', // ← arrow left
  rule: '\u2630', // ☰ trigram for heaven
  condition: '\u25C7', // ◇ diamond
  action: '\u25B6', // ▶ play
  ext: '\u25B7', // ▷ white right-pointing triangle
  flow: '\u21C4', // ⇄ right arrow over left arrow
  note: '\u2756', // ❖ four pointed star
}

/** Base node model with shared configuration for all RuleFlow custom nodes */
export class RuleFlowBaseModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    const nodeType = data.properties?.nodeType || 'rule'
    this.width = data.properties?.width || 200
    this.height = data.properties?.height || 80
    this.radius = 8
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    const nodeType = this.properties?.nodeType || 'rule'
    const styleInfo = getNodeStyle(nodeType as string)
    style.stroke = styleInfo.hexColor
    style.strokeWidth = 1
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

// Base node view with custom HTML rendering
export class RuleFlowBaseView extends RectNode {
  getShape() {
    const { model } = this.props as any
    const { x, y, width, height } = model
    const nodeType = model.properties?.nodeType || 'rule'
    const styleInfo = getNodeStyle(nodeType as string)
    const color = styleInfo.hexColor
    const icon = NODE_ICONS[nodeType as string] || NODE_ICONS.rule
    const label = model.text?.value || nodeType
    const priority = model.properties?.priority || 1
    const enabled = model.properties?.enabled !== false
    const debugState = model.properties?.debugState as string | undefined

    // Debug state visual overrides
    const debugStroke =
      debugState === 'processing'
        ? 'var(--rf-status-processing, #7c3aed)'
        : debugState === 'success'
          ? 'var(--rf-status-success, #16a34a)'
          : debugState === 'failure'
            ? 'var(--rf-status-danger, #dc2626)'
            : color

    const debugStrokeWidth = debugState ? 2.5 : 1

    // Debug state glow filter
    const debugFilter =
      debugState === 'processing'
        ? 'url(#rf-debug-pulse)'
        : debugState === 'success'
          ? 'url(#rf-debug-success-glow)'
          : debugState === 'failure'
            ? 'url(#rf-debug-failure-glow)'
            : 'url(#rf-shadow-sm)'

    // Breakpoint marker
    const hasBreakpoint = model.properties?.breakpoint === true

    const children: any[] = [
      // Card shadow / debug glow
      h('rect', {
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
        rx: 8,
        ry: 8,
        fill: 'var(--rf-bg-primary, #ffffff)',
        stroke: debugStroke,
        strokeWidth: debugStrokeWidth,
        filter: debugFilter,
      }),
      // Color bar at top (4px)
      h('rect', {
        x: x - width / 2,
        y: y - height / 2,
        width,
        height: 4,
        rx: 8,
        ry: 8,
        fill: debugState ? debugStroke : color,
        clipPath: `url(#rf-topbar-${model.id})`,
      }),
      // Clip path for top bar
      h('clipPath', { id: `rf-topbar-${model.id}` }, [
        h('rect', {
          x: x - width / 2,
          y: y - height / 2,
          width,
          height: 4,
        }),
      ]),
      // Node icon
      h(
        'text',
        {
          x: x - width / 2 + 14,
          y: y - height / 2 + 24,
          fontSize: 14,
          fill: debugState ? debugStroke : color,
          fontFamily: 'var(--rf-font-sans, sans-serif)',
          textAnchor: 'middle',
        },
        icon,
      ),
      // Node label
      h(
        'text',
        {
          x: x - width / 2 + 28,
          y: y - height / 2 + 24,
          fontSize: 12,
          fill: 'var(--rf-text-primary, #111827)',
          fontFamily: 'var(--rf-font-sans, sans-serif)',
          fontWeight: 500,
        },
        label,
      ),
      // Priority badge
      h('rect', {
        x: x + width / 2 - 36,
        y: y - height / 2 + 9,
        width: 28,
        height: 16,
        rx: 4,
        fill: 'var(--rf-brand-primary-light, #eff6ff)',
      }),
      h(
        'text',
        {
          x: x + width / 2 - 22,
          y: y - height / 2 + 21,
          fontSize: 9,
          fill: 'var(--rf-brand-primary, #2563eb)',
          fontWeight: 600,
          fontFamily: 'var(--rf-font-data, var(--rf-font-sans, sans-serif))',
          textAnchor: 'middle',
        },
        `P:${priority}`,
      ),
      // Summary line
      h(
        'text',
        {
          x: x - width / 2 + 14,
          y: y - height / 2 + 42,
          fontSize: 10,
          fill: 'var(--rf-text-secondary, #6b7280)',
          fontFamily: 'var(--rf-font-sans, sans-serif)',
        },
        model.properties?.summary || '',
      ),
      // Enabled indicator
      h('circle', {
        cx: x + width / 2 - 12,
        cy: y - height / 2 + 24,
        r: 4,
        fill: enabled ? 'var(--rf-status-success, #16a34a)' : 'var(--rf-text-tertiary, #78716c)',
        stroke: enabled ? 'var(--rf-status-success, #16a34a)' : 'var(--rf-text-tertiary, #78716c)',
        strokeWidth: 0,
      }),
      // Dual encoding — checkmark/x inside circle
      enabled
        ? h(
            'text',
            {
              x: x + width / 2 - 12,
              y: y - height / 2 + 27,
              fontSize: 7,
              fill: '#ffffff',
              textAnchor: 'middle',
              fontFamily: 'var(--rf-font-sans, sans-serif)',
            },
            '\u2713',
          )
        : h(
            'text',
            {
              x: x + width / 2 - 12,
              y: y - height / 2 + 27,
              fontSize: 7,
              fill: '#ffffff',
              textAnchor: 'middle',
              fontFamily: 'var(--rf-font-sans, sans-serif)',
            },
            '\u2717',
          ),
    ]

    // Breakpoint marker (red circle at top-left corner)
    if (hasBreakpoint) {
      children.push(
        h('circle', {
          cx: x - width / 2 + 8,
          cy: y - height / 2 + 8,
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
        debugState === 'processing'
          ? '\u23F3' // ⏳
          : debugState === 'success'
            ? '\u2713' // ✓
            : '\u2717' // ✗

      children.push(
        h('circle', {
          cx: x + width / 2 - 8,
          cy: y + height / 2 - 8,
          r: 7,
          fill: debugStroke,
          stroke: 'var(--rf-bg-primary, #ffffff)',
          strokeWidth: 1.5,
        }),
        h(
          'text',
          {
            x: x + width / 2 - 8,
            y: y + height / 2 - 5,
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

/** Node type registrations for LogicFlow custom node rendering */
export const CUSTOM_NODE_TYPES: Record<
  string,
  { model: typeof RuleFlowBaseModel; view: typeof RuleFlowBaseView }
> = {
  'rf-input-port': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  'rf-output-port': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  'rf-rule': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  'rf-condition': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  'rf-action': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  'rf-ext-action': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  'rf-sub-chain': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  'rf-note': { model: RuleFlowBaseModel, view: RuleFlowBaseView },
  [LOGIC_GATE_NODE_TYPE]: { model: LogicGateModel, view: LogicGateView },
}

export { NODE_ICONS }
