import { ToolDocumentation } from '../types';

export const n8nExecutionsListDoc: ToolDocumentation = {
  name: 'n8n_executions_list',
  category: 'workflow_management',
  essentials: {
    description: 'List workflow executions with filters and pagination.',
    keyParameters: ['limit', 'workflowId', 'status'],
    example: 'n8n_executions_list({workflowId: "wf_123", limit: 20})',
    performance: 'Fast (50-200ms)',
    tips: [
      'Use workflowId to focus on a single workflow',
      'Filter by status to find failures',
      'Use cursor for pagination'
    ]
  },
  full: {
    description: 'List executions with optional filters and pagination.',
    parameters: {
      limit: { type: 'integer', required: false, description: 'Number of results (1-100, default: 100)' },
      cursor: { type: 'string', required: false, description: 'Pagination cursor from previous response' },
      workflowId: { type: 'string', required: false, description: 'Filter by workflow ID' },
      projectId: { type: 'string', required: false, description: 'Filter by project ID (enterprise)' },
      status: { type: 'string', required: false, description: 'Filter by status (success, error, waiting)' },
      includeData: { type: 'boolean', required: false, description: 'Include execution data (default: false)' }
    },
    returns: 'List of executions with optional nextCursor.',
    examples: [
      'n8n_executions_list({limit: 10})',
      'n8n_executions_list({workflowId: "wf_123", status: "error"})'
    ],
    useCases: [
      'Audit recent executions',
      'Find failed runs for debugging',
      'Paginate through execution history'
    ],
    performance: 'Fast (50-200ms), data-dependent if includeData=true',
    bestPractices: [
      'Keep limit small for quick scans',
      'Use status filter to narrow results',
      'Paginate using cursor for long histories'
    ],
    pitfalls: [
      'includeData can increase payload size significantly'
    ],
    relatedTools: ['n8n_executions_get', 'n8n_list_workflows']
  }
};
