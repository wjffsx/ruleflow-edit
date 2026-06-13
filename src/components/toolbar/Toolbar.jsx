import { h } from 'preact'
import {
  FilePlus, FolderOpen, Save, ChevronDown,
  Undo2, Redo2,
  Play, Square, RotateCcw,
  Maximize, List, Map,
  LayoutGrid, Grid3X3, Grid2X2,
  Copy, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-preact'
import {
  canUndo, canRedo, selectedNodeId, canvasStatus, setCanvasStatus,
  isDebugRunning, startDebug, stopDebug, isDebugPaused, pauseDebug, resumeDebug,
  togglePanel, setActivePanelTab, panelClosed,
  lfInstance, chainName, nodeCount, edgeCount,
} from '../../store/editorStore'
import { t } from '../../i18n'

const toolbarStyle = {
  gridArea: 'toolbar',
  display: 'flex',
  alignItems: 'center',
  height: 'var(--toolbar-height)',
  padding: '0 var(--rf-space-2)',
  background: 'var(--rf-bg-primary)',
  borderBottom: '1px solid var(--rf-border)',
  gap: '2px',
  zIndex: 'var(--rf-z-toolbar)',
  overflow: 'hidden',
}

const groupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1px',
}

const dividerStyle = {
  width: 1,
  height: 20,
  background: 'var(--rf-border)',
  margin: '0 var(--rf-space-2)',
  flexShrink: 0,
}

const btnBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  height: 30,
  minWidth: 30,
  padding: '0 6px',
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-secondary)',
  borderRadius: 'var(--rf-radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--rf-text-xs)',
  fontFamily: 'var(--rf-font-sans)',
  transition: 'all var(--rf-duration-fast) var(--rf-ease-default)',
  whiteSpace: 'nowrap',
}

const labelStyle = {
  fontSize: 'var(--rf-text-2xs)',
  color: 'var(--rf-text-tertiary)',
  padding: '0 var(--rf-space-2)',
  whiteSpace: 'nowrap',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
}

const spacerStyle = { flex: 1 }

function ToolbarBtn({ icon: Icon, label, title, onClick, active, disabled }) {
  return (
    <button
      style={{
        ...btnBase,
        ...(active ? { background: 'var(--rf-brand-primary-light)', color: 'var(--rf-brand-primary)' } : {}),
        ...(disabled ? { opacity: 0.4, cursor: 'default' } : {}),
      }}
      title={title || label}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={!disabled ? (e) => {
        e.currentTarget.style.background = active ? 'var(--rf-brand-primary-light)' : 'var(--rf-bg-hover)'
        e.currentTarget.style.color = 'var(--rf-text-primary)'
      } : undefined}
      onMouseLeave={!disabled ? (e) => {
        e.currentTarget.style.background = active ? 'var(--rf-brand-primary-light)' : 'transparent'
        e.currentTarget.style.color = active ? 'var(--rf-brand-primary)' : 'var(--rf-text-secondary)'
      } : undefined}
    >
      {Icon && <Icon size={14} />}
      {label && <span>{label}</span>}
    </button>
  )
}

