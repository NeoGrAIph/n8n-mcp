import { ToolDocumentation } from '../types';

export const n8nWorkflowVersionsGetDoc: ToolDocumentation = {
  name: 'n8n_workflow_versions_get',
  category: 'workflow_management',
  essentials: {
    description: 'Get details for a specific workflow version by version ID.',
    keyParameters: ['versionId'],
    example: 'n8n_workflow_versions_get({versionId: 42})',
    performance: 'Fast (50-200ms)',
    tips: [
      'Use versionId from n8n_workflow_versions_list',
      'Inspect version before rollback'
    ]
  },
  full: {
    description: 'Retrieve a specific workflow version by its version ID.',
    parameters: {
      versionId: { type: 'integer', required: true, description: 'Version ID' }
    },
    returns: 'Workflow version details.',
    examples: [
      'n8n_workflow_versions_get({versionId: 42})'
    ],
    useCases: [
      'Inspect changes in a specific version',
      'Validate version content before rollback'
    ],
    performance: 'Fast (50-200ms)',
    bestPractices: [
      'Use list to discover valid version IDs'
    ],
    pitfalls: [
      'Version ID must exist'
    ],
    relatedTools: ['n8n_workflow_versions_list', 'n8n_workflow_versions_rollback']
  }
};
