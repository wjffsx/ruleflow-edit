/**
 * Debug state management.
 * Handles debug execution, breakpoints, node states, and execution logs.
 */
import { signal } from '@preact/signals'
import type { DebugNodeState } from '../types/editor'

/** Whether a debug session is running */
export const isDebugRunning = signal<boolean>(false)

/** Currently debugging node ID */
export const debugNodeId = signal<string | null>(null)

/** Current step in execution */
export const debugStep = signal<number>(0)

/** Total steps in the execution plan */
export const debugTotalSteps = signal<number>(0)

/** Ordered list of node IDs in the execution path */
export const debugExecutionPath = signal<string[]>([])

/** Per-node debug state: nodeId → state */
export const debugNodeStates = signal<Record<string, DebugNodeState>>({})

/** Debug messages log */
export const debugMessages = signal<
  Array<{ nodeId: string; type: string; message: string; time: number }>
>([])

/** Breakpoint node IDs */
export const debugBreakpoints = signal<string[]>([])

/** Whether the debug session is paused */
export const isDebugPaused = signal<boolean>(false)

/** 启动调试会话 */
export function startDebug(): void {
  isDebugRunning.value = true
  isDebugPaused.value = false
  debugNodeStates.value = {}
  debugMessages.value = []
  debugExecutionPath.value = []
  debugStep.value = 0
}

/** Pause the debug session */
export function pauseDebug(): void {
  isDebugPaused.value = true
}

/** Resume the debug session */
export function resumeDebug(): void {
  isDebugPaused.value = false
}

/** 停止调试会话并重置状态 */
export function stopDebug(): void {
  isDebugRunning.value = false
  isDebugPaused.value = false
  debugStep.value = 0
  debugExecutionPath.value = []
  debugNodeStates.value = {}
}

/** Advance debug by one step */
export function stepDebug(): void {
  if (debugStep.value < debugTotalSteps.value) {
    debugStep.value++
  }
}

/** 切换节点断点 */
export function toggleBreakpoint(nodeId: string): void {
  const bps = [...debugBreakpoints.value]
  const idx = bps.indexOf(nodeId)
  if (idx >= 0) {
    bps.splice(idx, 1)
  } else {
    bps.push(nodeId)
  }
  debugBreakpoints.value = bps
}

/** 设置节点调试状态 */
export function setDebugNodeState(nodeId: string, state: DebugNodeState): void {
  debugNodeStates.value = { ...debugNodeStates.value, [nodeId]: state }
}

/** Maximum number of debug messages to retain */
const MAX_DEBUG_MESSAGES = 500

/** Add a debug message to the log */
export function addDebugMessage(msg: { nodeId: string; type: string; message: string }): void {
  const current = debugMessages.value
  const next = [...current, { ...msg, time: Date.now() }]
  debugMessages.value = next.length > MAX_DEBUG_MESSAGES ? next.slice(-MAX_DEBUG_MESSAGES) : next
}
