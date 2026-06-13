import { h } from 'preact'
import { useState, useMemo } from 'preact/hooks'
import type { LucideIcon } from 'lucide-preact'
import { Search, Star, ChevronRight, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-preact'
import type { NodeItem, NodeCategory, PortNode, SearchItem } from '../../types/editor'
import {
  sidebarCollapsed,
  toggleSidebar,
  toggleCategoryCollapse,
  isCategoryCollapsed,
} from '../../store'
import { NODE_CATEGORIES, PORT_NODES, NOTE_NODE, ICON_MAP } from '../../data'
import { searchService } from '../../services'
import { t } from '../../i18n'
import s from './Sidebar.module.css'
import ls from '../../styles/layout.module.css'

/** Lucide 图标组件属性 */
interface LucideIconProps {
  /** 图标名称 */
  name: string
  /** 图标大小 */
  size?: number
  /** 自定义样式 */
  style?: Record<string, string | number>
  /** 图标颜色 */
  color?: string
}

function LucideIcon({ name, size = 14, style, color }: LucideIconProps) {
  const Icon: LucideIcon | undefined = ICON_MAP[name]
  if (!Icon) return <span style={{ fontSize: size, ...style }}>{name?.[0] || '?'}</span>
  return <Icon size={size} style={style} color={color} />
}

/** 侧栏项属性 */
interface SidebarItemProps {
  /** 节点项数据 */
  item: NodeItem
  /** 颜色 CSS 变量 */
  colorVar?: string
}

function SidebarItem({ item, colorVar }: SidebarItemProps) {
  return (
    <div
      class={s.sidebarItem}
      draggable
      onDragStart={(e: DragEvent) => {
        e.dataTransfer!.setData('application/ruleflow-node', JSON.stringify(item))
        e.dataTransfer!.effectAllowed = 'copy'
      }}
      role="treeitem"
      aria-label={item.name}
      tabIndex={0}
    >
      <LucideIcon
        name={item.icon}
        size={14}
        style={{ flexShrink: '0' }}
        color={`var(${colorVar || '--rf-brand-primary'})`}
      />
      <span class={s.itemText}>{item.name}</span>
      <div
        class={s.itemColorBar}
        style={{ background: `var(${colorVar || '--rf-brand-primary'})` }}
      />
    </div>
  )
}

/** 分类区块属性 */
interface CategorySectionProps {
  /** 分类数据 */
  category: NodeCategory
}

function CategorySection({ category }: CategorySectionProps) {
  const collapsed = isCategoryCollapsed(category.id)
  const open = !collapsed

  return (
    <div>
      <div
        class={s.categoryHeader}
        onClick={() => toggleCategoryCollapse(category.id)}
        role="treeitem"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <LucideIcon
          name={category.icon}
          size={12}
          style={{ flexShrink: '0' }}
          color={category.color}
        />
        <span style={{ flex: 1 }}>{category.name}</span>
        <span class={s.categoryCount}>{category.items.length}</span>
      </div>
      {open &&
        category.items.map((item: NodeItem) => (
          <SidebarItem
            key={item.type}
            item={item}
            colorVar={category.color?.replace('var(', '').replace(')', '') || '--rf-brand-primary'}
          />
        ))}
    </div>
  )
}

/** 侧栏组件 */
export function Sidebar() {
  const [query, setQuery] = useState('')
  const collapsed = sidebarCollapsed.value

  // Build flat list for search
  const allItems = useMemo(() => {
    const items: SearchItem[] = []
    NODE_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item: NodeItem) => {
        items.push({ ...item, category: cat.name, categoryIcon: cat.icon })
      })
    })
    PORT_NODES.forEach((item: PortNode) => {
      items.push({ ...item, category: '端口', categoryIcon: 'LogIn' })
    })
    items.push({ ...NOTE_NODE, category: '辅助', categoryIcon: 'MessageSquare' })
    // Update search service index
    searchService.updateSidebarItemIndex(items)
    return items
  }, [])

  const searchResults = useMemo(() => {
    if (!query.trim()) return null
    return searchService.searchSidebarItems(query)
  }, [query])

  if (collapsed) {
    return (
      <aside
        class={ls.sidebar}
        style={{ width: 'var(--sidebar-collapsed-width)' }}
        role="complementary"
        aria-label="组件面板"
      >
        <button onClick={toggleSidebar} class={s.expandBtn} title="展开侧栏" aria-label="展开侧栏">
          <PanelLeft size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside class={ls.sidebar} role="complementary" aria-label="组件面板">
      {/* Search */}
      <div class={s.searchContainer}>
        <div class={s.searchRow}>
          <Search size={14} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
          <input
            class={s.searchInput}
            placeholder={t('sidebar.search')}
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            aria-label={t('sidebar.search')}
          />
          <button
            onClick={toggleSidebar}
            class={s.collapseBtn}
            title="折叠侧栏"
            aria-label="折叠侧栏"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      {/* Scroll area */}
      <div class={s.scrollArea}>
        {/* Search results */}
        {searchResults ? (
          searchResults.length === 0 ? (
            <div class={s.noResults}>{t('sidebar.noResults')}</div>
          ) : (
            searchResults.map((item: SearchItem) => <SidebarItem key={item.type} item={item} />)
          )
        ) : (
          <>
            {/* Port nodes */}
            <div class={s.sectionHeader}>
              <Star size={12} style={{ color: 'var(--rf-brand-accent)' }} />
              {t('sidebar.favorites')}
            </div>
            {PORT_NODES.map((item: PortNode) => (
              <SidebarItem key={item.type} item={item} />
            ))}
            <SidebarItem item={NOTE_NODE} />

            {/* Category sections */}
            {NODE_CATEGORIES.map((cat: NodeCategory) => (
              <CategorySection key={cat.id} category={cat} />
            ))}
          </>
        )}
      </div>
    </aside>
  )
}
