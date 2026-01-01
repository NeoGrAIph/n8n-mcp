import { ToolDocumentation } from '../types';

export const n8nWorkflowVersionsListDoc: ToolDocumentation = {
  name: 'n8n_workflow_versions_list',
  category: 'workflow_management',
  essentials: {
    description: 'List version history for a workflow.',
    keyParameters: ['workflowId', 'limit'],
    example: 'n8n_workflow_versions_list({workflowId: "wf_123", limit: 5})',
    performance: 'Fast (50-200ms)',
    tips: [
      'Use small limits for quick history checks',
      'Use workflowId from n8n_list_workflows',
      'Combine with get for specific versions'
    ]
  },
  full: {
    description: 'Retrieve version history for a workflow with optional limit.',
    parameters: {
      workflowId: { type: 'string', required: true, description: 'Workflow ID' },
      limit: { type: 'integer', required: false, description: 'Max versions to return (default: 10)' }
    },
    returns: 'List of versions with metadata.',
    examples: [
      'n8n_workflow_versions_list({workflowId: "wf_123"})',
      'n8n_workflow_versions_list({workflowId: "wf_123", limit: 5})'
    ],
    useCases: [
      'Audit workflow changes',
      'Find version IDs for rollback',
      'Track change frequency'
    ],
    performance: 'Fast (50-200ms)',
    bestPractices: [
      'Limit results for faster responses',
      'Use get to inspect a specific version'
    ],
    pitfalls: [
      'Large histories may return many records'
    ],
    relatedTools: ['n8n_workflow_versions_get', 'n8n_workflow_versions_rollback']
  }
};
