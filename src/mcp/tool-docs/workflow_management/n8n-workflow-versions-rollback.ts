import { ToolDocumentation } from '../types';

export const n8nWorkflowVersionsRollbackDoc: ToolDocumentation = {
  name: 'n8n_workflow_versions_rollback',
  category: 'workflow_management',
  essentials: {
    description: 'Rollback a workflow to a previous version.',
    keyParameters: ['workflowId', 'versionId'],
    example: 'n8n_workflow_versions_rollback({workflowId: "wf_123", versionId: 42})',
    performance: 'Moderate (100-400ms)',
    tips: [
      'Use versionId to target a specific version',
      'Keep validateBefore=true for safety',
      'Review version details before rollback'
    ]
  },
  full: {
    description: 'Rollback a workflow to a previous version. This operation changes workflow state.',
    parameters: {
      workflowId: { type: 'string', required: true, description: 'Workflow ID' },
      versionId: { type: 'integer', required: false, description: 'Specific version ID to rollback to (optional)' },
      validateBefore: { type: 'boolean', required: false, description: 'Validate workflow structure before rollback (default: true)' }
    },
    returns: 'Rollback result and updated workflow info.',
    examples: [
      'n8n_workflow_versions_rollback({workflowId: "wf_123"})',
      'n8n_workflow_versions_rollback({workflowId: "wf_123", versionId: 42})'
    ],
    useCases: [
      'Restore a stable workflow version',
      'Undo problematic changes'
    ],
    performance: 'Moderate (100-400ms)',
    bestPractices: [
      'Validate versions before rollback',
      'Use list/get to confirm target version'
    ],
    pitfalls: [
      'Rollback changes active workflow behavior'
    ],
    relatedTools: ['n8n_workflow_versions_list', 'n8n_workflow_versions_get']
  }
};
