import { useEffect } from 'preact/hooks'
import {
  Play,
  Pause,
  Square,
  SkipForward,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Bug,
} from 'lucide-preact'
import {
  isDebugRunning,
  isDebugPaused,
  debugStep,
  debugTotalSteps,
  debugNodeStates,
  debugMessages,
  debugBreakpoints,
  pauseDebug,
  resumeDebug,
  stopDebug,
  stepDebug,
  toggleBreakpoint,
} from '../../store'
import { simulateDebug, countStates, clearSimulationInterval } from './debugSimulation'
import s from './DebugPanel.module.css'

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

  useEffect(() => {
    return () => {
      clearSimulationInterval()
    }
  }, [])

  return (
    <div class="rf-content">
      {/* Run controls */}
      <div class="rf-section-title">
        <Play size={12} />
        运行控制
      </div>

      <div class={s.ctrlRow}>
        {!running ? (
          <button
            class={s.ctrlBtn}
            style={{ color: 'var(--rf-status-success)' }}
            onClick={simulateDebug}
            title="运行"
            aria-label="运行调试"
          >
            <Play size={16} />
          </button>
        ) : (
          <>
            <button
              class={`${s.ctrlBtn} ${paused ? s.ctrlBtnActive : ''}`}
              style={{ color: 'var(--rf-brand-primary)' }}
              onClick={paused ? resumeDebug : pauseDebug}
              title={paused ? '继续' : '暂停'}
              aria-label={paused ? '继续' : '暂停'}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              class={s.ctrlBtn}
              style={{ color: 'var(--rf-status-danger)' }}
              onClick={stopDebug}
              title="停止"
              aria-label="停止调试"
            >
              <Square size={16} />
            </button>
            <button class={s.ctrlBtn} onClick={stepDebug} title="单步执行" aria-label="单步执行">
              <SkipForward size={16} />
            </button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {running && (
        <div>
          <div class={s.progressInfo}>
            <span>
              步骤 {step}/{total}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div class={s.progressBar}>
            <div class={s.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* State summary cards */}
      <div class="rf-section-title">
        <Bug size={12} />
        节点状态
      </div>
      <div class={s.cardGrid}>
        <div
          class={s.statCard}
          style={{
            background: 'var(--rf-status-success-light)',
            borderLeft: '3px solid var(--rf-status-success)',
          }}
        >
          <div class={s.statValue} style={{ color: 'var(--rf-status-success)' }}>
            {counts.success}
          </div>
          <div class={s.statLabel}>成功</div>
        </div>
        <div
          class={s.statCard}
          style={{
            background: 'var(--rf-status-danger-light)',
            borderLeft: '3px solid var(--rf-status-danger)',
          }}
        >
          <div class={s.statValue} style={{ color: 'var(--rf-status-danger)' }}>
            {counts.failure}
          </div>
          <div class={s.statLabel}>失败</div>
        </div>
        <div
          class={s.statCard}
          style={{
            background: 'var(--rf-status-processing-light)',
            borderLeft: '3px solid var(--rf-status-processing)',
          }}
        >
          <div class={s.statValue} style={{ color: 'var(--rf-status-processing)' }}>
            {counts.processing}
          </div>
          <div class={s.statLabel}>处理中</div>
        </div>
      </div>

      {/* Breakpoints */}
      {breakpoints.length > 0 && (
        <div style={{ marginBottom: 'var(--rf-space-4, 16px)' }}>
          <div class="rf-section-title">
            <AlertTriangle size={12} />
            断点
          </div>
          {breakpoints.map((bp: string) => (
            <div key={bp} class={s.breakpointItem}>
              <div class={s.breakpointDot} />
              <span style={{ flex: 1, color: 'var(--rf-text-primary)' }}>{bp}</span>
              <button class={s.breakpointRemoveBtn} onClick={() => toggleBreakpoint(bp)}>
                移除
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Execution log */}
      <div class="rf-section-title">
        <Clock size={12} />
        执行日志
      </div>
      <div class={s.logScroll}>
        {messages.length === 0 ? (
          <div class={s.logEmpty}>运行规则链后查看执行日志</div>
        ) : (
          messages.map((msg: any, i: number) => {
            const iconMap: Record<string, any> = {
              success: CheckCircle,
              failure: XCircle,
              info: Clock,
              warning: AlertTriangle,
            }
            const colorMap: Record<string, string> = {
              success: 'var(--rf-status-success)',
              failure: 'var(--rf-status-danger)',
              info: 'var(--rf-brand-primary)',
              warning: 'var(--rf-status-warning)',
            }
            const Icon = iconMap[msg.type] || Clock
            const color = colorMap[msg.type] || 'var(--rf-text-tertiary)'
            const time = msg.time
              ? new Date(msg.time).toLocaleTimeString('zh-CN', { hour12: false })
              : ''
            return (
              <div key={i} class={s.logItem}>
                <Icon size={11} style={{ color, flexShrink: 0, marginTop: 2 }} />
                <span class={s.logTime}>{time}</span>
                <span class={s.logMessage}>{msg.message}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
