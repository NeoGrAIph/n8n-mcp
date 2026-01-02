import { ToolDocumentation } from '../types';

export const workflowFilesResourcesGuide: ToolDocumentation = {
  name: 'workflow_files_resources_guide',
  category: 'guides',
  essentials: {
    description: 'Guide for MCP Resources that expose n8n workflow files (Code node and Set(raw) files). Use this to understand URI formats, how to read/write files, and how workflowId/nodeId are encoded in resource URIs.',
    keyParameters: ['topic', 'depth'],
    example: 'n8n_tools_documentation({topic: "workflow_files_resources_guide"})',
    performance: 'Instant (static content)',
    tips: [
      'Use resources/list to discover available files before reading or writing',
      'workflowId is the workflow folder name, nodeId is the file name stem',
      'Always pass expectedEtag when writing to avoid conflicts',
      'For partial changes, use n8n_workflow_file_patch'
    ]
  },
  full: {
    description: 'This guide documents the MCP Resources layer for workflow file access. It explains the URI scheme, how to map workflowId and nodeId from URIs, and the recommended read/write flow with etag-based concurrency control.',
    parameters: {
      topic: { type: 'string', description: 'Use "workflow_files_resources_guide" for this guide.', required: false },
      depth: { type: 'string', description: 'Use "essentials" or "full".', required: false }
    },
    returns: 'Markdown guide describing resource URI formats, read/write flow, and concurrency behavior.',
    examples: [
      '// Discover available workflow files',
      'resources/list',
      '',
      '// Read a Code node file',
      'resources/read { "uri": "n8n-workflows:///code/<workflowId>/<nodeId>.json" }',
      '',
      '// Write a Code node file (with optimistic concurrency)',
      'resources/write { "uri": "n8n-workflows:///code/<workflowId>/<nodeId>.json", "text": "...", "expectedEtag": "<etag>" }',
      '',
      '// Read a Set(raw) node file',
      'resources/read { "uri": "n8n-workflows:///set/<workflowId>/<nodeId>.set.json" }'
    ],
    useCases: [
      'Inspect Code node source files without fetching whole workflow JSON',
      'Update Code node source with etag protection',
      'Read/modify Set(raw) node JSON payloads'
    ],
    performance: 'Fast for small files; depends on storage and file size',
    bestPractices: [
      'Always call resources/list first to confirm available URIs',
      'Use etag from resources/read when calling resources/write',
      'Prefer narrow edits to avoid overwriting unrelated changes',
      'Use n8n_workflow_file_patch for partial updates instead of full rewrites'
    ],
    pitfalls: [
      'Invalid URI format will return resource not found',
      'Missing or stale expectedEtag will cause a conflict error',
      'Write requires plain text content; JSON must be valid for .set.json files'
    ],
    relatedTools: [
      'n8n_code_files_list',
      'n8n_code_file_read',
      'n8n_code_file_write',
      'n8n_set_files_list',
      'n8n_set_file_read',
      'n8n_set_file_write'
    ]
  }
};
