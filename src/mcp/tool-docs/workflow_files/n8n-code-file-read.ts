import { ToolDocumentation } from '../types';

export const n8nCodeFileReadDoc: ToolDocumentation = {
  name: 'n8n_code_file_read',
  category: 'workflow_files',
  essentials: {
    description: 'Read a Code node source file and return its content plus metadata.',
    keyParameters: ['workflowId', 'nodeId'],
    example: 'n8n_code_file_read({workflowId: "<workflowId>", nodeId: "<uuid>"})',
    performance: 'Fast (reads a single file from disk).',
    tips: [
      'Use n8n_code_files_list to find nodeId values',
      'Capture etag for safe writes'
    ]
  },
  full: {
    description: 'Reads the Code node source file for a given workflowId and nodeId. The server resolves the correct extension (.py or .json) automatically. Returns content along with metadata for concurrency control.',
    parameters: {
      workflowId: { type: 'string', description: 'Workflow ID (folder name under workflows)', required: true },
      nodeId: { type: 'string', description: 'Node UUID for the Code node file', required: true }
    },
    returns: 'Object with content (string), language, uri, etag, size, lastModified, workflowId, and nodeId.',
    examples: [
      'n8n_code_file_read({workflowId: "09c0dR8IitPI8NLu", nodeId: "7f2e1b1c-5f0d-4e1a-9b1f-1234567890ab"})'
    ],
    useCases: [
      'Review Code node source before editing',
      'Fetch code for linting or analysis',
      'Capture etag for optimistic concurrency'
    ],
    performance: 'Typically <20ms per file, depends on file size and storage.',
    bestPractices: [
      'Always store etag before writing updates',
      'Keep edits small and targeted'
    ],
    pitfalls: [
      'nodeId must be a UUID matching the Code node file name',
      'File must exist for the workflowId'
    ],
    relatedTools: ['n8n_code_files_list', 'n8n_code_file_write']
  }
};
