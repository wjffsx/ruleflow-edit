import { h } from 'preact'
import { useState } from 'preact/hooks'
import { X, FileText, Bug, List, Pin, ExternalLink, Pencil, LogIn, LogOut, GitBranch, Play, Zap, Radio, Puzzle, Link, ArrowLeftRight, MessageSquare } from 'lucide-preact'
import {
  panelClosed, togglePanel, activePanelTab, setActivePanelTab,
  selectedNodeId, panelMode, chainName, setPanelMode,
  outlineNodes, lfInstance,
} from '../../store/editorStore'
import { DebugPanel } from './DebugPanel'
import { t } from '../../i18n'

const panelStyle = {
  gridArea: 'panel',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'var(--rf-bg-primary)',
  borderLeft: '1px solid var(--rf-border)',
  overflow: 'hidden',
  transition: 'width var(--rf-duration-normal) var(--rf-ease-default)',
  fontFamily: 'var(--rf-font-sans)',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  borderBottom: '1px solid var(--rf-border-light)',
  flexShrink: 0,
}

const tabStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '10px 14px',
  border: 'none',
  background: 'transparent',
  color: active ? 'var(--rf-brand-primary)' : 'var(--rf-text-secondary)',
  fontSize: 'var(--rf-text-sm)',
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  fontFamily: 'var(--rf-font-sans)',
  borderBottom: active ? '2px solid var(--rf-brand-primary)' : '2px solid transparent',
  transition: 'all var(--rf-duration-fast)',
})

const closeBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-tertiary)',
  cursor: 'pointer',
  borderRadius: 'var(--rf-radius-sm)',
  marginLeft: 'auto',
  flexShrink: 0,
}

const contentStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: 'var(--rf-space-4)',
}

const sectionTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2)',
  fontSize: 'var(--rf-text-xs)',
  fontWeight: 600,
  color: 'var(--rf-text-secondary)',
  marginBottom: 'var(--rf-space-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const fieldGroupStyle = {
  marginBottom: 'var(--rf-space-4)',
}

const fieldRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'var(--rf-space-2) 0',
  borderBottom: '1px solid var(--rf-border-light)',
}

const fieldLabelStyle = {
  fontSize: 'var(--rf-text-sm)',
  color: 'var(--rf-text-secondary)',
}

const inputStyle = {
  width: '100%',
  height: 28,
  padding: '0 var(--rf-space-2)',
  border: '1px solid var(--rf-border)',
  borderRadius: 'var(--rf-radius-sm)',
  background: 'var(--rf-bg-secondary)',
  color: 'var(--rf-text-primary)',
  fontSize: 'var(--rf-text-sm)',
  fontFamily: 'var(--rf-font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
}

const connectionItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2)',
  padding: 'var(--rf-space-2)',
  borderRadius: 'var(--rf-radius-sm)',
  marginBottom: 4,
  fontSize: 'var(--rf-text-sm)',
}

const tabs = [
  { key: 'properties', label: t('panel.properties'), icon: FileText },
  { key: 'debug', label: t('panel.debug'), icon: Bug },
  { key: 'outline', label: t('panel.outline'), icon: List },
]

// Panel mode options
const panelModes = [
  { key: 'fixed', icon: Pin, label: '固定' },
  { key: 'floating', icon: ExternalLink, label: '浮动' },
  { key: 'inline', icon: Pencil, label: '内联' },
]

// Relation type colors
const RELATION_COLORS = {
  True: '--rf-relation-true',
  False: '--rf-relation-false',
  Success: '--rf-relation-success',
  default: '--rf-border',
}

