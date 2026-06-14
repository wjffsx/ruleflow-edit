import { FileText, Pin, ExternalLink, Pencil } from 'lucide-preact'
import type { ComponentChild } from 'preact'
import type { PanelMode } from '../../types/editor'
import { selectedNodeId, panelMode, setPanelMode, lfInstance } from '../../store'
import { t } from '../../i18n'
import { EdgeRelations } from './EdgeRelations'

/** Panel mode options */
const PANEL_MODES = [
  { key: 'fixed', icon: Pin, label: '固定' },
  { key: 'floating', icon: ExternalLink, label: '浮动' },
  { key: 'inline', icon: Pencil, label: '内联' },
]

interface PropertiesTabProps {
  /** Custom property renderer for selected node */
  propertyRenderer?: (node: unknown, onChange: (updated: unknown) => void) => ComponentChild
  /** Read-only mode — disables property editing */
  readOnly?: boolean
}

/**
 * Properties panel tab — displays node properties when a node is selected.
 */
export function PropertiesTab({ propertyRenderer, readOnly = false }: PropertiesTabProps = {}) {
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

  // Use custom property renderer if provided
  if (propertyRenderer) {
    const handleNodeChange = (updated: unknown) => {
      if (lf && nodeId) {
        const model = lf.getNodeModelById(nodeId)
        if (model && updated && typeof updated === 'object') {
          model.setProperties({ ...model.properties, ...(updated as Record<string, unknown>) })
        }
      }
    }
    return <div class="rf-content">{propertyRenderer(nodeData, handleNodeChange)}</div>
  }

  return (
    <div class="rf-content">
      {/* Panel mode switcher */}
      <div class="flex gap-1 mb-[var(--rf-space-4)]">
        {PANEL_MODES.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setPanelMode(key as PanelMode)}
            class={`flex items-center gap-1 px-2 py-1 border border-[var(--rf-border)] rounded-[var(--rf-radius-sm)] bg-transparent text-[var(--rf-text-secondary)] cursor-pointer text-[var(--rf-text-2xs)] font-[var(--rf-font-sans)] hover:bg-[var(--rf-bg-hover)] ${currentMode === key ? 'border-[var(--rf-brand-primary)] bg-[var(--rf-brand-primary-light)] text-[var(--rf-brand-primary)] hover:bg-[var(--rf-brand-primary-light)]' : ''}`}
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
            <span class="px-2 py-0.5 rounded-[var(--rf-radius-sm)] bg-[var(--rf-brand-primary-light)] text-[var(--rf-brand-primary)] text-[var(--rf-text-xs)] font-semibold">
              P:{nodeData.priority}
            </span>
          </span>
        </div>

        <div class="rf-field-row">
          <span class="rf-field-label">{t('node.enabled')}</span>
          <div
            onClick={() => {
              if (readOnly) return
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
            class="w-8 h-[18px] rounded-[var(--rf-radius-full)] relative cursor-pointer transition-[background] duration-[var(--rf-duration-fast)]"
            style={{
              background: nodeData.enabled ? 'var(--rf-status-success)' : 'var(--rf-text-tertiary)',
            }}
          >
            <div
              class={`w-3.5 h-3.5 rounded-[var(--rf-radius-full)] bg-white absolute top-[2px] shadow-[var(--rf-shadow-xs)] ${nodeData.enabled ? 'right-[2px]' : 'left-[2px]'}`}
            />
          </div>
        </div>
      </div>

      {/* Connections */}
      <EdgeRelations nodeId={nodeId} />
    </div>
  )
}
