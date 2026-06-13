/**
 * Global search service for RuleFlow Editor.
 * Eliminates duplicate Fuse.js index creation across components.
 */
import Fuse from 'fuse.js'
import type { SearchItem, CommandItem } from '../types/editor'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LFNode = Record<string, any>

class SearchService {
  private nodeFuse: Fuse<LFNode> | null = null
  private sidebarItemFuse: Fuse<SearchItem> | null = null
  private commandFuse: Fuse<CommandItem> | null = null
  private lastNodes: LFNode[] = []
  private lastSidebarItems: SearchItem[] = []

  /**
   * Update node search index (used by NodeSearch and outline)
   */
  updateNodeIndex(nodes: LFNode[]): void {
    if (!nodes || nodes.length === 0) return
    // Only rebuild if nodes actually changed
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
    if (!this.nodeFuse || !query?.trim()) return []
    return this.nodeFuse.search(query).map((r) => r.item)
  }

  /**
   * Update sidebar item search index
   */
  updateSidebarItemIndex(items: SearchItem[]): void {
    if (!items || items.length === 0) return
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
    if (!this.sidebarItemFuse || !query?.trim()) return []
    return this.sidebarItemFuse.search(query).map((r) => r.item)
  }

  /**
   * Update command search index
   */
  updateCommandIndex(commands: CommandItem[]): void {
    if (!commands || commands.length === 0) return
    this.commandFuse = new Fuse(commands, {
      keys: ['label', 'category', 'shortcut'],
      threshold: 0.3,
    })
  }

  /**
   * Search commands by query
   */
  searchCommands(query: string): CommandItem[] {
    if (!this.commandFuse || !query?.trim()) return []
    return this.commandFuse.search(query).map((r) => r.item)
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
