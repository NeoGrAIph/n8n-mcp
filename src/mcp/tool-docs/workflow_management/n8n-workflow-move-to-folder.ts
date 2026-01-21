import { ToolDocumentation } from '../types';

export const n8nWorkflowMoveToFolderDoc: ToolDocumentation = {
  name: 'n8n_workflow_move_to_folder',
  category: 'workflow_management',
  essentials: {
    description: 'Move a workflow to a folder (uses internal REST transfer endpoint).',
    keyParameters: ['workflowId', 'parentFolderId', 'projectId'],
    example: 'n8n_workflow_move_to_folder({workflowId: "wf_123", parentFolderId: "fold_ops"})',
    performance: 'Fast (100-400ms)',
    tips: [
      'Use null parentFolderId to move to root',
      'Use n8n_folders_list to find folder IDs',
      'Confirm move with n8n_workflow_get'
    ]
  },
  full: {
    description: 'Moves a workflow to a folder using the internal REST transfer endpoint. Requires REST auth and a resolved destination project.',
    parameters: {
      workflowId: { type: 'string', description: 'Workflow ID to move (required)', required: true },
      parentFolderId: { type: 'string|null', description: 'Target folder ID (null to move to root)', required: true },
      projectId: { type: 'string', description: 'Optional destination project ID (defaults to REST project)', required: false }
    },
    returns: 'Updated workflow metadata (id and parentFolderId).',
    examples: [
      'n8n_workflow_move_to_folder({workflowId: "wf_123", parentFolderId: "fold_ops"}) - Move to folder',
      'n8n_workflow_move_to_folder({workflowId: "wf_123", parentFolderId: null}) - Move to root',
      'n8n_workflow_move_to_folder({workflowId: "wf_123", parentFolderId: "fold_ops", projectId: "proj_123"}) - Move across projects'
    ],
    useCases: [
      'Reorganize workflows into folders',
      'Align workflow structure with team taxonomy',
      'Bulk moves after folder restructuring'
    ],
    performance: 'Fast - typically sub-second.',
    bestPractices: [
      'Validate target folder ID first',
      'Use n8n_workflow_get to confirm parentFolderId',
      'Avoid moving workflows across projects unless supported by the server'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'Requires REST auth (N8N_REST_EMAIL/N8N_REST_PASSWORD)',
      'Ensure REST project is configured (N8N_REST_PROJECT_EMAIL or N8N_REST_PROJECT_ID)',
      'Server may reject invalid folder IDs'
    ],
    relatedTools: [
      'n8n_folders_list',
      'n8n_folder_move',
      'n8n_workflow_get'
    ]
  }
};
