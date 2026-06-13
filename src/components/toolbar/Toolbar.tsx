import { canvasStatus, selectedNodeId } from '../../store'
import { t } from '../../i18n'
import s from '../../styles/layout.module.css'
import { FileGroup } from './FileGroup'
import { EditGroup } from './EditGroup'
import { RunGroup } from './RunGroup'
import { ViewGroup } from './ViewGroup'
import { LayoutGroup } from './LayoutGroup'
import { ContextActions } from './ContextActions'

export function Toolbar() {
  const isRunning = canvasStatus.value === 'running'

  return (
    <div class={s.toolbar} role="toolbar" aria-label="工具栏">
      {/* File group */}
      <span class={s.toolbarLabel}>{t('toolbar.file')}</span>
      <FileGroup />

      <div class={s.toolbarDivider} />

      {/* Edit group */}
      <span class={s.toolbarLabel}>{t('toolbar.edit')}</span>
      <EditGroup />

      <div class={s.toolbarDivider} />

      {/* Run group */}
      <span class={s.toolbarLabel}>{t('toolbar.run')}</span>
      <RunGroup isRunning={isRunning} />

      <div class={s.toolbarDivider} />

      {/* View group */}
      <span class={s.toolbarLabel}>{t('toolbar.view')}</span>
      <ViewGroup />

      <div class={s.toolbarDivider} />

      {/* Layout group */}
      <span class={s.toolbarLabel}>{t('toolbar.layout')}</span>
      <LayoutGroup />

      <div class={s.spacer} />

      {/* Context actions (visible when node selected) */}
      {selectedNodeId.value && <ContextActions />}
    </div>
  )
}
