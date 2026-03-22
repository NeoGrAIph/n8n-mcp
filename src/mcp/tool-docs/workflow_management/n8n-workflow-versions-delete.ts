import { ToolDocumentation } from '../types';

export const n8nWorkflowVersionsDeleteDoc: ToolDocumentation = {
  name: 'n8n_workflow_versions_delete',
  category: 'workflow_management',
  essentials: {
    description: 'Delete workflow versions (single or all) for a workflow.',
    keyParameters: ['workflowId', 'versionId', 'deleteAll'],
    example: 'n8n_workflow_versions_delete({workflowId: "wf_123", versionId: 42})',
    performance: 'Moderate (100-400ms)',
    tips: [
      'Prefer deleting a specific version when possible',
      'Use deleteAll only with explicit confirmation',
      'Deletion is irreversible'
    ]
  },
  full: {
    description: 'Delete workflow versions by ID or delete all versions for a workflow. This is destructive.',
    parameters: {
      workflowId: { type: 'string', required: true, description: 'Workflow ID' },
      versionId: { type: 'integer', required: false, description: 'Specific version ID to delete' },
      deleteAll: { type: 'boolean', required: false, description: 'Delete all versions for the workflow (default: false)' }
    },
    returns: 'Deletion result with count/message.',
    examples: [
      'n8n_workflow_versions_delete({workflowId: "wf_123", versionId: 42})',
      'n8n_workflow_versions_delete({workflowId: "wf_123", deleteAll: true})'
    ],
    useCases: [
      'Remove outdated versions',
      'Clean up version history'
    ],
    performance: 'Moderate (100-400ms)',
    bestPractices: [
      'Confirm version IDs before deleting',
      'Avoid deleteAll without explicit user approval'
    ],
    pitfalls: [
      'Deleted versions cannot be recovered'
    ],
    relatedTools: ['n8n_workflow_versions_list', 'n8n_workflow_versions_get']
  }
};
