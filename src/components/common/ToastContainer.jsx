import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-preact'
import { toastQueue, dismissToast } from '../../services/toastService'

const containerStyle = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxWidth: 400,
}

const toastStyle = (type) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: 'var(--rf-radius-md)',
  background: 'var(--rf-bg-elevated)',
  border: '1px solid var(--rf-border)',
  boxShadow: 'var(--rf-shadow-lg)',
  animation: 'rf-slide-in 300ms ease-out',
  fontFamily: 'var(--rf-font-sans)',
  fontSize: 'var(--rf-text-sm)',
  color: 'var(--rf-text-primary)',
})

const iconStyle = (type) => ({
  flexShrink: 0,
})

const TYPE_CONFIG = {
  success: { icon: CheckCircle, color: 'var(--rf-status-success)' },
  error: { icon: XCircle, color: 'var(--rf-status-danger)' },
  warning: { icon: AlertTriangle, color: 'var(--rf-status-warning)' },
  info: { icon: Info, color: 'var(--rf-brand-primary)' },
}

const closeBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-tertiary)',
  cursor: 'pointer',
  borderRadius: 'var(--rf-radius-sm)',
  padding: 0,
  marginLeft: 'auto',
  flexShrink: 0,
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    // 使用 setInterval 来定期检查 toastQueue 的变化
    const intervalId = setInterval(() => {
      const currentToasts = toastQueue.value
      setToasts([...currentToasts])
    }, 100)
    
    return () => clearInterval(intervalId)
  }, [])

  if (toasts.length === 0) return null

  return h('div', { style: containerStyle, 'data-toast-container': true },
    toasts.map(toast => {
      const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info
      const Icon = config.icon

      return h('div', {
        key: toast.id,
        style: toastStyle(toast.type),
        'data-toast': toast.type,
      }, [
        h(Icon, { size: 18, style: { ...iconStyle(toast.type), color: config.color } }),
        h('span', { style: { flex: 1 } }, toast.message),
        h('button', {
          style: closeBtnStyle,
          onClick: () => dismissToast(toast.id),
          'aria-label': '关闭',
        }, h(X, { size: 14 })),
      ])
    })
  )
}