function PropertiesTab() {
  const nodeId = selectedNodeId.value
  const currentMode = panelMode.value

  if (!nodeId) {
    return (
      <div style={{ ...contentStyle, textAlign: 'center', color: 'var(--rf-text-tertiary)', paddingTop: 'var(--rf-space-10)' }}>
        <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--rf-text-sm)' }}>选择节点查看属性</div>
      </div>
    )
  }

  // Get node data from LogicFlow
  const lf = lfInstance.value
  let nodeData = null
  let outgoingEdges = []
  if (lf) {
    try {
      const model = lf.getNodeModelById(nodeId)
      if (model) {
        nodeData = {
          text: typeof model.text === 'object' ? model.text.value : model.text,
          nodeType: model.properties?.nodeType || 'action',
          priority: model.properties?.priority ?? 1,
          enabled: model.properties?.enabled !== false,
          summary: model.properties?.summary || '',
        }
      }
      // Get outgoing edges for connections
      const graphData = lf.getGraphData()
      outgoingEdges = (graphData.edges || []).filter(e => e.sourceNodeId === nodeId)
    } catch (e) { /* ignore */ }
  }

  if (!nodeData) {
    return (
      <div style={{ ...contentStyle, textAlign: 'center', color: 'var(--rf-text-tertiary)', paddingTop: 'var(--rf-space-10)' }}>
        <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--rf-text-sm)' }}>选择节点查看属性</div>
      </div>
    )
  }

  // Resolve target node names for connections
  const connections = outgoingEdges.map(edge => {
    const relationType = edge.properties?.relationType || 'default'
    let targetName = edge.targetNodeId
    if (lf) {
      try {
        const targetModel = lf.getNodeModelById(edge.targetNodeId)
        if (targetModel) {
          targetName = typeof targetModel.text === 'object' ? targetModel.text.value : targetModel.text
        }
      } catch (e) { /* ignore */ }
    }
    const colorVar = RELATION_COLORS[relationType] || RELATION_COLORS.default
    return { relation: relationType === 'default' ? '' : relationType, target: targetName, colorVar }
  }).filter(c => c.relation) // Only show labeled relations

  return (
    <div style={contentStyle}>
      {/* Panel mode switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--rf-space-4)' }}>
        {panelModes.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setPanelMode(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              border: '1px solid',
              borderColor: currentMode === key ? 'var(--rf-brand-primary)' : 'var(--rf-border)',
              borderRadius: 'var(--rf-radius-sm)',
              background: currentMode === key ? 'var(--rf-brand-primary-light)' : 'transparent',
              color: currentMode === key ? 'var(--rf-brand-primary)' : 'var(--rf-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--rf-text-2xs)',
              fontFamily: 'var(--rf-font-sans)',
            }}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {/* Basic config */}
      <div style={sectionTitleStyle}>
        <FileText size={12} />
        {t('panel.basicConfig')}
      </div>

      <div style={fieldGroupStyle}>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>节点名称</span>
        </div>
        <input style={inputStyle} value={nodeData.text} readOnly />

        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>优先级</span>
          <span style={{ fontSize: 'var(--rf-text-sm)', color: 'var(--rf-text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: 'var(--rf-radius-sm)',
              background: 'var(--rf-brand-primary-light)',
              color: 'var(--rf-brand-primary)',
              fontSize: 'var(--rf-text-xs)',
              fontWeight: 600,
            }}>P:{nodeData.priority}</span>
          </span>
        </div>

        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>{t('node.enabled')}</span>
          <div onClick={() => {
            if (lf && nodeId) {
              const model = lf.getNodeModelById(nodeId)
              if (model) {
                model.setProperties({
                  ...model.properties,
                  enabled: !nodeData.enabled
                })
              }
            }
          }} style={{
            width: 32, height: 18, borderRadius: 'var(--rf-radius-full)',
            background: nodeData.enabled ? 'var(--rf-status-success)' : 'var(--rf-text-tertiary)',
            position: 'relative', cursor: 'pointer',
            transition: 'background var(--rf-duration-fast)',
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: 'var(--rf-radius-full)',
              background: '#fff', position: 'absolute', top: 2,
              left: nodeData.enabled ? 'auto' : 2,
              right: nodeData.enabled ? 2 : 'auto',
              boxShadow: 'var(--rf-shadow-xs)',
              transition: 'left var(--rf-duration-fast), right var(--rf-duration-fast)',
            }} />
          </div>
        </div>
      </div>

      {/* Connections */}
      <div style={sectionTitleStyle}>
        <span style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--rf-brand-accent)' }} />
        {t('panel.connections')}
      </div>

      {connections.length > 0 ? connections.map((conn, i) => (
        <div key={i} style={{
          ...connectionItemStyle,
          background: `var(${conn.colorVar}-light)`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: 'var(--rf-radius-full)',
            background: `var(${conn.colorVar})`, flexShrink: 0,
          }} />
          <span style={{ color: `var(${conn.colorVar})`, fontWeight: 600, fontSize: 'var(--rf-text-xs)' }}>
            {conn.relation}
          </span>
          <span style={{ color: 'var(--rf-text-primary)' }}>→</span>
          <span style={{ color: 'var(--rf-text-primary)' }}>{conn.target}</span>
        </div>
      )) : (
        <div style={{ color: 'var(--rf-text-tertiary)', fontSize: 'var(--rf-text-sm)', padding: 'var(--rf-space-2) 0' }}>
          无连接关系
        </div>
      )}

      <button style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: 'var(--rf-space-2)',
        border: '1px dashed var(--rf-border)', borderRadius: 'var(--rf-radius-sm)',
        background: 'transparent', color: 'var(--rf-text-tertiary)', fontSize: 'var(--rf-text-sm)',
        cursor: 'pointer', width: '100%', justifyContent: 'center', fontFamily: 'var(--rf-font-sans)',
      }}>
        {t('panel.addRelation')}
      </button>
    </div>
  )
}

