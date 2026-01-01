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
    name: 'n8n_create_workflow',
    description: `Use this when creating a new workflow in n8n (writes data). Do not use it when you only need to view a template.`,
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
    name: 'n8n_get_workflow',
    description: `Use this when fetching an existing workflow by ID (read-only). Do not use it for listing or search.`,
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
    name: 'n8n_update_full_workflow',
    description: `Use this when replacing a workflow’s nodes/connections in one full update (writes data). Do not use it for small changes.`,
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
    name: 'n8n_update_partial_workflow',
    description: `Use this when applying small, targeted changes via diff operations (writes data). Do not use it for full replacements.`,
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
    name: 'n8n_delete_workflow',
    description: `Use this when permanently deleting a workflow (destructive). Do not use it without explicit user confirmation.`,
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
    name: 'n8n_list_workflows',
    description: `Use this when listing workflows with minimal metadata and filters. Do not use it for full workflow details.`,
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
    name: 'n8n_validate_workflow',
    description: `Use this when validating an existing workflow by ID in n8n. Do not use it if you only have workflow JSON.`,
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
    name: 'n8n_autofix_workflow',
    description: `Use this to preview or apply automated fixes to a workflow by ID (writes if applyFixes=true). Do not apply fixes without user confirmation.`,
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
    name: 'n8n_test_workflow',
    description: `Use this when you need to trigger/test a workflow execution (writes / side-effects). Do not use it for validation only.`,
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
    description: `Use this when you need execution details by ID. Do not use it to list or delete executions.`,
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
    description: `Use this when you need to list executions with filters. Do not use it to fetch details or delete executions.`,
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
    description: `Use this when you need to delete an execution record. Do not use it without explicit user confirmation.`,
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
    description: `Use this when you need to verify n8n API health/connectivity. Do not use it for workflow data.`,
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
    description: `Use this when you need version history for a workflow. Do not use it to modify or delete versions.`,
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
    description: `Use this when you need a specific workflow version by ID. Do not use it to modify versions.`,
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
    description: `Use this when you need to roll back a workflow to a previous version. Do not use it without explicit user confirmation.`,
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
    description: `Use this when you need to delete workflow versions. Do not use it without explicit user confirmation.`,
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
    description: `Use this when you need to prune old workflow versions. Do not use it without explicit user confirmation.`,
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
    description: `Use this when you need to delete all workflow versions (global). Do not use it without explicit user confirmation.`,
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
    name: 'n8n_deploy_template',
    description: `Use this when deploying a template into n8n (creates a workflow). Do not use it to just view template details.`,
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
