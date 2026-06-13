import type { EdgeData } from '@logicflow/core'
import { lfInstance } from '../../store'
import { t } from '../../i18n'
import s from './RightPanel.module.css'

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
        <span class={s.sectionAccentBar} />
        {t('panel.connections')}
      </div>

      {connections.length > 0 ? (
        connections.map((conn, i) => (
          <div
            key={i}
            class={s.connectionItem}
            style={{ background: `var(${conn.colorVar}-light)` }}
          >
            <div class={s.connectionDot} style={{ background: `var(${conn.colorVar})` }} />
            <span class={s.connectionLabel} style={{ color: `var(${conn.colorVar})` }}>
              {conn.relation}
            </span>
            <span style={{ color: 'var(--rf-text-primary)' }}>→</span>
            <span style={{ color: 'var(--rf-text-primary)' }}>{conn.target}</span>
          </div>
        ))
      ) : (
        <div class={s.noConnections}>无连接关系</div>
      )}

      <button class={s.addRelationBtn}>{t('panel.addRelation')}</button>
    </>
  )
}
