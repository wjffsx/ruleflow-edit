/**
 * Global shortcut manager for RuleFlow Editor.
 * Uses hotkeys-js for unified keyboard shortcut handling.
 */
import hotkeys from 'hotkeys-js'

// Configure hotkeys to not interfere with input fields
hotkeys.filter = function(event) {
  const tagName = event.target.tagName
  if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA') {
    // Allow shortcuts with Ctrl/Cmd in input fields
    return event.ctrlKey || event.metaKey
  }
  return true
}

class ShortcutManager {
  #handlers = new Map()
  #enabled = true

  /**
   * Register a keyboard shortcut
   * @param {string} key - Shortcut key combination (e.g., 'ctrl+s', 'ctrl+k')
   * @param {Function} handler - Handler function
   * @param {Object} options - Additional options
   */
  register(key, handler, options = {}) {
    if (this.#handlers.has(key)) {
      console.warn(`Shortcut "${key}" is already registered. Overwriting.`)
      this.unregister(key)
    }
    
    this.#handlers.set(key, handler)
    hotkeys(key, options, (event) => {
      if (this.#enabled) {
        event.preventDefault()
        handler(event)
      }
    })
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} key - Shortcut key combination
   */
  unregister(key) {
    if (this.#handlers.has(key)) {
      hotkeys.unbind(key)
      this.#handlers.delete(key)
    }
  }

  /**
   * Temporarily disable all shortcuts
   */
  disable() {
    this.#enabled = false
  }

  /**
   * Re-enable all shortcuts
   */
  enable() {
    this.#enabled = true
  }

  /**
   * Get all registered shortcuts
   * @returns {string[]} Array of registered shortcut keys
   */
  getRegistered() {
    return Array.from(this.#handlers.keys())
  }

  /**
   * Trigger a shortcut handler manually
   * @param {string} key - Shortcut key combination
   */
  trigger(key) {
    const handler = this.#handlers.get(key)
    if (handler) {
      handler()
    }
  }
}

export const shortcutManager = new ShortcutManager()

/**
 * Initialize default shortcuts for RuleFlow Editor
 * @param {Object} actions - Action functions to bind
 */
export function initializeShortcuts(actions) {
  const {
    toggleCommandPalette,
    toggleNodeSearch,
    toggleSidebar,
    togglePanel,
    toggleFocusMode,
    save,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    runDebug,
    stopDebug,
  } = actions

  // Command palette: Ctrl+K
  if (toggleCommandPalette) {
    shortcutManager.register('ctrl+k', toggleCommandPalette)
  }

  // Node search: Ctrl+F
  if (toggleNodeSearch) {
    shortcutManager.register('ctrl+f', toggleNodeSearch)
  }

  // Toggle sidebar: Ctrl+B
  if (toggleSidebar) {
    shortcutManager.register('ctrl+b', toggleSidebar)
  }

  // Toggle panel: Ctrl+J
  if (togglePanel) {
    shortcutManager.register('ctrl+j', togglePanel)
  }

  // Focus mode: F11
  if (toggleFocusMode) {
    shortcutManager.register('f11', toggleFocusMode)
  }

  // Save: Ctrl+S
  if (save) {
    shortcutManager.register('ctrl+s', save)
  }

  // Undo: Ctrl+Z
  if (undo) {
    shortcutManager.register('ctrl+z', undo)
  }

  // Redo: Ctrl+Shift+Z or Ctrl+Y
  if (redo) {
    shortcutManager.register('ctrl+shift+z', redo)
    shortcutManager.register('ctrl+y', redo)
  }

  // Zoom in: Ctrl+= or Ctrl++
  if (zoomIn) {
    shortcutManager.register('ctrl+=', zoomIn)
    shortcutManager.register('ctrl++', zoomIn)
  }

  // Zoom out: Ctrl+- or Ctrl+-
  if (zoomOut) {
    shortcutManager.register('ctrl+-', zoomOut)
  }

  // Reset zoom: Ctrl+0
  if (resetZoom) {
    shortcutManager.register('ctrl+0', resetZoom)
  }

  // Run debug: F5
  if (runDebug) {
    shortcutManager.register('f5', runDebug)
  }

  // Stop debug: Shift+F5
  if (stopDebug) {
    shortcutManager.register('shift+f5', stopDebug)
  }
}