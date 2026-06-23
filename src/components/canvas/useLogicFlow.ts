import type { RefObject } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { LogicFlow, type GraphData } from '@logicflow/core'
import { MiniMap, Snapshot, SelectionSelect } from '@logicflow/extension'
import '@logicflow/core/dist/index.css'
import '@logicflow/extension/dist/index.css'
import { CUSTOM_NODE_TYPES } from '../nodes/BaseNode'
import {
  RelationEdgeModel,
  RelationEdgeView,
  RELATION_EDGE_TYPE,
  ConditionTreeEdgeModel,
  ConditionTreeEdgeView,
  CONDITION_TREE_EDGE_TYPE,
} from '../nodes/RelationEdges'
import { setLfInstance } from '../../store'
import { setupLogicFlowEvents } from './useLogicFlowEvents'

/** Parameters for useLogicFlow hook */
interface UseLogicFlowParams {
  containerRef: RefObject<HTMLElement | null>
  lfRef: { current: LogicFlow | null }
  setIsEmpty: (v: boolean) => void
  setAllNodes: (v: import('@logicflow/core').NodeData[]) => void
  initialData?: GraphData
  readOnly?: boolean
}

interface UseLogicFlowReturn {
  lfRef: { current: LogicFlow | null }
}

export function useLogicFlow({
  containerRef,
  lfRef,
  setIsEmpty,
  setAllNodes,
  initialData,
  readOnly = false,
}: UseLogicFlowParams): UseLogicFlowReturn {
  // P0-fix: mounted guard — prevents forceUpdate on unmounted component
  const mountedRef = useRef(true)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const addTimer = (id: ReturnType<typeof setTimeout>) => { timersRef.current.push(id) }
  const clearAllTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  useEffect(() => {
    mountedRef.current = true
    if (!containerRef.current || lfRef.current) return

    const lf = new LogicFlow({
      container: containerRef.current,
      grid: { size: 20, visible: true, type: 'dot', config: { color: '#e5e7eb' } },
      keyboard: { enabled: !readOnly },
      plugins: readOnly ? [MiniMap] : [MiniMap, Snapshot, SelectionSelect],
      style: {
        rect: { width: 200, height: 80, radius: 8, strokeWidth: 2 },
        nodeText: { fontSize: 13, overflowMode: 'autoWrap' },
        edgeText: { fontSize: 11, background: { fill: '#fff', stroke: 'none', radius: 4 } },
        polyline: { stroke: '#d1d5db', strokeWidth: 2 },
      },
      edgeType: 'polyline',
      snapline: !readOnly,
      history: !readOnly,
      partial: true,
      isSilentMode: false,
      stopScrollGraph: readOnly,
      stopZoomGraph: readOnly,
      stopMoveGraph: readOnly ? true : false,
      allowRotation: false,
      allowResize: false,
    })

    Object.entries(CUSTOM_NODE_TYPES).forEach(([type, { model, view }]) => {
      lf.register(type, () => ({ model, view }))
    })
    lf.register(RELATION_EDGE_TYPE, () => ({
      model: RelationEdgeModel,
      view: RelationEdgeView,
    }))
    lf.register(CONDITION_TREE_EDGE_TYPE, () => ({
      model: ConditionTreeEdgeModel,
      view: ConditionTreeEdgeView,
    }))

    const dataToRender = initialData || { nodes: [], edges: [] }
    lf.render(dataToRender)
    // P0-fix: guard fitView timer with mounted check
    const fitViewId = setTimeout(() => {
      if (!mountedRef.current) return
      lf.fitView(60)
    }, 100)
    addTimer(fitViewId)
    lfRef.current = lf
    setLfInstance(lf)

    // P0-fix: guard injectSvgFilterDefs with mounted check
    const injectId = setTimeout(() => injectSvgFilterDefs(containerRef.current, mountedRef), 100)
    addTimer(injectId)

    if (readOnly) {
      try {
        const graphModel = lf.graphModel as { nodes?: any[] }
        graphModel.nodes?.forEach((node: any) => { node.draggable = false })
      } catch (_e) { /* ignore */ }
    }

    // P0-fix: always expose globally — host page uses this to destroy LF before Preact unmount
    ;(window as unknown as Record<string, unknown>).__lf = lf
    // P0-fix: expose lfRef so host page can nullify it before Preact unmount
    ;(window as unknown as Record<string, unknown>).__lfRef = lfRef

    const cleanup = setupLogicFlowEvents(lf, setIsEmpty, setAllNodes)

    return () => {
      // P0-fix: set mounted false IMMEDIATELY
      mountedRef.current = false
      clearAllTimers()
      cleanup()
      // P0-fix: Do NOT call lf.destroy() in cleanup — it triggers signal reactions
      // (ObservableMap.clear → endBatch → reactionScheduler → forceUpdate) that fire
      // via microtask AFTER the component is already unmounted by Preact.
      // The LF instance is disposed via external destroy (window.__lf.destroy in handleBack)
      // when the user navigates away. For internal toggles (visual↔yaml), the orphaned
      // LF is GC'd when the container DOM is removed by Preact.
      lfRef.current = null
      setLfInstance(null as unknown as LogicFlow)
      ;(window as unknown as Record<string, unknown>).__lf = null
      ;(window as unknown as Record<string, unknown>).__lfRef = null
    }
  }, [])

  return { lfRef }
}

function injectSvgFilterDefs(container: HTMLElement | null, mountedRef: { current: boolean }): void {
  if (!container || !mountedRef.current) return
  const svgEl = container.querySelector('svg.lf-graph')
  if (!svgEl) {
    const retryId = setTimeout(() => {
      if (!mountedRef.current) return
      const retrySvg = container.querySelector('svg.lf-graph')
      if (retrySvg) appendFilterDefs(retrySvg as SVGElement)
    }, 200)
    return
  }
  appendFilterDefs(svgEl as SVGElement)
}

function appendFilterDefs(svgEl: SVGElement): void {
  // Avoid duplicate injection
  if (svgEl.querySelector('#rf-svg-filters')) return

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  defs.setAttribute('id', 'rf-svg-filters')

  defs.innerHTML = `
    <!-- Default drop shadow -->
    <filter id="rf-shadow-sm" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="var(--rf-shadow-color, rgba(0,0,0,0.1))" />
    </filter>

    <!-- Debug: processing pulse glow -->
    <filter id="rf-debug-pulse" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="var(--rf-status-processing, #7c3aed)" flood-opacity="0.6" />
    </filter>

    <!-- Debug: success glow -->
    <filter id="rf-debug-success-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="var(--rf-status-success, #16a34a)" flood-opacity="0.5" />
    </filter>

    <!-- Debug: failure glow -->
    <filter id="rf-debug-failure-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="var(--rf-status-danger, #dc2626)" flood-opacity="0.5" />
    </filter>
  `

  svgEl.prepend(defs)
}
