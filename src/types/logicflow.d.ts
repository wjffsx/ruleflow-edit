/**
 * Type declarations for @logicflow/core.
 * Provides minimal type information for LogicFlow instances used in RuleFlow Editor.
 */
declare module '@logicflow/core' {
  interface NodeData {
    id: string
    type: string
    x: number
    y: number
    text: string | { value: string }
    properties: Record<string, unknown>
    [key: string]: unknown
  }

  interface EdgeData {
    id: string
    type: string
    sourceNodeId: string
    targetNodeId: string
    text: string | { value: string }
    properties: Record<string, unknown>
    startPoint?: { x: number; y: number }
    endPoint?: { x: number; y: number }
    [key: string]: unknown
  }

  interface GraphData {
    nodes: NodeData[]
    edges: EdgeData[]
    Undo?: unknown
    Redo?: unknown
    [key: string]: unknown
  }

  interface NodeModel {
    id: string
    text: string | { value: string }
    properties: Record<string, unknown>
    width: number
    height: number
    x: number
    y: number
    setProperties(props: Record<string, unknown>): void
    [key: string]: unknown
  }

  interface EdgeModel {
    id: string
    type: string
    sourceNodeId: string
    targetNodeId: string
    text: string | { value: string }
    properties: Record<string, unknown>
    startPoint?: { x: number; y: number }
    endPoint?: { x: number; y: number }
    points: string
    setProperties(props: Record<string, unknown>): void
    [key: string]: unknown
  }

  /** Transform model for coordinate conversion */
  interface TransformModel {
    CanvasPointToHtmlPoint(x: number, y: number): { x: number; y: number }
  }

  /** Event center for emitting and listening to events */
  interface EventCenter {
    emit(event: string, ...args: unknown[]): void
  }

  /** Graph model containing grid and transform state */
  interface GraphModel {
    grid: Record<string, unknown>
    transformModel: TransformModel
    eventCenter: EventCenter
  }

  // ── Event callback types ────────────────────────────────────────

  /** Event data for node:click */
  interface NodeClickEvent {
    data: NodeData
    e: MouseEvent
  }

  /** Event data for edge:add */
  interface EdgeAddEvent {
    data: EdgeData
  }

  /** Event data for edge:click */
  interface EdgeClickEvent {
    data: EdgeData
    e: MouseEvent
  }

  /** Event data for graph:updated */
  interface GraphUpdatedEvent {
    data: GraphData
  }

  /** Event data for selection:selected */
  interface SelectionEvent {
    data: { nodes: NodeData[]; edges: EdgeData[] }
  }

  export class LogicFlow {
    constructor(options: Record<string, unknown>)
    render(data?: GraphData): void
    clearData(): void
    getGraphData(): GraphData
    getTransform(): { SCALE_X: number; SCALE_Y: number }
    zoom(scaleOrDelta: number | boolean, point?: Record<string, unknown>): void
    fitView(offset?: number): void
    undo(): void
    redo(): void
    deleteNode(id: string): void
    updateAttributes(id: string, attrs: Record<string, unknown>): void
    getPointByClient(x: number, y: number): { x: number; y: number }
    addElements(data: Record<string, unknown>): Record<string, unknown>
    register(type: string, custom: () => Record<string, unknown>): void
    on(event: 'node:click', handler: (evt: NodeClickEvent) => void): void
    on(event: 'edge:add', handler: (evt: EdgeAddEvent) => void): void
    on(event: 'edge:click', handler: (evt: EdgeClickEvent) => void): void
    on(event: 'graph:updated', handler: (evt: GraphUpdatedEvent) => void): void
    on(event: 'graph:transform', handler: () => void): void
    on(event: 'blank:click', handler: () => void): void
    on(event: 'selection:selected', handler: (evt: SelectionEvent) => void): void
    on(event: string, handler: (...args: unknown[]) => void): void
    off(event: string, handler: (...args: unknown[]) => void): void
    destroy(): void
    resetZoom(): void
    focusOnElementById(id: string): void
    addNode(config: Record<string, unknown>): void
    cloneNode(id: string, options?: Record<string, unknown>): void
    getNodeModelById(id: string): NodeModel
    getEdgeModelById(id: string): EdgeModel
    extension: Record<string, unknown>
    graphModel: GraphModel
  }

  export class RectNodeModel {
    initNodeData(data: unknown): void
    getNodeStyle(): Record<string, unknown>
    getOutlineStyle(): Record<string, unknown>
    width: number
    height: number
    radius: number
    properties: Record<string, unknown>
    id: string
    text: string | { value: string }
  }

  export class RectNode {
    props: Record<string, unknown>
    getShape(): unknown
  }

  export class PolylineEdgeModel {
    getEdgeStyle(): Record<string, unknown>
    getTextStyle(): Record<string, unknown>
    properties: Record<string, unknown>
    points: string
    startPoint?: { x: number; y: number }
    endPoint?: { x: number; y: number }
    text: string | { value: string }
  }

  export class PolylineEdge {
    props: Record<string, unknown>
    getEdge(): unknown
    getAppendWidth(): unknown
  }

  export function h(tag: string, attrs?: Record<string, unknown>, children?: unknown): unknown
}
