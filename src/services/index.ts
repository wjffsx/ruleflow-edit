/**
 * Services layer barrel export.
 * Re-exports all services from a single entry point.
 *
 * @module services
 */

export { searchService } from './searchService'

export {
  calculateSimplePosition,
  computePosition,
  flip,
  shift,
  offset,
  autoUpdate,
} from './floatingPosition'

export { showSuccess, showError, showWarning, showInfo, toast } from './toastService'
