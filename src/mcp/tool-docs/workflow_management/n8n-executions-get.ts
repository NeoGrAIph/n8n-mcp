import { ToolDocumentation } from '../types';

export const n8nExecutionsGetDoc: ToolDocumentation = {
  name: 'n8n_executions_get',
  category: 'workflow_management',
  essentials: {
    description: 'Get execution details by ID with an optional detail mode.',
    keyParameters: ['id', 'mode', 'itemsLimit'],
    example: 'n8n_executions_get({id: "exec_456", mode: "error"})',
    performance: 'Fast (50-200ms)',
    tips: [
      'Use mode="error" for efficient failure debugging',
      'Use mode="preview" to inspect structure only',
      'Use itemsLimit to control data volume in filtered mode'
    ]
  },
  full: {
    description: `Retrieve execution details for a single execution ID. Use mode to control how much data is returned.`,
    parameters: {
      id: { type: 'string', required: true, description: 'Execution ID' },
      mode: { type: 'string', required: false, description: 'preview, summary (default), filtered, full, or error' },
      nodeNames: { type: 'array', required: false, description: 'For mode=filtered: filter to specific nodes by name' },
      itemsLimit: { type: 'integer', required: false, description: 'For mode=filtered: items per node (0=structure, 2=default, -1=unlimited)' },
      includeInputData: { type: 'boolean', required: false, description: 'Include input data in addition to output (default: false)' },
      errorItemsLimit: { type: 'integer', required: false, description: 'For mode=error: sample items from upstream node (default: 2, max: 100)' },
      includeStackTrace: { type: 'boolean', required: false, description: 'For mode=error: include full stack trace (default: false)' },
      includeExecutionPath: { type: 'boolean', required: false, description: 'For mode=error: include execution path leading to error (default: true)' },
      fetchWorkflow: { type: 'boolean', required: false, description: 'For mode=error: fetch workflow for accurate upstream detection (default: true)' }
    },
    returns: 'Execution object (shape depends on mode).',
    examples: [
      'n8n_executions_get({id: "exec_456"})',
      'n8n_executions_get({id: "exec_456", mode: "error"})',
      'n8n_executions_get({id: "exec_456", mode: "filtered", nodeNames: ["HTTP Request"], itemsLimit: 2})'
    ],
    useCases: [
      'Debug a failed execution quickly with mode=error',
      'Inspect structure without payloads using mode=preview',
      'Get limited node data for targeted analysis'
    ],
    performance: 'Fast (50-200ms), data-dependent for full mode',
    bestPractices: [
      'Prefer mode=error for failures',
      'Limit data with mode=filtered and itemsLimit',
      'Use mode=preview for quick structure checks'
    ],
    pitfalls: [
      'mode=full can return very large payloads',
      'Filtered mode without nodeNames may still be large'
    ],
    relatedTools: ['n8n_executions_list', 'n8n_test_workflow', 'n8n_list_workflows']
  }
};
