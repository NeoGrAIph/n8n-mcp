import { ToolDocumentation } from '../types';

export const n8nCodeNodeTestDoc: ToolDocumentation = {
  name: 'n8n_code_node_test',
  category: 'workflow_management',
  essentials: {
    description: 'Execute a Code node from an existing workflow using the utility runner (webhook + Execute Sub-workflow).',
    keyParameters: ['workflowId', 'nodeId', 'nodeName', 'items'],
    example: 'n8n_code_node_test({workflowId: "123", nodeName: "My Code"})',
    performance: 'Immediate trigger, response time depends on code execution',
    tips: [
      'Runner workflow must exist and be ACTIVE',
      'Provide nodeId for precision when multiple similar node names exist',
      'Use items to simulate input data from previous nodes'
    ]
  },
  full: {
    description: `Test a Code node by running it inside a temporary sub-workflow. The tool builds a minimal workflow containing an Execute Workflow Trigger + the target Code node, then calls the utility runner webhook to execute it.

This is useful for isolated debugging of Code nodes without modifying the original workflow.`,
    parameters: {
      workflowId: {
        type: 'string',
        required: true,
        description: 'Workflow ID that contains the Code node'
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
    returns: `Execution response from the runner webhook, plus metadata:
- workflowId / nodeId / nodeName
- runnerWorkflowId
- runnerWebhookUrl
- response (status, data)`,
    examples: [
      'n8n_code_node_test({workflowId: "123", nodeId: "abc"})',
      'n8n_code_node_test({workflowId: "123", nodeName: "Code in Python (Native)"})',
      'n8n_code_node_test({workflowId: "123", nodeName: "Code", item: {foo: "bar"}})',
      'n8n_code_node_test({workflowId: "123", nodeName: "Code", items: [{json: {a: 1}}, {json: {a: 2}}]})'
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
      'Runner webhook URL depends on your n8n base URL configuration'
    ],
    relatedTools: ['n8n_workflow_get', 'n8n_workflow_test', 'n8n_executions_get', 'n8n_executions_list']
  }
};