export function Toolbar() {
  const isRunning = canvasStatus.value === 'running'

  return (
    <div style={toolbarStyle} role="toolbar" aria-label="工具栏">
      {/* File group */}
      <span style={labelStyle}>{t('toolbar.file')}</span>
      <div style={groupStyle}>
        <ToolbarBtn icon={FilePlus} title={t('toolbar.new')} onClick={() => {
          const lf = lfInstance
          if (lf) {
            lf.clearData()
            lf.render({ nodes: [], edges: [] })
            chainName.value = '未命名规则链'
            nodeCount.value = 0
            edgeCount.value = 0
          }
        }} />
        <ToolbarBtn icon={FolderOpen} title={t('toolbar.open')} />
        <ToolbarBtn icon={Save} title={t('toolbar.save')} />
      </div>

      <div style={dividerStyle} />

      {/* Edit group */}
      <span style={labelStyle}>{t('toolbar.edit')}</span>
      <div style={groupStyle}>
        <ToolbarBtn icon={Undo2} title={t('toolbar.undo')} disabled={!canUndo.value} />
        <ToolbarBtn icon={Redo2} title={t('toolbar.redo')} disabled={!canRedo.value} />
      </div>

      <div style={dividerStyle} />

      {/* Run group */}
      <span style={labelStyle}>{t('toolbar.run')}</span>
      <div style={groupStyle}>
        <ToolbarBtn
          icon={Play}
          title={t('toolbar.start')}
          active={isRunning}
          onClick={() => { startDebug() }}
        />
        <ToolbarBtn
          icon={Square}
          title={t('toolbar.stop')}
          onClick={() => { stopDebug() }}
        />
        <ToolbarBtn icon={RotateCcw} title={t('toolbar.reset')} />
      </div>

      <div style={dividerStyle} />

      {/* View group */}
      <span style={labelStyle}>{t('toolbar.view')}</span>
      <div style={groupStyle}>
        <ToolbarBtn icon={Maximize} title={t('toolbar.fullscreen')} onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
        }} />
        <ToolbarBtn icon={List} title={t('toolbar.outline')} onClick={() => { if (panelClosed.value) togglePanel(); setActivePanelTab('outline'); }} />
        <ToolbarBtn icon={Map} title={t('toolbar.minimap')} onClick={() => {
          const lf = lfInstance
          if (!lf) return
          try {
            const minimap = lf.extension.miniMap
            if (minimap) {
              if (minimap.isShow) { minimap.hide() } else { minimap.show(0, 0) }
            }
          } catch (e) { /* MiniMap plugin may not support show/hide */ }
        }} />
      </div>

      <div style={dividerStyle} />

      {/* Layout group */}
      <span style={labelStyle}>{t('toolbar.layout')}</span>
      <div style={groupStyle}>
        <ToolbarBtn icon={LayoutGrid} title={t('toolbar.autolayout')} onClick={() => {
          const lf = lfInstance
          if (!lf) return
          try {
            const data = lf.getGraphData()
            const nodes = data?.nodes || []
            const edges = data?.edges || []
            if (nodes.length === 0) return

            // Build adjacency for topological layering
            const nodeMap = new Map(nodes.map(n => [n.id, n]))
            const inDeg = new Map(nodes.map(n => [n.id, 0]))
            const children = new Map(nodes.map(n => [n.id, []]))
            edges.forEach(e => {
              if (nodeMap.has(e.sourceNodeId) && nodeMap.has(e.targetNodeId)) {
                inDeg.set(e.targetNodeId, (inDeg.get(e.targetNodeId) || 0) + 1)
                children.get(e.sourceNodeId)?.push(e.targetNodeId)
              }
            })

            // Assign layers via BFS (longest path for proper layering)
            const layer = new Map()
            const queue = nodes.filter(n => (inDeg.get(n.id) || 0) === 0).map(n => n.id)
            queue.forEach(id => layer.set(id, 0))
            const visited = new Set(queue)
            let q = [...queue]
            while (q.length) {
              const next = []
              for (const id of q) {
                for (const cid of (children.get(id) || [])) {
                  const newLayer = (layer.get(id) || 0) + 1
                  if (!visited.has(cid) || newLayer > (layer.get(cid) || 0)) {
                    layer.set(cid, newLayer)
                    if (!visited.has(cid)) { visited.add(cid); next.push(cid) }
                  }
                }
              }
              q = next
            }
            // Handle unvisited nodes (disconnected)
            nodes.forEach(n => { if (!layer.has(n.id)) layer.set(n.id, 0) })

            // Group by layer, then arrange
            const layers = new Map()
            nodes.forEach(n => {
              const l = layer.get(n.id) || 0
              if (!layers.has(l)) layers.set(l, [])
              layers.get(l).push(n)
            })

            const colWidth = 280
            const rowHeight = 120
            const sortedLayers = [...layers.entries()].sort((a, b) => a[0] - b[0])
            sortedLayers.forEach(([, layerNodes]) => {
              layerNodes.forEach((node, i) => {
                lf.updateAttributes(node.id, {
                  x: 150 + (layer.get(node.id) || 0) * colWidth,
                  y: 150 + i * rowHeight,
                })
              })
            })
          } catch (e) { /* ignore */ }
        }} />
        <ToolbarBtn icon={Grid3X3} title="对齐网格" onClick={() => {
          const lf = lfInstance
          if (!lf) return
          try {
            const gridSize = 20
            const data = lf.getGraphData()
            const nodes = data?.nodes || []
            nodes.forEach(node => {
              const snapX = Math.round(node.x / gridSize) * gridSize
              const snapY = Math.round(node.y / gridSize) * gridSize
              if (snapX !== node.x || snapY !== node.y) {
                lf.updateAttributes(node.id, { x: snapX, y: snapY })
              }
            })
          } catch (e) { /* ignore */ }
        }} />
        <ToolbarBtn icon={Grid2X2} title="显示/隐藏网格" onClick={() => {
          const lf = lfInstance
          if (!lf) return
          try {
            const grid = lf.graphModel.grid
            if (grid) {
              grid.visible = !grid.visible
              lf.graphModel.eventCenter.emit('graph:transform', grid)
            }
          } catch (e) {
            // Fallback: toggle grid via re-render
            try {
              const model = lf.graphModel
              const curVisible = model.grid?.visible ?? true
              lf.graphModel.grid = { ...model.grid, visible: !curVisible }
            } catch (e2) { /* ignore */ }
          }
        }} />
      </div>

      <div style={spacerStyle} />

      {/* Context actions (visible when node selected) */}
      {selectedNodeId.value && (
        <div style={groupStyle}>
          <div style={dividerStyle} />
          <ToolbarBtn icon={Copy} title="复制" />
          <ToolbarBtn icon={Trash2} title="删除" onClick={() => {
            const lf = lfInstance
            if (lf && selectedNodeId.value) {
              try { lf.deleteNode(selectedNodeId.value) } catch (e) { /* ignore */ }
              selectedNodeId.value = null
            }
          }} />
          <ToolbarBtn icon={ToggleLeft} title="启用/禁用" />
        </div>
      )}
    </div>
  )
}
