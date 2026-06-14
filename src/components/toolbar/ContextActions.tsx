import { Copy, Trash2, ToggleLeft } from 'lucide-preact'
import { lfInstance, selectedNodeId } from '../../store'
import { showInfo } from '../../services'
import { ToolbarBtn } from './ToolbarBtn'

export function ContextActions() {
  return (
    <div class="flex items-center gap-px">
      <div class="w-px h-5 bg-[var(--rf-border)] mx-[var(--rf-space-2)] shrink-0" />
      <ToolbarBtn
        icon={Copy}
        title="复制"
        onClick={() => {
          const lf = lfInstance.value
          if (lf && selectedNodeId.value) {
            try {
              lf.cloneNode(selectedNodeId.value, { offsetX: 20, offsetY: 20 } as any)
              showInfo('已复制节点')
            } catch (_e) {
              if (import.meta.env.DEV) console.warn('[RuleFlow] node clone failed:', _e)
            }
          }
        }}
      />
      <ToolbarBtn
        icon={Trash2}
        title="删除"
        onClick={() => {
          const lf = lfInstance.value
          if (lf && selectedNodeId.value) {
            try {
              lf.deleteNode(selectedNodeId.value)
            } catch (_e) {
              if (import.meta.env.DEV) console.warn('[RuleFlow] node delete failed:', _e)
            }
            showInfo('已删除节点')
          }
        }}
      />
      <ToolbarBtn
        icon={ToggleLeft}
        title="启用/禁用"
        onClick={() => {
          const lf = lfInstance.value
          if (lf && selectedNodeId.value) {
            try {
              const model = lf.getNodeModelById(selectedNodeId.value) as any
              if (model) {
                const current = model.properties?.enabled !== false
                model.setProperties({ ...model.properties, enabled: !current })
                showInfo(current ? '节点已禁用' : '节点已启用')
              }
            } catch (_e) {
              if (import.meta.env.DEV) console.warn('[RuleFlow] node toggle failed:', _e)
            }
          }
        }}
      />
    </div>
  )
}
