import { ToolDocumentation } from '../types';

export const n8nFolderCreateDoc: ToolDocumentation = {
  name: 'n8n_folder_create',
  category: 'workflow_management',
  essentials: {
    description: 'Create a folder in a project (internal REST API). Supports root or nested folders.',
    keyParameters: ['projectId', 'name', 'parentFolderId'],
    example: 'n8n_folder_create({projectId: "proj_123", name: "Ops"})',
    performance: 'Fast (100-300ms)',
    tips: [
      'Use parentFolderId to create nested folders',
      'Names should be unique within the same parent',
      'Use n8n_folders_list to confirm placement'
    ]
  },
  full: {
    description: 'Creates a folder in a project using n8n internal REST endpoints. You can create a top-level folder (omit parentFolderId) or a nested folder (provide parentFolderId).',
    parameters: {
      projectId: { type: 'string', description: 'Project ID (required)', required: true },
      name: { type: 'string', description: 'Folder name (required)', required: true },
      parentFolderId: { type: 'string|null', description: 'Parent folder ID (null or omit for root)' }
    },
    returns: 'Folder metadata for the created folder.',
    examples: [
      'n8n_folder_create({projectId: "proj_123", name: "Finance"}) - Create a root folder',
      'n8n_folder_create({projectId: "proj_123", name: "Q1", parentFolderId: "fold_fin"}) - Create nested folder'
    ],
    useCases: [
      'Organize workflows into folders',
      'Create project-specific taxonomy',
      'Prepare target folders before moving workflows'
    ],
    performance: 'Fast - typically sub-second.',
    bestPractices: [
      'Validate folder placement with n8n_folders_list',
      'Use consistent naming conventions',
      'Avoid deep nesting unless needed'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'Uses internal REST API (not part of public API)',
      'Folder name collisions may be rejected by server'
    ],
    relatedTools: [
      'n8n_folders_list',
      'n8n_folder_move',
      'n8n_workflow_move_to_folder'
    ]
  }
};
