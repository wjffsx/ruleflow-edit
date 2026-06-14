import { LayoutGrid, Grid3X3, Grid2X2 } from 'lucide-preact'
import { lfInstance } from '../../store'
import { showSuccess, showWarning } from '../../services'
import { t } from '../../i18n'
import { RuleFlowError, ERROR_CODES } from '../../utils'
import { ToolbarBtn } from './ToolbarBtn'

export function LayoutGroup() {
  return (
    <div class="flex items-center gap-px">
      <ToolbarBtn
        icon={LayoutGrid}
        title={t('toolbar.autolayout')}
        onClick={() => {
          const lf = lfInstance.value
          if (!lf) return
          try {
            const data = lf.getGraphData() as any
            const nodes: any[] = data?.nodes || []
            const edges: any[] = data?.edges || []
            if (nodes.length === 0) return

            // Build adjacency for topological layering
            const nodeMap = new Map(nodes.map((n) => [n.id, n]))
            const inDeg = new Map(nodes.map((n) => [n.id, 0]))
            const children = new Map(nodes.map((n) => [n.id, [] as string[]]))
            edges.forEach((e) => {
              if (nodeMap.has(e.sourceNodeId) && nodeMap.has(e.targetNodeId)) {
                inDeg.set(e.targetNodeId, (inDeg.get(e.targetNodeId) || 0) + 1)
                children.get(e.sourceNodeId)?.push(e.targetNodeId)
              }
            })

            // Assign layers via BFS
            const layer = new Map<string, number>()
            const queue = nodes.filter((n) => (inDeg.get(n.id) || 0) === 0).map((n) => n.id)
            queue.forEach((id: string) => layer.set(id, 0))
            const visited = new Set(queue)
            let q = [...queue]
            while (q.length) {
              const next: string[] = []
              for (const id of q) {
                for (const cid of children.get(id) || []) {
                  const newLayer = (layer.get(id) || 0) + 1
                  if (!visited.has(cid) || newLayer > (layer.get(cid) || 0)) {
                    layer.set(cid, newLayer)
                    if (!visited.has(cid)) {
                      visited.add(cid)
                      next.push(cid)
                    }
                  }
                }
              }
              q = next
            }
            nodes.forEach((n) => {
              if (!layer.has(n.id)) layer.set(n.id, 0)
            })

            // Group by layer, then arrange
            const layers = new Map<number, any[]>()
            nodes.forEach((n) => {
              const l = layer.get(n.id) || 0
              if (!layers.has(l)) layers.set(l, [])
              layers.get(l)!.push(n)
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
            showSuccess('自动布局完成')
          } catch (_e) {
            showWarning('自动布局失败')
            if (import.meta.env.DEV)
              console.warn(new RuleFlowError('自动布局失败', ERROR_CODES.LAYOUT, { cause: _e }))
          }
        }}
      />
      <ToolbarBtn
        icon={Grid3X3}
        title="对齐网格"
        onClick={() => {
          const lf = lfInstance.value
          if (!lf) return
          try {
            const gridSize = 20
            const data = lf.getGraphData() as any
            const nodes: any[] = data?.nodes || []
            nodes.forEach((node) => {
              const snapX = Math.round(node.x / gridSize) * gridSize
              const snapY = Math.round(node.y / gridSize) * gridSize
              if (snapX !== node.x || snapY !== node.y) {
                lf.updateAttributes(node.id, { x: snapX, y: snapY })
              }
            })
          } catch (_e) {
            if (import.meta.env.DEV) console.warn('[RuleFlow] grid snap failed:', _e)
          }
        }}
      />
      <ToolbarBtn
        icon={Grid2X2}
        title="显示/隐藏网格"
        onClick={() => {
          const lf = lfInstance.value
          if (!lf) return
          try {
            const grid = lf.graphModel.grid as any
            if (grid) {
              grid.visible = !grid.visible
              ;(lf.graphModel.eventCenter as any).emit('graph:transform', grid)
            }
          } catch (_e) {
            if (import.meta.env.DEV) console.warn('[RuleFlow] grid visibility toggle failed:', _e)
            try {
              const model = lf.graphModel as any
              const curVisible = model.grid?.visible ?? true
              lf.graphModel.grid = { ...model.grid, visible: !curVisible }
            } catch (_e2) {
              if (import.meta.env.DEV)
                console.warn('[RuleFlow] grid visibility toggle failed:', _e2)
            }
          }
        }}
      />
    </div>
  )
}
