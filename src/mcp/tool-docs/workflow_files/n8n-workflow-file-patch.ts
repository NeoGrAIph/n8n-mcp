import { ToolDocumentation } from '../types';

export const n8nWorkflowFilePatchDoc: ToolDocumentation = {
  name: 'n8n_workflow_file_patch',
  category: 'workflow_files',
  essentials: {
    description: 'Apply a unified diff patch to a workflow file (Code or Set(raw)).',
    keyParameters: ['uri', 'patch', 'expectedEtag'],
    example: 'n8n_workflow_file_patch({uri: "n8n-workflows:///code/<workflowId>/<nodeId>.json", patch: "@@ -1,1 +1,1 @@\\n-const x = 1;\\n+const x = 2;\\n", expectedEtag: "<etag>"})',
    performance: 'Fast (reads, patches, and writes a single file).',
    tips: [
      'Use resources/list to discover valid URIs',
      'Read first to capture expectedEtag and base content',
      'Patch applies line-by-line; keep hunks small for reliability',
      'Wrapped patches (*** Begin/End Patch or git headers) are accepted and stripped; prefer full @@ -a,b +c,d @@ hunks'
    ]
  },
  full: {
    description: 'Applies a unified diff patch to a workflow file referenced by a resource URI. Works for Code node files (.json/.py) and Set(raw) files (.set.json). Use expectedEtag to prevent overwriting concurrent changes.',
    parameters: {
      uri: { type: 'string', description: 'Resource URI, e.g. n8n-workflows:///code/{workflowId}/{nodeId}.json or n8n-workflows:///set/{workflowId}/{nodeId}.set.json', required: true },
      patch: { type: 'string', description: 'Unified diff patch content (wrapper lines are tolerated)', required: true },
      expectedEtag: { type: 'string', description: 'Optional ETag for optimistic concurrency control' },
      minContextLines: { type: 'integer', description: 'Minimum number of context lines that must match (default 0)' },
      maxFuzz: { type: 'integer', description: 'Maximum fuzz to allow when matching context (default 0, max 2)' },
      ignoreWhitespaceInContext: { type: 'boolean', description: 'If true, ignores whitespace changes when matching context lines' }
    },
    returns: 'Object with uri, etag, size, and lastModified after patch is applied.',
    examples: [
      'n8n_workflow_file_patch({uri: "n8n-workflows:///code/09c0dR8IitPI8NLu/7f2e1b1c-5f0d-4e1a-9b1f-1234567890ab.json", patch: "@@ -1,3 +1,3 @@\\n-const x = 1;\\n+const x = 2;\\n", expectedEtag: "<etag>"})',
      'n8n_workflow_file_patch({uri: "n8n-workflows:///set/09c0dR8IitPI8NLu/7f2e1b1c-5f0d-4e1a-9b1f-1234567890ab.set.json", patch: "@@ -1,1 +1,1 @@\\n-{\\"value\\":1}\\n+{\\"value\\":2}\\n", expectedEtag: "<etag>"})'
    ],
    useCases: [
      'Update a small portion of a Code node without sending full contents',
      'Adjust a Set(raw) JSON value with minimal changes',
      'Apply a generated diff from an external editor'
    ],
    performance: 'Typically <50ms per patch, depends on storage latency.',
    bestPractices: [
      'Always read the file first and pass expectedEtag to prevent conflicts',
      'Validate the patch applies cleanly before running',
      'Prefer unified diff hunks with clear context lines',
      'Use minContextLines to keep matches safe when fuzz is enabled',
      'If using wrapper-style patches, keep context unique to avoid ambiguous matches'
    ],
    pitfalls: [
      'Patch will fail if context lines do not match current file contents',
      'Missing expectedEtag can overwrite concurrent changes',
      'Invalid URI format will return resource not found'
    ],
    relatedTools: [
      'n8n_code_file_read',
      'n8n_code_file_write',
      'n8n_set_file_read',
      'n8n_set_file_write',
      'n8n_tools_documentation'
    ]
  }
};
