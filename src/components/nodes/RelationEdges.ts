/**
 * Custom LogicFlow edge models with relation-type color coding.
 * True=Green, False=Red, Success=Blue, Failure=Amber, Custom=Violet
 */
import { PolylineEdge, PolylineEdgeModel, h } from '@logicflow/core'

// Relation type to color mapping
const RELATION_COLORS: Record<string, string> = {
  True: '#16a34a',
  False: '#dc2626',
  Success: '#2563eb',
  Failure: '#d97706',
  Custom: '#7c3aed',
  default: '#9ca3af',
}

const RELATION_LABELS: Record<string, string> = {
  True: 'True',
  False: 'False',
  Success: 'Success',
  Failure: 'Failure',
  Custom: '自定义',
}

/** Custom polyline edge model with relation-type color coding */
export class RelationEdgeModel extends PolylineEdgeModel {
  getEdgeStyle() {
    const style = super.getEdgeStyle()
    const relation = (this.properties?.relationType as string) || 'default'
    const color = RELATION_COLORS[relation] || RELATION_COLORS.default
    style.stroke = color
    style.strokeWidth = this.properties?.debugExecuted ? 3.5 : 2
    style.strokeDasharray = relation === 'TargetRoute' ? '8 4' : ''
    return style
  }

  getTextStyle() {
    const style = super.getTextStyle()
    const relation = (this.properties?.relationType as string) || 'default'
    const color = RELATION_COLORS[relation] || RELATION_COLORS.default
    style.color = color
    style.fontSize = 11
    style.background = {
      fill: 'var(--rf-bg-primary, #ffffff)',
      stroke: color,
      strokeWidth: 1,
      radius: 4,
    }
    return style
  }
}

// Custom edge view with label and debug highlighting
export class RelationEdgeView extends PolylineEdge {
  getEdge() {
    const { model } = this.props as any
    const { points, properties } = model
    const relation = properties?.relationType || 'default'
    const color = RELATION_COLORS[relation as string] || RELATION_COLORS.default
    const label = RELATION_LABELS[relation as string] || ''
    const isDebugExecuted = properties?.debugExecuted === true

    const attrs: Record<string, any> = {
      points,
      stroke: color,
      strokeWidth: isDebugExecuted ? 3.5 : 2,
      fill: 'none',
      strokeDasharray: relation === 'TargetRoute' ? '8 4' : '',
    }

    // P1-3: Debug glow filter for executed edges
    if (isDebugExecuted) {
      attrs.filter = 'url(#rf-debug-pulse)'
      attrs.strokeOpacity = 0.9
    }

    return h('g', {}, [h('polyline', attrs)])
  }

  getAppendWidth() {
    return h('g', {}, [])
  }
}

// Edge registration config
export const RELATION_EDGE_TYPE = 'relation-edge'

// ── Condition tree edge type ──────────────────────────────────────
// Dashed lines with distinct color for condition tree connections
// (AND/OR/NOT gate → child condition nodes)

/** Custom polyline edge model for condition tree connections */
export class ConditionTreeEdgeModel extends PolylineEdgeModel {
  getEdgeStyle() {
    const style = super.getEdgeStyle()
    style.stroke = 'var(--rf-status-processing, #7c3aed)'
    style.strokeWidth = 1.5
    style.strokeDasharray = '5 3'
    return style
  }

  getTextStyle() {
    const style = super.getTextStyle()
    style.color = 'var(--rf-status-processing, #7c3aed)'
    style.fontSize = 10
    style.background = {
      fill: 'var(--rf-bg-primary, #ffffff)',
      stroke: 'var(--rf-status-processing, #7c3aed)',
      strokeWidth: 1,
      radius: 4,
    }
    return style
  }
}

/** Custom edge view for condition tree connections */
export class ConditionTreeEdgeView extends PolylineEdge {
  getEdge() {
    const { model } = this.props as any
    const { points } = model

    return h('g', {}, [
      h('polyline', {
        points,
        stroke: 'var(--rf-status-processing, #7c3aed)',
        strokeWidth: 1.5,
        fill: 'none',
        strokeDasharray: '5 3',
      }),
    ])
  }

  getAppendWidth() {
    return h('g', {}, [])
  }
}

/** Condition tree edge type identifier */
export const CONDITION_TREE_EDGE_TYPE = 'condition-tree-edge'

// Color getter for external use
/** 根据关系类型获取对应颜色 */
export function getRelationColor(relationType: string): string {
  return RELATION_COLORS[relationType] || RELATION_COLORS.default
}

export { RELATION_COLORS, RELATION_LABELS }
