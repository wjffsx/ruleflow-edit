/**
 * Floating position calculation for RuleFlow Editor.
 * P2-6.3: Removed unused @floating-ui/dom import (only calculateSimplePosition is used).
 * P2-5.1: Added optional container parameter for container-bounded positioning
 *         (editor is usually embedded in a container smaller than window).
 */

/**
 * Calculate position for a floating element, keeping it within the container or viewport.
 * @param anchorX Anchor X coordinate (relative to document or container)
 * @param anchorY Anchor Y coordinate (relative to document or container)
 * @param floatingWidth Width of the floating element
 * @param floatingHeight Height of the floating element
 * @param offsetVal Offset from anchor
 * @param container Optional container element. If provided, positioning is bounded by
 *                  the container's rect (better for embedded scenarios). Otherwise
 *                  falls back to window inner dimensions.
 */
export function calculateSimplePosition(
  anchorX: number,
  anchorY: number,
  floatingWidth: number = 200,
  floatingHeight: number = 200,
  offsetVal: number = 8,
  container?: HTMLElement | null,
): { x: number; y: number } {
  let boundaryWidth: number
  let boundaryHeight: number
  let offsetOriginX = 0
  let offsetOriginY = 0

  if (container) {
    try {
      const rect = container.getBoundingClientRect()
      boundaryWidth = rect.width
      boundaryHeight = rect.height
      offsetOriginX = rect.left
      offsetOriginY = rect.top
    } catch (_e) {
      boundaryWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
      boundaryHeight = typeof window !== 'undefined' ? window.innerHeight : 768
    }
  } else if (typeof window !== 'undefined') {
    boundaryWidth = window.innerWidth
    boundaryHeight = window.innerHeight
  } else {
    boundaryWidth = 1024
    boundaryHeight = 768
  }

  // Default: position to the right and slightly above
  let posX = anchorX + offsetVal
  let posY = anchorY - 40

  // Flip to left if would overflow right edge
  if (posX + floatingWidth > boundaryWidth - 8) {
    posX = anchorX - floatingWidth - offsetVal
  }

  // Shift down if would overflow top edge
  if (posY < 60) {
    posY = 60
  }

  // Shift up if would overflow bottom edge
  if (posY + floatingHeight > boundaryHeight - 8) {
    posY = boundaryHeight - floatingHeight - 8
  }

  // Clamp to container origin (avoid negative offset)
  if (posX < offsetOriginX + 4) posX = offsetOriginX + 4
  if (posY < offsetOriginY + 4) posY = offsetOriginY + 4

  return { x: posX, y: posY }
}
