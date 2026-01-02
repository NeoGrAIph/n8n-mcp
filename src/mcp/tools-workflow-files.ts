import { ToolDefinition } from '../types';

/**
 * Workflow File Tools
 *
 * These tools provide read/write access to Code node and Set(raw) node files
 * stored in the n8n workflows filesystem.
 */
export const n8nWorkflowFileTools: ToolDefinition[] = [
  {
    name: 'n8n_code_files_list',
    description: 'List Code node source files for a workflow. Use this when you need the available Code node files and their metadata for a specific workflow. Provide workflowId to target the workflow folder. Returns file descriptors with nodeId, language, uri, etag, size, and lastModified.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (folder name under workflows)'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'n8n_code_file_read',
    description: 'Read a Code node source file by workflowId and nodeId. Use this when you need the current file contents before making edits. Provide workflowId and nodeId; the server resolves .py or .json automatically. Returns file content plus metadata (etag, size, language, lastModified) for concurrency control.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (folder name under workflows)'
        },
        nodeId: {
          type: 'string',
          description: 'Node UUID for the Code node file'
        }
      },
      required: ['workflowId', 'nodeId']
    }
  },
  {
    name: 'n8n_code_file_write',
    description: 'Write a Code node source file by workflowId and nodeId. Use this when you need to update or create Code node content. Provide content and expectedEtag to protect against concurrent edits; include language when creating a new file so the extension is chosen correctly. Returns updated metadata (etag, size, uri) after the write.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (folder name under workflows)'
        },
        nodeId: {
          type: 'string',
          description: 'Node UUID for the Code node file'
        },
        content: {
          type: 'string',
          description: 'Full file contents to write'
        },
        expectedEtag: {
          type: 'string',
          description: 'Optional ETag for optimistic concurrency control'
        },
        language: {
          type: 'string',
          description: 'Required when creating a new file. Accepted values: python/py, javascript/js/json.'
        }
      },
      required: ['workflowId', 'nodeId', 'content']
    }
  },
  {
    name: 'n8n_set_files_list',
    description: 'List Set(raw) node JSON files for a workflow. Use this when you need the available Set(raw) files and their metadata for a specific workflow. Provide workflowId to target the workflow folder. Returns file descriptors with nodeId, uri, etag, size, and lastModified.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (folder name under workflows)'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'n8n_set_file_read',
    description: 'Read a Set(raw) node JSON file by workflowId and nodeId. Use this when you need the current raw JSON payload for a Set node. Provide workflowId and nodeId. Returns file content plus metadata (etag, size, lastModified) for concurrency control.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (folder name under workflows)'
        },
        nodeId: {
          type: 'string',
          description: 'Node UUID for the Set(raw) node file'
        }
      },
      required: ['workflowId', 'nodeId']
    }
  },
  {
    name: 'n8n_set_file_write',
    description: 'Write a Set(raw) node JSON file by workflowId and nodeId. Use this when you need to update the raw JSON payload for a Set node. Provide content and expectedEtag to protect against concurrent edits. Returns updated metadata (etag, size, uri) after the write.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (folder name under workflows)'
        },
        nodeId: {
          type: 'string',
          description: 'Node UUID for the Set(raw) node file'
        },
        content: {
          type: 'string',
          description: 'Full JSON contents to write'
        },
        expectedEtag: {
          type: 'string',
          description: 'Optional ETag for optimistic concurrency control'
        }
      },
      required: ['workflowId', 'nodeId', 'content']
    }
  },
  {
    name: 'n8n_workflow_file_patch',
    description: 'Apply a unified diff patch to a workflow file (Code or Set). Use this when you need to edit part of a file without sending full contents. Provide uri, patch, and expectedEtag to protect against concurrent edits. Returns updated metadata (etag, size, lastModified).',
    inputSchema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description: 'Resource URI: n8n-workflows:///code/{workflowId}/{nodeId}.{ext} or n8n-workflows:///set/{workflowId}/{nodeId}.set.json'
        },
        patch: {
          type: 'string',
          description: 'Unified diff patch to apply to the file contents'
        },
        expectedEtag: {
          type: 'string',
          description: 'Optional ETag for optimistic concurrency control'
        }
      },
      required: ['uri', 'patch']
    }
  }
];
