import { FileText, Bug, List, PanelRight, PanelRightClose } from 'lucide-preact'
import { panelClosed, togglePanel, activePanelTab, setActivePanelTab } from '../../store'
import { DebugPanel } from './DebugPanel'
import { PropertiesTab } from './PropertiesTab'
import { OutlineTab } from './OutlineTab'
import { t } from '../../i18n'
import s from './RightPanel.module.css'
import ls from '../../styles/layout.module.css'

const TABS = [
  { key: 'properties', label: t('panel.properties'), icon: FileText },
  { key: 'debug', label: t('panel.debug'), icon: Bug },
  { key: 'outline', label: t('panel.outline'), icon: List },
]

export function RightPanel() {
  const closed = panelClosed.value
  const activeTab = activePanelTab.value

  if (closed) {
    return (
      <aside
        class={ls.panel}
        style={{
          width: 'var(--sidebar-collapsed-width)',
          borderLeft: 'none',
          borderRight: '1px solid var(--rf-border)',
        }}
        role="complementary"
        aria-label="属性面板"
      >
        <button onClick={togglePanel} class={s.expandBtn} title="展开面板" aria-label="展开面板">
          <PanelRight size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside class={ls.panel} role="complementary" aria-label="属性面板">
      {/* Tab header */}
      <div class={s.header}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            class={`${s.tab} ${activeTab === key ? s.tabActive : ''}`}
            onClick={() => setActivePanelTab(key as any)}
            role="tab"
            aria-selected={activeTab === key}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
        <button class={s.closeBtn} onClick={togglePanel} title="折叠面板" aria-label="折叠面板">
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Tab content */}
      <div role="tabpanel" class={s.tabContent}>
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'debug' && <DebugPanel />}
        {activeTab === 'outline' && <OutlineTab />}
      </div>
    </aside>
  )
}
