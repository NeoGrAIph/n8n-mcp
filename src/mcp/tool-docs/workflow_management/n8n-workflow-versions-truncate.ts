import { ToolDocumentation } from '../types';

export const n8nWorkflowVersionsTruncateDoc: ToolDocumentation = {
  name: 'n8n_workflow_versions_truncate',
  category: 'workflow_management',
  essentials: {
    description: 'Truncate all workflow versions globally. Requires explicit confirmation.',
    keyParameters: ['confirmTruncate'],
    example: 'n8n_workflow_versions_truncate({confirmTruncate: true})',
    performance: 'Moderate (100-500ms)',
    tips: [
      'Use only with explicit approval',
      'This removes all version history'
    ]
  },
  full: {
    description: 'Delete all workflow versions for all workflows. This is highly destructive.',
    parameters: {
      confirmTruncate: { type: 'boolean', required: true, description: 'Must be true to proceed' }
    },
    returns: 'Truncate result with counts.',
    examples: [
      'n8n_workflow_versions_truncate({confirmTruncate: true})'
    ],
    useCases: [
      'Reset version history during maintenance'
    ],
    performance: 'Moderate (100-500ms)',
    bestPractices: [
      'Back up data before truncation',
      'Use only during maintenance windows'
    ],
    pitfalls: [
      'All history is removed and cannot be restored'
    ],
    relatedTools: ['n8n_workflow_versions_list', 'n8n_workflow_versions_delete']
  }
};
