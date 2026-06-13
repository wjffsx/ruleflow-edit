/**
 * Theme and density state management.
 * Handles visual appearance preferences persisted in localStorage.
 */
import { signal } from '@preact/signals'
import type { ThemeMode, DensityMode } from '../types/editor'
import {
  safeGetTheme,
  safeGetDensity,
  safeReadJsonStorage,
  safeSetStorage,
  isBooleanRecord,
} from '../utils'

/** Current theme mode */
export const theme = signal<ThemeMode>(safeGetTheme() as ThemeMode)

/** Set theme and persist to localStorage */
export function setTheme(t: ThemeMode): void {
  theme.value = t
  safeSetStorage('rf-theme', t)
  document.documentElement.setAttribute('data-theme', t)
}

/** Current density mode */
export const densityMode = signal<DensityMode>(safeGetDensity() as DensityMode)

/** Set density mode and persist to localStorage */
export function setDensityMode(mode: DensityMode): void {
  densityMode.value = mode
  safeSetStorage('rf-density', mode)
  document.documentElement.setAttribute('data-density', mode === 'comfortable' ? '' : mode)
}

/** 循环切换密度模式：comfortable → compact → ultra-compact */
export function cycleDensityMode(): void {
  const modes: DensityMode[] = ['comfortable', 'compact', 'ultra-compact']
  const currentIdx = modes.indexOf(densityMode.value)
  const nextIdx = (currentIdx + 1) % modes.length
  setDensityMode(modes[nextIdx])
}

/** Sidebar category collapse state (persisted in localStorage) */
const SAVED_COLLAPSE_KEY = 'rf-sidebar-collapsed'

export const sidebarCollapsedCategories = signal<Record<string, boolean>>(
  safeReadJsonStorage<Record<string, boolean>>(SAVED_COLLAPSE_KEY, {}, isBooleanRecord),
)

/** 切换侧栏分类的折叠状态 */
export function toggleCategoryCollapse(categoryId: string): void {
  const current = { ...sidebarCollapsedCategories.value }
  current[categoryId] = !current[categoryId]
  sidebarCollapsedCategories.value = current
  safeSetStorage(SAVED_COLLAPSE_KEY, JSON.stringify(current))
}

/** 检查侧栏分类是否折叠 */
export function isCategoryCollapsed(categoryId: string): boolean {
  return !!sidebarCollapsedCategories.value[categoryId]
}
