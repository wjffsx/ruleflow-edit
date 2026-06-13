import { describe, it, expect } from 'vitest'
import { calculateSimplePosition } from './floatingPosition'

describe('floatingPosition', () => {
  describe('calculateSimplePosition', () => {
    it('should return default position when viewport has enough space', () => {
      const result = calculateSimplePosition(100, 200, 200, 200, 8)
      expect(result.x).toBe(108)
      expect(result.y).toBe(160)
    })

    it('should flip to left when overflowing right edge', () => {
      const anchorX = window.innerWidth - 50
      const result = calculateSimplePosition(anchorX, 200, 200, 200, 8)
      expect(result.x).toBe(anchorX - 200 - 8)
    })

    it('should shift down when overflowing top edge', () => {
      const result = calculateSimplePosition(100, 20, 200, 200, 8)
      expect(result.y).toBe(60)
    })

    it('should shift up when overflowing bottom edge', () => {
      const anchorY = window.innerHeight - 10
      const result = calculateSimplePosition(100, anchorY, 200, 200, 8)
      expect(result.y).toBe(window.innerHeight - 200 - 8)
    })

    it('should use default dimensions when not specified', () => {
      const result = calculateSimplePosition(100, 200)
      expect(result).toEqual({
        x: 108,
        y: 160,
      })
    })

    it('should respect custom offset value', () => {
      const result = calculateSimplePosition(100, 200, 200, 200, 20)
      expect(result.x).toBe(120)
    })
  })
})
