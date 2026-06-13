import { describe, it, expect } from 'vitest'
import { NODE_CATEGORIES, PORT_NODES, NOTE_NODE, RELATION_TYPES } from './nodeData'
import {
  NODE_TYPE_MAP,
  NODE_VISUAL_MAP,
  NODE_STYLE_MAP,
  CATEGORY_TO_LF_TYPE,
  TYPE_ORDER,
  getNodeStyle,
} from './nodeMappings'

describe('nodeRegistry', () => {
  describe('NODE_CATEGORIES', () => {
    it('should have at least 4 categories', () => {
      expect(NODE_CATEGORIES.length).toBeGreaterThanOrEqual(4)
    })

    it('should have required category IDs', () => {
      const ids = NODE_CATEGORIES.map((c) => c.id)
      expect(ids).toContain('builtin-condition')
      expect(ids).toContain('builtin-action')
      expect(ids).toContain('ext-nodes')
      expect(ids).toContain('flow-nodes')
    })

    it('should have items in each category', () => {
      NODE_CATEGORIES.forEach((cat) => {
        expect(cat.items.length).toBeGreaterThan(0)
        cat.items.forEach((item) => {
          expect(item.type).toBeTruthy()
          expect(item.name).toBeTruthy()
          expect(item.icon).toBeTruthy()
        })
      })
    })
  })

  describe('PORT_NODES', () => {
    it('should have input and output ports', () => {
      expect(PORT_NODES.length).toBe(2)
      const types = PORT_NODES.map((p) => p.type)
      expect(types).toContain('input_port')
      expect(types).toContain('output_port')
    })
  })

  describe('NOTE_NODE', () => {
    it('should be a note type', () => {
      expect(NOTE_NODE.type).toBe('note')
      expect(NOTE_NODE.name).toBeTruthy()
      expect(NOTE_NODE.icon).toBeTruthy()
    })
  })

  describe('RELATION_TYPES', () => {
    it('should have standard relation types', () => {
      const keys = RELATION_TYPES.map((r) => r.key)
      expect(keys).toContain('True')
      expect(keys).toContain('False')
      expect(keys).toContain('Success')
      expect(keys).toContain('Failure')
      expect(keys).toContain('Custom')
    })

    it('should have colorVar and lightColorVar for each type', () => {
      RELATION_TYPES.forEach((rt) => {
        expect(rt.colorVar).toBeTruthy()
        expect(rt.lightColorVar).toBeTruthy()
      })
    })
  })

  describe('NODE_TYPE_MAP', () => {
    it('should have entries for all visual types', () => {
      expect(NODE_TYPE_MAP.input_port).toBeDefined()
      expect(NODE_TYPE_MAP.output_port).toBeDefined()
      expect(NODE_TYPE_MAP.condition).toBeDefined()
      expect(NODE_TYPE_MAP.action).toBeDefined()
      expect(NODE_TYPE_MAP.ext_action).toBeDefined()
      expect(NODE_TYPE_MAP.sub_chain).toBeDefined()
      expect(NODE_TYPE_MAP.note).toBeDefined()
    })

    it('should have lfType for each entry', () => {
      Object.values(NODE_TYPE_MAP).forEach((meta) => {
        expect(meta.lfType).toBeTruthy()
        expect(meta.lfType.startsWith('rf-')).toBe(true)
      })
    })
  })

  describe('NODE_VISUAL_MAP', () => {
    it('should map port nodes', () => {
      expect(NODE_VISUAL_MAP['input_port']).toBe('port')
      expect(NODE_VISUAL_MAP['output_port']).toBe('port')
    })

    it('should map note node', () => {
      expect(NODE_VISUAL_MAP['note']).toBe('note')
    })
  })

  describe('getNodeStyle', () => {
    it('should return style for known category', () => {
      const style = getNodeStyle('condition')
      expect(style.colorVar).toBe('--rf-node-condition')
      expect(style.icon).toBe('GitBranch')
    })

    it('should return rule style for unknown category', () => {
      const style = getNodeStyle('unknown')
      expect(style).toBe(NODE_STYLE_MAP.rule)
    })

    it('should return rule style for undefined', () => {
      const style = getNodeStyle(undefined)
      expect(style).toBe(NODE_STYLE_MAP.rule)
    })
  })

  describe('CATEGORY_TO_LF_TYPE', () => {
    it('should map all visual categories to LF types', () => {
      expect(CATEGORY_TO_LF_TYPE.condition).toBe('rf-condition')
      expect(CATEGORY_TO_LF_TYPE.action).toBe('rf-action')
      expect(CATEGORY_TO_LF_TYPE.ext).toBe('rf-ext-action')
      expect(CATEGORY_TO_LF_TYPE.flow).toBe('rf-sub-chain')
      expect(CATEGORY_TO_LF_TYPE.port).toBe('rf-input-port')
      expect(CATEGORY_TO_LF_TYPE.note).toBe('rf-note')
    })
  })

  describe('TYPE_ORDER', () => {
    it('should contain all visual categories in order', () => {
      expect(TYPE_ORDER).toEqual(['port', 'condition', 'action', 'ext', 'flow', 'note'])
    })
  })
})
