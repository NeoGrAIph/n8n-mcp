import { ToolDocumentation } from '../types';

export const n8nWorkflowFullTestDoc: ToolDocumentation = {
  name: 'n8n_workflow_full_test',
  category: 'workflow_management',
  essentials: {
    description: 'Execute a full workflow through n8n\'s native REST test endpoint (/rest/workflows/:id/run). This is the preferred full test mode for editor-style/manual workflows.',
    keyParameters: ['workflowId', 'triggerNode', 'startNodes', 'waitForCompletion', 'diagnostics'],
    example: 'n8n_workflow_full_test({workflowId: "123", waitForCompletion: true})',
    performance: 'Starts immediately; total latency depends on workflow runtime and waitForCompletion',
    tips: [
      'Requires REST auth (N8N_REST_EMAIL and N8N_REST_PASSWORD)',
      'If the workflow has exactly one trigger node, trigger selection is automatic',
      'If startNodes are omitted, direct downstream nodes of the selected trigger are used',
      'Use waitForCompletion=false to get execution metadata only',
      'Use diagnostics only when waiting for completion'
    ]
  },
  full: {
    description: `Execute a full workflow through n8n's native REST run endpoint. The tool fetches the original workflow JSON, selects a trigger node and start nodes, then calls POST /rest/workflows/:id/run with the native editor-style payload.

This is the preferred full test path when you want semantics close to n8n's own "Execute workflow" behavior. Unlike n8n_workflow_runner_test, it does not generate a synthetic sub-workflow or rewrite triggers.`,
    parameters: {
      workflowId: {
        type: 'string',
        required: true,
        description: 'Workflow ID to execute through the native REST run endpoint'
      },
      triggerNode: {
        type: 'object',
        required: false,
        description: 'Optional explicit trigger selector: {name, data}. Required when auto-selection is ambiguous.'
      },
      startNodes: {
        type: 'array',
        required: false,
        description: 'Optional explicit start nodes: [{name, sourceData}]. Defaults to direct downstream nodes of the selected trigger.'
      },
      waitForCompletion: {
        type: 'boolean',
        required: false,
        description: 'Wait until the execution reaches a terminal state (default: true)'
      },
      timeout: {
        type: 'number',
        required: false,
        description: 'Total wait timeout in ms when waitForCompletion=true (default: 120000)'
      },
      pollIntervalMs: {
        type: 'number',
        required: false,
        description: 'Polling interval in ms while waiting for execution completion (default: 1000)'
      },
      diagnostics: {
        type: 'string',
        required: false,
        description: 'Diagnostics mode: none | preview | summary | full | error (default: none). Only valid when waitForCompletion=true'
      },
      diagnosticsItemsLimit: {
        type: 'number',
        required: false,
        description: 'Items limit per node for diagnostics output'
      },
      responseMode: {
        type: 'string',
        required: false,
        description: 'Response shape: result | full (default: result)'
      }
    },
    returns: `When waitForCompletion=false:
- workflowId
- executionId (when returned by n8n)
- status
- triggerNodeName
- startNodeNames
- runResponse

When waitForCompletion=true:
- workflowId
- executionId
- triggerNodeName
- startNodeNames
- status
- result

With responseMode=full or diagnostics enabled, the response also includes raw runResponse, processed diagnostics, polling metadata, and raw execution details.`,
    examples: [
      'n8n_workflow_full_test({workflowId: "123"})',
      'n8n_workflow_full_test({workflowId: "123", waitForCompletion: false})',
      'n8n_workflow_full_test({workflowId: "123", triggerNode: {name: "Manual Trigger"}, startNodes: [{name: "Prepare Data"}]})',
      'n8n_workflow_full_test({workflowId: "123", diagnostics: "summary", responseMode: "full"})'
    ],
    useCases: [
      'Test manual/editor-style workflows without rewriting them into runner sub-workflows',
      'Run a workflow from a specific trigger and explicit downstream entry nodes',
      'Compare native full execution against runner-based execution'
    ],
    performance: 'Native REST start is fast; completion time depends on actual workflow runtime and polling window.',
    errorHandling: `Common errors:
- REST authentication required for native full test mode
- Cannot auto-select trigger node
- No downstream start nodes found for selected trigger
- Native workflow run did not return an execution ID
- EXECUTION_TIMEOUT when the execution does not finish before timeout`,
    bestPractices: [
      'Prefer this tool over n8n_workflow_runner_test when you want native full-test semantics',
      'Pass triggerNode explicitly when the workflow has multiple triggers',
      'Use waitForCompletion=false for long-running workflows and inspect later with execution tools',
      'Use n8n_workflow_runner_test only when you specifically want the generated runner path'
    ],
    pitfalls: [
      'Requires REST auth in addition to the standard API configuration',
      'Ambiguous trigger selection must be resolved explicitly',
      'Native runs execute real nodes and side effects',
      'Diagnostics are unavailable when waitForCompletion=false'
    ],
    relatedTools: ['n8n_workflow_test', 'n8n_workflow_runner_test', 'n8n_executions_get', 'n8n_workflow_execution_get', 'n8n_workflow_get']
  }
};
