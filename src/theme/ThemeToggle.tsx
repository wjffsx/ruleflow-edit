import { createPortal } from 'preact/compat'
import { useState, useEffect, useRef } from 'preact/hooks'
import { Sun, Moon, Monitor } from 'lucide-preact'
import { theme, setTheme } from '../store'
import { safeGetTheme, safeGetThemePref, safeSetStorage } from '../utils'
import s from './ThemeToggle.module.css'

const MODES = [
  { key: 'light', icon: Sun, label: '浅色' },
  { key: 'dark', icon: Moon, label: '深色' },
  { key: 'system', icon: Monitor, label: '跟随系统' },
] as const

export function ThemeToggle() {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const saved = safeGetTheme()
    setTheme(saved as any)
  }, [])

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ x: rect.left, y: rect.bottom })
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        const menu = document.querySelector('.rf-theme-menu')
        if (menu && !menu.contains(e.target as Node)) {
          setOpen(false)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSelect = (key: string) => {
    let resolved = key
    if (key === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    setTheme(resolved as any)
    safeSetStorage('rf-theme-pref', key)
    setOpen(false)
  }

  const CurrentIcon = theme.value === 'dark' ? Moon : Sun

  const menuContent = open && (
    <div class={`${s.menu} rf-theme-menu`} style={{ left: position.x, top: position.y + 4 }}>
      {MODES.map(({ key, icon: Icon, label }) => {
        const themePref = safeGetThemePref()
        const isCurrent = themePref === key
        return (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            class={`${s.menuItem} ${isCurrent ? s.menuItemActive : ''}`}
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
        class={s.triggerBtn}
        onClick={() => setOpen(!open)}
        title="切换主题"
        aria-label="切换主题"
      >
        <CurrentIcon size={16} />
      </button>
      {createPortal(menuContent, document.body)}
    </div>
  )
}
