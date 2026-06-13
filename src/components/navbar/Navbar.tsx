import { h } from 'preact'
import { useState } from 'preact/hooks'
import { Search, ChevronDown, Zap } from 'lucide-preact'
import { ThemeToggle } from '../../theme'
import { chainName, showCommandPalette } from '../../store'
import { t } from '../../i18n'
import s from '../../styles/layout.module.css'

/** 导航栏组件 */
export function Navbar() {
  const [chainDropdown, setChainDropdown] = useState(false)

  return (
    <header class={s.navbar} role="banner">
      {/* Brand */}
      <div class={s.brand} onClick={() => {}}>
        <Zap size={18} style={{ color: 'var(--rf-brand-primary)' }} />
        <span>{t('nav.brand')}</span>
      </div>

      {/* Chain Selector */}
      <button
        class={s.chainSelector}
        onClick={() => setChainDropdown(!chainDropdown)}
        aria-label="选择规则链"
      >
        <span>{chainName.value}</span>
        <ChevronDown size={12} />
      </button>

      {/* Breadcrumb */}
      <nav class={s.breadcrumb} aria-label="面包屑导航">
        <span>首页</span>
        <span>/</span>
        <span>项目</span>
        <span>/</span>
        <span class={s.breadcrumbActive}>{chainName.value}</span>
      </nav>

      <div class={s.spacer} />

      {/* Right actions */}
      <button
        class={s.iconBtn}
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
