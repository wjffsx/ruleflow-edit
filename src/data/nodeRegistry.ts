// Barrel re-export for node data and mappings
// Split from original nodeRegistry.ts into nodeData.ts (data) and nodeMappings.ts (logic)

export { NODE_CATEGORIES, PORT_NODES, NOTE_NODE, RELATION_TYPES } from './nodeData'

export {
  NODE_TYPE_MAP,
  NODE_VISUAL_MAP,
  NODE_STYLE_MAP,
  CATEGORY_TO_LF_TYPE,
  TYPE_ORDER,
  getNodeStyle,
} from './nodeMappings'
