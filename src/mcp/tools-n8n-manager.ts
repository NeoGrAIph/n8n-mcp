import { ToolDefinition } from '../types';

/**
 * n8n Management Tools
 * 
 * These tools enable AI agents to manage n8n workflows through the n8n API.
 * They require N8N_API_URL and N8N_API_KEY to be configured.
 */
export const n8nManagementTools: ToolDefinition[] = [
  // Workflow Management Tools
  {
    name: 'n8n_workflow_create',
    description: `Create a new workflow in n8n. Provide name, nodes, and connections (node types must use full n8n-nodes-base.* form) plus optional settings. Returns the new workflow id/name and basic stats; the workflow is created inactive.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          description: 'Workflow name (required)' 
        },
        nodes: { 
          type: 'array', 
          description: 'Array of workflow nodes. Each node must have: id, name, type, typeVersion, position, and parameters',
          items: {
            type: 'object',
            required: ['id', 'name', 'type', 'typeVersion', 'position', 'parameters'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              typeVersion: { type: 'integer' },
              position: { 
                type: 'array',
                items: { type: 'integer' },
                minItems: 2,
                maxItems: 2
              },
              parameters: { type: 'object' },
              credentials: { type: 'object' },
              disabled: { type: 'boolean' },
              notes: { type: 'string' },
              continueOnFail: { type: 'boolean' },
              retryOnFail: { type: 'boolean' },
              maxTries: { type: 'integer' },
              waitBetweenTries: { type: 'integer' }
            }
          }
        },
        connections: {
          type: 'object',
          description: 'Workflow connections object. Keys are source node names (the name field, not id), values define output connections'
        },
        settings: {
          type: 'object',
          description: 'Optional workflow settings (execution order, timezone, error handling)',
          properties: {
            executionOrder: { type: 'string', enum: ['v0', 'v1'] },
            timezone: { type: 'string' },
            saveDataErrorExecution: { type: 'string', enum: ['all', 'none'] },
            saveDataSuccessExecution: { type: 'string', enum: ['all', 'none'] },
            saveManualExecutions: { type: 'boolean' },
            saveExecutionProgress: { type: 'boolean' },
            executionTimeout: { type: 'integer' },
            errorWorkflow: { type: 'string' }
          }
        }
      },
      required: ['name', 'nodes', 'connections']
    }
  },
  {
    name: 'n8n_workflow_get',
    description: `Fetch a workflow by id from n8n. Use mode to control detail (full, details, structure, minimal) depending on how much data you need. Returns workflow data, and the details mode adds execution stats and webhook info.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Workflow ID'
        },
        mode: {
          type: 'string',
          enum: ['full', 'details', 'structure', 'minimal'],
          default: 'full',
          description: 'Detail level: full=complete workflow, details=full+execution stats, structure=nodes/connections topology, minimal=metadata only'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_workflow_update_full',
    description: `Replace a workflow’s nodes, connections, and settings in n8n. Provide id plus the updated fields and use this for full updates rather than small diffs. Returns basic info about the updated workflow and writes changes to n8n.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID to update' 
        },
        name: { 
          type: 'string', 
          description: 'New workflow name' 
        },
        nodes: { 
          type: 'array', 
          description: 'Complete array of workflow nodes (required if modifying workflow structure)',
          items: {
            type: 'object',
            additionalProperties: true
          }
        },
        connections: { 
          type: 'object', 
          description: 'Complete connections object (required if modifying workflow structure)' 
        },
        settings: { 
          type: 'object', 
          description: 'Workflow settings to update' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_workflow_update_partial',
    description: `Apply diff-based updates to an existing workflow. Provide id and an operations[] list (add/remove/update nodes or connections, settings, tags), with optional validateOnly and continueOnError. Returns applied/failed operations and writes changes when validateOnly is false.`,
    inputSchema: {
      type: 'object',
      additionalProperties: true,  // Allow any extra properties Claude Desktop might add
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID to update' 
        },
        operations: {
          type: 'array',
          description: 'Array of diff operations to apply. Each operation must have a "type" field and relevant properties for that operation type.',
          items: {
            type: 'object',
            additionalProperties: true
          }
        },
        validateOnly: {
          type: 'boolean',
          description: 'If true, only validate operations without applying them'
        },
        continueOnError: {
          type: 'boolean',
          description: 'If true, apply valid operations even if some fail (best-effort mode). Returns applied and failed operation indices. Default: false (atomic)'
        }
      },
      required: ['id', 'operations']
    }
  },
  {
    name: 'n8n_workflow_delete',
    description: `Delete a workflow by id in n8n. Provide id. Returns confirmation of deletion and removes the workflow permanently.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID to delete' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_workflows_list',
    description: `List workflows in n8n with optional filters. Provide limit, cursor, active, tags, or projectId as needed. Returns minimal metadata and pagination cursors.`,
    inputSchema: {
      type: 'object',
      properties: {
        limit: { 
          type: 'integer', 
          description: 'Number of workflows to return (1-100, default: 100)' 
        },
        cursor: { 
          type: 'string', 
          description: 'Pagination cursor from previous response' 
        },
        active: { 
          type: 'boolean', 
          description: 'Filter by active status' 
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Filter by tags (exact match)' 
        },
        projectId: { 
          type: 'string', 
          description: 'Filter by project ID (enterprise feature)' 
        },
        excludePinnedData: { 
          type: 'boolean', 
          description: 'Exclude pinned data from response (default: true)' 
        }
      }
    }
  },
  {
    name: 'n8n_workflow_validate',
    description: `Validate an existing workflow in n8n by id. Optionally pass options to control checks and profile. Returns validity, summary, errors, warnings, and suggestions for that workflow.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID to validate' 
        },
        options: {
          type: 'object',
          description: 'Validation options',
          properties: {
            validateNodes: { 
              type: 'boolean', 
              description: 'Validate node configurations (default: true)' 
            },
            validateConnections: { 
              type: 'boolean', 
              description: 'Validate workflow connections (default: true)' 
            },
            validateExpressions: { 
              type: 'boolean', 
              description: 'Validate n8n expressions (default: true)' 
            },
            profile: { 
              type: 'string', 
              enum: ['minimal', 'runtime', 'ai-friendly', 'strict'],
              description: 'Validation profile to use (default: runtime)' 
            }
          }
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_workflow_autofix',
    description: `Generate or apply automatic fixes for a workflow. Provide id and optional applyFixes, fixTypes, confidenceThreshold, and maxFixes. Returns fix summaries and counts, and writes changes when applyFixes is true.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Workflow ID to fix'
        },
        applyFixes: {
          type: 'boolean',
          description: 'Apply fixes to workflow (default: false - preview mode)'
        },
        fixTypes: {
          type: 'array',
          description: 'Types of fixes to apply (default: all)',
          items: {
            type: 'string',
            enum: ['expression-format', 'typeversion-correction', 'error-output-config', 'node-type-correction', 'webhook-missing-path', 'typeversion-upgrade', 'version-migration']
          }
        },
        confidenceThreshold: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Minimum confidence level for fixes (default: medium)'
        },
        maxFixes: {
          type: 'integer',
          description: 'Maximum number of fixes to apply (default: 50)'
        }
      },
      required: ['id']
    }
  },

  // Execution Management Tools
  {
    name: 'n8n_workflow_test',
    description: `Trigger a workflow execution via webhook, form, or chat. Provide workflowId and optional trigger parameters such as triggerType, message, or httpMethod. Returns execution details and metadata when supported, and may cause side effects in connected systems.`,
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID to execute (required)'
        },
        triggerType: {
          type: 'string',
          enum: ['webhook', 'form', 'chat'],
          description: 'Trigger type. Auto-detected if not specified. Workflow must have a matching trigger node.'
        },
        // Webhook options
        httpMethod: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'For webhook: HTTP method (default: from workflow config or POST)'
        },
        webhookPath: {
          type: 'string',
          description: 'For webhook: override the webhook path'
        },
        // Chat options
        message: {
          type: 'string',
          description: 'For chat: message to send (required for chat triggers)'
        },
        sessionId: {
          type: 'string',
          description: 'For chat: session ID for conversation continuity'
        },
        // Common options
        data: {
          type: 'object',
          description: 'Input data/payload for webhook, form fields, or execution data'
        },
        headers: {
          type: 'object',
          description: 'Custom HTTP headers'
        },
        timeout: {
          type: 'integer',
          description: 'Timeout in ms (default: 120000)'
        },
        waitForResponse: {
          type: 'boolean',
          description: 'Wait for workflow completion (default: true)'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'n8n_executions_get',
    description: `Get details for a specific execution by id. Use mode, nodeNames, and other filters to control response size and debugging output. Returns the execution data, possibly filtered or summarized.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Execution ID (required)'
        },
        mode: {
          type: 'string',
          enum: ['preview', 'summary', 'filtered', 'full', 'error'],
          description: 'Detail level: preview, summary (default), filtered, full, or error'
        },
        nodeNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'For mode=filtered: filter to specific nodes by name'
        },
        itemsLimit: {
          type: 'integer',
          description: 'For mode=filtered: items per node (0=structure, 2=default, -1=unlimited)'
        },
        includeInputData: {
          type: 'boolean',
          description: 'Include input data in addition to output (default: false)'
        },
        errorItemsLimit: {
          type: 'integer',
          description: 'For mode=error: sample items from upstream node (default: 2, max: 100)'
        },
        includeStackTrace: {
          type: 'boolean',
          description: 'For mode=error: include full stack trace (default: false, shows truncated)'
        },
        includeExecutionPath: {
          type: 'boolean',
          description: 'For mode=error: include execution path leading to error (default: true)'
        },
        fetchWorkflow: {
          type: 'boolean',
          description: 'For mode=error: fetch workflow for accurate upstream detection (default: true)'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_executions_list',
    description: `List executions with filters such as status, workflowId, and limit. Returns a paginated list of execution records and cursors. Use this for monitoring or troubleshooting runs.`,
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Number of executions to return (1-100, default: 100)'
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor from previous response'
        },
        workflowId: {
          type: 'string',
          description: 'Filter by workflow ID'
        },
        projectId: {
          type: 'string',
          description: 'Filter by project ID (enterprise feature)'
        },
        status: {
          type: 'string',
          enum: ['success', 'error', 'waiting'],
          description: 'Filter by execution status'
        },
        includeData: {
          type: 'boolean',
          description: 'Include execution data (default: false)'
        }
      }
    }
  },
  {
    name: 'n8n_executions_delete',
    description: `Delete an execution record by id. Returns confirmation when removed. This permanently removes execution data from n8n.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Execution ID (required)'
        }
      },
      required: ['id']
    }
  },

  // System Tools
  {
    name: 'n8n_health_check',
    description: `Check n8n API connectivity and MCP server status. Use mode=diagnostic for a detailed report and optional verbose output. Returns health status, version info, and troubleshooting hints.`,
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['status', 'diagnostic'],
          description: 'Mode: "status" (default) for quick health check, "diagnostic" for detailed debug info including env vars and tool status',
          default: 'status'
        },
        verbose: {
          type: 'boolean',
          description: 'Include extra details in diagnostic mode (default: false)'
        }
      }
    }
  },
  {
    name: 'n8n_workflow_versions_list',
    description: `List stored version history for a workflow. Provide workflowId and optional limit. Returns version metadata and count.`,
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (required)'
        },
        limit: {
          type: 'integer',
          default: 10,
          description: 'Max versions to return'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'n8n_workflow_versions_get',
    description: `Get a specific stored workflow version by versionId. Returns the full version record for inspection or rollback planning. Use this when you need the exact snapshot of a workflow.`,
    inputSchema: {
      type: 'object',
      properties: {
        versionId: {
          type: 'integer',
          description: 'Version ID (required)'
        }
      },
      required: ['versionId']
    }
  },
  {
    name: 'n8n_workflow_versions_rollback',
    description: `Rollback a workflow to a previous version. Provide workflowId and optional versionId/validateBefore. Returns success or validation errors and writes changes to n8n.`,
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (required)'
        },
        versionId: {
          type: 'integer',
          description: 'Specific version ID to rollback to (optional)'
        },
        validateBefore: {
          type: 'boolean',
          default: true,
          description: 'Validate workflow structure before rollback'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'n8n_workflow_versions_delete',
    description: `Delete workflow versions by workflowId. Provide versionId to remove one version or deleteAll to remove all versions. Returns confirmation and permanently removes version history.`,
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (required)'
        },
        versionId: {
          type: 'integer',
          description: 'Specific version ID to delete (optional)'
        },
        deleteAll: {
          type: 'boolean',
          default: false,
          description: 'Delete all versions for this workflow (delete mode only)'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'n8n_workflow_versions_prune',
    description: `Prune old versions of a workflow, keeping the most recent N. Provide workflowId and maxVersions. Returns how many versions were removed and updates version history.`,
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID (required)'
        },
        maxVersions: {
          type: 'integer',
          default: 10,
          description: 'Keep N most recent versions'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'n8n_workflow_versions_truncate',
    description: `Truncate all stored workflow versions globally. Requires confirmTruncate=true. Returns the count of deleted versions and clears version history.`,
    inputSchema: {
      type: 'object',
      properties: {
        confirmTruncate: {
          type: 'boolean',
          default: false,
          description: 'REQUIRED: Must be true to truncate all versions'
        }
      },
      required: ['confirmTruncate']
    }
  },

  // Template Deployment Tool
  {
    name: 'n8n_template_deploy',
    description: `Deploy a workflow template from the local template database into n8n. Provide templateId and optional name, autoUpgradeVersions, autoFix, and stripCredentials. Returns the new workflow id plus required credentials and status, and creates the workflow inactive.`,
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'integer',
          description: 'Template ID from n8n.io (required)'
        },
        name: {
          type: 'string',
          description: 'Custom workflow name (default: template name)'
        },
        autoUpgradeVersions: {
          type: 'boolean',
          default: true,
          description: 'Automatically upgrade node typeVersions to latest supported (default: true)'
        },
        autoFix: {
          type: 'boolean',
          default: true,
          description: 'Auto-apply fixes after deployment for expression format issues, missing = prefix, etc. (default: true)'
        },
        stripCredentials: {
          type: 'boolean',
          default: true,
          description: 'Remove credential references from nodes - user configures in n8n UI (default: true)'
        }
      },
      required: ['templateId']
    }
  }
];
