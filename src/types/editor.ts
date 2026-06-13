/** Node category in the sidebar */
export interface NodeCategory {
  id: string
  name: string
  icon: string
  color: string
  items: NodeItem[]
}

/** Individual node item within a category */
export interface NodeItem {
  type: string
  name: string
  icon: string
  color?: string
}

/** Visual style info for a node category */
export interface VisualCategory {
  colorVar: string
  icon: string
  hexColor: string
}

/** Port node definition */
export interface PortNode extends NodeItem {
  color: string
}

/** Note node definition */
export interface NoteNode extends NodeItem {
  color: string
}

/** Relation type definition */
export interface RelationType {
  key: string
  label: string
  colorVar: string
  lightColorVar: string
}

/** Node type metadata for LogicFlow rendering */
export interface NodeTypeMeta {
  label: string
  icon: string
  colorVar: string
  width: number
  height: number
  lfType: string
  category: string
}

/** Theme mode */
export type ThemeMode = 'light' | 'dark' | 'system'

/** Density mode */
export type DensityMode = 'comfortable' | 'compact' | 'ultra-compact'

/** Canvas status */
export type CanvasStatus = 'editing' | 'running' | 'deployed' | 'disabled'

/** Panel tab */
export type PanelTab = 'properties' | 'debug' | 'outline'

/** Panel display mode */
export type PanelMode = 'fixed' | 'floating' | 'inline'

/** Debug node state */
export type DebugNodeState = 'success' | 'failure' | 'processing' | 'idle'

/** Debug message */
export interface DebugMessage {
  id: number
  nodeId: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: string
}

/** Property bubble state */
export interface PropertyBubbleState {
  visible: boolean
  nodeId: string | null
  x: number
  y: number
  nodeData?: unknown
}

/** Relation selector state */
export interface RelationSelectorState {
  visible: boolean
  sourceId: string | null
  targetId: string | null
  x: number
  y: number
  edgeId?: string
}

/** Search result item */
export interface SearchItem {
  type: string
  name: string
  icon: string
  category?: string
  categoryIcon?: string
  color?: string
}

/** Command palette item */
export interface CommandItem {
  id: string
  label: string
  category: string
  icon: string
  shortcut?: string
  action?: () => void
}
