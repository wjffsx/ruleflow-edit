import { h } from 'preact'
import { useState } from 'preact/hooks'
import { Search, ChevronDown, Zap } from 'lucide-preact'
import { ThemeToggle } from '../../theme'
import { chainName, showCommandPalette } from '../../store'
import { t } from '../../i18n'

/** 导航栏组件 */
export function Navbar() {
  const [chainDropdown, setChainDropdown] = useState(false)

  return (
    <header
      class="flex items-center h-[var(--navbar-height)] px-[var(--rf-space-4)] bg-[var(--rf-bg-secondary)] border-b border-[var(--rf-border)] gap-[var(--rf-space-4)] z-[var(--rf-z-toolbar)]"
      style={{ gridArea: 'navbar' }}
      role="banner"
    >
      {/* Brand */}
      <div
        class="flex items-center gap-[var(--rf-space-2)] font-semibold text-[var(--rf-text-md)] text-[var(--rf-brand-primary)] whitespace-nowrap cursor-pointer"
        onClick={() => {}}
      >
        <Zap size={18} style={{ color: 'var(--rf-brand-primary)' }} />
        <span>{t('nav.brand')}</span>
      </div>

      {/* Chain Selector */}
      <button
        class="flex items-center gap-[var(--rf-space-1)] py-1 px-2.5 border border-[var(--rf-border)] rounded-[var(--rf-radius-sm)] bg-[var(--rf-bg-primary)] text-[var(--rf-text-primary)] text-[var(--rf-text-sm)] cursor-pointer font-[var(--rf-font-sans)]"
        onClick={() => setChainDropdown(!chainDropdown)}
        aria-label="选择规则链"
      >
        <span>{chainName.value}</span>
        <ChevronDown size={12} />
      </button>

      {/* Breadcrumb */}
      <nav
        class="flex items-center gap-[var(--rf-space-2)] text-[var(--rf-text-xs)] text-[var(--rf-text-tertiary)]"
        aria-label="面包屑导航"
      >
        <span>首页</span>
        <span>/</span>
        <span>项目</span>
        <span>/</span>
        <span class="text-[var(--rf-text-primary)] font-medium">{chainName.value}</span>
      </nav>

      <div class="flex-1" />

      {/* Right actions */}
      <button
        class="flex items-center justify-center w-7 h-7 border-none bg-transparent text-[var(--rf-text-secondary)] cursor-pointer rounded-[var(--rf-radius-sm)] p-0 shrink-0 hover:bg-[var(--rf-bg-hover)]"
        title={t('nav.search')}
        aria-label={t('nav.search')}
        onClick={showCommandPalette}
      >
        <Search size={16} />
      </button>

      <ThemeToggle />
    </header>
  )
}
