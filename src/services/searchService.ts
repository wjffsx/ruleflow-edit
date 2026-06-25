/**
 * Global search service for RuleFlow Editor.
 * Eliminates duplicate Fuse.js index creation across components.
 *
 * P2-6.4: For small datasets (< FUSE_THRESHOLD), use simple substring matching
 *         to avoid fuse.js indexing overhead (significant on embedded CPUs).
 */
import Fuse from 'fuse.js'
import type { SearchItem, CommandItem } from '../types/editor'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LFNode = Record<string, any>

/** Datasets smaller than this use simple includes() matching instead of fuse.js */
const FUSE_THRESHOLD = 50

/** Normalize a node's searchable text from various text shapes */
function nodeText(n: LFNode): string {
  const t = n.text
  if (typeof t === 'string') return t
  if (t && typeof t === 'object' && typeof t.value === 'string') return t.value
  return ''
}

class SearchService {
  private nodeFuse: Fuse<LFNode> | null = null
  private sidebarItemFuse: Fuse<SearchItem> | null = null
  private commandFuse: Fuse<CommandItem> | null = null
  private lastNodes: LFNode[] = []
  private lastSidebarItems: SearchItem[] = []
  private lastCommands: CommandItem[] = []

  /**
   * Update node search index (used by NodeSearch and outline)
   * P2-6.4: Skip fuse.js for small datasets
   */
  updateNodeIndex(nodes: LFNode[]): void {
    if (!nodes || nodes.length === 0) return
    if (nodes.length < FUSE_THRESHOLD) {
      // Don't build fuse index for small datasets
      this.nodeFuse = null
      this.lastNodes = nodes
      return
    }
    if (
      this.lastNodes.length !== nodes.length ||
      nodes.some((n, i) => n.id !== this.lastNodes[i]?.id)
    ) {
      this.nodeFuse = new Fuse(nodes, {
        keys: ['text.value', 'text', 'properties.nodeType', 'properties.summary', 'id'],
        threshold: 0.4,
      })
      this.lastNodes = nodes
    }
  }

  /**
   * Search nodes by query
   */
  searchNodes(query: string): LFNode[] {
    if (!query?.trim()) return []
    if (this.nodeFuse) {
      return this.nodeFuse.search(query).map((r) => r.item)
    }
    // Fallback: simple includes() matching
    const q = query.toLowerCase()
    return this.lastNodes.filter((n) => {
      const text = nodeText(n).toLowerCase()
      if (text.includes(q)) return true
      const id = (n.id ?? '').toLowerCase()
      if (id.includes(q)) return true
      const nodeType = (n.properties?.nodeType ?? '').toLowerCase()
      if (nodeType.includes(q)) return true
      return false
    })
  }

  /**
   * Update sidebar item search index
   * P2-6.4: Skip fuse.js for small datasets
   */
  updateSidebarItemIndex(items: SearchItem[]): void {
    if (!items || items.length === 0) return
    if (items.length < FUSE_THRESHOLD) {
      this.sidebarItemFuse = null
      this.lastSidebarItems = items
      return
    }
    if (this.lastSidebarItems.length !== items.length) {
      this.sidebarItemFuse = new Fuse(items, {
        keys: ['name', 'type', 'category'],
        threshold: 0.4,
      })
      this.lastSidebarItems = items
    }
  }

  /**
   * Search sidebar items by query
   */
  searchSidebarItems(query: string): SearchItem[] {
    if (!query?.trim()) return []
    if (this.sidebarItemFuse) {
      return this.sidebarItemFuse.search(query).map((r) => r.item)
    }
    const q = query.toLowerCase()
    return this.lastSidebarItems.filter((it) => {
      const name = (it.name ?? '').toLowerCase()
      const type = (it.type ?? '').toLowerCase()
      const category = (it.category ?? '').toLowerCase()
      return name.includes(q) || type.includes(q) || category.includes(q)
    })
  }

  /**
   * Update command search index
   * P2-6.4: Skip fuse.js for small command sets
   */
  updateCommandIndex(commands: CommandItem[]): void {
    if (!commands || commands.length === 0) return
    if (commands.length < FUSE_THRESHOLD) {
      this.commandFuse = null
      this.lastCommands = commands
      return
    }
    this.commandFuse = new Fuse(commands, {
      keys: ['label', 'category', 'shortcut'],
      threshold: 0.3,
    })
    this.lastCommands = commands
  }

  /**
   * Search commands by query
   */
  searchCommands(query: string): CommandItem[] {
    if (!query?.trim()) return []
    if (this.commandFuse) {
      return this.commandFuse.search(query).map((r) => r.item)
    }
    const q = query.toLowerCase()
    return this.lastCommands.filter((c) => {
      const label = (c.label ?? '').toLowerCase()
      const category = (c.category ?? '').toLowerCase()
      const shortcut = (c.shortcut ?? '').toLowerCase()
      return label.includes(q) || category.includes(q) || shortcut.includes(q)
    })
  }

  /**
   * Get current node Fuse instance (for direct use if needed)
   */
  getNodeFuse(): Fuse<LFNode> | null {
    return this.nodeFuse
  }
}

/** Global search service singleton instance */
export const searchService = new SearchService()
