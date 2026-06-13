/**
 * Toast notification service for RuleFlow Editor.
 * Custom implementation for Preact compatibility.
 */
import { signal } from '@preact/signals'

const MAX_TOASTS = 5
const DEFAULT_DURATION = 3000

// Toast state
export const toastQueue = signal([])

/**
 * Generate unique toast ID
 */
function generateId() {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Add a toast to the queue
 * @param {Object} toast - Toast object
 */
function addToast(toast) {
  const current = toastQueue.value
  const next = [...current, toast]
  // Limit queue size
  toastQueue.value = next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next
  
  // Auto dismiss after duration
  setTimeout(() => {
    dismissToast(toast.id)
  }, toast.duration || DEFAULT_DURATION)
}

/**
 * Show a success toast notification
 * @param {string} message - Toast message
 * @param {Object} options - Additional options
 */
export function showSuccess(message, options = {}) {
  addToast({
    id: generateId(),
    type: 'success',
    message,
    duration: options.duration || 3000,
    ...options,
  })
}

/**
 * Show an error toast notification
 * @param {string} message - Toast message
 * @param {Object} options - Additional options
 */
export function showError(message, options = {}) {
  addToast({
    id: generateId(),
    type: 'error',
    message,
    duration: options.duration || 4000,
    ...options,
  })
}

/**
 * Show a warning toast notification
 * @param {string} message - Toast message
 * @param {Object} options - Additional options
 */
export function showWarning(message, options = {}) {
  addToast({
    id: generateId(),
    type: 'warning',
    message,
    duration: options.duration || 3500,
    ...options,
  })
}

/**
 * Show an info toast notification
 * @param {string} message - Toast message
 * @param {Object} options - Additional options
 */
export function showInfo(message, options = {}) {
  addToast({
    id: generateId(),
    type: 'info',
    message,
    duration: options.duration || 3000,
    ...options,
  })
}

/**
 * Dismiss a specific toast
 * @param {string} id - Toast ID to dismiss
 */
export function dismissToast(id) {
  toastQueue.value = toastQueue.value.filter(t => t.id !== id)
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toastQueue.value = []
}