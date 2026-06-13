import { describe, it, expect } from 'vitest'
import {
  theme,
  setTheme,
  densityMode,
  setDensityMode,
  cycleDensityMode,
  isCategoryCollapsed,
  toggleCategoryCollapse,
  sidebarCollapsedCategories,
} from './themeStore'

describe('themeStore', () => {
  it('should toggle theme', () => {
    const initial = theme.value
    setTheme(initial === 'light' ? 'dark' : 'light')
    expect(theme.value).not.toBe(initial)
    // Restore
    setTheme(initial)
  })

  it('should set density mode', () => {
    setDensityMode('compact')
    expect(densityMode.value).toBe('compact')
    setDensityMode('comfortable')
    expect(densityMode.value).toBe('comfortable')
  })

  it('should cycle density modes', () => {
    setDensityMode('comfortable')
    cycleDensityMode()
    expect(densityMode.value).toBe('compact')
    cycleDensityMode()
    expect(densityMode.value).toBe('ultra-compact')
    cycleDensityMode()
    expect(densityMode.value).toBe('comfortable')
  })

  it('should toggle category collapse', () => {
    const testId = 'test-category'
    const initial = isCategoryCollapsed(testId)
    toggleCategoryCollapse(testId)
    expect(isCategoryCollapsed(testId)).toBe(!initial)
    toggleCategoryCollapse(testId)
    expect(isCategoryCollapsed(testId)).toBe(initial)
  })
})
