import { ToolDocumentation } from '../types';

export const n8nSetFilesListDoc: ToolDocumentation = {
  name: 'n8n_set_files_list',
  category: 'workflow_files',
  essentials: {
    description: 'List Set(raw) node JSON files for a workflow with metadata.',
    keyParameters: ['workflowId'],
    example: 'n8n_set_files_list({workflowId: "<workflowId>"})',
    performance: 'Fast (filesystem scan scoped to a single workflow folder).',
    tips: [
      'Only Set nodes in raw mode produce .set.json files',
      'Use n8n_set_file_read to fetch contents'
    ]
  },
  full: {
    description: 'Lists Set(raw) node JSON files stored in the workflow folder. Returns metadata only; it does not include file contents. Use this to discover which Set(raw) nodes have file-backed JSON.',
    parameters: {
      workflowId: { type: 'string', description: 'Workflow ID (folder name under workflows)', required: true }
    },
    returns: 'Object with files[] (metadata entries: workflowId, nodeId, uri, etag, size, lastModified), returned, and workflowId.',
    examples: [
      'n8n_set_files_list({workflowId: "09c0dR8IitPI8NLu"})'
    ],
    useCases: [
      'Find Set(raw) node files to review or edit',
      'Collect etags before batch updates',
      'Audit Set(raw) usage per workflow'
    ],
    performance: 'Typically <50ms for a single workflow directory; may be higher with large folders.',
    bestPractices: [
      'Use the returned etag when writing to avoid overwriting concurrent changes',
      'Prefer read-before-write for safe edits'
    ],
    pitfalls: [
      'Only Set nodes in raw mode generate .set.json files',
      'workflowId must match the folder name exactly'
    ],
    relatedTools: ['n8n_set_file_read', 'n8n_set_file_write', 'n8n_code_files_list']
  }
};
