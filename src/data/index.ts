/**
 * Data layer barrel export.
 * Re-exports all data registries from a single entry point.
 *
 * @module data
 */

export {
  NODE_CATEGORIES,
  PORT_NODES,
  NOTE_NODE,
  NODE_TYPE_MAP,
  NODE_VISUAL_MAP,
  NODE_STYLE_MAP,
  RELATION_TYPES,
  CATEGORY_TO_LF_TYPE,
  TYPE_ORDER,
  getNodeStyle,
} from './nodeRegistry'

export { ICON_MAP } from './iconRegistry'

export { DEMO_DATA } from './demoData'
