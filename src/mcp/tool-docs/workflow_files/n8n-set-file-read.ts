import { ToolDocumentation } from '../types';

export const n8nSetFileReadDoc: ToolDocumentation = {
  name: 'n8n_set_file_read',
  category: 'workflow_files',
  essentials: {
    description: 'Read a Set(raw) node JSON file and return its content plus metadata.',
    keyParameters: ['workflowId', 'nodeId'],
    example: 'n8n_set_file_read({workflowId: "<workflowId>", nodeId: "<uuid>"})',
    performance: 'Fast (reads a single file from disk).',
    tips: [
      'Use n8n_set_files_list to find nodeId values',
      'Capture etag for safe writes'
    ]
  },
  full: {
    description: 'Reads the Set(raw) node JSON file for a given workflowId and nodeId. Returns content along with metadata for concurrency control. Use this before editing Set raw JSON payloads.',
    parameters: {
      workflowId: { type: 'string', description: 'Workflow ID (folder name under workflows)', required: true },
      nodeId: { type: 'string', description: 'Node UUID for the Set(raw) node file', required: true }
    },
    returns: 'Object with content (string), uri, etag, size, lastModified, workflowId, and nodeId.',
    examples: [
      'n8n_set_file_read({workflowId: "09c0dR8IitPI8NLu", nodeId: "7f2e1b1c-5f0d-4e1a-9b1f-1234567890ab"})'
    ],
    useCases: [
      'Review Set(raw) JSON payloads',
      'Prepare edits with optimistic concurrency',
      'Troubleshoot Set node outputs'
    ],
    performance: 'Typically <20ms per file, depends on file size and storage.',
    bestPractices: [
      'Always store etag before writing updates',
      'Validate JSON content before writing'
    ],
    pitfalls: [
      'Set node must be in raw mode to produce a file',
      'nodeId must be a UUID matching the file name'
    ],
    relatedTools: ['n8n_set_files_list', 'n8n_set_file_write']
  }
};
