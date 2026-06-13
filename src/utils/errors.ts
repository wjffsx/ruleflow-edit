/**
 * Standard error class for RuleFlow Editor.
 * Provides structured error information with error codes and optional cause chain.
 *
 * @example
 * ```ts
 * throw new RuleFlowError('Invalid graph data', 'INVALID_GRAPH', { cause: originalError })
 * ```
 */
export class RuleFlowError extends Error {
  /** Machine-readable error code */
  public readonly code: string

  /** Original cause of this error */
  public cause?: unknown

  constructor(message: string, code: string, options?: { cause?: unknown }) {
    super(message)
    this.cause = options?.cause
    this.name = 'RuleFlowError'
    this.code = code
  }
}

/** Common error codes used across RuleFlow Editor */
export const ERROR_CODES = {
  /** Invalid graph data structure */
  INVALID_GRAPH: 'INVALID_GRAPH',
  /** Invalid node data from drag-drop */
  INVALID_NODE: 'INVALID_NODE',
  /** File operation failed */
  FILE_OPERATION: 'FILE_OPERATION',
  /** LogicFlow operation failed */
  LF_OPERATION: 'LF_OPERATION',
  /** Layout operation failed */
  LAYOUT: 'LAYOUT',
  /** Debug operation failed */
  DEBUG: 'DEBUG',
} as const

/** Error code type derived from ERROR_CODES */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
