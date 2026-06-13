import { h } from 'preact'
import { useState, useMemo, useCallback } from 'preact/hooks'
import {
  Search, Star, ChevronRight, ChevronDown, PanelLeftClose, PanelLeft,
  // Ports
  LogIn, LogOut,
  // Builtin condition icons
  Cpu, Hash, MapPin, Ruler, CheckCircle, Timer, AlertTriangle,
  Regex, FolderTree, ListChecks, Binary, ArrowUpDown, Gauge,
  RefreshCw, Hourglass, TrendingUp, Repeat, SlidersHorizontal, Undo2,
  // Builtin action icons
  Pencil, Tag, Trash2, TrafficCone, Bell, Clock,
  ArrowLeftRight, BadgeCheck, Package,
  // Ext node icons
  FileCode, History, BellRing, FileText, Network, Target,
  Calculator, Database, BarChart3, Layers, Activity, Snowflake, Sigma,
  // VPP icons
  BatteryMedium, Coins, Radio, LineChart, Leaf, CloudSun, Percent,
  ArrowDown, PlugZap, HeartPulse, Zap,
  // Flow icons
  Link, AlarmClock,
  // Category icons
  Factory, GitBranch, Play, GitMerge, Puzzle, MessageSquare, ClipboardList,
  // Unpack icon fallback
  Box,
} from 'lucide-preact'
import { sidebarCollapsed, toggleSidebar, toggleCategoryCollapse, isCategoryCollapsed } from '../../store/editorStore'
import { NODE_CATEGORIES, PORT_NODES, NOTE_NODE } from '../../data/nodeRegistry'
import { searchService } from '../../services/searchService'
import { t } from '../../i18n'

// v2.0: Icon name to Lucide component mapping
const ICON_MAP = {
  // Ports
  LogIn, LogOut,
  // Builtin condition
  Cpu, Hash, MapPin, Ruler, CheckCircle, Timer, AlertTriangle,
  Regex, FolderTree, ListChecks, Binary, ArrowUpDown, Gauge,
  RefreshCw, Hourglass, TrendingUp, Repeat, SlidersHorizontal, Undo2,
  // Builtin action
  Pencil, Tag, Trash2, TrafficCone, Bell, Clock,
  ArrowLeftRight, BadgeCheck, Package,
  // Ext
  FileCode, History, BellRing, FileText, Network, Target,
  Calculator, Database, BarChart3, Layers, Activity, Snowflake, Sigma,
  // VPP
  BatteryMedium, Coins, Radio, LineChart, Leaf, CloudSun, Percent,
  ArrowDown, PlugZap, HeartPulse,
  // Flow
  Link, AlarmClock,
  // Category
  Factory, GitBranch, Play, GitMerge, Puzzle, MessageSquare, ClipboardList,
  // Fallbacks
  Box, Split: GitBranch, Zap,
  Star,
}

function LucideIcon({ name, size = 14, style, color }) {
  const Icon = ICON_MAP[name]
  if (!Icon) return <span style={{ fontSize: size, ...style }}>{name?.[0] || '?'}</span>
  return <Icon size={size} style={style} color={color} />
}

const sidebarStyle = {
  gridArea: 'sidebar',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'var(--rf-bg-primary)',
  borderRight: '1px solid var(--rf-border)',
  overflow: 'hidden',
  transition: 'width var(--rf-duration-normal) var(--rf-ease-default)',
  fontFamily: 'var(--rf-font-sans)',
}

const collapsedStyle = {
  ...sidebarStyle,
  width: 'var(--sidebar-collapsed-width)',
}

const searchContainerStyle = {
  padding: 'var(--rf-space-3)',
  borderBottom: '1px solid var(--rf-border-light)',
}

const searchInputStyle = {
  width: '100%',
  height: 30,
  padding: '0 var(--rf-space-3)',
  border: '1px solid var(--rf-border)',
  borderRadius: 'var(--rf-radius-sm)',
  background: 'var(--rf-bg-secondary)',
  color: 'var(--rf-text-primary)',
  fontSize: 'var(--rf-text-sm)',
  fontFamily: 'var(--rf-font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--rf-duration-fast)',
}

const scrollAreaStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: 'var(--rf-space-1) 0',
}

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2)',
  padding: 'var(--rf-space-2) var(--rf-space-3)',
  fontSize: 'var(--rf-text-xs)',
  fontWeight: 600,
  color: 'var(--rf-text-secondary)',
  cursor: 'pointer',
  userSelect: 'none',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const categoryHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2)',
  padding: 'var(--rf-space-2) var(--rf-space-3)',
  fontSize: 'var(--rf-text-xs)',
  fontWeight: 600,
  color: 'var(--rf-text-secondary)',
  cursor: 'pointer',
  userSelect: 'none',
  borderTop: '1px solid var(--rf-border-light)',
}

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2)',
  padding: '5px var(--rf-space-3) 5px var(--rf-space-6)',
  fontSize: 'var(--rf-text-sm)',
  color: 'var(--rf-text-primary)',
  cursor: 'grab',
  transition: 'background var(--rf-duration-fast)',
  borderRadius: 0,
}

function SidebarItem({ item, colorVar }) {
  return (
    <div
      style={itemStyle}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/ruleflow-node', JSON.stringify(item))
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--rf-bg-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
      role="treeitem"
      aria-label={item.name}
      tabindex="0"
    >
      <LucideIcon name={item.icon} size={14} style={{ flexShrink: 0 }} color={`var(${colorVar || '--rf-brand-primary'})`} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </span>
      <div
        style={{
          width: 3,
          height: 12,
          borderRadius: 2,
          background: `var(${colorVar || '--rf-brand-primary'})`,
          flexShrink: 0,
        }}
      />
    </div>
  )
}

function CategorySection({ category }) {
  const collapsed = isCategoryCollapsed(category.id)
  const open = !collapsed

  return (
    <div>
      <div
        style={categoryHeaderStyle}
        onClick={() => toggleCategoryCollapse(category.id)}
        role="treeitem"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <LucideIcon name={category.icon} size={12} style={{ flexShrink: 0 }} color={category.color} />
        <span style={{ flex: 1 }}>{category.name}</span>
        <span style={{ fontSize: 'var(--rf-text-xs)', color: 'var(--rf-text-tertiary)' }}>
          {category.items.length}
        </span>
      </div>
      {open && category.items.map((item) => (
        <SidebarItem key={item.type} item={item} colorVar={category.color?.replace('var(', '').replace(')', '') || '--rf-brand-primary'} />
      ))}
    </div>
  )
}

export function Sidebar() {
  const [query, setQuery] = useState('')
  const collapsed = sidebarCollapsed.value

  // Build flat list for search
  const allItems = useMemo(() => {
    const items = []
    NODE_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        items.push({ ...item, category: cat.name, categoryIcon: cat.icon })
      })
    })
    PORT_NODES.forEach(item => {
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
      <aside style={collapsedStyle} role="complementary" aria-label="组件面板">
        <button
          onClick={toggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 48,
            border: 'none',
            background: 'transparent',
            color: 'var(--rf-text-tertiary)',
            cursor: 'pointer',
          }}
          title="展开侧栏"
          aria-label="展开侧栏"
        >
          <PanelLeft size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside style={sidebarStyle} role="complementary" aria-label="组件面板">
      {/* Search */}
      <div style={searchContainerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Search size={14} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
          <input
            style={searchInputStyle}
            placeholder={t('sidebar.search')}
            value={query}
            onInput={(e) => setQuery(e.target.value)}
            onFocus={(e) => { e.target.style.borderColor = 'var(--rf-brand-primary)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--rf-border)' }}
            aria-label={t('sidebar.search')}
          />
          <button
            onClick={toggleSidebar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              border: 'none',
              background: 'transparent',
              color: 'var(--rf-text-tertiary)',
              cursor: 'pointer',
              borderRadius: 'var(--rf-radius-sm)',
              flexShrink: 0,
            }}
            title="折叠侧栏"
            aria-label="折叠侧栏"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      {/* Scroll area */}
      <div style={scrollAreaStyle}>
        {/* Search results */}
        {searchResults ? (
          searchResults.length === 0 ? (
            <div style={{
              padding: 'var(--rf-space-6) var(--rf-space-3)',
              textAlign: 'center',
              color: 'var(--rf-text-tertiary)',
              fontSize: 'var(--rf-text-sm)',
            }}>
              {t('sidebar.noResults')}
            </div>
          ) : (
            searchResults.map((item) => (
              <SidebarItem key={item.type} item={item} />
            ))
          )
        ) : (
          <>
            {/* Port nodes */}
            <div style={sectionHeaderStyle}>
              <Star size={12} style={{ color: 'var(--rf-brand-accent)' }} />
              {t('sidebar.favorites')}
            </div>
            {PORT_NODES.map((item) => (
              <SidebarItem key={item.type} item={item} />
            ))}
            <SidebarItem item={NOTE_NODE} />

            {/* Category sections */}
            {NODE_CATEGORIES.map((cat) => (
              <CategorySection key={cat.id} category={cat} />
            ))}
          </>
        )}
      </div>

    </aside>
  )
}
