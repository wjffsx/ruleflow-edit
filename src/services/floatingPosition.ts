/**
 * Floating position calculation for RuleFlow Editor.
 * Uses @floating-ui/dom for advanced positioning and provides
 * a simple synchronous fallback for cases where floating-ui's
 * async API is not needed.
 */
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom'

export { computePosition, flip, shift, offset, autoUpdate }

/**
 * Calculate position for a floating element, keeping it within the viewport.
 * Simple synchronous viewport-aware positioning for cases where
 * floating-ui's async API is not needed.
 */
export function calculateSimplePosition(
  anchorX: number,
  anchorY: number,
  floatingWidth: number = 200,
  floatingHeight: number = 200,
  offsetVal: number = 8,
): { x: number; y: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Default: position to the right and slightly above
  let posX = anchorX + offsetVal
  let posY = anchorY - 40

  // Flip to left if would overflow right edge
  if (posX + floatingWidth > viewportWidth - 8) {
    posX = anchorX - floatingWidth - offsetVal
  }

  // Shift down if would overflow top edge
  if (posY < 60) {
    posY = 60
  }

  // Shift up if would overflow bottom edge
  if (posY + floatingHeight > viewportHeight - 8) {
    posY = viewportHeight - floatingHeight - 8
  }

  return { x: posX, y: posY }
}
