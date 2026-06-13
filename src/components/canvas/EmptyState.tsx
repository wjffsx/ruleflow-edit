import { h } from 'preact'
import { MousePointer2 } from 'lucide-preact'
import { t } from '../../i18n'

/** 画布空状态提示组件 */
export function EmptyState() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--rf-space-3)',
        color: 'var(--rf-text-tertiary)',
        pointerEvents: 'none',
        zIndex: 1,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--rf-radius-xl)',
          background: 'var(--rf-brand-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MousePointer2 size={28} style={{ color: 'var(--rf-brand-primary)' }} />
      </div>
      <div
        style={{
          fontSize: 'var(--rf-text-md)',
          fontWeight: 600,
          color: 'var(--rf-text-secondary)',
        }}
      >
        {t('canvas.empty.title')}
      </div>
      <div style={{ fontSize: 'var(--rf-text-sm)', maxWidth: 280 }}>{t('canvas.empty.desc')}</div>
    </div>
  )
}
