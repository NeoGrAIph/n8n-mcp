import { ToolDocumentation } from '../types';

export const n8nFolderMoveDoc: ToolDocumentation = {
  name: 'n8n_folder_move',
  category: 'workflow_management',
  essentials: {
    description: 'Rename or move a folder within a project (internal REST API).',
    keyParameters: ['projectId', 'folderId', 'name', 'parentFolderId'],
    example: 'n8n_folder_move({projectId: "proj_123", folderId: "fold_1", parentFolderId: "fold_2"})',
    performance: 'Fast (100-300ms)',
    tips: [
      'Provide name to rename; parentFolderId to move',
      'Use null parentFolderId to move to root',
      'Confirm results with n8n_folders_list'
    ]
  },
  full: {
    description: 'Moves a folder to a new parent and/or renames it using n8n internal REST endpoints. You must provide at least one of name or parentFolderId.',
    parameters: {
      projectId: { type: 'string', description: 'Project ID (required)', required: true },
      folderId: { type: 'string', description: 'Folder ID to move/rename (required)', required: true },
      name: { type: 'string', description: 'New folder name (optional)' },
      parentFolderId: { type: 'string|null', description: 'New parent folder ID (null to move to root)' }
    },
    returns: 'Updated folder metadata.',
    examples: [
      'n8n_folder_move({projectId: "proj_123", folderId: "fold_1", name: "Ops"}) - Rename folder',
      'n8n_folder_move({projectId: "proj_123", folderId: "fold_1", parentFolderId: "fold_2"}) - Move folder',
      'n8n_folder_move({projectId: "proj_123", folderId: "fold_1", name: "Ops", parentFolderId: null}) - Rename and move to root'
    ],
    useCases: [
      'Restructure folder hierarchy',
      'Rename folders to match naming conventions',
      'Move a folder subtree under a new parent'
    ],
    performance: 'Fast - typically sub-second.',
    bestPractices: [
      'Avoid moving a folder into its own subtree',
      'Verify final structure with n8n_folders_list',
      'Update any documentation that references folder paths'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'Uses internal REST API (not part of public API)',
      'Server may reject invalid parentFolderId values'
    ],
    relatedTools: [
      'n8n_folders_list',
      'n8n_folder_create',
      'n8n_folder_delete',
      'n8n_workflow_move_to_folder'
    ]
  }
};
