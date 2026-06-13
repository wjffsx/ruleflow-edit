/**
 * History (undo/redo) state management.
 * Delegates to LogicFlow's built-in history API.
 */
import { signal } from '@preact/signals'
import { lfInstance } from './canvasStore'
import { RuleFlowError, ERROR_CODES } from '../utils'

/** Whether undo is available */
export const canUndo = signal<boolean>(false)

/** Whether redo is available */
export const canRedo = signal<boolean>(false)

/** Perform undo via LogicFlow */
export function undo(): void {
  const lf = lfInstance.value
  if (lf) {
    try {
      lf.undo()
    } catch (e) {
      if (import.meta.env.DEV)
        console.warn(new RuleFlowError('撤销失败', ERROR_CODES.LF_OPERATION, { cause: e }))
    }
  }
}

/** 通过 LogicFlow 执行重做 */
export function redo(): void {
  const lf = lfInstance.value
  if (lf) {
    try {
      lf.redo()
    } catch (e) {
      if (import.meta.env.DEV)
        console.warn(new RuleFlowError('重做失败', ERROR_CODES.LF_OPERATION, { cause: e }))
    }
  }
}

/** 从 LogicFlow 历史同步撤销/重做可用状态 */
export function syncHistoryState(): void {
  const lf = lfInstance.value
  if (lf) {
    try {
      const data = lf.getGraphData()
      canUndo.value = Boolean(data?.Undo)
      canRedo.value = Boolean(data?.Redo)
    } catch (e) {
      canUndo.value = false
      canRedo.value = false
    }
  }
}
