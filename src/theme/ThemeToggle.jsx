import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { Sun, Moon, Monitor } from 'lucide-preact'
import { theme, setTheme } from '../store/editorStore'

const modes = [
  { key: 'light', icon: Sun, label: '浅色' },
  { key: 'dark', icon: Moon, label: '深色' },
  { key: 'system', icon: Monitor, label: '跟随系统' },
]

export function ThemeToggle() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Initialize theme on mount
    const saved = localStorage.getItem('rf-theme') || 'light'
    setTheme(saved)
  }, [])

  const handleSelect = (key) => {
    let resolved = key
    if (key === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    setTheme(resolved)
    localStorage.setItem('rf-theme-pref', key)
    setOpen(false)
  }

  const CurrentIcon = theme.value === 'dark' ? Moon : Sun

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="切换主题"
        aria-label="切换主题"
        style={{
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
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--rf-bg-hover)'
          e.currentTarget.style.color = 'var(--rf-text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--rf-text-secondary)'
        }}
      >
        <CurrentIcon size={16} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'var(--rf-bg-elevated)',
            border: '1px solid var(--rf-border)',
            borderRadius: 'var(--rf-radius-md)',
            boxShadow: 'var(--rf-shadow-lg)',
            padding: '4px',
            zIndex: 'var(--rf-z-popover)',
            minWidth: 140,
          }}
        >
          {modes.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 10px',
                border: 'none',
                background: theme.value === key || (key === 'system' && !localStorage.getItem('rf-theme-pref')) ? 'var(--rf-brand-primary-light)' : 'transparent',
                color: theme.value === key ? 'var(--rf-brand-primary)' : 'var(--rf-text-primary)',
                borderRadius: 'var(--rf-radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--rf-text-sm)',
                fontFamily: 'var(--rf-font-sans)',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
