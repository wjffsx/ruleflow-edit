import { describe, it, expect } from 'vitest'
import { ICON_MAP } from './iconRegistry'

describe('iconRegistry', () => {
  it('should contain all expected icon entries', () => {
    // Port icons
    expect(ICON_MAP.LogIn).toBeDefined()
    expect(ICON_MAP.LogOut).toBeDefined()

    // Condition icons
    expect(ICON_MAP.Cpu).toBeDefined()
    expect(ICON_MAP.Hash).toBeDefined()
    expect(ICON_MAP.GitBranch).toBeDefined()

    // Action icons
    expect(ICON_MAP.Play).toBeDefined()
    expect(ICON_MAP.Pencil).toBeDefined()
    expect(ICON_MAP.Trash2).toBeDefined()

    // Ext icons
    expect(ICON_MAP.Puzzle).toBeDefined()
    expect(ICON_MAP.FileCode).toBeDefined()

    // Flow icons
    expect(ICON_MAP.GitMerge).toBeDefined()
    expect(ICON_MAP.Link).toBeDefined()

    // Note
    expect(ICON_MAP.MessageSquare).toBeDefined()
  })

  it('should map Split to GitBranch component', () => {
    expect(ICON_MAP.Split).toBe(ICON_MAP.GitBranch)
  })

  it('should have all icons as functional components', () => {
    Object.entries(ICON_MAP).forEach(([name, Component]) => {
      expect(typeof Component).toBe('function')
    })
  })
})
