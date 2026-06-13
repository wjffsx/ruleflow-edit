import { Maximize, Map } from 'lucide-preact'
import { lfInstance } from '../../store'
import { t } from '../../i18n'
import s from '../../styles/layout.module.css'
import { ToolbarBtn } from './ToolbarBtn'

export function ViewGroup() {
  return (
    <div class={s.toolbarGroup}>
      <ToolbarBtn
        icon={Maximize}
        title={t('toolbar.fullscreen')}
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
        }}
      />
      <ToolbarBtn
        icon={Map}
        title={t('toolbar.minimap')}
        onClick={() => {
          const lf = lfInstance.value
          if (!lf) return
          try {
            const minimap = lf.extension.miniMap as any
            if (minimap) {
              if (minimap.isShow) {
                minimap.hide()
              } else {
                minimap.show(0, 0)
              }
            }
          } catch (_e) {
            if (import.meta.env.DEV) console.warn('[RuleFlow] minimap toggle failed:', _e)
          }
        }}
      />
    </div>
  )
}
