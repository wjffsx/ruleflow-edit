/**
 * Global search service for RuleFlow Editor.
 * Eliminates duplicate Fuse.js index creation across components.
 */
import Fuse from 'fuse.js'

class SearchService {
  #nodeFuse = null
  #sidebarItemFuse = null
  #commandFuse = null
  #lastNodes = []
  #lastSidebarItems = []

  /**
   * Update node search index (used by NodeSearch and outline)
   * @param {Array} nodes - Array of node objects from LogicFlow
   */
  updateNodeIndex(nodes) {
    if (!nodes || nodes.length === 0) return
    // Only rebuild if nodes actually changed
    if (this.#lastNodes.length !== nodes.length || 
        nodes.some((n, i) => n.id !== this.#lastNodes[i]?.id)) {
      this.#nodeFuse = new Fuse(nodes, {
        keys: ['text.value', 'text', 'properties.nodeType', 'properties.summary', 'id'],
        threshold: 0.4,
      })
      this.#lastNodes = nodes
    }
  }

  /**
   * Search nodes by query
   * @param {string} query - Search query
   * @returns {Array} Matching nodes
   */
  searchNodes(query) {
    if (!this.#nodeFuse || !query?.trim()) return []
    return this.#nodeFuse.search(query).map(r => r.item)
  }

  /**
   * Update sidebar item search index
   * @param {Array} items - Flat list of sidebar items
   */
  updateSidebarItemIndex(items) {
    if (!items || items.length === 0) return
    if (this.#lastSidebarItems.length !== items.length) {
      this.#sidebarItemFuse = new Fuse(items, {
        keys: ['name', 'type', 'category'],
        threshold: 0.4,
      })
      this.#lastSidebarItems = items
    }
  }

  /**
   * Search sidebar items by query
   * @param {string} query - Search query
   * @returns {Array} Matching items
   */
  searchSidebarItems(query) {
    if (!this.#sidebarItemFuse || !query?.trim()) return []
    return this.#sidebarItemFuse.search(query).map(r => r.item)
  }

  /**
   * Update command search index
   * @param {Array} commands - Array of command objects
   */
  updateCommandIndex(commands) {
    if (!commands || commands.length === 0) return
    this.#commandFuse = new Fuse(commands, {
      keys: ['label', 'category', 'shortcut'],
      threshold: 0.3,
    })
  }

  /**
   * Search commands by query
   * @param {string} query - Search query
   * @returns {Array} Matching commands
   */
  searchCommands(query) {
    if (!this.#commandFuse || !query?.trim()) return []
    return this.#commandFuse.search(query).map(r => r.item)
  }

  /**
   * Get current node Fuse instance (for direct use if needed)
   * @returns {Fuse|null}
   */
  getNodeFuse() {
    return this.#nodeFuse
  }
}

export const searchService = new SearchService()