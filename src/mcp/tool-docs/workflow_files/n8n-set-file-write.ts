import { ToolDocumentation } from '../types';

export const n8nSetFileWriteDoc: ToolDocumentation = {
  name: 'n8n_set_file_write',
  category: 'workflow_files',
  essentials: {
    description: 'Write a Set(raw) node JSON file with optional ETag-based concurrency control.',
    keyParameters: ['workflowId', 'nodeId', 'content', 'expectedEtag'],
    example: 'n8n_set_file_write({workflowId: "<workflowId>", nodeId: "<uuid>", content: "{...}", expectedEtag: "<etag>"})',
    performance: 'Fast (writes a single file).',
    tips: [
      'Pass expectedEtag from a prior read to avoid overwrites',
      'Ensure content is valid JSON'
    ]
  },
  full: {
    description: 'Writes the Set(raw) node JSON file for a workflowId and nodeId. If the file exists, expectedEtag enforces optimistic concurrency. Use this to update raw JSON payloads for Set nodes.',
    parameters: {
      workflowId: { type: 'string', description: 'Workflow ID (folder name under workflows)', required: true },
      nodeId: { type: 'string', description: 'Node UUID for the Set(raw) node file', required: true },
      content: { type: 'string', description: 'Full JSON contents to write', required: true },
      expectedEtag: { type: 'string', description: 'Optional ETag for optimistic concurrency control' }
    },
    returns: 'Object with workflowId, nodeId, uri, etag, size, and lastModified after the write.',
    examples: [
      'n8n_set_file_write({workflowId: "09c0dR8IitPI8NLu", nodeId: "7f2e1b1c-5f0d-4e1a-9b1f-1234567890ab", content: "{\"foo\": 1}", expectedEtag: "<etag>"})'
    ],
    useCases: [
      'Update Set(raw) JSON payloads',
      'Apply refactors to Set node outputs',
      'Fix invalid JSON in a Set node file'
    ],
    performance: 'Typically <50ms per write, depends on storage latency.',
    bestPractices: [
      'Always read first and use expectedEtag to prevent concurrent overwrites',
      'Validate JSON content before writing'
    ],
    pitfalls: [
      'ETag mismatch indicates the file changed since the last read',
      'Set node must be in raw mode for the file to be used'
    ],
    relatedTools: ['n8n_set_file_read', 'n8n_set_files_list', 'n8n_code_file_write']
  }
};
