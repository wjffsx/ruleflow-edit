import { h } from 'preact'
import { createPortal } from 'preact/compat'
import { useState, useEffect, useRef } from 'preact/hooks'
import { Sun, Moon, Monitor } from 'lucide-preact'
import { theme, setTheme } from '../store/editorStore'

const modes = [
  { key: 'light', icon: Sun, label: '浅色' },
  { key: 'dark', icon: Moon, label: '深色' },
  { key: 'system', icon: Monitor, label: '跟随系统' },
]

export function ThemeToggle() {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('rf-theme') || 'light'
    setTheme(saved)
  }, [])

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ x: rect.left, y: rect.bottom })
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        const menu = document.querySelector('.rf-theme-menu')
        if (menu && !menu.contains(e.target)) {
          setOpen(false)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
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

  const menuContent = open && (
    <div
      class="rf-theme-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y + 4,
        background: 'var(--rf-bg-elevated)',
        border: '1px solid var(--rf-border)',
        borderRadius: 'var(--rf-radius-md)',
        boxShadow: 'var(--rf-shadow-lg)',
        padding: '4px',
        zIndex: 10000,
        minWidth: 140,
      }}
    >
      {modes.map(({ key, icon: Icon, label }) => {
        const themePref = localStorage.getItem('rf-theme-pref') || 'light'
        const isCurrent = themePref === key
        return (
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
              background: isCurrent ? 'var(--rf-brand-primary-light)' : 'transparent',
              color: isCurrent ? 'var(--rf-brand-primary)' : 'var(--rf-text-primary)',
              borderRadius: 'var(--rf-radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--rf-text-sm)',
              fontFamily: 'var(--rf-font-sans)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div>
      <button
        ref={buttonRef}
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
      {createPortal(menuContent, document.body)}
    </div>
  )
}
