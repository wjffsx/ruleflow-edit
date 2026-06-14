import { List } from 'lucide-preact'
import type { NodeData } from '@logicflow/core'
import { selectedNodeId, outlineNodes, chainName } from '../../store'
import { getNodeStyle, TYPE_ORDER, ICON_MAP } from '../../data'

/**
 * Outline panel tab — displays a sorted list of nodes on the canvas.
 */
export function OutlineTab() {
  const nodes = outlineNodes.value

  if (!nodes || nodes.length === 0) {
    return (
      <div
        class="rf-content"
        style={{
          textAlign: 'center',
          color: 'var(--rf-text-tertiary)',
          paddingTop: 'var(--rf-space-10)',
        }}
      >
        <List size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--rf-text-sm)' }}>画布为空</div>
      </div>
    )
  }

  // Sort using TYPE_ORDER from nodeRegistry
  const typeOrderMap: Record<string, number> = Object.fromEntries(TYPE_ORDER.map((t, i) => [t, i]))
  typeOrderMap.input_port = 0
  typeOrderMap.output_port = TYPE_ORDER.length
  const sorted = [...nodes].sort((a: NodeData, b: NodeData) => {
    const ta = typeOrderMap[a.properties?.nodeType as string] ?? 3
    const tb = typeOrderMap[b.properties?.nodeType as string] ?? 3
    return ta - tb
  })

  return (
    <div class="rf-content">
      <div class="rf-section-title">
        <span>{chainName.value}</span>
      </div>
      {sorted.map((node: NodeData) => {
        const nodeType = node.properties?.nodeType || 'action'
        const styleInfo = getNodeStyle(nodeType as string)
        const IconComp = ICON_MAP[styleInfo.icon] || ICON_MAP.Play
        const color = `var(${styleInfo.colorVar})`
        const text =
          typeof node.text === 'object' ? (node.text as { value: string }).value : node.text
        const priority = node.properties?.priority
        const priorityLabel = priority ? ` (P:${priority})` : ''
        const isSelected = selectedNodeId.value === node.id

        return (
          <div
            key={node.id}
            class={`flex items-center gap-[var(--rf-space-2)] px-1.5 py-1 text-[var(--rf-text-sm)] cursor-pointer rounded-[var(--rf-radius-sm)] transition-[background] duration-[var(--rf-duration-fast)] ${isSelected ? 'bg-[var(--rf-brand-primary-light)] text-[var(--rf-brand-primary)] font-medium hover:bg-[var(--rf-brand-primary-light)]' : 'hover:bg-[var(--rf-bg-hover)]'}`}
            onClick={() => {
              selectedNodeId.value = node.id
            }}
          >
            <IconComp size={14} style={{ color, flexShrink: 0 }} aria-hidden="true" />
            <span style={{ flex: 1 }}>
              {text}
              {priorityLabel}
            </span>
            <div class="w-[3px] h-2.5 rounded-sm shrink-0" style={{ background: color }} />
          </div>
        )
      })}
    </div>
  )
}
