/**
 * Layout state management.
 * Handles sidebar, panel, focus mode, and panel tab state.
 */
import { signal } from '@preact/signals'
import type { PanelTab, PanelMode } from '../types/editor'

/** Whether the sidebar is collapsed */
export const sidebarCollapsed = signal<boolean>(false)

/** Toggle sidebar collapsed state */
export function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

/** Whether the right panel is closed */
export const panelClosed = signal<boolean>(false)

/** Toggle right panel closed state */
export function togglePanel(): void {
  panelClosed.value = !panelClosed.value
}

/** Whether focus mode is active (hides sidebar and panel) */
export const focusMode = signal<boolean>(false)

/** Toggle focus mode — collapses sidebar and panel when entering */
export function toggleFocusMode(): void {
  focusMode.value = !focusMode.value
  if (focusMode.value) {
    sidebarCollapsed.value = true
    panelClosed.value = true
  }
}

/** Active panel tab */
export const activePanelTab = signal<PanelTab>('properties')

/** Set active panel tab */
export function setActivePanelTab(tab: PanelTab): void {
  activePanelTab.value = tab
}

/** Panel display mode */
export const panelMode = signal<PanelMode>('fixed')

/** 设置面板显示模式 */
export function setPanelMode(mode: PanelMode): void {
  panelMode.value = mode
}
