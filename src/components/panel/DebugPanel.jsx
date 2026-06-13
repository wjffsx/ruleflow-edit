import { h } from 'preact'
import { Play, Pause, Square, SkipForward, AlertTriangle, CheckCircle, XCircle, Clock, Bug } from 'lucide-preact'
import {
  isDebugRunning, isDebugPaused, debugStep, debugTotalSteps,
  debugNodeStates, debugMessages, debugBreakpoints, debugExecutionPath,
  startDebug, pauseDebug, resumeDebug, stopDebug, stepDebug, toggleBreakpoint,
  selectedNodeId, nodeCount, setDebugNodeState, addDebugMessage,
} from '../../store/editorStore'

const sectionTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2, 8px)',
  fontSize: 'var(--rf-text-xs, 10px)',
  fontWeight: 600,
  color: 'var(--rf-text-secondary, #6b7280)',
  marginBottom: 'var(--rf-space-3, 12px)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const contentStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: 'var(--rf-space-4, 16px)',
  fontFamily: 'var(--rf-font-sans, sans-serif)',
}

const ctrlBtnStyle = (active, color) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  border: active ? '1px solid var(--rf-brand-primary)' : '1px solid var(--rf-border)',
  borderRadius: 'var(--rf-radius-md, 6px)',
  background: active ? 'var(--rf-brand-primary-light)' : 'var(--rf-bg-primary)',
  color: color || 'var(--rf-text-secondary)',
  cursor: 'pointer',
  transition: 'all 120ms',
})

const cardGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 'var(--rf-space-2, 8px)',
  marginBottom: 'var(--rf-space-4, 16px)',
}

const statCardStyle = (colorVar, lightVar) => ({
  padding: 'var(--rf-space-2, 8px)',
  borderRadius: 'var(--rf-radius-md, 6px)',
  background: `var(${lightVar})`,
  borderLeft: `3px solid var(${colorVar})`,
  fontSize: 'var(--rf-text-xs, 10px)',
})

const logItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--rf-space-2, 8px)',
  padding: '6px 0',
  borderBottom: '1px solid var(--rf-border-light, #f3f4f6)',
  fontSize: 'var(--rf-text-sm, 11px)',
  fontFamily: 'var(--rf-font-mono, monospace)',
}

const progressBarStyle = {
  width: '100%',
  height: 6,
  borderRadius: 3,
  background: 'var(--rf-bg-tertiary, #e5e7eb)',
  overflow: 'hidden',
  marginBottom: 'var(--rf-space-3, 12px)',
}

// Count node states
function countStates(nodeStates) {
  let success = 0, failure = 0, processing = 0, idle = 0
  Object.values(nodeStates).forEach(s => {
    if (s === 'success') success++
    else if (s === 'failure') failure++
    else if (s === 'processing') processing++
    else idle++
  })
  return { success, failure, processing, idle }
}

