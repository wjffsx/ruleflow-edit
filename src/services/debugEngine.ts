/**
 * Debug engine abstraction layer.
 *
 * Provides the DebugEngine interface for pluggable debug execution,
 * a built-in SimulationEngine for development/demo, and integration
 * with the debug store signals.
 *
 * @module debugEngine
 */

import type { DebugNodeState } from '../types/editor'
import {
  isDebugRunning,
  isDebugPaused,
  debugStep,
  debugTotalSteps,
  debugNodeStates,
  debugMessages,
  debugExecutionPath,
  debugBreakpoints,
  startDebug as storeStartDebug,
  stopDebug as storeStopDebug,
  pauseDebug as storePauseDebug,
  resumeDebug as storeResumeDebug,
  setDebugNodeState,
  addDebugMessage,
  lfInstance,
} from '../store'
import { TYPE_ORDER } from '../data'
import { RuleFlowError, ERROR_CODES } from '../utils'

// ── Types ────────────────────────────────────────────────────────

/** Result of a single debug step */
export interface DebugStepResult {
  /** Node ID that was executed */
  nodeId: string
  /** Execution state */
  state: DebugNodeState
  /** Node output data (optional) */
  output?: Record<string, unknown>
  /** Execution duration in ms */
  duration?: number
  /** Error message if failed */
  error?: string
}

/** Debug state snapshot */
export interface DebugStateSnapshot {
  nodeStates: Record<string, DebugNodeState>
  messages: Array<{ nodeId: string; type: string; message: string; time: number }>
  isRunning: boolean
  isPaused: boolean
  currentStep: number
  totalSteps: number
  executionPath: string[]
}

/** Pluggable debug engine interface */
export interface DebugEngine {
  /** Start a debug session */
  start(breakpoints: string[]): Promise<void>
  /** Execute one step */
  step(): Promise<DebugStepResult>
  /** Pause execution */
  pause(): void
  /** Resume execution */
  resume(): void
  /** Stop and reset */
  stop(): void
  /** Register state change callback */
  onStateChange(callback: (state: DebugStateSnapshot) => void): void
}

// ── Active engine management ─────────────────────────────────────

let activeEngine: DebugEngine | null = null
const stateChangeCallback: ((state: DebugStateSnapshot) => void) | null = null

/** Set the active debug engine (null to use built-in simulation) */
export function setDebugEngine(engine: DebugEngine | null): void {
  activeEngine = engine
}

/** Get the current debug engine (returns null if using built-in simulation) */
export function getDebugEngine(): DebugEngine | null {
  return activeEngine
}

// ── Built-in Simulation Engine ───────────────────────────────────

const intervalRef: { current: ReturnType<typeof setInterval> | null } = { current: null }

/**
 * Built-in simulation debug engine for development and demo.
 * Steps through nodes on an 800ms interval using TYPE_ORDER sorting.
 */
export class SimulationEngine implements DebugEngine {
  private steps: string[] = []
  private currentIdx = 0
  private callback: ((state: DebugStateSnapshot) => void) | null = null
  private lf: import('@logicflow/core').LogicFlow | null = null

  onStateChange(callback: (state: DebugStateSnapshot) => void): void {
    this.callback = callback
  }

  async start(_breakpoints: string[]): Promise<void> {
    const lf = lfInstance.value
    if (!lf) return
    this.lf = lf

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Build execution order
    const typeOrderMap: Record<string, number> = Object.fromEntries(
      TYPE_ORDER.map((t, i) => [t, i]),
    )
    typeOrderMap.input_port = 0
    typeOrderMap.output_port = TYPE_ORDER.length

    try {
      const data = lf.getGraphData()
      this.steps = [...(data.nodes || [])]
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

    if (this.steps.length === 0) return

    this.currentIdx = 0
    debugTotalSteps.value = this.steps.length
    debugStep.value = 0
    debugNodeStates.value = {}
    debugMessages.value = []
    debugExecutionPath.value = []

    // Start stepping
    intervalRef.current = setInterval(() => {
      if (this.currentIdx >= this.steps.length || !isDebugRunning.value) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        if (isDebugRunning.value) storeStopDebug()
        return
      }

      const nodeId = this.steps[this.currentIdx]
      debugStep.value = this.currentIdx + 1
      debugExecutionPath.value = [...debugExecutionPath.value, nodeId]

      // Mark previous as completed
      if (this.currentIdx > 0) {
        setDebugNodeState(this.steps[this.currentIdx - 1], 'success')
      }

      // Mark current as processing
      setDebugNodeState(nodeId, 'processing')

      // Resolve node name and write simulated debug data to node properties
      let nodeName: string = nodeId
      try {
        const model = lf!.getNodeModelById(nodeId)
        if (model) {
          nodeName = typeof model.text === 'object' ? model.text.value : model.text

          // P1-4: Generate simulated debug data for the node
          const simInput = this.generateSimInput(model)
          const simOutput = this.generateSimOutput(model)
          const simVariables = this.generateSimVariables(model)
          model.setProperties({
            ...model.properties,
            debugInput: simInput,
            debugOutput: simOutput,
            debugVariables: simVariables,
          })
        }
      } catch (_e) {
        if (import.meta.env.DEV) console.warn('[RuleFlow] node model lookup failed:', _e)
      }
      addDebugMessage({ nodeId, type: 'info', message: `执行节点: ${nodeName}` })

      this.currentIdx++

      // Finish
      if (this.currentIdx >= this.steps.length) {
        setTimeout(() => {
          setDebugNodeState(nodeId, 'success')
          addDebugMessage({ nodeId, type: 'success', message: `节点执行成功` })
          addDebugMessage({ nodeId: 'system', type: 'info', message: '规则链执行完成' })
          this.notifyStateChange()
        }, 600)
      }

      this.notifyStateChange()
    }, 800)

    this.notifyStateChange()
  }

