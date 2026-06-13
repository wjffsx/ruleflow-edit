import { h } from 'preact'
import { useState } from 'preact/hooks'
import { Search, Bell, ChevronDown, Zap, Wifi, WifiOff } from 'lucide-preact'
import { ThemeToggle } from '../../theme/ThemeToggle'
import { chainName, focusMode, toggleFocusMode, showCommandPalette } from '../../store/editorStore'
import { t } from '../../i18n'

const navbarStyle = {
  gridArea: 'navbar',
  display: 'flex',
  alignItems: 'center',
  height: 'var(--navbar-height)',
  padding: '0 var(--rf-space-4)',
  background: 'var(--rf-bg-secondary)',
  borderBottom: '1px solid var(--rf-border)',
  gap: 'var(--rf-space-4)',
  zIndex: 'var(--rf-z-toolbar)',
}

const brandStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2)',
  fontWeight: 600,
  fontSize: 'var(--rf-text-md)',
  color: 'var(--rf-brand-primary)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}

const chainSelectorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-1)',
  padding: '4px 10px',
  border: '1px solid var(--rf-border)',
  borderRadius: 'var(--rf-radius-sm)',
  background: 'var(--rf-bg-primary)',
  color: 'var(--rf-text-primary)',
  fontSize: 'var(--rf-text-sm)',
  cursor: 'pointer',
  fontFamily: 'var(--rf-font-sans)',
}

const spacerStyle = { flex: 1 }

const iconBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-secondary)',
  cursor: 'pointer',
  borderRadius: 'var(--rf-radius-sm)',
  transition: 'all var(--rf-duration-fast) var(--rf-ease-default)',
}

const breadcrumbStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2)',
  fontSize: 'var(--rf-text-xs)',
  color: 'var(--rf-text-tertiary)',
}

const breadcrumbActiveStyle = {
  color: 'var(--rf-text-primary)',
  fontWeight: 500,
}

export function Navbar() {
  const [chainDropdown, setChainDropdown] = useState(false)

  return (
    <header style={navbarStyle} role="banner">
      {/* Brand */}
      <div style={brandStyle} onClick={toggleFocusMode}>
        <Zap size={18} style={{ color: 'var(--rf-brand-primary)' }} />
        <span>{t('nav.brand')}</span>
      </div>

      {/* Chain Selector */}
      <button
        style={chainSelectorStyle}
        onClick={() => setChainDropdown(!chainDropdown)}
        aria-label="选择规则链"
      >
        <span>{chainName.value}</span>
        <ChevronDown size={12} />
      </button>

      {/* Breadcrumb */}
      <nav style={breadcrumbStyle} aria-label="面包屑导航">
        <span>首页</span>
        <span>/</span>
        <span>项目</span>
        <span>/</span>
        <span style={breadcrumbActiveStyle}>{chainName.value}</span>
      </nav>

      <div style={spacerStyle} />

      {/* Right actions */}
      <button
        style={iconBtnStyle}
        title={t('nav.search')}
        aria-label={t('nav.search')}
        onClick={showCommandPalette}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--rf-bg-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <Search size={16} />
      </button>

      <ThemeToggle />

      <button
        style={iconBtnStyle}
        title="通知"
        aria-label="通知"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--rf-bg-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <Bell size={16} />
      </button>

      {/* v2.0: Connection status indicator (Spec 14.1/20.1) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 'var(--rf-radius-sm)',
          background: 'var(--rf-status-success-light)',
          fontSize: 'var(--rf-text-xs)',
          color: 'var(--rf-status-success)',
          fontWeight: 500,
          userSelect: 'none',
        }}
        role="status"
        aria-label="连接状态: 已连接"
      >
        <Wifi size={12} aria-hidden="true" />
        <span>已连接</span>
      </div>

      {/* User avatar placeholder */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--rf-radius-full)',
          background: 'var(--rf-brand-primary-light)',
          color: 'var(--rf-brand-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--rf-text-xs)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
        title="用户菜单"
        role="button"
        aria-label="用户菜单"
      >
        U
      </div>
    </header>
  )
}
