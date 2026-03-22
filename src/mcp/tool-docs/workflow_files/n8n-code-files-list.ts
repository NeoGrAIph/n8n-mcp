import { ToolDocumentation } from '../types';

export const n8nCodeFilesListDoc: ToolDocumentation = {
  name: 'n8n_code_files_list',
  category: 'workflow_files',
  essentials: {
    description: 'List Code node source files for a workflow with metadata (nodeId, language, uri, etag, size).',
    keyParameters: ['workflowId'],
    example: 'n8n_code_files_list({workflowId: "<workflowId>"})',
    performance: 'Fast (filesystem scan scoped to a single workflow folder).',
    tips: [
      'Use workflowId from n8n_workflows_list or n8n_workflow_get',
      'Use n8n_code_file_read to fetch contents'
    ]
  },
  full: {
    description: 'Lists Code node source files (.py for Python, .json for JavaScript) stored in the workflow folder. Returns metadata only; it does not include file contents. Use this to discover which Code nodes have file-backed source in a workflow.',
    parameters: {
      workflowId: { type: 'string', description: 'Workflow ID (directory is code_nodes_<workflowId> under workflows; pass raw workflowId)', required: true }
    },
    returns: 'Object with files[] (metadata entries: workflowId, nodeId, language, uri, etag, size, lastModified), returned, and workflowId.',
    examples: [
      'n8n_code_files_list({workflowId: "09c0dR8IitPI8NLu"})',
      'n8n_code_files_list({workflowId: "1CskUKnQGSPsGJfA"})'
    ],
    useCases: [
      'Find Code node files to review or edit',
      'Collect etags before batch updates',
      'Inventory Code node usage per workflow'
    ],
    performance: 'Typically <50ms for a single workflow directory; may be higher with large folders.',
    bestPractices: [
      'Use the returned etag when writing to avoid overwriting concurrent changes',
      'Prefer read-before-write for safe edits'
    ],
    pitfalls: [
      'workflowId maps to the workflow ID; directory may be code_nodes_<workflowId>',
      'Only Code nodes with file-backed sources are listed'
    ],
    relatedTools: ['n8n_code_file_read', 'n8n_code_file_write', 'n8n_set_files_list']
  }
};
