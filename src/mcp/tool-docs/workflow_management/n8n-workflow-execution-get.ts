import { ToolDocumentation } from '../types';

export const n8nWorkflowExecutionGetDoc: ToolDocumentation = {
  name: 'n8n_workflow_execution_get',
  category: 'workflow_management',
  essentials: {
    description: 'Get execution results for a specific workflow by workflowId + executionId. Useful when you only have /workflow/<id>/executions/<executionId> references.',
    keyParameters: ['workflowId', 'executionId', 'mode'],
    example: 'n8n_workflow_execution_get({workflowId: "wf_123", executionId: "130", mode: "error"})',
    performance: 'Fast for summary/preview; full mode can be large depending on execution data.',
    tips: [
      'Use mode="summary" for a compact view (default)',
      'Use mode="error" to get stack traces and upstream context',
      'Combine nodeNames + itemsLimit to reduce payload size'
    ]
  },
  full: {
    description: `Fetch execution results for a workflow with safety checks:
- Validates that the execution belongs to the specified workflow
- Optionally processes execution data (summary/filtered/full/error modes)
- Returns processed results or raw execution if fetchWorkflow=false`,
    parameters: {
      workflowId: {
        type: 'string',
        required: true,
        description: 'Workflow ID that owns the execution'
      },
      executionId: {
        type: 'string',
        required: true,
        description: 'Execution ID to retrieve'
      },
      mode: {
        type: 'string',
        required: false,
        description: 'Detail level: preview | summary | filtered | full | error (default: summary)'
      },
      nodeNames: {
        type: 'array',
        required: false,
        description: 'Filter to specific nodes (for filtered mode)'
      },
      itemsLimit: {
        type: 'number',
        required: false,
        description: 'Items per node (for filtered/summary modes)'
      },
      includeInputData: {
        type: 'boolean',
        required: false,
        description: 'Include input data in results (default: false)'
      },
      errorItemsLimit: {
        type: 'number',
        required: false,
        description: 'For mode=error: sample items from upstream node (default: 2)'
      },
      includeStackTrace: {
        type: 'boolean',
        required: false,
        description: 'For mode=error: include full stack trace (default: false)'
      },
      includeExecutionPath: {
        type: 'boolean',
        required: false,
        description: 'For mode=error: include execution path to error (default: true)'
      },
      fetchWorkflow: {
        type: 'boolean',
        required: false,
        description: 'Fetch workflow for processing (default: true)'
      }
    },
    returns: `Execution result payload:
- workflowId + executionId
- status
- result (processed execution data or raw execution if fetchWorkflow=false)`,
    examples: [
      'n8n_workflow_execution_get({workflowId: "wf_123", executionId: "130"})',
      'n8n_workflow_execution_get({workflowId: "wf_123", executionId: "130", mode: "error"})',
      'n8n_workflow_execution_get({workflowId: "wf_123", executionId: "130", mode: "filtered", nodeNames: ["Code"], itemsLimit: 2})'
    ],
    useCases: [
      'Investigate errors for a known workflow execution',
      'Fetch a minimal summary for audit logs',
      'Retrieve filtered node outputs for debugging'
    ],
    relatedTools: ['n8n_executions_get', 'n8n_executions_list', 'n8n_workflow_test', 'n8n_workflow_get']
  }
};
