import { canvasStatus, selectedNodeId } from '../../store'
import { t } from '../../i18n'
import { FileGroup } from './FileGroup'
import { EditGroup } from './EditGroup'
import { RunGroup } from './RunGroup'
import { ViewGroup } from './ViewGroup'
import { LayoutGroup } from './LayoutGroup'
import { ContextActions } from './ContextActions'

export function Toolbar() {
  const isRunning = canvasStatus.value === 'running'

  return (
    <div
      class="flex items-center h-[var(--toolbar-height)] px-[var(--rf-space-2)] bg-[var(--rf-bg-primary)] border-b border-[var(--rf-border)] gap-0.5 z-[var(--rf-z-toolbar)] overflow-hidden"
      style={{ gridArea: 'toolbar' }}
      role="toolbar"
      aria-label="工具栏"
    >
      {/* File group */}
      <span class="text-[var(--rf-text-2xs)] text-[var(--rf-text-tertiary)] px-[var(--rf-space-2)] whitespace-nowrap tracking-wide uppercase">
        {t('toolbar.file')}
      </span>
      <FileGroup />

      <div class="w-px h-5 bg-[var(--rf-border)] mx-[var(--rf-space-2)] shrink-0" />

      {/* Edit group */}
      <span class="text-[var(--rf-text-2xs)] text-[var(--rf-text-tertiary)] px-[var(--rf-space-2)] whitespace-nowrap tracking-wide uppercase">
        {t('toolbar.edit')}
      </span>
      <EditGroup />

      <div class="w-px h-5 bg-[var(--rf-border)] mx-[var(--rf-space-2)] shrink-0" />

      {/* Run group */}
      <span class="text-[var(--rf-text-2xs)] text-[var(--rf-text-tertiary)] px-[var(--rf-space-2)] whitespace-nowrap tracking-wide uppercase">
        {t('toolbar.run')}
      </span>
      <RunGroup isRunning={isRunning} />

      <div class="w-px h-5 bg-[var(--rf-border)] mx-[var(--rf-space-2)] shrink-0" />

      {/* View group */}
      <span class="text-[var(--rf-text-2xs)] text-[var(--rf-text-tertiary)] px-[var(--rf-space-2)] whitespace-nowrap tracking-wide uppercase">
        {t('toolbar.view')}
      </span>
      <ViewGroup />

      <div class="w-px h-5 bg-[var(--rf-border)] mx-[var(--rf-space-2)] shrink-0" />

      {/* Layout group */}
      <span class="text-[var(--rf-text-2xs)] text-[var(--rf-text-tertiary)] px-[var(--rf-space-2)] whitespace-nowrap tracking-wide uppercase">
        {t('toolbar.layout')}
      </span>
      <LayoutGroup />

      <div class="flex-1" />

      {/* Context actions (visible when node selected) */}
      {selectedNodeId.value && <ContextActions />}
    </div>
  )
}
