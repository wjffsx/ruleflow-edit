import type { LucideIcon } from 'lucide-preact'
import s from '../../styles/layout.module.css'

/** Props for ToolbarBtn component */
interface ToolbarBtnProps {
  /** Icon component from lucide-preact */
  icon: LucideIcon
  /** Optional text label displayed next to the icon */
  label?: string
  /** Tooltip text on hover */
  title?: string
  /** Click handler */
  onClick?: () => void
  /** Whether the button is in active state */
  active?: boolean
  /** Whether the button is disabled */
  disabled?: boolean
}

export function ToolbarBtn({
  icon: Icon,
  label,
  title,
  onClick,
  active,
  disabled,
}: ToolbarBtnProps) {
  const cls = [s.toolbarBtn, active ? s.toolbarBtnActive : '', disabled ? s.toolbarBtnDisabled : '']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      class={cls}
      title={title || label}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={14} />}
      {label && <span>{label}</span>}
    </button>
  )
}
