import { FileText, Pin, ExternalLink, Pencil } from 'lucide-preact'
import type { PanelMode } from '../../types/editor'
import { selectedNodeId, panelMode, setPanelMode, lfInstance } from '../../store'
import { t } from '../../i18n'
import s from './RightPanel.module.css'
import { EdgeRelations } from './EdgeRelations'

/** Panel mode options */
const PANEL_MODES = [
  { key: 'fixed', icon: Pin, label: '固定' },
  { key: 'floating', icon: ExternalLink, label: '浮动' },
  { key: 'inline', icon: Pencil, label: '内联' },
]

/**
 * Properties panel tab — displays node properties when a node is selected.
 */
export function PropertiesTab() {
  const nodeId = selectedNodeId.value
  const currentMode = panelMode.value

  if (!nodeId) {
    return (
      <div
        class="rf-content"
        style={{
          textAlign: 'center',
          color: 'var(--rf-text-tertiary)',
          paddingTop: 'var(--rf-space-10)',
        }}
      >
        <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--rf-text-sm)' }}>选择节点查看属性</div>
      </div>
    )
  }

  // Get node data from LogicFlow
  const lf = lfInstance.value
  let nodeData: {
    text: string
    nodeType: string
    priority: number
    enabled: boolean
    summary: string
  } | null = null
  if (lf) {
    try {
      const model = lf.getNodeModelById(nodeId)
      if (model) {
        nodeData = {
          text: typeof model.text === 'object' ? model.text.value : model.text,
          nodeType: (model.properties?.nodeType as string) || 'action',
          priority: (model.properties?.priority as number) ?? 1,
          enabled: model.properties?.enabled !== false,
          summary: (model.properties?.summary as string) || '',
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[RuleFlow] node data lookup failed:', e)
    }
  }

  if (!nodeData) {
    return (
      <div
        class="rf-content"
        style={{
          textAlign: 'center',
          color: 'var(--rf-text-tertiary)',
          paddingTop: 'var(--rf-space-10)',
        }}
      >
        <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--rf-text-sm)' }}>选择节点查看属性</div>
      </div>
    )
  }

  return (
    <div class="rf-content">
      {/* Panel mode switcher */}
      <div class={s.modeSwitcher}>
        {PANEL_MODES.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setPanelMode(key as PanelMode)}
            class={`${s.modeBtn} ${currentMode === key ? s.modeBtnActive : ''}`}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {/* Basic config */}
      <div class="rf-section-title">
        <FileText size={12} />
        {t('panel.basicConfig')}
      </div>

      <div class="rf-field-group">
        <div class="rf-field-row">
          <span class="rf-field-label">节点名称</span>
        </div>
        <input class="rf-input" value={nodeData.text} readOnly />

        <div class="rf-field-row">
          <span class="rf-field-label">优先级</span>
          <span
            style={{
              fontSize: 'var(--rf-text-sm)',
              color: 'var(--rf-text-primary)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span class={s.priorityBadge}>P:{nodeData.priority}</span>
          </span>
        </div>

        <div class="rf-field-row">
          <span class="rf-field-label">{t('node.enabled')}</span>
          <div
            onClick={() => {
              if (lf && nodeId) {
                const model = lf.getNodeModelById(nodeId)
                if (model) {
                  model.setProperties({
                    ...model.properties,
                    enabled: !nodeData!.enabled,
                  })
                }
              }
            }}
            class={s.toggleTrack}
            style={{
              background: nodeData.enabled ? 'var(--rf-status-success)' : 'var(--rf-text-tertiary)',
            }}
          >
            <div
              class={`${s.toggleThumb} ${nodeData.enabled ? s.toggleThumbOn : s.toggleThumbOff}`}
            />
          </div>
        </div>
      </div>

      {/* Connections */}
      <EdgeRelations nodeId={nodeId} />
    </div>
  )
}
