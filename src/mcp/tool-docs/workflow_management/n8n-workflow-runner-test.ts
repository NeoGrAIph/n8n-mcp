import { ToolDocumentation } from '../types';

export const n8nWorkflowRunnerTestDoc: ToolDocumentation = {
  name: 'n8n_workflow_runner_test',
  category: 'workflow_management',
  essentials: {
    description: 'Execute a full workflow through the utility runner. This is the generated runner path for synthetic items, dry runs, and rewritten full-workflow execution.',
    keyParameters: ['workflowId', 'item', 'items', 'dryRun', 'diagnostics'],
    example: 'n8n_workflow_runner_test({workflowId: "123", dryRun: true})',
    performance: 'Immediate runner trigger; response time depends on workflow complexity and waitForResponse',
    tips: [
      'Runner workflow must exist and be ACTIVE',
      'Prefer n8n_workflow_full_test for native full execution semantics',
      'dryRun=true builds the generated workflow but does not execute it',
      'Use diagnostics only for real executions, not with dryRun',
      'Real node side effects still occur during runner execution'
    ]
  },
  full: {
    description: `Execute a full workflow through the MCP utility runner. The tool reads the source workflow, removes its trigger nodes, creates a generated sub-workflow in mode=full, injects an Execute Workflow Trigger, and sends the generated workflow JSON to the utility runner webhook.

This is the dedicated generated runner path. Prefer n8n_workflow_full_test when you want native /rest/workflows/:id/run semantics close to n8n's own editor execution flow.`,
    parameters: {
      workflowId: {
        type: 'string',
        required: true,
        description: 'Workflow ID to execute through the utility runner'
      },
      items: {
        type: 'array',
        required: false,
        description: 'Optional array of input items. Each item can be a full n8n item ({json, binary}) or a plain object'
      },
      item: {
        type: 'object',
        required: false,
        description: 'Optional single input object (used if items is not provided)'
      },
      dryRun: {
        type: 'boolean',
        required: false,
        description: 'If true, build the generated workflow and return metadata without executing the runner'
      },
      timeout: {
        type: 'number',
        required: false,
        description: 'Timeout in ms for the runner webhook call'
      },
      diagnostics: {
        type: 'string',
        required: false,
        description: 'Diagnostics mode: none | preview | summary | full | error (default: none). Cannot be used with dryRun=true'
      },
      diagnosticsItemsLimit: {
        type: 'number',
        required: false,
        description: 'Items limit per node for diagnostics output'
      },
      responseMode: {
        type: 'string',
        required: false,
        description: 'Response mode: result | full (default: result)'
      },
      runnerWorkflowId: {
        type: 'string',
        required: false,
        description: 'Override the utility runner workflow ID'
      },
      runnerWebhookPath: {
        type: 'string',
        required: false,
        description: 'Override the runner webhook path (default: mcp-code-node-runner)'
      },
      waitForResponse: {
        type: 'boolean',
        required: false,
        description: 'Wait for workflow completion (default: true)'
      }
    },
    returns: `Default response (minimal):
- workflowId
- mode=full
- executionId (runner execution, when available)
- result

Dry-run response:
- workflowId
- mode=full
- dryRun=true
- inputItemCount
- selectedNodeNames
- subWorkflowName
- triggerNodeName
- warnings (optional)

Full response (responseMode=full or diagnostics enabled) additionally includes:
- selectedNodeNames
- subWorkflowName
- triggerNodeName
- runnerWorkflowId
- runnerWebhookUrl
- runnerMeta
- response
- diagnostics
- warnings`,
    examples: [
      'n8n_workflow_runner_test({workflowId: "123", dryRun: true})',
      'n8n_workflow_runner_test({workflowId: "123", item: {foo: "bar"}})',
      'n8n_workflow_runner_test({workflowId: "123", items: [{json: {a: 1}}, {json: {a: 2}}], waitForResponse: true})',
      'n8n_workflow_runner_test({workflowId: "123", responseMode: "full"})',
      'n8n_workflow_runner_test({workflowId: "123", diagnostics: "summary", diagnosticsItemsLimit: 2})'
    ],
    useCases: [
      'Generate a reproducible runner-based full-workflow test run without editing triggers',
      'Inspect generated runner metadata with dryRun before execution',
      'Run synthetic input items through a generated full-workflow harness',
      'Compare runner execution against native full execution'
    ],
    performance: 'Runs via runner webhook; overall latency depends on workflow complexity and downstream side effects.',
    errorHandling: `Common errors:
- Runner workflow not found or inactive
- Cannot determine n8n base URL
- diagnostics cannot be used when dryRun=true
- Webhook call blocked by SSRF protection or invalid base URL
- Errors inside the executed workflow are returned with runner execution context`,
    bestPractices: [
      'Use n8n_workflow_test for webhook/form/chat workflows',
      'Use n8n_workflow_full_test for native full execution of manual/editor workflows',
      'Start with dryRun=true when the workflow may have external side effects',
      'Pass sample items that match real upstream data shape',
      'Use n8n_workflow_execution_get or n8n_executions_get to compare baseline and runner runs'
    ],
    pitfalls: [
      'This tool executes real nodes unless dryRun=true',
      'If items are omitted, the tool uses a single empty item',
      'Runner webhook URL depends on your n8n base URL configuration',
      'Diagnostics require an executionId from the runner response',
      'dryRun validates generation only; it does not prove runtime success'
    ],
    relatedTools: ['n8n_workflow_test', 'n8n_workflow_full_test', 'n8n_code_node_test', 'n8n_workflow_execution_get', 'n8n_executions_get']
  }
};
