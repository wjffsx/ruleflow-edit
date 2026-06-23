import type { RefObject } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { LogicFlow, type GraphData } from '@logicflow/core'
// P0-opt: Remove static import of extension plugins — dynamically loaded in Phase 1.
// Entire @logicflow/extension (~534KB) is tree-shaken from main bundle.
import '@logicflow/core/dist/index.css'
// CSS for extension plugins is loaded when plugins are dynamically imported.
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
  /** Whether extension plugins are loaded (edit mode only; view mode is always ready) */
  pluginsReady: boolean
}

export function useLogicFlow({
  containerRef,
  lfRef,
  setIsEmpty,
  setAllNodes,
  initialData,
  readOnly = false,
}: UseLogicFlowParams): UseLogicFlowReturn {
  const mountedRef = useRef(true)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const addTimer = (id: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(id)
  }
  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  // P0-opt: Phase 1 — dynamically load extension plugins only for edit mode
  const [pluginsReady, setPluginsReady] = useState(readOnly)
  const lfPluginsRef = useRef<any[]>([])

  useEffect(() => {
    if (readOnly) {
      // View mode: no plugins needed, signal ready immediately
      lfPluginsRef.current = []
      setPluginsReady(true)
      return
    }

    let cancelled = false
    // Edit mode: dynamically import only the needed plugins
    import('@logicflow/extension')
      .then((mod) => {
        if (cancelled) return
        lfPluginsRef.current = [mod.MiniMap, mod.Snapshot, mod.SelectionSelect]
        setPluginsReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[RuleFlow] Failed to load extension plugins:', err)
        // Fallback: create LF with no plugins
        lfPluginsRef.current = []
        setPluginsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [readOnly])

  // P0-opt: Phase 2 — create LogicFlow instance when plugins are ready
  useEffect(() => {
    mountedRef.current = true
    if (!containerRef.current || lfRef.current || !pluginsReady) return

    const lf = new LogicFlow({
      container: containerRef.current,
      grid: { size: 20, visible: true, type: 'dot', config: { color: '#e5e7eb' } },
      keyboard: { enabled: !readOnly },
      plugins: lfPluginsRef.current,
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
    const fitViewId = setTimeout(() => {
      if (!mountedRef.current) return
      lf.fitView(60)
    }, 100)
    addTimer(fitViewId)
    lfRef.current = lf
    setLfInstance(lf)

    const injectId = setTimeout(() => injectSvgFilterDefs(containerRef.current, mountedRef), 100)
    addTimer(injectId)

    if (readOnly) {
      try {
        const graphModel = lf.graphModel as { nodes?: any[] }
        graphModel.nodes?.forEach((node: any) => {
          node.draggable = false
        })
      } catch (_e) {
        /* ignore */
      }
    }

    ;(window as unknown as Record<string, unknown>).__lf = lf
    ;(window as unknown as Record<string, unknown>).__lfRef = lfRef

    const cleanup = setupLogicFlowEvents(lf, setIsEmpty, setAllNodes)

    return () => {
      mountedRef.current = false
      clearAllTimers()
      cleanup()
      lfRef.current = null
      setLfInstance(null as unknown as LogicFlow)
      ;(window as unknown as Record<string, unknown>).__lf = null
      ;(window as unknown as Record<string, unknown>).__lfRef = null
    }
  }, [pluginsReady])

  return { lfRef, pluginsReady }
}

function injectSvgFilterDefs(
  container: HTMLElement | null,
  mountedRef: { current: boolean },
): void {
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
  if (svgEl.querySelector('#rf-svg-filters')) return
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  defs.setAttribute('id', 'rf-svg-filters')
  defs.innerHTML = `
    <filter id="rf-shadow-sm" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="var(--rf-shadow-color, rgba(0,0,0,0.1))" />
    </filter>
    <filter id="rf-debug-pulse" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="var(--rf-status-processing, #7c3aed)" flood-opacity="0.6" />
    </filter>
    <filter id="rf-debug-success-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="var(--rf-status-success, #16a34a)" flood-opacity="0.5" />
    </filter>
    <filter id="rf-debug-failure-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="var(--rf-status-danger, #dc2626)" flood-opacity="0.5" />
    </filter>
  `
  svgEl.prepend(defs)
}
