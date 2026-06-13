/**
 * Floating UI positioning utilities for RuleFlow Editor.
 * Uses @floating-ui/dom for accurate overlay positioning.
 */
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom'

/**
 * Calculate optimal position for a floating element relative to a virtual anchor point.
 * @param {Object} options - Positioning options
 * @param {number} options.x - Anchor x coordinate
 * @param {number} options.y - Anchor y coordinate
 * @param {HTMLElement} options.floatingEl - The floating element to position
 * @param {string} options.placement - Preferred placement (default: 'right-start')
 * @param {number} options.offsetValue - Offset from anchor (default: 8)
 * @returns {Promise<{x: number, y: number}>} Calculated position
 */
export async function calculateFloatingPosition({ x, y, floatingEl, placement = 'right-start', offsetValue = 8 }) {
  // Create a virtual anchor element at the specified coordinates
  const virtualAnchor = {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x: x,
        y: y,
        top: y,
        left: x,
        right: x,
        bottom: y,
      }
    },
  }

  const { x: posX, y: posY } = await computePosition(virtualAnchor, floatingEl, {
    placement,
    middleware: [
      offset(offsetValue),
      flip({ fallbackPlacements: ['left-start', 'bottom', 'top'] }),
      shift({ padding: 8 }),
    ],
  })

  return { x: posX, y: posY }
}

/**
 * Create auto-update positioning for a floating element.
 * Useful when the anchor position might change (e.g., during node drag).
 * @param {Object} options - Auto-update options
 * @param {HTMLElement} options.anchorEl - The anchor element
 * @param {HTMLElement} options.floatingEl - The floating element
 * @param {Function} options.onUpdate - Callback when position updates
 * @returns {Function} Cleanup function to stop auto-update
 */
export function createAutoUpdatePosition({ anchorEl, floatingEl, onUpdate, placement = 'right-start', offsetValue = 8 }) {
  return autoUpdate(anchorEl, floatingEl, async () => {
    const { x, y } = await computePosition(anchorEl, floatingEl, {
      placement,
      middleware: [
        offset(offsetValue),
        flip(),
        shift({ padding: 8 }),
      ],
    })
    onUpdate({ x, y })
  })
}

/**
 * Simple synchronous position calculation for immediate positioning.
 * Falls back to manual calculation if floating-ui is not available.
 * @param {number} x - Anchor x coordinate
 * @param {number} y - Anchor y coordinate
 * @param {number} floatingWidth - Width of floating element
 * @param {number} floatingHeight - Height of floating element
 * @param {number} offset - Offset from anchor
 * @returns {{x: number, y: number}} Calculated position
 */
export function calculateSimplePosition(x, y, floatingWidth = 200, floatingHeight = 200, offset = 8) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Default: position to the right and slightly above
  let posX = x + offset
  let posY = y - 40
  
  // Flip to left if would overflow right edge
  if (posX + floatingWidth > viewportWidth - 8) {
    posX = x - floatingWidth - offset
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