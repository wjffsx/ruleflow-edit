import { h } from 'preact'
import { useEffect, useRef, useState, useCallback } from 'preact/hooks'
import LogicFlow from '@logicflow/core'
import { MiniMap, Snapshot, SelectionSelect } from '@logicflow/extension'
import '@logicflow/core/dist/index.css'
import '@logicflow/extension/dist/index.css'
import { ZoomIn, ZoomOut, RotateCcw, MousePointer2 } from 'lucide-preact'
import { RuleFlowBaseModel, RuleFlowBaseView, CUSTOM_NODE_TYPES } from '../nodes/BaseNode'
import { RelationEdgeModel, RelationEdgeView, RELATION_EDGE_TYPE } from '../nodes/RelationEdges'
import { RelationTypeSelector } from './RelationTypeSelector'
import { PropertyBubble } from './PropertyBubble'
import { NodeSearch } from './NodeSearch'
import { BatchActionToolbar } from './BatchActionToolbar'
import {
  nodeCount, edgeCount, canvasZoom, setZoom, selectedNodeId,
  showRelationSelector, hideRelationSelector, relationSelectorState,
  showPropertyBubble, hidePropertyBubble, propertyBubbleState,
  nodeSearchVisible, hideNodeSearch, showNodeSearch,
  setLfInstance,
  batchToolbarState, hideBatchToolbar,
  selectedNodeIds,
  setActivePanelTab,
} from '../../store/editorStore'
import { t } from '../../i18n'

// Demo data — v2.0: Emoji replaced with Unicode symbols per VPPTU design spec
const DEMO_DATA = {
  nodes: [
    { id: 'input_soc', type: 'rf-input-port', x: 200, y: 150, text: 'SOC 数据', properties: { nodeType: 'input_port', icon: '\u2192', priority: 0, enabled: true, summary: 'soc_monitor' } },
    { id: 'input_pw', type: 'rf-input-port', x: 200, y: 300, text: '有功功率', properties: { nodeType: 'input_port', icon: '\u2192', priority: 0, enabled: true, summary: 'active_power' } },
    { id: 'cond_soc', type: 'rf-condition', x: 500, y: 200, text: 'SOC 监控', properties: { nodeType: 'condition', icon: '\u25C7', priority: 1, enabled: true, summary: '条件: AND' } },
    { id: 'action_transform', type: 'rf-action', x: 820, y: 130, text: '值变换', properties: { nodeType: 'action', icon: '\u25B6', priority: 1, enabled: true, summary: '变换: 单位转换' } },
    { id: 'action_alert', type: 'rf-action', x: 820, y: 290, text: '告警通知', properties: { nodeType: 'action', icon: '\u25B6', priority: 1, enabled: true, summary: '通知: 运维人员' } },
    { id: 'action_dispatch', type: 'rf-action', x: 1100, y: 200, text: '调度下发', properties: { nodeType: 'action', icon: '\u25B6', priority: 1, enabled: true, summary: '目标: 储能系统' } },
    { id: 'output_dispatch', type: 'rf-output-port', x: 1400, y: 200, text: '调度指令', properties: { nodeType: 'output_port', icon: '\u2190', priority: 0, enabled: true, summary: 'dispatch_order' } },
  ],
  edges: [
    { id: 'e1', type: 'polyline', sourceNodeId: 'input_soc', targetNodeId: 'cond_soc', text: '', properties: { relationType: 'default' } },
    { id: 'e2', type: 'polyline', sourceNodeId: 'input_pw', targetNodeId: 'cond_soc', text: '', properties: { relationType: 'default' } },
    { id: 'e3', type: 'polyline', sourceNodeId: 'cond_soc', targetNodeId: 'action_transform', text: 'True', properties: { relationType: 'True' } },
    { id: 'e4', type: 'polyline', sourceNodeId: 'cond_soc', targetNodeId: 'action_alert', text: 'False', properties: { relationType: 'False' } },
    { id: 'e5', type: 'polyline', sourceNodeId: 'action_transform', targetNodeId: 'action_dispatch', text: 'Success', properties: { relationType: 'Success' } },
    { id: 'e6', type: 'polyline', sourceNodeId: 'action_dispatch', targetNodeId: 'output_dispatch', text: '', properties: { relationType: 'default' } },
  ],
}