  async step(): Promise<DebugStepResult> {
    if (this.currentIdx >= this.steps.length) {
      return { nodeId: '', state: 'idle' }
    }
    const nodeId = this.steps[this.currentIdx]
    this.currentIdx++
    setDebugNodeState(nodeId, 'success')
    return { nodeId, state: 'success' }
  }

  pause(): void {
    storePauseDebug()
    this.notifyStateChange()
  }

  resume(): void {
    storeResumeDebug()
    this.notifyStateChange()
  }

  stop(): void {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    this.steps = []
    this.currentIdx = 0
    storeStopDebug()
    this.notifyStateChange()
  }

  private notifyStateChange(): void {
    if (this.callback) {
      this.callback(getDebugStateSnapshot())
    }
  }

  // ── P1-4: Simulated debug data generators ──

  /** Generate simulated input data based on node type */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateSimInput(model: any): Record<string, unknown> {
    const role = model.properties?.roleInRule as string
    if (role === 'input') return { source: 'VPPTU Core', timestamp: Date.now() }
    if (role === 'output') return { target: 'VPPTU Storage' }
    if (role === 'action') {
      const actionType = model.properties?.actionType as string
      return { actionType, triggered: true, payload: { value: 42.5, unit: '°C' } }
    }
    if (role === 'logic_gate') {
      const op = model.properties?.conditionOp as string
      return { operator: op, childCount: model.properties?.childCount ?? 0 }
    }
    // condition leaf
    const leafType = model.properties?.leafType as string
    return {
      pointName: model.properties?.leafConfig?.point_name ?? 'unknown',
      currentValue: +(Math.random() * 100).toFixed(1),
      leafType: leafType || 'unknown',
    }
  }

  /** Generate simulated output data based on node type */
  private generateSimOutput(model: any): Record<string, unknown> {
    const role = model.properties?.roleInRule as string
    if (role === 'input') return { status: 'connected', nodeCount: 0 }
    if (role === 'output') return { status: 'written' }
    if (role === 'action') return { result: 'executed', timestamp: Date.now() }
    if (role === 'logic_gate') {
      const passed = Math.random() > 0.3
      return { result: passed ? 'passed' : 'failed', matchedChildren: passed ? 2 : 0 }
    }
    // condition leaf
    const passed = Math.random() > 0.4
    return { matched: passed, reason: passed ? '条件满足' : '条件不满足' }
  }

  /** Generate simulated variables for the node execution context */
  private generateSimVariables(model: any): Record<string, unknown> {
    const role = model.properties?.roleInRule as string
    if (role === 'input' || role === 'output') return {}
    return {
      executionTime: `${(Math.random() * 5 + 0.1).toFixed(1)}ms`,
      ruleId: model.properties?.ruleId ?? '',
      enabled: model.properties?.enabled ?? true,
    }
  }
}

// ── Debug orchestration (unified API) ────────────────────────────

/** Get current debug state snapshot */
export function getDebugStateSnapshot(): DebugStateSnapshot {
  return {
    nodeStates: { ...debugNodeStates.value },
    messages: [...debugMessages.value],
    isRunning: isDebugRunning.value,
    isPaused: isDebugPaused.value,
    currentStep: debugStep.value,
    totalSteps: debugTotalSteps.value,
    executionPath: [...debugExecutionPath.value],
  }
}

/** Start debug — uses active engine or falls back to simulation */
export async function startDebugWithEngine(): Promise<void> {
  storeStartDebug()

  if (activeEngine) {
    const bps = [...debugBreakpoints.value]
    await activeEngine.start(bps)
  } else {
    const sim = new SimulationEngine()
    sim.onStateChange((state) => {
      if (stateChangeCallback) stateChangeCallback(state)
    })
    await sim.start([])
  }
}

/** Step debug — uses active engine or no-op for simulation (auto-stepping) */
export async function stepDebugWithEngine(): Promise<DebugStepResult | null> {
  if (activeEngine) {
    return activeEngine.step()
  }
  // Simulation engine auto-steps, manual step not supported
  return null
}

/** Pause debug */
export function pauseDebugWithEngine(): void {
  if (activeEngine) {
    activeEngine.pause()
  } else {
    storePauseDebug()
  }
}

/** Resume debug */
export function resumeDebugWithEngine(): void {
  if (activeEngine) {
    activeEngine.resume()
  } else {
    storeResumeDebug()
  }
}

/** Stop debug */
export function stopDebugWithEngine(): void {
  if (activeEngine) {
    activeEngine.stop()
  } else {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    storeStopDebug()
  }
}

/** Count nodes by debug state category */
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

/** Clear the simulation interval (e.g. on component unmount) */
export function clearSimulationInterval() {
  if (intervalRef.current) {
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }
}

// Re-export store-level debugBreakpoints for convenience
export { debugBreakpoints } from '../store'
