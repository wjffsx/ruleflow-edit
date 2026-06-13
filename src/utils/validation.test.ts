import { describe, it, expect } from 'vitest'
import {
  safeReadStorage,
  safeJsonParse,
  hasRequiredKeys,
  isValidGraphData,
  isValidNodeItem,
  safeGetTheme,
  safeGetDensity,
  safeGetLang,
  safeReadJsonStorage,
} from './validation'

describe('validation utilities', () => {
  describe('safeReadStorage', () => {
    it('should return valid value from localStorage', () => {
      localStorage.setItem('test-key', 'light')
      expect(safeReadStorage('test-key', ['light', 'dark'], 'dark')).toBe('light')
    })

    it('should return fallback for invalid value', () => {
      localStorage.setItem('test-key', 'invalid')
      expect(safeReadStorage('test-key', ['light', 'dark'], 'dark')).toBe('dark')
    })

    it('should return fallback when key does not exist', () => {
      localStorage.removeItem('nonexistent-key')
      expect(safeReadStorage('nonexistent-key', ['light', 'dark'], 'dark')).toBe('dark')
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON with passing validator', () => {
      const result = safeJsonParse(
        '{"a":1}',
        (d): d is { a: number } => typeof d === 'object' && d !== null && 'a' in d,
      )
      expect(result).toEqual({ a: 1 })
    })

    it('should return null for invalid JSON', () => {
      const result = safeJsonParse(
        'not json',
        (d): d is Record<string, unknown> => typeof d === 'object' && d !== null,
      )
      expect(result).toBeNull()
    })

    it('should return null when validator fails', () => {
      const result = safeJsonParse('{"a":1}', (_d): _d is never => false)
      expect(result).toBeNull()
    })
  })

  describe('hasRequiredKeys', () => {
    it('should return true when all keys present', () => {
      expect(hasRequiredKeys({ type: 'a', name: 'b' }, ['type', 'name'])).toBe(true)
    })

    it('should return false when keys missing', () => {
      expect(hasRequiredKeys({ type: 'a' }, ['type', 'name'])).toBe(false)
    })

    it('should return false for null', () => {
      expect(hasRequiredKeys(null, ['type'])).toBe(false)
    })

    it('should return false for non-object', () => {
      expect(hasRequiredKeys('string', ['type'])).toBe(false)
    })
  })

  describe('isValidGraphData', () => {
    it('should validate correct graph data', () => {
      expect(isValidGraphData({ nodes: [], edges: [] })).toBe(true)
      expect(isValidGraphData({ nodes: [{ id: '1' }], edges: [] })).toBe(true)
    })

    it('should reject data without nodes', () => {
      expect(isValidGraphData({ edges: [] })).toBe(false)
    })

    it('should reject data without edges', () => {
      expect(isValidGraphData({ nodes: [] })).toBe(false)
    })

    it('should reject non-objects', () => {
      expect(isValidGraphData(null)).toBe(false)
      expect(isValidGraphData('string')).toBe(false)
    })
  })

  describe('isValidNodeItem', () => {
    it('should validate correct node item', () => {
      expect(isValidNodeItem({ type: 'device_type', name: '设备类型', icon: 'Cpu' })).toBe(true)
    })

    it('should reject item missing required keys', () => {
      expect(isValidNodeItem({ type: 'device_type' })).toBe(false)
      expect(isValidNodeItem({ type: 'a', name: 'b' })).toBe(false)
    })

    it('should reject null', () => {
      expect(isValidNodeItem(null)).toBe(false)
    })
  })

  describe('safeGetTheme / safeGetDensity / safeGetLang', () => {
    it('should return valid theme', () => {
      localStorage.setItem('rf-theme', 'dark')
      expect(safeGetTheme()).toBe('dark')
    })

    it('should return fallback for invalid theme', () => {
      localStorage.setItem('rf-theme', 'invalid-theme')
      expect(safeGetTheme()).toBe('light')
    })

    it('should return valid density', () => {
      localStorage.setItem('rf-density', 'compact')
      expect(safeGetDensity()).toBe('compact')
    })

    it('should return fallback for invalid density', () => {
      localStorage.setItem('rf-density', 'super-compact')
      expect(safeGetDensity()).toBe('comfortable')
    })

    it('should return valid lang', () => {
      localStorage.setItem('rf-lang', 'en')
      expect(safeGetLang()).toBe('en')
    })

    it('should return fallback for invalid lang', () => {
      localStorage.setItem('rf-lang', 'fr')
      expect(safeGetLang()).toBe('zh')
    })
  })

  describe('safeReadJsonStorage', () => {
    it('should parse valid JSON from localStorage', () => {
      localStorage.setItem('test-json', '{"a":1}')
      expect(safeReadJsonStorage('test-json', {})).toEqual({ a: 1 })
    })

    it('should return fallback for invalid JSON', () => {
      localStorage.setItem('test-json', 'not-json')
      expect(safeReadJsonStorage('test-json', { default: true })).toEqual({ default: true })
    })

    it('should return fallback when key does not exist', () => {
      localStorage.removeItem('nonexistent-json')
      expect(safeReadJsonStorage('nonexistent-json', { default: true })).toEqual({ default: true })
    })
  })
})
