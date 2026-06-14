import type { EdgeData } from '@logicflow/core'
import { lfInstance } from '../../store'
import { t } from '../../i18n'

/** Relation type color CSS variable mapping */
const RELATION_COLORS: Record<string, string> = {
  True: '--rf-relation-true',
  False: '--rf-relation-false',
  Success: '--rf-relation-success',
  default: '--rf-border',
}

interface Connection {
  relation: string
  target: string
  colorVar: string
}

/** Edge relations section — displays outgoing connections for a node */
export function EdgeRelations({ nodeId }: { nodeId: string }) {
  const lf = lfInstance.value
  const connections: Connection[] = []

  if (lf) {
    try {
      const graphData = lf.getGraphData()
      const outgoingEdges: EdgeData[] = (graphData.edges || []).filter(
        (e: EdgeData) => e.sourceNodeId === nodeId,
      )
      for (const edge of outgoingEdges) {
        const relationType = (edge.properties?.relationType as string) || 'default'
        let targetName: string = edge.targetNodeId
        try {
          const targetModel = lf.getNodeModelById(edge.targetNodeId)
          if (targetModel) {
            targetName =
              typeof targetModel.text === 'object' ? targetModel.text.value : targetModel.text
          }
        } catch (_e) {
          // ignore target lookup failure
        }
        const colorVar = RELATION_COLORS[relationType] || RELATION_COLORS.default
        if (relationType !== 'default') {
          connections.push({
            relation: relationType,
            target: targetName,
            colorVar,
          })
        }
      }
    } catch (_e) {
      // ignore graph data lookup failure
    }
  }

  return (
    <>
      <div class="rf-section-title">
        <span class="w-[3px] h-3 rounded-sm bg-[var(--rf-brand-accent)]" />
        {t('panel.connections')}
      </div>

      {connections.length > 0 ? (
        connections.map((conn, i) => (
          <div
            key={i}
            class="flex items-center gap-[var(--rf-space-2)] p-[var(--rf-space-2)] rounded-[var(--rf-radius-sm)] mb-1 text-[var(--rf-text-sm)]"
            style={{ background: `var(${conn.colorVar}-light)` }}
          >
            <div
              class="w-1.5 h-1.5 rounded-[var(--rf-radius-full)] shrink-0"
              style={{ background: `var(${conn.colorVar})` }}
            />
            <span
              class="font-semibold text-[var(--rf-text-xs)]"
              style={{ color: `var(${conn.colorVar})` }}
            >
              {conn.relation}
            </span>
            <span style={{ color: 'var(--rf-text-primary)' }}>→</span>
            <span style={{ color: 'var(--rf-text-primary)' }}>{conn.target}</span>
          </div>
        ))
      ) : (
        <div class="text-[var(--rf-text-tertiary)] text-[var(--rf-text-sm)] py-[var(--rf-space-2)]">
          无连接关系
        </div>
      )}

      <button class="flex items-center gap-1 p-[var(--rf-space-2)] border border-dashed border-[var(--rf-border)] rounded-[var(--rf-radius-sm)] bg-transparent text-[var(--rf-text-tertiary)] text-[var(--rf-text-sm)] cursor-pointer w-full justify-center font-[var(--rf-font-sans)] hover:bg-[var(--rf-bg-hover)]">
        {t('panel.addRelation')}
      </button>
    </>
  )
}
