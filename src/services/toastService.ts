/**
 * Toast notification service for RuleFlow Editor.
 * Uses react-hot-toast via preact/compat.
 */
import toast from 'react-hot-toast'

interface ToastOptions {
  duration?: number
  [key: string]: unknown
}

export function showSuccess(message: string, options: ToastOptions = {}): void {
  toast.success(message, { duration: options.duration || 3000, ...options })
}

export function showError(message: string, options: ToastOptions = {}): void {
  toast.error(message, { duration: options.duration || 4000, ...options })
}

/** Show a warning toast notification */
export function showWarning(message: string, options: ToastOptions = {}): void {
  toast(message, { icon: '⚠️', duration: options.duration || 3500, ...options })
}

/** Show an info toast notification */
export function showInfo(message: string, options: ToastOptions = {}): void {
  toast(message, { icon: 'ℹ️', duration: options.duration || 3000, ...options })
}

export { toast }
