/**
 * Utility functions barrel export.
 *
 * @module utils
 */

export {
  safeReadStorage,
  safeJsonParse,
  hasRequiredKeys,
  isValidGraphData,
  isValidNodeItem,
  safeGetTheme,
  safeGetThemePref,
  safeGetDensity,
  safeGetLang,
  safeReadJsonStorage,
  isBooleanRecord,
  safeSetStorage,
} from './validation'

export { RuleFlowError, ERROR_CODES } from './errors'
export type { ErrorCode } from './errors'

export {
  buildRuleflowDocument,
  applyDocumentToLf,
  downloadAsJsonFile,
  downloadAsJsonPair,
  readJsonFile,
  // 阶段 2: 语义/视图分离
  buildSemanticDocument,
  buildViewDocument,
  splitToSemanticAndView,
  mergeFromSemanticAndView,
  // 阶段 4.1: 视图态本地化
  saveViewToLocalStorage,
  loadViewFromLocalStorage,
  clearViewFromLocalStorage,
  // 阶段 4.2: JSON Schema 强校验
  validateSemanticDocument,
  // 阶段 4.3: ruleId 命名约定
  isValidRuleId,
  generateRuleId,
} from './ruleflowSerializer'
export type {
  SemanticDocument,
  SemanticNode,
  SemanticEdge,
  ViewDocument,
  ViewNode,
  ViewEdge,
  SplitResult,
  ValidationError,
  ValidationResult,
} from './ruleflowSerializer'
