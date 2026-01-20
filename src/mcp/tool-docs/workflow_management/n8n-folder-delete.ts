import { ToolDocumentation } from '../types';

export const n8nFolderDeleteDoc: ToolDocumentation = {
  name: 'n8n_folder_delete',
  category: 'workflow_management',
  essentials: {
    description: 'Delete an empty folder in a project (internal REST API). Non-empty deletes should fail.',
    keyParameters: ['folderId', 'projectId'],
    example: 'n8n_folder_delete({folderId: "fold_empty"})',
    performance: 'Fast (100-300ms)',
    tips: [
      'Only empty folders can be deleted',
      'Use n8n_folders_list to verify emptiness',
      'Omit projectId to use your personal project',
      'Move workflows out before deleting'
    ]
  },
  full: {
    description: 'Deletes a folder in a project using n8n internal REST endpoints. This tool is intended for EMPTY folders only; the server should reject non-empty folders.',
    parameters: {
      projectId: { type: 'string', description: 'Project ID (optional; defaults to your personal project)' },
      folderId: { type: 'string', description: 'Folder ID to delete (required)', required: true }
    },
    returns: 'Confirmation of deletion (id and deleted=true).',
    examples: [
      'n8n_folder_delete({folderId: "fold_empty"}) - Delete empty folder in your personal project'
    ],
    useCases: [
      'Clean up unused folders',
      'Remove temporary folder structures',
      'Finalize reorganizations after moving workflows'
    ],
    performance: 'Fast - typically sub-second.',
    bestPractices: [
      'Ensure folder has no workflows or child folders',
      'Use n8n_folders_list to confirm',
      'Perform moves before delete to avoid failures'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'Folder tools also require REST auth (N8N_REST_EMAIL, N8N_REST_PASSWORD)',
      'Uses internal REST API (not part of public API)',
      'Delete will fail if folder is not empty'
    ],
    relatedTools: [
      'n8n_folders_list',
      'n8n_folder_move',
      'n8n_workflow_move_to_folder'
    ]
  }
};
