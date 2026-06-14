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
  Database,
} from 'lucide-preact'
import {
  isDebugRunning,
  isDebugPaused,
  debugStep,
  debugTotalSteps,
  debugNodeStates,
  debugMessages,
  debugBreakpoints,
  debugNodeId,
  pauseDebug,
  resumeDebug,
  stopDebug,
  stepDebug,
  toggleBreakpoint,
  lfInstance,
} from '../../store'
import { startDebugWithEngine, countStates, clearSimulationInterval } from './debugSimulation'

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

      <div class="flex gap-[var(--rf-space-2,8px)] mb-[var(--rf-space-3,12px)]">
        {!running ? (
          <button
            class="flex items-center justify-center w-[34px] h-[34px] border border-[var(--rf-border)] rounded-[var(--rf-radius-md,6px)] bg-[var(--rf-bg-primary)] text-[var(--rf-text-secondary)] cursor-pointer transition-all duration-120 hover:bg-[var(--rf-bg-hover)]"
            style={{ color: 'var(--rf-status-success)' }}
            onClick={() => startDebugWithEngine()}
            title="运行"
            aria-label="运行调试"
          >
            <Play size={16} />
          </button>
        ) : (
          <>
            <button
              class={`flex items-center justify-center w-[34px] h-[34px] border border-[var(--rf-border)] rounded-[var(--rf-radius-md,6px)] bg-[var(--rf-bg-primary)] text-[var(--rf-text-secondary)] cursor-pointer transition-all duration-120 hover:bg-[var(--rf-bg-hover)] ${paused ? 'border-[var(--rf-brand-primary)] bg-[var(--rf-brand-primary-light)] text-[var(--rf-brand-primary)] hover:bg-[var(--rf-brand-primary-light)]' : ''}`}
              style={{ color: 'var(--rf-brand-primary)' }}
              onClick={paused ? resumeDebug : pauseDebug}
              title={paused ? '继续' : '暂停'}
              aria-label={paused ? '继续' : '暂停'}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              class="flex items-center justify-center w-[34px] h-[34px] border border-[var(--rf-border)] rounded-[var(--rf-radius-md,6px)] bg-[var(--rf-bg-primary)] text-[var(--rf-text-secondary)] cursor-pointer transition-all duration-120 hover:bg-[var(--rf-bg-hover)]"
              style={{ color: 'var(--rf-status-danger)' }}
              onClick={stopDebug}
              title="停止"
              aria-label="停止调试"
            >
              <Square size={16} />
            </button>
            <button
              class="flex items-center justify-center w-[34px] h-[34px] border border-[var(--rf-border)] rounded-[var(--rf-radius-md,6px)] bg-[var(--rf-bg-primary)] text-[var(--rf-text-secondary)] cursor-pointer transition-all duration-120 hover:bg-[var(--rf-bg-hover)]"
              onClick={stepDebug}
              title="单步执行"
              aria-label="单步执行"
            >
              <SkipForward size={16} />
            </button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {running && (
        <div>
          <div class="flex justify-between text-[var(--rf-text-2xs,9px)] text-[var(--rf-text-tertiary)] mb-1">
            <span>
              步骤 {step}/{total}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div class="w-full h-1.5 rounded bg-[var(--rf-bg-tertiary,#e5e7eb)] overflow-hidden mb-[var(--rf-space-3,12px)]">
            <div
              class="h-full rounded bg-[var(--rf-brand-primary)] transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* State summary cards */}
      <div class="rf-section-title">
        <Bug size={12} />
        节点状态
      </div>
      <div class="grid grid-cols-3 gap-[var(--rf-space-2,8px)] mb-[var(--rf-space-4,16px)]">
        <div
          class="p-[var(--rf-space-2,8px)] rounded-[var(--rf-radius-md,6px)] text-[var(--rf-text-xs,10px)]"
          style={{
            background: 'var(--rf-status-success-light)',
            borderLeft: '3px solid var(--rf-status-success)',
          }}
        >
          <div
            class="font-bold text-[var(--rf-text-lg,16px)]"
            style={{ color: 'var(--rf-status-success)' }}
          >
            {counts.success}
          </div>
          <div class="text-[var(--rf-text-secondary)]">成功</div>
        </div>
        <div
          class="p-[var(--rf-space-2,8px)] rounded-[var(--rf-radius-md,6px)] text-[var(--rf-text-xs,10px)]"
          style={{
            background: 'var(--rf-status-danger-light)',
            borderLeft: '3px solid var(--rf-status-danger)',
          }}
        >
          <div
            class="font-bold text-[var(--rf-text-lg,16px)]"
            style={{ color: 'var(--rf-status-danger)' }}
          >
            {counts.failure}
          </div>
          <div class="text-[var(--rf-text-secondary)]">失败</div>
        </div>
        <div
          class="p-[var(--rf-space-2,8px)] rounded-[var(--rf-radius-md,6px)] text-[var(--rf-text-xs,10px)]"
          style={{
            background: 'var(--rf-status-processing-light)',
            borderLeft: '3px solid var(--rf-status-processing)',
          }}
        >
          <div
            class="font-bold text-[var(--rf-text-lg,16px)]"
            style={{ color: 'var(--rf-status-processing)' }}
          >
            {counts.processing}
          </div>
          <div class="text-[var(--rf-text-secondary)]">处理中</div>
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
            <div key={bp} class="flex items-center gap-1.5 py-1 text-[var(--rf-text-sm,11px)]">
              <div class="w-2 h-2 rounded-[var(--rf-radius-full)] bg-[var(--rf-status-danger)]" />
              <span style={{ flex: 1, color: 'var(--rf-text-primary)' }}>{bp}</span>
              <button
                class="border-none bg-transparent text-[var(--rf-text-tertiary)] cursor-pointer text-[var(--rf-text-2xs,9px)] hover:text-[var(--rf-text-primary)]"
                onClick={() => toggleBreakpoint(bp)}
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}

      {/* P1-4: Node data inspection */}
      {running &&
        (() => {
          // Find the currently processing node
          const processingNodeId =
            Object.entries(states).find(([, s]) => s === 'processing')?.[0] || debugNodeId.value
          if (!processingNodeId) return null

          const lf = lfInstance.value
          let nodeData: Record<string, unknown> | null = null
          let nodeName = processingNodeId
          if (lf) {
            try {
              const model = lf.getNodeModelById(processingNodeId)
              if (model) {
                nodeName =
                  typeof model.text === 'object'
                    ? (model.text as any).value
                    : (model.text as string)
                nodeData = {
                  ...((model.properties?.debugOutput as Record<string, unknown>) || {}),
                  ...((model.properties?.debugVariables as Record<string, unknown>) || {}),
                }
              }
            } catch (_e) {
              /* skip */
            }
          }

          return (
            <div style={{ marginBottom: 'var(--rf-space-4, 16px)' }}>
              <div class="rf-section-title">
                <Database size={12} />
                节点数据
              </div>
              <div class="text-[var(--rf-text-sm,11px)] text-[var(--rf-brand-primary)] font-semibold mb-1">
                {nodeName}
              </div>
              {nodeData && Object.keys(nodeData).length > 0 ? (
                <div class="bg-[var(--rf-bg-secondary)] rounded-[var(--rf-radius-md,6px)] p-[var(--rf-space-2,8px)] font-[var(--rf-font-mono,monospace)] text-[var(--rf-text-2xs,9px)] max-h-[120px] overflow-y-auto">
                  {Object.entries(nodeData).map(([key, value]) => (
                    <div key={key} class="flex gap-1 py-0.5">
                      <span class="text-[var(--rf-brand-primary)] shrink-0">{key}:</span>
                      <span class="text-[var(--rf-text-primary)] break-all">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="text-[var(--rf-text-tertiary)] text-[var(--rf-text-2xs,9px)]">
                  暂无数据（节点执行完成后显示输出）
                </div>
              )}
            </div>
          )
        })()}

      {/* Execution log */}
      <div class="rf-section-title">
        <Clock size={12} />
        执行日志
      </div>
      <div class="max-h-[200px] overflow-y-auto">
        {messages.length === 0 ? (
          <div class="text-[var(--rf-text-tertiary)] text-[var(--rf-text-sm,11px)] text-center py-[var(--rf-space-4,16px)]">
            运行规则链后查看执行日志
          </div>
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
              <div
                key={i}
                class="flex items-start gap-[var(--rf-space-2,8px)] py-1.5 border-b border-[var(--rf-border-light,#f3f4f6)] text-[var(--rf-text-sm,11px)] font-[var(--rf-font-mono,monospace)]"
              >
                <Icon size={11} style={{ color, flexShrink: 0, marginTop: 2 }} />
                <span class="text-[var(--rf-text-tertiary)] text-[var(--rf-text-2xs,9px)] shrink-0">
                  {time}
                </span>
                <span class="text-[var(--rf-text-primary)] flex-1">{msg.message}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
