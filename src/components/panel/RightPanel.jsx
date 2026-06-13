import { h } from 'preact'
import { useState } from 'preact/hooks'
import { X, FileText, Bug, List, Pin, ExternalLink, Pencil, LogIn, LogOut, GitBranch, Play, Zap, Radio } from 'lucide-preact'
import {
  panelClosed, togglePanel, activePanelTab, setActivePanelTab,
  selectedNodeId, panelMode, chainName, setPanelMode,
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

// Mock data for demo
const MOCK_CONNECTIONS = [
  { relation: 'True', target: '值变换', colorVar: '--rf-relation-true' },
  { relation: 'False', target: '告警通知', colorVar: '--rf-relation-false' },
  { relation: 'Success', target: '调度下发', colorVar: '--rf-relation-success' },
]

function PropertiesTab() {
  const hasNode = selectedNodeId.value
  const currentMode = panelMode.value

  if (!hasNode) {
    return (
      <div style={{ ...contentStyle, textAlign: 'center', color: 'var(--rf-text-tertiary)', paddingTop: 'var(--rf-space-10)' }}>
        <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--rf-text-sm)' }}>选择节点查看属性</div>
      </div>
    )
  }

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
        <input style={inputStyle} value="SOC 监控" />

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
            }}>P:1</span>
          </span>
        </div>

        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>{t('node.enabled')}</span>
          <div style={{
            width: 32, height: 18, borderRadius: 'var(--rf-radius-full)',
            background: 'var(--rf-status-success)', position: 'relative', cursor: 'pointer',
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: 'var(--rf-radius-full)',
              background: '#fff', position: 'absolute', top: 2, right: 2, boxShadow: 'var(--rf-shadow-xs)',
            }} />
          </div>
        </div>
      </div>

      {/* Connections */}
      <div style={sectionTitleStyle}>
        <span style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--rf-brand-accent)' }} />
        {t('panel.connections')}
      </div>

      {MOCK_CONNECTIONS.map((conn, i) => (
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
      ))}

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
  input: LogIn,
  output: LogOut,
  condition: GitBranch,
  action: Play,
  dispatch: Radio,
}

function OutlineTab() {
  const outlineItems = [
    { icon: LogIn, name: '输入: soc', indent: 0, color: 'var(--rf-node-input)', id: 'input_soc' },
    { icon: LogIn, name: '输入: active_pw', indent: 0, color: 'var(--rf-node-input)', id: 'input_pw' },
    { icon: GitBranch, name: 'SOC 监控 (P:1)', indent: 0, color: 'var(--rf-node-condition)', id: 'cond_soc' },
    { icon: Zap, name: '值变换', indent: 1, color: 'var(--rf-node-action)', id: 'action_transform' },
    { icon: Zap, name: '告警通知', indent: 1, color: 'var(--rf-node-action)', id: 'action_alert' },
    { icon: Radio, name: '调度下发', indent: 0, color: 'var(--rf-node-action)', id: 'action_dispatch' },
    { icon: LogOut, name: '输出: dispatch', indent: 0, color: 'var(--rf-node-output)', id: 'output_dispatch' },
  ]

  return (
    <div style={contentStyle}>
      <div style={sectionTitleStyle}>
        <span>{chainName.value}</span>
      </div>
      {outlineItems.map((item, i) => {
        const IconComp = item.icon
        return (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--rf-space-2)',
              padding: '4px 0 4px ' + (item.indent * 16 + 4) + 'px',
              fontSize: 'var(--rf-text-sm)', color: 'var(--rf-text-primary)',
              cursor: 'pointer', borderRadius: 'var(--rf-radius-sm)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rf-bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => { selectedNodeId.value = item.id }}
          >
            <IconComp size={14} style={{ color: item.color, flexShrink: 0 }} aria-hidden="true" />
            <span style={{ flex: 1 }}>{item.name}</span>
            <div style={{ width: 3, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
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
