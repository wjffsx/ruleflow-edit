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

/** Detect low-performance device for SVG filter degradation */
const IS_LOW_PERF = (() => {
  try {
    return navigator.hardwareConcurrency <= 4 || /arm/i.test(navigator.platform || '')
  } catch {
    return false
  }
})()

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

  // P0-1: AutoLayout plugin reference (view mode) — 视图态节点无位置时自动布局
  const autoLayoutRef = useRef<any>(null)

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
        console.warn('[RuleFlow] Extension plugins unavailable, running without:', err)
        // Fallback: create LF with no plugins (embedded/offline environment)
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

    // P0-1: 在 view 模式下动态加载 AutoLayout 插件，处理节点全堆在 (0,0) 的情况
    if (readOnly) {
      import('@logicflow/extension')
        .then((mod) => {
          if (mountedRef.current && lfRef.current && mod.AutoLayout) {
            try {
              autoLayoutRef.current = new mod.AutoLayout({
                lf: lfRef.current,
                // 默认 layout 方法使用 dagre（自上而下）
              } as any)
              // 注：dagre 选项通过 lf.layout(options) 传入，不再使用 constructor 的 layoutOptions
              autoLayoutRef.current.layoutOptions = {
                type: 'dagre',
                rankdir: 'TB',
                nodesep: 60,
                ranksep: 80,
              }
              // 渲染后若节点全在 (0,0)，自动执行一次布局
              const lf = lfRef.current
              const nodes = lf.getGraphData()?.nodes || []
              const allZero =
                nodes.length > 1 && nodes.every((n: any) => (n.x ?? 0) === 0 && (n.y ?? 0) === 0)
              if (allZero) {
                try {
                  ;(lf as any).layout?.()
                  if (import.meta.env.DEV) console.log('[RuleFlow] Auto-layout applied (view mode)')
                } catch (e) {
                  if (import.meta.env.DEV)
                    console.warn('[RuleFlow] auto-layout failed, fallback to grid:', e)
                  fallbackGridLayout(lf, nodes)
                }
              }
              // 再次 fitView 确保所有节点可见
              setTimeout(() => {
                if (mountedRef.current && lfRef.current) {
                  try {
                    lfRef.current.fitView(60)
                  } catch (_e) {
                    /* ignore */
                  }
                }
              }, 150)
            } catch (e) {
              if (import.meta.env.DEV) console.warn('[RuleFlow] AutoLayout init failed:', e)
            }
          }
        })
        .catch((err) => {
          if (import.meta.env.DEV)
            console.warn('[RuleFlow] AutoLayout unavailable, using grid fallback:', err)
        })
    }

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

    const injectId = setTimeout(
      () => injectSvgFilterDefs(containerRef.current, mountedRef, addTimer),
      100,
    )
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
      // 如果 window.__lf 已被外部（handleBack）置为 null，说明 destroy 已执行，
      // 跳过二次 destroy 以避免组件卸载后 MobX 微任务仍触发 forceUpdate。
      try {
        if ((window as unknown as Record<string, unknown>).__lf !== null) {
          lf.destroy()
        }
      } catch (_e) {
        /* ignore destroy errors on unmount */
      }
      lfRef.current = null
      setLfInstance(null as unknown as LogicFlow)
      autoLayoutRef.current = null
      ;(window as unknown as Record<string, unknown>).__lf = null
      ;(window as unknown as Record<string, unknown>).__lfRef = null
    }
  }, [pluginsReady])

  return { lfRef, pluginsReady }
}

function injectSvgFilterDefs(
  container: HTMLElement | null,
  mountedRef: { current: boolean },
  addTimer: (id: ReturnType<typeof setTimeout>) => void,
): void {
  if (!container || !mountedRef.current) return
  const svgEl = container.querySelector('svg.lf-graph')
  if (!svgEl) {
    const retryId = setTimeout(() => {
      if (!mountedRef.current) return
      const retrySvg = container.querySelector('svg.lf-graph')
      if (retrySvg) appendFilterDefs(retrySvg as SVGElement)
    }, 200)
    addTimer(retryId) // Fix: register retry timer for cleanup
    return
  }
  appendFilterDefs(svgEl as SVGElement)
}

function appendFilterDefs(svgEl: SVGElement): void {
  if (svgEl.querySelector('#rf-svg-filters')) return
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  defs.setAttribute('id', 'rf-svg-filters')

  if (IS_LOW_PERF) {
    // Low-perf mode: only minimal shadow filter, no glow filters
    defs.innerHTML = `
      <filter id="rf-shadow-sm" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="var(--rf-shadow-color, rgba(0,0,0,0.08))" />
      </filter>
    `
  } else {
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
  }
  svgEl.prepend(defs)
}

/** Export low-perf flag for use in BaseNode/LogicGateNode rendering */
export { IS_LOW_PERF }

/**
 * 兜底网格布局：当 AutoLayout 插件不可用时，
 * 将 (0,0) 节点按拓扑顺序排列到简单网格中，确保所有节点可见。
 *
 * @param lf LogicFlow 实例
 * @param nodes 节点列表（包含 x, y 字段）
 */
function fallbackGridLayout(lf: LogicFlow, nodes: any[]): void {
  if (!nodes || nodes.length === 0) return
  const COL_WIDTH = 240
  const ROW_HEIGHT = 140
  const COLS = Math.ceil(Math.sqrt(nodes.length))
  nodes.forEach((n: any, idx: number) => {
    const col = idx % COLS
    const row = Math.floor(idx / COLS)
    const x = col * COL_WIDTH + COL_WIDTH / 2
    const y = row * ROW_HEIGHT + ROW_HEIGHT / 2
    try {
      const model = lf.getNodeModelById(n.id) as any
      if (model && typeof model.moveTo === 'function') {
        model.moveTo(x, y)
      } else if (model) {
        // 兜底：直接修改坐标属性
        model.x = x
        model.y = y
      }
    } catch (e) {
      if (import.meta.env.DEV)
        console.warn(`[RuleFlow] fallback layout failed for node ${n.id}:`, e)
    }
  })
  if (import.meta.env.DEV)
    console.log('[RuleFlow] fallback grid layout applied for', nodes.length, 'nodes')
}
