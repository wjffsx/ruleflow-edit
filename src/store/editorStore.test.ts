import { describe, it, expect } from 'vitest'
import {
  canvasZoom,
  setZoom,
  canvasStatus,
  setCanvasStatus,
  selectedNodeId,
  selectedEdgeId,
  selectedNodeIds,
  chainName,
  isDirty,
  nodeCount,
  edgeCount,
  errorCount,
  warningCount,
  relationSelectorState,
  showRelationSelector,
  hideRelationSelector,
  propertyBubbleState,
  showPropertyBubble,
  hidePropertyBubble,
  nodeSearchVisible,
  toggleNodeSearch,
  showNodeSearch,
  hideNodeSearch,
  batchToolbarState,
  showBatchToolbar,
  hideBatchToolbar,
} from './canvasStore'

describe('canvasStore', () => {
  describe('zoom', () => {
    it('should set zoom within valid range', () => {
      setZoom(150)
      expect(canvasZoom.value).toBe(150)
    })

    it('should clamp zoom to minimum 25', () => {
      setZoom(10)
      expect(canvasZoom.value).toBe(25)
    })

    it('should clamp zoom to maximum 200', () => {
      setZoom(300)
      expect(canvasZoom.value).toBe(200)
    })

    it('should round zoom values', () => {
      setZoom(99.7)
      expect(canvasZoom.value).toBe(100)
    })
  })

  describe('canvas status', () => {
    it('should set canvas status', () => {
      setCanvasStatus('running')
      expect(canvasStatus.value).toBe('running')
      setCanvasStatus('editing')
      expect(canvasStatus.value).toBe('editing')
    })
  })

  describe('selection', () => {
    it('should set selected node ID', () => {
      selectedNodeId.value = 'node-1'
      expect(selectedNodeId.value).toBe('node-1')
      selectedNodeId.value = null
      expect(selectedNodeId.value).toBeNull()
    })

    it('should set selected edge ID', () => {
      selectedEdgeId.value = 'edge-1'
      expect(selectedEdgeId.value).toBe('edge-1')
      selectedEdgeId.value = null
      expect(selectedEdgeId.value).toBeNull()
    })

    it('should set selected node IDs for multi-select', () => {
      selectedNodeIds.value = ['node-1', 'node-2']
      expect(selectedNodeIds.value).toEqual(['node-1', 'node-2'])
      selectedNodeIds.value = []
      expect(selectedNodeIds.value).toEqual([])
    })
  })

  describe('chain info', () => {
    it('should set chain name', () => {
      chainName.value = '测试规则链'
      expect(chainName.value).toBe('测试规则链')
    })

    it('should toggle dirty state', () => {
      isDirty.value = true
      expect(isDirty.value).toBe(true)
      isDirty.value = false
      expect(isDirty.value).toBe(false)
    })
  })

  describe('counters', () => {
    it('should update node count', () => {
      nodeCount.value = 5
      expect(nodeCount.value).toBe(5)
    })

    it('should update edge count', () => {
      edgeCount.value = 3
      expect(edgeCount.value).toBe(3)
    })

    it('should update error count', () => {
      errorCount.value = 1
      expect(errorCount.value).toBe(1)
    })

    it('should update warning count', () => {
      warningCount.value = 2
      expect(warningCount.value).toBe(2)
    })
  })

  describe('relation selector overlay', () => {
    it('should show and hide relation selector', () => {
      showRelationSelector(100, 200, 'edge-1')
      expect(relationSelectorState.value).toEqual({
        visible: true,
        x: 100,
        y: 200,
        edgeId: 'edge-1',
        sourceId: null,
        targetId: null,
      })
      hideRelationSelector()
      expect(relationSelectorState.value).toBeNull()
    })
  })

  describe('property bubble overlay', () => {
    it('should show and hide property bubble', () => {
      const nodeData = { label: 'test' }
      showPropertyBubble(50, 60, nodeData)
      expect(propertyBubbleState.value).toEqual({
        visible: true,
        x: 50,
        y: 60,
        nodeId: null,
        nodeData,
      })
      hidePropertyBubble()
      expect(propertyBubbleState.value).toBeNull()
    })
  })

  describe('node search overlay', () => {
    it('should show and hide node search', () => {
      showNodeSearch()
      expect(nodeSearchVisible.value).toBe(true)
      hideNodeSearch()
      expect(nodeSearchVisible.value).toBe(false)
    })

    it('should toggle node search', () => {
      hideNodeSearch()
      toggleNodeSearch()
      expect(nodeSearchVisible.value).toBe(true)
      toggleNodeSearch()
      expect(nodeSearchVisible.value).toBe(false)
    })
  })

  describe('batch toolbar overlay', () => {
    it('should show and hide batch toolbar', () => {
      showBatchToolbar(100, 150, 3)
      expect(batchToolbarState.value).toEqual({ x: 100, y: 150, count: 3 })
      hideBatchToolbar()
      expect(batchToolbarState.value).toBeNull()
    })
  })
})
