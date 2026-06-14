import { h } from 'preact'
import type { LucideIcon } from 'lucide-preact'
import {
  Minus,
  Plus,
  RotateCcw,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Save,
  Play,
} from 'lucide-preact'
import {
  canvasStatus,
  canvasZoom,
  setZoom,
  nodeCount,
  edgeCount,
  lastSaved,
  isDirty,
  errorCount,
  warningCount,
} from '../../store'
import { t } from '../../i18n'

const SEGMENT_STYLE: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const dotStyle = (color: string): Record<string, string | number> => ({
  width: 6,
  height: 6,
  borderRadius: 'var(--rf-radius-full)',
  background: color,
})

const ZOOM_BTN_STYLE: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-tertiary)',
  cursor: 'pointer',
  borderRadius: 'var(--rf-radius-sm)',
  padding: 0,
}

interface StatusEntry {
  label: string
  color: string
  Icon?: LucideIcon
}

const STATUS_MAP: Record<string, StatusEntry> = {
  editing: { label: t('status.editing'), color: 'var(--rf-status-success)', Icon: CheckCircle },
  running: { label: t('status.running'), color: 'var(--rf-brand-primary)', Icon: Play },
  deployed: { label: t('status.deployed'), color: 'var(--rf-status-info)', Icon: CheckCircle },
  disabled: { label: t('status.disabled'), color: 'var(--rf-text-tertiary)', Icon: XCircle },
}

/** 状态栏组件 */
export function StatusBar() {
  const status = STATUS_MAP[canvasStatus.value] || STATUS_MAP.editing

  return (
    <footer
      class="flex items-center h-[var(--statusbar-height)] px-[var(--rf-space-3)] bg-[var(--rf-bg-secondary)] border-t border-[var(--rf-border)] gap-[var(--rf-space-3)] text-[var(--rf-text-2xs)] text-[var(--rf-text-tertiary)] z-[var(--rf-z-toolbar)]"
      style={{ gridArea: 'status' }}
      role="contentinfo"
      aria-label="状态栏"
    >
      {/* Canvas status */}
      <div style={SEGMENT_STYLE}>
        <div style={dotStyle(status.color)} />
        {status.Icon && (
          <status.Icon size={10} style={{ color: status.color }} aria-hidden="true" />
        )}
        <span>{status.label}</span>
      </div>

      <div style={{ width: 1, height: 12, background: 'var(--rf-border)' }} />

      {/* Zoom */}
      <div style={SEGMENT_STYLE}>
        <span>{t('status.zoom')}:</span>
        <button
          style={ZOOM_BTN_STYLE}
          onClick={() => setZoom(canvasZoom.value - 10)}
          aria-label="缩小"
        >
          <Minus size={10} />
        </button>
        <span style={{ minWidth: 32, textAlign: 'center' }}>{canvasZoom.value}%</span>
        <button
          style={ZOOM_BTN_STYLE}
          onClick={() => setZoom(canvasZoom.value + 10)}
          aria-label="放大"
        >
          <Plus size={10} />
        </button>
        <button style={ZOOM_BTN_STYLE} onClick={() => setZoom(100)} aria-label="重置缩放">
          <RotateCcw size={10} />
        </button>
      </div>

      <div style={{ width: 1, height: 12, background: 'var(--rf-border)' }} />

      {/* Node count */}
      <div style={SEGMENT_STYLE}>
        <span>
          {t('status.nodes')}: {nodeCount.value}
        </span>
      </div>

      <div style={{ width: 1, height: 12, background: 'var(--rf-border)' }} />

      {/* Edge count */}
      <div style={SEGMENT_STYLE}>
        <span>
          {t('status.connections')}: {edgeCount.value}
        </span>
      </div>

      {/* Spacer */}
      <div class="flex-1" />

      {/* Errors / Warnings */}
      {(errorCount.value > 0 || warningCount.value > 0) && (
        <div style={{ ...SEGMENT_STYLE, gap: 8 }}>
          {errorCount.value > 0 && (
            <div style={{ ...SEGMENT_STYLE, color: 'var(--rf-status-danger)' }}>
              <XCircle size={12} />
              <span>{errorCount.value}</span>
            </div>
          )}
          {warningCount.value > 0 && (
            <div style={{ ...SEGMENT_STYLE, color: 'var(--rf-status-warning)' }}>
              <AlertTriangle size={12} />
              <span>{warningCount.value}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ width: 1, height: 12, background: 'var(--rf-border)' }} />

      {/* Save status */}
      <div style={SEGMENT_STYLE}>
        {isDirty.value ? (
          <span style={{ color: 'var(--rf-status-warning)' }}>* {t('status.unsaved')}</span>
        ) : lastSaved.value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={10} style={{ color: 'var(--rf-status-success)' }} aria-hidden="true" />
            <span>{lastSaved.value}</span>
          </div>
        ) : null}
      </div>
    </footer>
  )
}
