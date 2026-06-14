import { FileText, Bug, List, PanelRight, PanelRightClose } from 'lucide-preact'
import type { ComponentChild } from 'preact'
import { panelClosed, togglePanel, activePanelTab, setActivePanelTab } from '../../store'
import { DebugPanel } from './DebugPanel'
import { PropertiesTab } from './PropertiesTab'
import { OutlineTab } from './OutlineTab'
import { t } from '../../i18n'

const TABS = [
  { key: 'properties', label: t('panel.properties'), icon: FileText },
  { key: 'debug', label: t('panel.debug'), icon: Bug },
  { key: 'outline', label: t('panel.outline'), icon: List },
]

interface RightPanelProps {
  /** Custom property renderer for selected node */
  propertyRenderer?: (node: unknown, onChange: (updated: unknown) => void) => ComponentChild
}

export function RightPanel({ propertyRenderer }: RightPanelProps = {}) {
  const closed = panelClosed.value
  const activeTab = activePanelTab.value

  if (closed) {
    return (
      <aside
        class="flex flex-col h-full bg-[var(--rf-bg-primary)] border-l border-[var(--rf-border)] overflow-hidden transition-[width] duration-[var(--rf-duration-normal)] font-[var(--rf-font-sans)]"
        style={{
          gridArea: 'panel',
          width: 'var(--sidebar-collapsed-width)',
          borderLeft: 'none',
          borderRight: '1px solid var(--rf-border)',
        }}
        role="complementary"
        aria-label="属性面板"
      >
        <button
          onClick={togglePanel}
          class="flex items-center justify-center w-full h-12 border-none bg-transparent text-[var(--rf-text-tertiary)] cursor-pointer"
          title="展开面板"
          aria-label="展开面板"
        >
          <PanelRight size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside
      class="flex flex-col h-full bg-[var(--rf-bg-primary)] border-l border-[var(--rf-border)] overflow-hidden transition-[width] duration-[var(--rf-duration-normal)] font-[var(--rf-font-sans)]"
      style={{ gridArea: 'panel' }}
      role="complementary"
      aria-label="属性面板"
    >
      {/* Tab header */}
      <div class="flex items-center border-b border-[var(--rf-border-light)] shrink-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            class={`flex items-center gap-1 px-3.5 py-2.5 border-none bg-transparent text-[var(--rf-text-sm)] font-normal cursor-pointer font-[var(--rf-font-sans)] border-b-2 border-transparent transition-all duration-[var(--rf-duration-fast)] ${activeTab === key ? 'text-[var(--rf-brand-primary)] font-semibold border-b-[var(--rf-brand-primary)] hover:text-[var(--rf-brand-primary)] hover:bg-transparent' : 'text-[var(--rf-text-secondary)] hover:text-[var(--rf-text-primary)] hover:bg-[var(--rf-bg-hover)]'}`}
            onClick={() => setActivePanelTab(key as any)}
            role="tab"
            aria-selected={activeTab === key}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
        <button
          class="flex items-center justify-center w-7 h-7 border-none bg-transparent text-[var(--rf-text-tertiary)] cursor-pointer rounded-[var(--rf-radius-sm)] ml-auto shrink-0 hover:bg-[var(--rf-bg-hover)]"
          onClick={togglePanel}
          title="折叠面板"
          aria-label="折叠面板"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Tab content */}
      <div role="tabpanel" class="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'properties' && <PropertiesTab propertyRenderer={propertyRenderer} />}
        {activeTab === 'debug' && <DebugPanel />}
        {activeTab === 'outline' && <OutlineTab />}
      </div>
    </aside>
  )
}
