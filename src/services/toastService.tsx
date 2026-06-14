/**
 * Toast notification service for RuleFlow Editor.
 * Uses sonner, aligned with VPPTU Editor's addToast pattern.
 */
import { toast, Toaster } from 'sonner'

type ToastType = 'success' | 'error' | 'warning' | 'info'

const TYPE_BORDER: Record<ToastType, string> = {
  success: 'var(--rf-status-success)',
  error: 'var(--rf-status-danger)',
  warning: 'var(--rf-status-warning)',
  info: 'var(--rf-status-info)',
}

interface ToastOptions {
  duration?: number
}

/** Show a toast notification with type and message */
export function addToast(type: ToastType, message: string, options?: ToastOptions): void {
  toast[type](message, {
    duration: options?.duration ?? 4000,
    style: {
      background: 'var(--rf-color-surface)',
      color: 'var(--rf-text-primary)',
      border: '1px solid var(--rf-border)',
      borderLeft: `3px solid ${TYPE_BORDER[type]}`,
    },
  })
}

/** Convenience wrappers */
export function showSuccess(message: string, options: ToastOptions = {}): void {
  addToast('success', message, options)
}

export function showError(message: string, options: ToastOptions = {}): void {
  addToast('error', message, options)
}

export function showWarning(message: string, options: ToastOptions = {}): void {
  addToast('warning', message, options)
}

export function showInfo(message: string, options: ToastOptions = {}): void {
  addToast('info', message, options)
}

/** Toast container component — render once at app root */
export function ToastContainer() {
  return <Toaster position="top-right" />
}

export { toast }
