/**
 * Debug simulation — backward-compatible re-export layer.
 *
 * All logic has been moved to services/debugEngine.ts.
 * This module re-exports the public API for backward compatibility.
 *
 * @module debugSimulation
 */

export {
  countStates,
  clearSimulationInterval,
  SimulationEngine,
  startDebugWithEngine,
  stepDebugWithEngine,
  pauseDebugWithEngine,
  resumeDebugWithEngine,
  stopDebugWithEngine,
  getDebugStateSnapshot,
  setDebugEngine,
  getDebugEngine,
} from '../../services/debugEngine'

export type { DebugEngine, DebugStepResult, DebugStateSnapshot } from '../../services/debugEngine'
