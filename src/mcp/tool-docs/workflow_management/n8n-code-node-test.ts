import { ToolDocumentation } from '../types';

export const n8nCodeNodeTestDoc: ToolDocumentation = {
  name: 'n8n_code_node_test',
  category: 'workflow_management',
  essentials: {
    description: 'Execute a Code node or branch from an existing workflow using the utility runner (webhook + Execute Sub-workflow). Supports full/node/subgraph modes.',
    keyParameters: ['workflowId', 'mode', 'nodeId', 'nodeName', 'startNode', 'items'],
    example: 'n8n_code_node_test({workflowId: "123", nodeName: "My Code"})',
    performance: 'Immediate trigger, response time depends on code execution',
    tips: [
      'Runner workflow must exist and be ACTIVE',
      'Provide nodeId for precision when multiple similar node names exist',
      'Use items to simulate input data from previous nodes',
      'Use mode=subgraph with startNode/endNodes for branch testing'
    ]
  },
  full: {
    description: `Test a Code node or branch by running a generated sub-workflow. Depending on the mode, the tool selects nodes from the source workflow, removes trigger nodes, adds an Execute Workflow Trigger, and connects it to the subgraph roots. The utility runner webhook then executes the generated workflow JSON.

This is useful for isolated debugging of Code nodes or their surrounding branches without modifying the original workflow.`,
    parameters: {
      workflowId: {
        type: 'string',
        required: true,
        description: 'Workflow ID that contains the Code node'
      },
      mode: {
        type: 'string',
        required: false,
        description: 'Execution mode: full | node | subgraph (default: node)'
      },
      nodeId: {
        type: 'string',
        required: false,
        description: 'Code node ID (preferred for precision)'
      },
      nodeName: {
        type: 'string',
        required: false,
        description: 'Code node name (used if nodeId is not provided)'
      },
      startNode: {
        type: 'string',
        required: false,
        description: 'Start node for subgraph mode (node name or id)'
      },
      endNodes: {
        type: 'array',
        required: false,
        description: 'Optional end nodes to limit subgraph traversal'
      },
      includeUpstream: {
        type: 'boolean',
        required: false,
        description: 'Include upstream ancestors in the generated subgraph'
      },
      includeDownstream: {
        type: 'boolean',
        required: false,
        description: 'Include downstream descendants in the generated subgraph'
      },
      items: {
        type: 'array',
        required: false,
        description: 'Array of input items (each item can be full n8n item or plain object)'
      },
      item: {
        type: 'object',
        required: false,
        description: 'Single input object (used if items is not provided)'
      },
      timeout: {
        type: 'number',
        required: false,
        description: 'Timeout in ms for the runner webhook call'
      },
      diagnostics: {
        type: 'string',
        required: false,
        description: 'Diagnostics mode: none | preview | summary | full | error (default: summary)'
      },
      diagnosticsItemsLimit: {
        type: 'number',
        required: false,
        description: 'Items limit per node for diagnostics output'
      },
      runnerWorkflowId: {
        type: 'string',
        required: false,
        description: 'Override the utility runner workflow ID (defaults to the MCP utility runner)'
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
    returns: `Runner webhook response plus metadata:
- workflowId / nodeId / nodeName
- mode + selectedNodeNames
- subWorkflowName + triggerNodeName
- runnerWorkflowId + runnerWebhookUrl
- executionId (runner execution, when available)
- response (status, data) and result
- diagnostics (optional)
- warnings (optional)`,
    examples: [
      'n8n_code_node_test({workflowId: "123", nodeId: "abc"})',
      'n8n_code_node_test({workflowId: "123", nodeName: "Code in Python (Native)"})',
      'n8n_code_node_test({workflowId: "123", nodeName: "Code", item: {foo: "bar"}})',
      'n8n_code_node_test({workflowId: "123", nodeName: "Code", items: [{json: {a: 1}}, {json: {a: 2}}]})',
      'n8n_code_node_test({workflowId: "123", mode: "subgraph", startNode: "Prepare Data", endNodes: ["Notify"], diagnostics: "summary"})',
      'n8n_code_node_test({workflowId: "123", mode: "full", timeout: 180000})'
    ],
    useCases: [
      'Debug Code node logic in isolation',
      'Validate Python/JS code output without modifying the workflow',
      'Quickly test data transformations with sample items'
    ],
    performance: 'Runs via webhook; overall latency depends on code execution and waitForResponse.',
    errorHandling: `Common errors:
- Runner workflow not found or inactive
- Code node not found in the workflow
- Node is not a Code node (type mismatch)
- Webhook call blocked by SSRF protection (invalid URL)`,
    bestPractices: [
      'Keep the utility runner workflow active',
      'Provide items that match the real upstream data shape',
      'Use nodeId for consistent targeting after renames'
    ],
    pitfalls: [
      'If items are omitted, the tool uses a single empty item',
      'Code node side effects still occur if the code triggers external actions',
      'Runner webhook URL depends on your n8n base URL configuration',
      'Trigger nodes are removed in generated sub-workflows, so trigger-specific context may be missing'
    ],
    relatedTools: ['n8n_workflow_get', 'n8n_workflow_test', 'n8n_executions_get', 'n8n_executions_list']
  }
};
