import { h } from 'preact'
import { Minus, Plus, RotateCcw, AlertTriangle, XCircle, CheckCircle, Save, Play } from 'lucide-preact'
import {
  canvasStatus, canvasZoom, setZoom,
  nodeCount, edgeCount, lastSaved, isDirty,
  errorCount, warningCount,
} from '../../store/editorStore'
import { t } from '../../i18n'

const barStyle = {
  gridArea: 'status',
  display: 'flex',
  alignItems: 'center',
  height: 'var(--statusbar-height)',
  padding: '0 var(--rf-space-3)',
  background: 'var(--rf-bg-secondary)',
  borderTop: '1px solid var(--rf-border)',
  fontSize: 'var(--rf-text-xs)',
  color: 'var(--rf-text-secondary)',
  gap: 'var(--rf-space-4)',
  fontFamily: 'var(--rf-font-sans)',
  userSelect: 'none',
}

const segmentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const dotStyle = (color) => ({
  width: 6,
  height: 6,
  borderRadius: 'var(--rf-radius-full)',
  background: color,
})

const zoomBtnStyle = {
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

const STATUS_MAP = {
  editing: { label: t('status.editing'), color: 'var(--rf-status-success)', Icon: CheckCircle },
  running: { label: t('status.running'), color: 'var(--rf-brand-primary)', Icon: Play },
  deployed: { label: t('status.deployed'), color: 'var(--rf-status-info)', Icon: CheckCircle },
  disabled: { label: t('status.disabled'), color: 'var(--rf-text-tertiary)', Icon: XCircle },
}

export function StatusBar() {
  const status = STATUS_MAP[canvasStatus.value] || STATUS_MAP.editing

  return (
    <footer style={barStyle} role="contentinfo" aria-label="状态栏">
      {/* Canvas status — v2.0: dual encoding (color + icon) */}
      <div style={segmentStyle}>
        <div style={dotStyle(status.color)} />
        {status.Icon && <status.Icon size={10} style={{ color: status.color }} aria-hidden="true" />}
        <span>{status.label}</span>
      </div>

      <div style={{ width: 1, height: 12, background: 'var(--rf-border)' }} />

      {/* Zoom */}
      <div style={segmentStyle}>
        <span>{t('status.zoom')}:</span>
        <button style={zoomBtnStyle} onClick={() => setZoom(canvasZoom.value - 10)} aria-label="缩小">
          <Minus size={10} />
        </button>
        <span style={{ minWidth: 32, textAlign: 'center' }}>{canvasZoom.value}%</span>
        <button style={zoomBtnStyle} onClick={() => setZoom(canvasZoom.value + 10)} aria-label="放大">
          <Plus size={10} />
        </button>
        <button style={zoomBtnStyle} onClick={() => setZoom(100)} aria-label="重置缩放">
          <RotateCcw size={10} />
        </button>
      </div>

      <div style={{ width: 1, height: 12, background: 'var(--rf-border)' }} />

      {/* Node count */}
      <div style={segmentStyle}>
        <span>{t('status.nodes')}: {nodeCount.value}</span>
      </div>

      <div style={{ width: 1, height: 12, background: 'var(--rf-border)' }} />

      {/* Edge count */}
      <div style={segmentStyle}>
        <span>{t('status.connections')}: {edgeCount.value}</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Errors / Warnings */}
      {(errorCount.value > 0 || warningCount.value > 0) && (
        <div style={{ ...segmentStyle, gap: 8 }}>
          {errorCount.value > 0 && (
            <div style={{ ...segmentStyle, color: 'var(--rf-status-danger)' }}>
              <XCircle size={12} />
              <span>{errorCount.value}</span>
            </div>
          )}
          {warningCount.value > 0 && (
            <div style={{ ...segmentStyle, color: 'var(--rf-status-warning)' }}>
              <AlertTriangle size={12} />
              <span>{warningCount.value}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ width: 1, height: 12, background: 'var(--rf-border)' }} />

      {/* Save status — v2.0: replaced Emoji with Lucide icon */}
      <div style={segmentStyle}>
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