// v2.0: Outline items use Lucide icons instead of Emoji
const OUTLINE_ICON_MAP = {
  input_port: LogIn,
  output_port: LogOut,
  condition: GitBranch,
  action: Play,
  ext: Puzzle,
  flow: Link,
  note: MessageSquare,
}

const OUTLINE_COLOR_MAP = {
  input_port: 'var(--rf-node-input)',
  output_port: 'var(--rf-node-output)',
  condition: 'var(--rf-node-condition)',
  action: 'var(--rf-node-action)',
  ext: 'var(--rf-node-ext)',
  flow: 'var(--rf-node-subchain)',
  note: 'var(--rf-text-tertiary)',
}

function OutlineTab() {
  const nodes = outlineNodes.value

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ ...contentStyle, textAlign: 'center', color: 'var(--rf-text-tertiary)', paddingTop: 'var(--rf-space-10)' }}>
        <List size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--rf-text-sm)' }}>画布为空</div>
      </div>
    )
  }

  // Sort: input_port first, then condition, action, ext, flow, output_port last
  const typeOrder = { input_port: 0, condition: 1, action: 2, ext: 3, flow: 4, note: 5, output_port: 6 }
  const sorted = [...nodes].sort((a, b) => {
    const ta = typeOrder[a.properties?.nodeType] ?? 3
    const tb = typeOrder[b.properties?.nodeType] ?? 3
    return ta - tb
  })

  return (
    <div style={contentStyle}>
      <div style={sectionTitleStyle}>
        <span>{chainName.value}</span>
      </div>
      {sorted.map((node) => {
        const nodeType = node.properties?.nodeType || 'action'
        const IconComp = OUTLINE_ICON_MAP[nodeType] || Play
        const color = OUTLINE_COLOR_MAP[nodeType] || 'var(--rf-text-secondary)'
        const text = typeof node.text === 'object' ? node.text.value : node.text
        const priority = node.properties?.priority
        const priorityLabel = priority ? ` (P:${priority})` : ''
        const isSelected = selectedNodeId.value === node.id

        return (
          <div
            key={node.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--rf-space-2)',
              padding: '4px 6px',
              fontSize: 'var(--rf-text-sm)',
              color: isSelected ? 'var(--rf-brand-primary)' : 'var(--rf-text-primary)',
              cursor: 'pointer', borderRadius: 'var(--rf-radius-sm)',
              background: isSelected ? 'var(--rf-brand-primary-light)' : 'transparent',
              fontWeight: isSelected ? 500 : 400,
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--rf-bg-hover)' }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
            onClick={() => { selectedNodeId.value = node.id }}
          >
            <IconComp size={14} style={{ color, flexShrink: 0 }} aria-hidden="true" />
            <span style={{ flex: 1 }}>{text}{priorityLabel}</span>
            <div style={{ width: 3, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
          </div>
        )
      })}
    </div>
  )
}

export function RightPanel() {
  if (panelClosed.value) return null

  const activeTab = activePanelTab.value

  return (
    <aside style={panelStyle} role="complementary" aria-label="属性面板">
      {/* Tab header */}
      <div style={headerStyle}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            style={tabStyle(activeTab === key)}
            onClick={() => setActivePanelTab(key)}
            role="tab"
            aria-selected={activeTab === key}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
        <button
          style={closeBtnStyle}
          onClick={togglePanel}
          title="关闭面板"
          aria-label="关闭面板"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab content */}
      <div role="tabpanel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'debug' && <DebugPanel />}
        {activeTab === 'outline' && <OutlineTab />}
      </div>
    </aside>
  )
}
