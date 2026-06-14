import { Play, Square, RotateCcw } from 'lucide-preact'
import { lfInstance, startDebug, stopDebug } from '../../store'
import { showInfo } from '../../services'
import { t } from '../../i18n'
import { ToolbarBtn } from './ToolbarBtn'

/** Props for RunGroup component */
interface RunGroupProps {
  /** Whether the debug is currently running */
  isRunning: boolean
}

export function RunGroup({ isRunning }: RunGroupProps) {
  return (
    <div class="flex items-center gap-px">
      <ToolbarBtn
        icon={Play}
        title={t('toolbar.start')}
        active={isRunning}
        onClick={() => startDebug()}
      />
      <ToolbarBtn icon={Square} title={t('toolbar.stop')} onClick={() => stopDebug()} />
      <ToolbarBtn
        icon={RotateCcw}
        title={t('toolbar.reset')}
        onClick={() => {
          const lf = lfInstance.value
          if (lf) {
            try {
              const data = lf.getGraphData()
              if ((data.nodes as any[])?.length > 0) {
                lf.clearData()
                lf.render(data)
                showInfo('画布已重置')
              }
            } catch (_e) {
              if (import.meta.env.DEV) console.warn('[RuleFlow] canvas reset failed:', _e)
            }
          }
        }}
      />
    </div>
  )
}