const canvasContainerStyle = {
  gridArea: 'canvas',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--rf-bg-secondary)',
}

export function CanvasViewport() {
  const containerRef = useRef(null)
  const lfRef = useRef(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [allNodes, setAllNodes] = useState([])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F: Node search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        showNodeSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    lf.register(RELATION_EDGE_TYPE, () => ({ model: RelationEdgeModel, view: RelationEdgeView }))

    lf.render(DEMO_DATA)
    setTimeout(() => lf.fitView(60), 100)
    lfRef.current = lf
    setLfInstance(lf)
    // Expose for debugging
    if (typeof window !== 'undefined') window.__lf = lf

    // ── Event handlers ──

    // Graph updated → update stats
    lf.on('graph:updated', () => {
      try {
        const data = lf.getGraphData()
        const nc = data?.nodes?.length || 0
        const ec = data?.edges?.length || 0
        nodeCount.value = nc
        edgeCount.value = ec
        setIsEmpty(nc === 0)
        setAllNodes(data?.nodes || [])
      } catch (e) { /* ignore */ }
    })

    // Node click → select & show property bubble
    lf.on('node:click', ({ data, e }) => {
      selectedNodeId.value = data.id
      // Show property bubble near clicked node
      const clientPos = lf.graphModel.eventCenter.emit
      try {
        const model = lf.getNodeModelById(data.id)
        if (model) {
          const point = lf.graphModel.transformModel.CanvasPointToHtmlPoint(
            model.x + (model.width || 200) / 2 + 10,
            model.y - (model.height || 80) / 2
          )
          showPropertyBubble(point.x, point.y, data)
        }
      } catch (err) { /* fallback */ }
    })

    // Blank click → deselect
    lf.on('blank:click', () => {
      selectedNodeId.value = null
      selectedNodeIds.value = []
      hidePropertyBubble()
      hideBatchToolbar()
    })

    // Edge creation → show relation type selector
    lf.on('edge:add', ({ data }) => {
      try {
        const model = lf.getEdgeModelById(data.id)
        if (model) {
          const startX = model.startPoint?.x || 0
          const startY = model.startPoint?.y || 0
          const endX = model.endPoint?.x || 0
          const endY = model.endPoint?.y || 0
          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2
          const point = lf.graphModel.transformModel.CanvasPointToHtmlPoint(midX, midY)
          showRelationSelector(point.x, point.y, data.id)
        }
      } catch (err) { /* ignore */ }
    })

    // Edge click → select edge
    lf.on('edge:click', ({ data }) => {
      selectedNodeId.value = null
    })

    // Transform → update zoom
    lf.on('graph:transform', () => {
      try {
        const zoom = lf.getTransform()
        if (zoom?.SCALE_X) setZoom(Math.round(zoom.SCALE_X * 100))
      } catch (e) { /* ignore */ }
    })

    // Selection select (multi-select) → show batch toolbar
    lf.on('selection:selected', ({ data }) => {
      const nodes = data?.nodes || []
      if (nodes.length >= 2) {
        selectedNodeIds.value = nodes.map(n => n.id)
        // Calculate bounding box center
        const xs = nodes.map(n => n.x)
        const ys = nodes.map(n => n.y)
        const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
        const centerY = Math.min(...ys)
        const point = lf.graphModel.transformModel.CanvasPointToHtmlPoint(centerX, centerY)
        showBatchToolbar(point.x, point.y, nodes.length)
      }
    })

    return () => {
      if (lfRef.current) {
        try { lfRef.current.destroy() } catch (e) { /* ignore */ }
        lfRef.current = null
        setLfInstance(null)
      }
    }
  }, [])

  // ── Handlers for overlay components ──

  const handleRelationSelect = useCallback((edgeId, relationType) => {
    const lf = lfRef.current
    if (!lf || !edgeId) return
    try {
      const edgeModel = lf.getEdgeModelById(edgeId)
      if (edgeModel) {
        edgeModel.setProperties({ ...edgeModel.properties, relationType })
        edgeModel.text = { ...edgeModel.text, value: relationType === 'default' ? '' : relationType }
      }
    } catch (err) { /* ignore */ }
    hideRelationSelector()
  }, [])

  const handleLocateNode = useCallback((nodeId) => {
    const lf = lfRef.current
    if (!lf || !nodeId) return
    try {
      lf.focusOnElementById(nodeId)
      selectedNodeId.value = nodeId
    } catch (err) { /* ignore */ }
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    const lf = lfRef.current
    if (!lf) return
    const nodeData = e.dataTransfer.getData('application/ruleflow-node')
    if (!nodeData) return
    try {
      const item = JSON.parse(nodeData)
      const point = lf.getPointByClient(e.clientX, e.clientY)
      // Map nodeType to custom LogicFlow type based on category
      const categoryTypeMap = {
        // Input port items
        device_type: 'rf-input-port', device_id: 'rf-input-port',
        point_name: 'rf-input-port', value_range: 'rf-input-port',
        quality_code: 'rf-input-port', time_window: 'rf-input-port',
        // Condition items
        js_filter: 'rf-condition', value_range_cond: 'rf-condition',
        state_change: 'rf-condition', duration_cond: 'rf-condition',
        trend_cond: 'rf-condition', soc_monitor: 'rf-condition',
        power_factor: 'rf-condition', price_threshold: 'rf-condition',
        // Action items
        transform: 'rf-action', rename: 'rf-action',
        label: 'rf-action', discard: 'rf-action',
        route: 'rf-action', alert: 'rf-action',
        rest_call: 'rf-action', dispatch: 'rf-action',
        aggregator: 'rf-action',
        // Flow items
        sub_chain: 'rf-sub-chain', delay: 'rf-rule',
        // VPP items
        vpp_charge: 'rf-action', vpp_discharge: 'rf-action',
        vpp_ess_control: 'rf-action', vpp_grid_interact: 'rf-action',
        vpp_load_shift: 'rf-action', vpp_demand_resp: 'rf-action',
        // Base types
        input_port: 'rf-input-port', output_port: 'rf-output-port',
        rule: 'rf-rule', condition: 'rf-condition',
        action: 'rf-action', note: 'rf-note',
      }
      // Determine nodeType from item for properties
      const nodeCategoryMap = {
        device_type: 'input_port', device_id: 'input_port',
        point_name: 'input_port', value_range: 'input_port',
        quality_code: 'input_port', time_window: 'input_port',
        js_filter: 'condition', value_range_cond: 'condition',
        state_change: 'condition', duration_cond: 'condition',
        trend_cond: 'condition', soc_monitor: 'condition',
        power_factor: 'condition', price_threshold: 'condition',
        transform: 'action', rename: 'action',
        label: 'action', discard: 'action',
        route: 'action', alert: 'action',
        rest_call: 'action', dispatch: 'action',
        aggregator: 'action',
        sub_chain: 'sub_chain', delay: 'rule',
        vpp_charge: 'action', vpp_discharge: 'action',
        vpp_ess_control: 'action', vpp_grid_interact: 'action',
        vpp_load_shift: 'action', vpp_demand_resp: 'action',
      }
      const lfType = categoryTypeMap[item.type] || 'rf-rule'
      const nodeType = nodeCategoryMap[item.type] || item.type
      lf.addNode({
        id: `${item.type}_${Date.now()}`,
        type: lfType,
        x: point.x,
        y: point.y,
        text: item.name,
        properties: { nodeType: nodeType, icon: item.icon, priority: 1, enabled: true },
      })
      setIsEmpty(false)
    } catch (err) { console.error('Failed to add node:', err) }
  }

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }

  const handleZoomIn = () => {
    const lf = lfRef.current
    if (lf) { lf.zoom(true); try { const z = lf.getTransform(); if (z?.SCALE_X) setZoom(Math.round(z.SCALE_X * 100)) } catch (e) { } }
  }
  const handleZoomOut = () => {
    const lf = lfRef.current
    if (lf) { lf.zoom(false); try { const z = lf.getTransform(); if (z?.SCALE_X) setZoom(Math.round(z.SCALE_X * 100)) } catch (e) { } }
  }
  const handleZoomReset = () => {
    const lf = lfRef.current
    if (lf) { lf.resetZoom(); setZoom(100) }
  }

  // Read overlay states
  const relSelector = relationSelectorState.value
  const propBubble = propertyBubbleState.value
  const showSearch = nodeSearchVisible.value
  const batchToolbar = batchToolbarState.value

  return (
    <div
      style={canvasContainerStyle}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      role="application"
      aria-label="规则链画布"
    >
      {/* LogicFlow container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Empty state */}
      {isEmpty && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--rf-space-3)',
          color: 'var(--rf-text-tertiary)', pointerEvents: 'none', zIndex: 1, textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--rf-radius-xl)',
            background: 'var(--rf-brand-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MousePointer2 size={28} style={{ color: 'var(--rf-brand-primary)' }} />
          </div>
          <div style={{ fontSize: 'var(--rf-text-md)', fontWeight: 600, color: 'var(--rf-text-secondary)' }}>
            {t('canvas.empty.title')}
          </div>
          <div style={{ fontSize: 'var(--rf-text-sm)', maxWidth: 280 }}>{t('canvas.empty.desc')}</div>
        </div>
      )}

      {/* ── Phase 2 Overlay Components ── */}

      {/* Relation type selector */}
      {relSelector && (
        <RelationTypeSelector
          x={relSelector.x}
          y={relSelector.y}
          edgeId={relSelector.edgeId}
          onSelect={handleRelationSelect}
          onClose={hideRelationSelector}
        />
      )}

      {/* Property bubble */}
      {propBubble && (
        <PropertyBubble
          x={propBubble.x}
          y={propBubble.y}
          nodeData={propBubble.nodeData}
          onClose={hidePropertyBubble}
          onOpenPanel={() => { hidePropertyBubble(); setActivePanelTab('properties') }}
        />
      )}

      {/* Node search (Ctrl+F) */}
      {showSearch && (
        <NodeSearch
          nodes={allNodes}
          onClose={hideNodeSearch}
          onLocateNode={handleLocateNode}
        />
      )}

      {/* Batch action toolbar */}
      {batchToolbar && batchToolbar.count >= 2 && (
        <BatchActionToolbar
          x={batchToolbar.x}
          y={batchToolbar.y}
          selectedCount={batchToolbar.count}
          onCopy={() => { /* TODO */ }}
          onDelete={() => {
            const lf = lfRef.current
            if (lf) {
              selectedNodeIds.value.forEach(id => { try { lf.deleteNode(id) } catch (e) { } })
              hideBatchToolbar()
            }
          }}
          onToggleEnable={() => { /* TODO */ }}
          onGroup={() => { /* TODO */ }}
        />
      )}

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 4, zIndex: 5,
      }}>
        <CanvasControlBtn icon={ZoomOut} title="缩小" onClick={handleZoomOut} />
        <CanvasControlBtn icon={ZoomIn} title="放大" onClick={handleZoomIn} />
        <CanvasControlBtn icon={RotateCcw} title="重置" onClick={handleZoomReset} />
      </div>
    </div>
  )
}

function CanvasControlBtn({ icon: Icon, title, onClick }) {
  return (
    <button
      onClick={onClick} title={title} aria-label={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, border: '1px solid var(--rf-border)',
        borderRadius: 'var(--rf-radius-sm)', background: 'var(--rf-bg-primary)',
        color: 'var(--rf-text-secondary)', cursor: 'pointer', boxShadow: 'var(--rf-shadow-sm)',
      }}
    >
      <Icon size={14} />
    </button>
  )
}
