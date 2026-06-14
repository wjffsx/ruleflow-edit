import type { LucideIcon } from 'lucide-preact'

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
  const baseClass =
    'flex items-center justify-center gap-1 h-[30px] min-w-[30px] px-1.5 border-none bg-transparent rounded-[var(--rf-radius-sm)] cursor-pointer text-[var(--rf-text-xs)] font-[var(--rf-font-sans)] transition-all duration-[var(--rf-duration-fast)] whitespace-nowrap'
  const colorClass = active
    ? ' bg-[var(--rf-brand-primary-light)] text-[var(--rf-brand-primary)] hover:bg-[var(--rf-brand-primary-light)] hover:text-[var(--rf-brand-primary)]'
    : ' text-[var(--rf-text-secondary)] hover:bg-[var(--rf-bg-hover)] hover:text-[var(--rf-text-primary)]'
  const disabledClass = disabled ? ' opacity-40 cursor-default' : ''

  return (
    <button
      class={`${baseClass}${colorClass}${disabledClass}`}
      title={title || label}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={14} />}
      {label && <span>{label}</span>}
    </button>
  )
}
