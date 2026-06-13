/**
 * Debug simulation logic — pure functions and orchestration.
 *
 * This module contains the debug execution simulation engine and
 * related utility functions. It has no Preact / UI dependencies;
 * all state mutations go through the store signals.
 *
 * @module debugSimulation
 */

import {
  isDebugRunning,
  debugStep,
  debugTotalSteps,
  debugNodeStates,
  debugMessages,
  debugExecutionPath,
  stopDebug,
  setDebugNodeState,
  addDebugMessage,
  lfInstance,
} from '../../store'
import { TYPE_ORDER } from '../../data'
import { RuleFlowError, ERROR_CODES } from '../../utils'

/** Interval handle for the running simulation step timer */
const intervalRef: { current: ReturnType<typeof setInterval> | null } = { current: null }

/**
 * Count nodes by their debug state category.
 *
 * @param nodeStates - Map of node ID → state string
 * @returns An object with `success`, `failure`, `processing`, and `idle` counts
 */
export function countStates(nodeStates: Record<string, string>) {
  let success = 0,
    failure = 0,
    processing = 0,
    idle = 0
  Object.values(nodeStates).forEach((st) => {
    if (st === 'success') success++
    else if (st === 'failure') failure++
    else if (st === 'processing') processing++
    else idle++
  })
  return { success, failure, processing, idle }
}

/**
 * Start a simulated debug execution using the actual graph nodes.
 *
 * Reads the current graph from the LogicFlow instance, sorts nodes
 * by their type order (input → condition → action → … → output),
 * then steps through each node on an 800 ms interval, updating
 * debug state signals along the way.
 */
export function simulateDebug() {
  const lf = lfInstance.value
  if (!lf) return

  // Clear any existing interval
  if (intervalRef.current) {
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  let steps: string[] = []
  try {
    const data = lf.getGraphData()
    // Build execution order using TYPE_ORDER from nodeRegistry
    const typeOrderMap: Record<string, number> = Object.fromEntries(
      TYPE_ORDER.map((t, i) => [t, i]),
    )
    typeOrderMap.input_port = 0
    typeOrderMap.output_port = TYPE_ORDER.length
    steps = [...(data.nodes || [])]
      .sort(
        (a, b) =>
          (typeOrderMap[a.properties?.nodeType as string] ?? 3) -
          (typeOrderMap[b.properties?.nodeType as string] ?? 3),
      )
      .map((n) => n.id)
  } catch (e) {
    throw new RuleFlowError(
      'Failed to read graph data for debug simulation',
      ERROR_CODES.LF_OPERATION,
      { cause: e },
    )
  }

  if (steps.length === 0) return

  debugTotalSteps.value = steps.length
  debugStep.value = 0
  debugNodeStates.value = {}
  debugMessages.value = []
  debugExecutionPath.value = []

  let i = 0
  intervalRef.current = setInterval(() => {
    if (i >= steps.length || !isDebugRunning.value) {
      clearInterval(intervalRef.current!)
      intervalRef.current = null
      if (isDebugRunning.value) stopDebug()
      return
    }

    const nodeId = steps[i]
    debugStep.value = i + 1
    debugExecutionPath.value = [...debugExecutionPath.value, nodeId]

    // Mark previous as completed
    if (i > 0) {
      setDebugNodeState(steps[i - 1], 'success')
    }

    // Mark current as processing
    setDebugNodeState(nodeId, 'processing')
    // Resolve node name for log message
    let nodeName: string = nodeId
    try {
      const model = lf!.getNodeModelById(nodeId)
      if (model) nodeName = typeof model.text === 'object' ? model.text.value : model.text
    } catch (_e) {
      if (import.meta.env.DEV) console.warn('[RuleFlow] node model lookup failed:', _e)
    }
    addDebugMessage({ nodeId, type: 'info', message: `执行节点: ${nodeName}` })

    i++

    // Finish
    if (i >= steps.length) {
      setTimeout(() => {
        setDebugNodeState(nodeId, 'success')
        addDebugMessage({ nodeId, type: 'success', message: `节点执行成功` })
        addDebugMessage({ nodeId: 'system', type: 'info', message: '规则链执行完成' })
      }, 600)
    }
  }, 800)
}

/**
 * Clear the simulation interval (e.g. on component unmount).
 */
export function clearSimulationInterval() {
  if (intervalRef.current) {
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }
}
