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

/** Point type options */
const POINT_TYPES = ['analog', 'digital', 'counter', 'virtual'] as const
/** Data type options */
const DATA_TYPES = ['double', 'float32', 'int32', 'bool', 'string'] as const
/** Scope options for output ports */
const SCOPE_OPTIONS = ['per_device', 'global'] as const

interface PropertiesTabProps {
  /** Custom property renderer for selected node */
  propertyRenderer?: (node: unknown, onChange: (updated: unknown) => void) => ComponentChild
  /** Read-only mode — disables property editing */
  readOnly?: boolean
}

/** 更新节点属性的通用辅助函数 */
function updateNodeProperty(nodeId: string, key: string, value: unknown): void {
  const lf = lfInstance.value
  if (!lf) return
  try {
    const model = lf.getNodeModelById(nodeId)
    if (model) {
      model.setProperties({ ...model.properties, [key]: value })
    }
  } catch (_e) {
    /* ignore */
  }
}

/** 数据点配置编辑器（输入/输出端口专用） */
function PortPropertiesEditor({ nodeId, readOnly }: { nodeId: string; readOnly: boolean }) {
  const lf = lfInstance.value
  if (!lf) return null
  let props: Record<string, unknown> = {}
  let lfType = ''
  try {
    const model = lf.getNodeModelById(nodeId)
    if (model) {
      props = (model.properties as Record<string, unknown>) || {}
      // model.type 是 LogicFlow 注册类型：rf-input-port / rf-output-port
      lfType = (model as unknown as Record<string, unknown>).type as string || ''
    }
  } catch (_e) {
    return null
  }
  const isInput = lfType === 'rf-input-port'
  const isOutput = lfType === 'rf-output-port'
  if (!isInput && !isOutput) return null
  const setProp = (key: string, value: unknown) => updateNodeProperty(nodeId, key, value)

  return (
    <div>
      <div class="rf-section-title" style={{ marginTop: 'var(--rf-space-4)' }}>
        <FileText size={12} />
        数据点配置
      </div>
      <div class="rf-field-group">
        {/* pointName */}
        <div class="rf-field-row">
          <span class="rf-field-label">测点名称 (pointName)</span>
        </div>
        <input
          class="rf-input"
          value={(props.pointName as string) || ''}
          readOnly={readOnly}
          onInput={(e) => setProp('pointName', (e.target as HTMLInputElement).value)}
        />

        {/* displayName */}
        <div class="rf-field-row">
          <span class="rf-field-label">显示名称 (displayName)</span>
        </div>
        <input
          class="rf-input"
          value={(props.displayName as string) || ''}
          readOnly={readOnly}
          onInput={(e) => setProp('displayName', (e.target as HTMLInputElement).value)}
        />

        {/* pointType */}
        <div class="rf-field-row">
          <span class="rf-field-label">测点类型 (pointType)</span>
        </div>
        <select
          class="rf-input"
          value={(props.pointType as string) || 'analog'}
          disabled={readOnly}
          onChange={(e) => setProp('pointType', (e.target as HTMLSelectElement).value)}
        >
          {POINT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* dataType */}
        <div class="rf-field-row">
          <span class="rf-field-label">数据类型 (dataType)</span>
        </div>
        <select
          class="rf-input"
          value={(props.dataType as string) || 'double'}
          disabled={readOnly}
          onChange={(e) => setProp('dataType', (e.target as HTMLSelectElement).value)}
        >
          {DATA_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* unit */}
        <div class="rf-field-row">
          <span class="rf-field-label">单位 (unit)</span>
        </div>
        <input
          class="rf-input"
          value={(props.unit as string) || ''}
          readOnly={readOnly}
          onInput={(e) => setProp('unit', (e.target as HTMLInputElement).value)}
        />

        {/* group */}
        <div class="rf-field-row">
          <span class="rf-field-label">分组 (group)</span>
        </div>
        <input
          class="rf-input"
          value={(props.group as string) || ''}
          readOnly={readOnly}
          onInput={(e) => setProp('group', (e.target as HTMLInputElement).value)}
        />

        {/* 输出端口专属字段 */}
        {isOutput && (
          <>
            {/* scope */}
            <div class="rf-field-row">
              <span class="rf-field-label">作用域 (scope)</span>
            </div>
            <select
              class="rf-input"
              value={(props.scope as string) || 'per_device'}
              disabled={readOnly}
              onChange={(e) => setProp('scope', (e.target as HTMLSelectElement).value)}
            >
              {SCOPE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* inputPoints */}
            <div class="rf-field-row">
              <span class="rf-field-label">关联输入 (inputPoints)</span>
            </div>
            <input
              class="rf-input"
              value={((props.inputPoints as string[]) || []).join(', ')}
              readOnly={readOnly}
              placeholder="逗号分隔多个测点"
              onInput={(e) => {
                const val = (e.target as HTMLInputElement).value
                setProp('inputPoints', val ? val.split(',').map((s) => s.trim()) : [])
              }}
            />
          </>
        )}
      </div>
    </div>
  )
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

      {/* 端口节点数据点配置 */}
      <PortPropertiesEditor nodeId={nodeId} readOnly={readOnly} />

      {/* Connections */}
      <EdgeRelations nodeId={nodeId} />
    </div>
  )
}
