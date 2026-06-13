/**
 * Custom LogicFlow edge models with relation-type color coding.
 * True=Green, False=Red, Success=Blue, Failure=Amber, Custom=Violet
 */
import { PolylineEdge, PolylineEdgeModel, h } from '@logicflow/core'

// Relation type to color mapping
const RELATION_COLORS = {
  True:    '#16a34a',
  False:   '#dc2626',
  Success: '#2563eb',
  Failure: '#d97706',
  Custom:  '#7c3aed',
  default: '#9ca3af',
}

const RELATION_LABELS = {
  True:    'True',
  False:   'False',
  Success: 'Success',
  Failure: 'Failure',
  Custom:  '自定义',
}

// Custom polyline edge model with relation-type awareness
export class RelationEdgeModel extends PolylineEdgeModel {
  getEdgeStyle() {
    const style = super.getEdgeStyle()
    const relation = this.properties?.relationType || 'default'
    const color = RELATION_COLORS[relation] || RELATION_COLORS.default
    style.stroke = color
    style.strokeWidth = 2
    style.strokeDasharray = relation === 'TargetRoute' ? '8 4' : ''
    return style
  }

  getTextStyle() {
    const style = super.getTextStyle()
    const relation = this.properties?.relationType || 'default'
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

// Custom edge view with label
export class RelationEdgeView extends PolylineEdge {
  getEdge() {
    const { model } = this.props
    const { points, properties } = model
    const relation = properties?.relationType || 'default'
    const color = RELATION_COLORS[relation] || RELATION_COLORS.default
    const label = RELATION_LABELS[relation] || ''

    const attrs = {
      points,
      stroke: color,
      strokeWidth: 2,
      fill: 'none',
      strokeDasharray: relation === 'TargetRoute' ? '8 4' : '',
    }

    return h('g', {}, [
      h('polyline', attrs),
    ])
  }

  getAppendWidth() {
    return h('g', {}, [])
  }
}

// Edge registration config
export const RELATION_EDGE_TYPE = 'relation-edge'

// Color getter for external use
export function getRelationColor(relationType) {
  return RELATION_COLORS[relationType] || RELATION_COLORS.default
}

export { RELATION_COLORS, RELATION_LABELS }
