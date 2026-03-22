import { ToolDocumentation } from '../types';

export const n8nCodeFileWriteDoc: ToolDocumentation = {
  name: 'n8n_code_file_write',
  category: 'workflow_files',
  essentials: {
    description: 'Write a Code node source file with optional ETag-based concurrency control.',
    keyParameters: ['workflowId', 'nodeId', 'content', 'expectedEtag', 'language'],
    example: 'n8n_code_file_write({workflowId: "<workflowId>", nodeId: "<uuid>", content: "...", expectedEtag: "<etag>"})',
    performance: 'Fast (writes a single file).',
    tips: [
      'Pass expectedEtag from a prior read to avoid overwrites',
      'Provide language only when creating a new file'
    ]
  },
  full: {
    description: 'Writes the Code node source file for a workflowId and nodeId. If the file exists, expectedEtag enforces optimistic concurrency. If the file does not exist, language is required to select the extension (.py or .json).',
    parameters: {
      workflowId: { type: 'string', description: 'Workflow ID (folder name under workflows)', required: true },
      nodeId: { type: 'string', description: 'Node UUID for the Code node file', required: true },
      content: { type: 'string', description: 'Full file contents to write', required: true },
      expectedEtag: { type: 'string', description: 'Optional ETag for optimistic concurrency control' },
      language: { type: 'string', description: 'Required when creating a new file: python/py or javascript/js/json' }
    },
    returns: 'Object with workflowId, nodeId, language, uri, etag, size, and lastModified after the write.',
    examples: [
      'n8n_code_file_write({workflowId: "09c0dR8IitPI8NLu", nodeId: "7f2e1b1c-5f0d-4e1a-9b1f-1234567890ab", content: "return [{json: {ok: true}}];", expectedEtag: "<etag>"})',
      'n8n_code_file_write({workflowId: "09c0dR8IitPI8NLu", nodeId: "7f2e1b1c-5f0d-4e1a-9b1f-1234567890ab", content: "print(\\"hi\\")", language: "python"})'
    ],
    useCases: [
      'Apply a targeted change to Code node logic',
      'Create a new Code node file from template',
      'Repair a broken Code node script'
    ],
    performance: 'Typically <50ms per write, depends on storage latency.',
    bestPractices: [
      'Always read first and use expectedEtag to prevent concurrent overwrites',
      'Keep edits small and validate with n8n workflow validation tools'
    ],
    pitfalls: [
      'Missing language when creating a new file will fail',
      'ETag mismatch indicates the file changed since the last read'
    ],
    relatedTools: ['n8n_code_file_read', 'n8n_code_files_list', 'n8n_set_file_write']
  }
};
