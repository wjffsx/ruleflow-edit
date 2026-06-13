import { Undo2, Redo2 } from 'lucide-preact'
import { canUndo, canRedo, undo, redo } from '../../store'
import { t } from '../../i18n'
import s from '../../styles/layout.module.css'
import { ToolbarBtn } from './ToolbarBtn'

export function EditGroup() {
  return (
    <div class={s.toolbarGroup}>
      <ToolbarBtn
        icon={Undo2}
        title={t('toolbar.undo')}
        disabled={!canUndo.value}
        onClick={() => undo()}
      />
      <ToolbarBtn
        icon={Redo2}
        title={t('toolbar.redo')}
        disabled={!canRedo.value}
        onClick={() => redo()}
      />
    </div>
  )
}
