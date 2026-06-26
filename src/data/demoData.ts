import type { GraphData } from '@logicflow/core'
/**
 * Demo graph data for initial canvas rendering.
 * v0.4.0: Simplified to input → action(×0.1) → output chain.
 */
export const DEMO_DATA: GraphData = {
  nodes: [
    {
      id: 'input_1',
      type: 'rf-input-port',
      x: 200,
      y: 200,
      text: '模拟量输入',
      properties: {
        nodeType: 'input_port',
        icon: '\u2192',
        priority: 0,
        enabled: true,
        summary: '模拟量输入',
        roleInRule: 'input',
        ruleId: 'port:analog_input',
        pointName: 'analog_input',
        displayName: '模拟量输入',
        pointType: 'analog',
        dataType: 'double',
        unit: 'kW',
      },
    },
    {
      id: 'action_scale',
      type: 'rf-action',
      x: 550,
      y: 200,
      text: '值变换 ×0.1',
      properties: {
        nodeType: 'action',
        icon: '\u25B6',
        priority: 1,
        enabled: true,
        summary: '变换: 乘以 0.1',
        roleInRule: 'action',
        ruleId: 'act:scale_001',
        actionType: 'transform',
        actionConfig: { expression: 'value * 0.1' },
      },
    },
    {
      id: 'output_1',
      type: 'rf-output-port',
      x: 900,
      y: 200,
      text: '变换结果',
      properties: {
        nodeType: 'output_port',
        icon: '\u2190',
        priority: 0,
        enabled: true,
        summary: 'scale_output',
        roleInRule: 'output',
        ruleId: 'port:scale_output',
        pointName: 'scale_output',
        displayName: '变换结果',
        pointType: 'virtual',
        dataType: 'double',
        unit: 'kW',
        scope: 'per_device',
        inputPoints: ['analog_input'],
      },
    },
  ],
  edges: [
    {
      id: 'edge:input_to_action',
      type: 'polyline',
      sourceNodeId: 'input_1',
      targetNodeId: 'action_scale',
      text: '',
      properties: { relationType: 'default' },
    },
    {
      id: 'edge:action_to_output',
      type: 'polyline',
      sourceNodeId: 'action_scale',
      targetNodeId: 'output_1',
      text: 'Success',
      properties: { relationType: 'Success' },
    },
  ],
}