// Demo: simulate debug execution
function simulateDebug() {
  const steps = ['input_soc', 'cond_soc', 'action_transform', 'action_dispatch', 'output_dispatch']
  debugTotalSteps.value = steps.length
  debugStep.value = 0
  debugNodeStates.value = {}
  debugMessages.value = []
  debugExecutionPath.value = []

  let i = 0
  const interval = setInterval(() => {
    if (i >= steps.length || !isDebugRunning.value) {
      clearInterval(interval)
      if (isDebugRunning.value) stopDebug()
      return
    }

    const nodeId = steps[i]
    debugStep.value = i + 1
    debugExecutionPath.value = [...debugExecutionPath.value, nodeId]

    // Mark previous as completed
    if (i > 0) {
      setDebugNodeState(steps[i-1], 'success')
    }

    // Mark current as processing
    setDebugNodeState(nodeId, 'processing')
    addDebugMessage({ nodeId, type: 'info', message: `执行节点: ${nodeId}` })

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

export function DebugPanel() {
  const running = isDebugRunning.value
  const paused = isDebugPaused.value
  const step = debugStep.value
  const total = debugTotalSteps.value
  const states = debugNodeStates.value
  const messages = debugMessages.value
  const breakpoints = debugBreakpoints.value
  const counts = countStates(states)

  const progressPct = total > 0 ? Math.round((step / total) * 100) : 0

  return (
    <div style={contentStyle}>
      {/* Run controls */}
      <div style={sectionTitleStyle}>
        <Play size={12} />
        运行控制
      </div>

      <div style={{ display: 'flex', gap: 'var(--rf-space-2, 8px)', marginBottom: 'var(--rf-space-3, 12px)' }}>
        {!running ? (
          <button style={ctrlBtnStyle(false, 'var(--rf-status-success)')} onClick={simulateDebug} title="运行" aria-label="运行调试">
            <Play size={16} />
          </button>
        ) : (
          <>
            <button style={ctrlBtnStyle(paused, 'var(--rf-brand-primary)')} onClick={paused ? resumeDebug : pauseDebug} title={paused ? '继续' : '暂停'} aria-label={paused ? '继续' : '暂停'}>
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button style={ctrlBtnStyle(false, 'var(--rf-status-danger)')} onClick={stopDebug} title="停止" aria-label="停止调试">
              <Square size={16} />
            </button>
            <button style={ctrlBtnStyle(false)} onClick={stepDebug} title="单步执行" aria-label="单步执行">
              <SkipForward size={16} />
            </button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {running && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--rf-text-2xs, 9px)', color: 'var(--rf-text-tertiary)', marginBottom: 4 }}>
            <span>步骤 {step}/{total}</span>
            <span>{progressPct}%</span>
          </div>
          <div style={progressBarStyle}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              borderRadius: 3,
              background: 'var(--rf-brand-primary)',
              transition: 'width 300ms ease',
            }} />
          </div>
        </div>
      )}

      {/* State summary cards */}
      <div style={sectionTitleStyle}>
        <Bug size={12} />
        节点状态
      </div>
      <div style={cardGridStyle}>
        <div style={statCardStyle('--rf-status-success', '--rf-status-success-light')}>
          <div style={{ color: 'var(--rf-status-success)', fontWeight: 700, fontSize: 'var(--rf-text-lg, 16px)' }}>{counts.success}</div>
          <div style={{ color: 'var(--rf-text-secondary)' }}>成功</div>
        </div>
        <div style={statCardStyle('--rf-status-danger', '--rf-status-danger-light')}>
          <div style={{ color: 'var(--rf-status-danger)', fontWeight: 700, fontSize: 'var(--rf-text-lg, 16px)' }}>{counts.failure}</div>
          <div style={{ color: 'var(--rf-text-secondary)' }}>失败</div>
        </div>
        <div style={statCardStyle('--rf-status-processing', '--rf-status-processing-light')}>
          <div style={{ color: 'var(--rf-status-processing)', fontWeight: 700, fontSize: 'var(--rf-text-lg, 16px)' }}>{counts.processing}</div>
          <div style={{ color: 'var(--rf-text-secondary)' }}>处理中</div>
        </div>
      </div>

      {/* Breakpoints */}
      {breakpoints.length > 0 && (
        <div style={{ marginBottom: 'var(--rf-space-4, 16px)' }}>
          <div style={sectionTitleStyle}>
            <AlertTriangle size={12} />
            断点
          </div>
          {breakpoints.map(bp => (
            <div key={bp} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 'var(--rf-text-sm, 11px)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 'var(--rf-radius-full)', background: 'var(--rf-status-danger)' }} />
              <span style={{ flex: 1, color: 'var(--rf-text-primary)' }}>{bp}</span>
              <button style={{ border: 'none', background: 'transparent', color: 'var(--rf-text-tertiary)', cursor: 'pointer', fontSize: 'var(--rf-text-2xs, 9px)' }} onClick={() => toggleBreakpoint(bp)}>移除</button>
            </div>
          ))}
        </div>
      )}

      {/* Execution log */}
      <div style={sectionTitleStyle}>
        <Clock size={12} />
        执行日志
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--rf-text-tertiary)', fontSize: 'var(--rf-text-sm, 11px)', textAlign: 'center', padding: 'var(--rf-space-4, 16px)' }}>
            运行规则链后查看执行日志
          </div>
        ) : (
          messages.map((msg, i) => {
            const iconMap = { success: CheckCircle, failure: XCircle, info: Clock, warning: AlertTriangle }
            const colorMap = { success: 'var(--rf-status-success)', failure: 'var(--rf-status-danger)', info: 'var(--rf-brand-primary)', warning: 'var(--rf-status-warning)' }
            const Icon = iconMap[msg.type] || Clock
            const color = colorMap[msg.type] || 'var(--rf-text-tertiary)'
            const time = msg.time ? new Date(msg.time).toLocaleTimeString('zh-CN', { hour12: false }) : ''
            return (
              <div key={i} style={logItemStyle}>
                <Icon size={11} style={{ color, flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: 'var(--rf-text-tertiary)', fontSize: 'var(--rf-text-2xs, 9px)', flexShrink: 0 }}>{time}</span>
                <span style={{ color: 'var(--rf-text-primary)', flex: 1 }}>{msg.message}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
