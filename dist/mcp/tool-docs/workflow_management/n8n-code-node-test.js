"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.n8nCodeNodeTestDoc = void 0;
exports.n8nCodeNodeTestDoc = {
    name: 'n8n_code_node_test',
    category: 'workflow_management',
    essentials: {
        description: 'Execute a generated Code-node-focused sub-workflow using the utility runner. Supports node/subgraph modes only; native full-workflow execution moved to n8n_workflow_full_test.',
        keyParameters: ['workflowId', 'mode', 'nodeId', 'nodeName', 'includeUpstream', 'includeDownstream', 'startNode', 'endNodes', 'items'],
        example: 'n8n_code_node_test({workflowId: "123", mode: "node", nodeName: "Code"})',
        performance: 'Immediate trigger, response time depends on code execution',
        tips: [
            'Runner workflow must exist and be ACTIVE',
            'Provide nodeId for precision when multiple similar node names exist',
            'Use n8n_workflow_full_test for native full-workflow execution',
            'Use n8n_workflow_runner_test only for generated runner-based full-workflow execution',
            'In mode=node and mode=subgraph, nodeId/nodeName selects the target Code node. startNode does NOT replace it.',
            'Use items to simulate input data from previous nodes',
            'Use mode=subgraph + includeUpstream/includeDownstream to include related non-Code nodes (e.g., Set) around the Code node',
            'Default response is minimal (result only). Use responseMode=full for full payload.'
        ]
    },
    full: {
        description: `Execute a generated Code-node-focused sub-workflow through the utility runner. Depending on the mode, the tool selects nodes from the source workflow, removes trigger nodes, adds an Execute Workflow Trigger, and connects it to the subgraph roots. The utility runner webhook then executes the generated workflow JSON.

This tool is for isolated debugging of Code nodes and Code-node-centered subgraphs. Native full-workflow execution is handled by n8n_workflow_full_test, while generated runner full-workflow execution is handled by n8n_workflow_runner_test.

Important note for mode=subgraph:
- nodeId/nodeName is still used to identify the Code node this tool is testing (and to validate the node type).
- startNode only affects which part of the workflow graph is selected; it does not replace nodeId/nodeName.`,
        parameters: {
            workflowId: {
                type: 'string',
                required: true,
                description: 'Workflow ID to execute through the utility runner'
            },
            mode: {
                type: 'string',
                required: false,
                description: 'Execution mode: node | subgraph (default: node). mode=full has moved to n8n_workflow_full_test.'
            },
            nodeId: {
                type: 'string',
                required: false,
                description: 'Code node ID (preferred for precision). Required for mode=node and mode=subgraph if nodeName is not provided.'
            },
            nodeName: {
                type: 'string',
                required: false,
                description: 'Code node name (used if nodeId is not provided). Required for mode=node and mode=subgraph if nodeId is not provided.'
            },
            startNode: {
                type: 'string',
                required: false,
                description: 'Start node for subgraph selection (node name or id). Does NOT replace nodeId/nodeName; use startNode to choose where traversal begins.'
            },
            endNodes: {
                type: 'array',
                required: false,
                description: 'Optional end nodes to limit subgraph traversal (node names or ids)'
            },
            includeUpstream: {
                type: 'boolean',
                required: false,
                description: 'Include upstream ancestors in the generated subgraph (default: true for mode=subgraph)'
            },
            includeDownstream: {
                type: 'boolean',
                required: false,
                description: 'Include downstream descendants in the generated subgraph (default: true for mode=subgraph)'
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
                description: 'Diagnostics mode: none | preview | summary | full | error (default: none)'
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
        returns: `Default response (minimal):
- workflowId / nodeId / nodeName
- mode
- executionId (runner execution, when available)
- result (workflow output)

Full response (responseMode=full or diagnostics enabled):
- workflowId / nodeId / nodeName
- mode + selectedNodeNames
- subWorkflowName + triggerNodeName
- runnerWorkflowId + runnerWebhookUrl
- executionId + runnerMeta
- response (status, data)
- diagnostics (optional)
- warnings (optional)`,
        examples: [
            'n8n_code_node_test({workflowId: "123", nodeId: "abc"})',
            'n8n_code_node_test({workflowId: "123", nodeName: "Code in Python (Native)"})',
            'n8n_code_node_test({workflowId: "123", nodeName: "Code", item: {foo: "bar"}})',
            'n8n_code_node_test({workflowId: "123", nodeName: "Code", items: [{json: {a: 1}}, {json: {a: 2}}]})',
            'n8n_code_node_test({workflowId: "123", mode: "subgraph", nodeName: "Code", includeUpstream: true, responseMode: "full"})',
            'n8n_code_node_test({workflowId: "123", mode: "subgraph", nodeName: "Code", startNode: "Prepare Data", includeDownstream: true, endNodes: ["Notify"], diagnostics: "summary"})'
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
            'Use n8n_workflow_full_test for native full execution of manual/editor workflows',
            'Use n8n_workflow_runner_test only when you need the generated runner path',
            'Provide items that match the real upstream data shape',
            'Use nodeId for consistent targeting after renames'
        ],
        pitfalls: [
            'If items are omitted, the tool uses a single empty item',
            'Code node side effects still occur if the code triggers external actions',
            'Runner webhook URL depends on your n8n base URL configuration',
            'In mode=subgraph, startNode alone is not enough: you must still pass nodeId/nodeName to select the target Code node',
            'Trigger nodes are removed in generated sub-workflows, so trigger-specific context may be missing'
        ],
        relatedTools: ['n8n_workflow_full_test', 'n8n_workflow_runner_test', 'n8n_workflow_get', 'n8n_workflow_test', 'n8n_executions_get', 'n8n_executions_list']
    }
};
//# sourceMappingURL=n8n-code-node-test.js.map