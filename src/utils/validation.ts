/**
 * Runtime validation utilities for RuleFlow Editor.
 * Validates external inputs (localStorage, JSON.parse, drag-drop data)
 * that TypeScript cannot guarantee at compile time.
 */

/** Valid theme values */
const VALID_THEMES = ['light', 'dark', 'system'] as const

/** Valid density values */
const VALID_DENSITIES = ['comfortable', 'compact', 'ultra-compact'] as const

/** Valid language values */
const VALID_LANGS = ['zh', 'en'] as const

/**
 * Safely read and validate a value from localStorage.
 * Returns the default if the stored value is invalid.
 */
export function safeReadStorage(
  key: string,
  validValues: readonly string[],
  fallback: string,
): string {
  try {
    const val = localStorage.getItem(key)
    if (val !== null && (validValues as readonly string[]).includes(val)) return val
  } catch {
    // localStorage may be unavailable (SSR, privacy mode)
  }
  return fallback
}

/**
 * Safely parse JSON with schema validation.
 * Returns null if parsing fails or data doesn't match the validator.
 */
export function safeJsonParse<T extends Record<string, unknown>>(
  text: string,
  validator: (data: unknown) => data is T,
): T | null {
  try {
    const data: unknown = JSON.parse(text)
    return validator(data) ? data : null
  } catch {
    return null
  }
}

/** Validate that a value is a non-null object with specific required keys */
export function hasRequiredKeys(data: unknown, keys: string[]): data is Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return false
  return keys.every((key) => key in data)
}

/** Validate a LogicFlow graph data structure from file import */
export function isValidGraphData(data: unknown): data is {
  nodes: unknown[]
  edges: unknown[]
  [key: string]: unknown
} {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return Array.isArray(obj.nodes) && Array.isArray(obj.edges)
}

/** Validate a drag-drop node data item */
export function isValidNodeItem(data: unknown): data is {
  type: string
  name: string
  icon: string
  [key: string]: unknown
} {
  return hasRequiredKeys(data, ['type', 'name', 'icon'])
}

/** Validate and return theme from localStorage */
export function safeGetTheme(): string {
  return safeReadStorage('rf-theme', VALID_THEMES, 'light')
}

/** Validate and return theme preference from localStorage */
export function safeGetThemePref(): string {
  return safeReadStorage('rf-theme-pref', VALID_THEMES, 'light')
}

/** Validate and return density mode from localStorage */
export function safeGetDensity(): string {
  return safeReadStorage('rf-density', VALID_DENSITIES, 'comfortable')
}

/** Validate and return language from localStorage */
export function safeGetLang(): string {
  return safeReadStorage('rf-lang', VALID_LANGS, 'zh')
}

/** Safely parse JSON from localStorage, with fallback */
export function safeReadJsonStorage<T extends Record<string, unknown>>(
  key: string,
  fallback: T,
  validator?: (data: unknown) => data is T,
): T {
  try {
    const val = localStorage.getItem(key)
    if (val === null) return fallback
    const parsed: unknown = JSON.parse(val)
    if (validator) {
      return validator(parsed) ? parsed : fallback
    }
    return parsed as T
  } catch {
    return fallback
  }
}

/** Validate that a value is a Record<string, boolean> */
export function isBooleanRecord(data: unknown): data is Record<string, boolean> {
  if (typeof data !== 'object' || data === null) return false
  return Object.values(data).every((v) => typeof v === 'boolean')
}

/**
 * Safely write a value to localStorage.
 * Returns true if successful, false if localStorage is unavailable.
 */
export function safeSetStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    // localStorage may be unavailable (SSR, privacy mode, quota exceeded)
    return false
  }
}
