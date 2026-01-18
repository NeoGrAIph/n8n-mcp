import { ToolDocumentation } from '../types';

export const n8nFoldersListDoc: ToolDocumentation = {
  name: 'n8n_folders_list',
  category: 'workflow_management',
  essentials: {
    description: 'List folders in a project (internal REST API). Returns folder metadata and pagination cursors when available.',
    keyParameters: ['projectId', 'parentFolderId', 'filter'],
    example: 'n8n_folders_list({projectId: "proj_123"})',
    performance: 'Fast (100-300ms)',
    tips: [
      'Use parentFolderId to list direct children',
      'Pass filter object for UI-style filtering',
      'Use cursor when API returns nextCursor'
    ]
  },
  full: {
    description: 'Lists folders for a project using n8n internal REST endpoints. Useful for browsing folder structure and getting folder IDs for move/delete operations.',
    parameters: {
      projectId: { type: 'string', description: 'Project ID (required)', required: true },
      parentFolderId: { type: 'string', description: 'Optional parent folder ID to list direct children only' },
      filter: { type: 'object', description: 'Optional filter object (will be JSON-stringified and passed as filter=...)' },
      projectRelation: { type: 'boolean', description: 'Include project relation metadata (internal API flag)' },
      projectRole: { type: 'boolean', description: 'Include project role metadata (internal API flag)' },
      cursor: { type: 'string', description: 'Pagination cursor from previous response' },
      limit: { type: 'number', description: 'Max folders to return (server-dependent)' }
    },
    returns: 'Object with: folders array (folder metadata), returned (count), hasMore (boolean), nextCursor (if provided by server), and _note when more data exists.',
    examples: [
      'n8n_folders_list({projectId: "proj_123"}) - List top-level folders',
      'n8n_folders_list({projectId: "proj_123", parentFolderId: "fold_1"}) - List child folders',
      'n8n_folders_list({projectId: "proj_123", filter: { state: "active" }}) - Filter folders'
    ],
    useCases: [
      'Browse folder structure in n8n',
      'Find folder IDs for move/delete operations',
      'Build folder pickers or navigation UIs'
    ],
    performance: 'Fast - typically sub-second for moderate folder counts.',
    bestPractices: [
      'Keep responses small using parentFolderId or filters',
      'Expect pagination on large datasets',
      'Use this before destructive folder operations'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'Uses internal REST API (not part of public API)',
      'Response shape may vary between n8n versions'
    ],
    relatedTools: [
      'n8n_folder_create',
      'n8n_folder_move',
      'n8n_folder_delete',
      'n8n_workflow_move_to_folder'
    ]
  }
};
