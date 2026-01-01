import { ToolDocumentation } from '../types';

export const n8nWorkflowVersionsPruneDoc: ToolDocumentation = {
  name: 'n8n_workflow_versions_prune',
  category: 'workflow_management',
  essentials: {
    description: 'Prune workflow versions to keep only the most recent N.',
    keyParameters: ['workflowId', 'maxVersions'],
    example: 'n8n_workflow_versions_prune({workflowId: "wf_123", maxVersions: 5})',
    performance: 'Moderate (100-400ms)',
    tips: [
      'Use small maxVersions for aggressive cleanup',
      'Pruning is destructive and irreversible'
    ]
  },
  full: {
    description: 'Prune older workflow versions, keeping only the most recent N versions.',
    parameters: {
      workflowId: { type: 'string', required: true, description: 'Workflow ID' },
      maxVersions: { type: 'integer', required: false, description: 'Keep N most recent versions (default: 10)' }
    },
    returns: 'Prune result with counts.',
    examples: [
      'n8n_workflow_versions_prune({workflowId: "wf_123", maxVersions: 5})'
    ],
    useCases: [
      'Reduce version history size',
      'Enforce retention policies'
    ],
    performance: 'Moderate (100-400ms)',
    bestPractices: [
      'Confirm retention requirements before pruning'
    ],
    pitfalls: [
      'Pruned versions cannot be recovered'
    ],
    relatedTools: ['n8n_workflow_versions_list', 'n8n_workflow_versions_delete']
  }
};
