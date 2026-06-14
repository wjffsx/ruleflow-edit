import type { RefObject } from 'preact'
import { useEffect } from 'preact/hooks'
import { LogicFlow, type GraphData } from '@logicflow/core'
import { MiniMap, Snapshot, SelectionSelect } from '@logicflow/extension'
import '@logicflow/core/dist/index.css'
import '@logicflow/extension/dist/index.css'
import { RuleFlowBaseModel, RuleFlowBaseView, CUSTOM_NODE_TYPES } from '../nodes/BaseNode'
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
  /** Ref to the container DOM element */
  containerRef: RefObject<HTMLElement | null>
  /** Mutable ref holding the LogicFlow instance */
  lfRef: { current: LogicFlow | null }
  /** Callback to set whether the canvas is empty */
  setIsEmpty: (v: boolean) => void
  /** Callback to set all node data */
  setAllNodes: (v: import('@logicflow/core').NodeData[]) => void
  /** Demo data to render initially */
  demoData: GraphData
}

/** Return type of useLogicFlow hook */
interface UseLogicFlowReturn {
  lfRef: { current: LogicFlow | null }
}

export function useLogicFlow({
  containerRef,
  lfRef,
  setIsEmpty,
  setAllNodes,
  demoData,
}: UseLogicFlowParams): UseLogicFlowReturn {
  useEffect(() => {
    if (!containerRef.current || lfRef.current) return

    const lf = new LogicFlow({
      container: containerRef.current,
      grid: { size: 20, visible: true, type: 'dot', config: { color: '#e5e7eb' } },
      keyboard: { enabled: true },
      plugins: [MiniMap, Snapshot, SelectionSelect],
      style: {
        rect: { width: 200, height: 80, radius: 8, strokeWidth: 2 },
        nodeText: { fontSize: 13, overflowMode: 'autoWrap' },
        edgeText: { fontSize: 11, background: { fill: '#fff', stroke: 'none', radius: 4 } },
        polyline: { stroke: '#d1d5db', strokeWidth: 2 },
      },
      edgeType: 'polyline',
      snapline: true,
      history: true,
      partial: true,
    })

    // Register custom types
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

    lf.render(demoData)
    setTimeout(() => lf.fitView(60), 100)
    lfRef.current = lf
    setLfInstance(lf)

    // ── Inject SVG filter defs for debug glow effects ──
    injectSvgFilterDefs(containerRef.current)

    // Expose for debugging (dev only)
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__lf = lf
    }

    // ── Event handlers ──
    const cleanup = setupLogicFlowEvents(lf, setIsEmpty, setAllNodes)

    return () => {
      cleanup()
      if (lfRef.current) {
        try {
          lfRef.current.destroy()
        } catch (e) {
          if (import.meta.env.DEV) console.warn('[RuleFlow] lf destroy failed:', e)
        }
        lfRef.current = null
        setLfInstance(null as unknown as LogicFlow)
      }
    }
  }, [])

  return { lfRef }
}

/**
 * Inject SVG <defs> with filter definitions for debug glow effects
 * and default drop shadow into the LogicFlow SVG canvas.
 */
function injectSvgFilterDefs(container: HTMLElement | null): void {
  if (!container) return
  const svgEl = container.querySelector('svg.lf-graph')
  if (!svgEl) {
    // Retry after a short delay if SVG not yet rendered
    setTimeout(() => {
      const retrySvg = container.querySelector('svg.lf-graph')
      if (retrySvg) appendFilterDefs(retrySvg)
    }, 200)
    return
  }
  appendFilterDefs(svgEl)
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
