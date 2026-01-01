import { ToolDocumentation } from '../types';

export const n8nExecutionsDeleteDoc: ToolDocumentation = {
  name: 'n8n_executions_delete',
  category: 'workflow_management',
  essentials: {
    description: 'Delete a single execution record by ID.',
    keyParameters: ['id'],
    example: 'n8n_executions_delete({id: "exec_456"})',
    performance: 'Fast (50-200ms)',
    tips: [
      'Use with explicit user confirmation',
      'Prefer listing executions first to confirm IDs',
      'Deletion cannot be undone'
    ]
  },
  full: {
    description: 'Delete an execution record by ID. This operation is destructive.',
    parameters: {
      id: { type: 'string', required: true, description: 'Execution ID to delete' }
    },
    returns: 'Success confirmation with message.',
    examples: [
      'n8n_executions_delete({id: "exec_456"})'
    ],
    useCases: [
      'Remove obsolete or test executions',
      'Clean up execution history'
    ],
    performance: 'Fast (50-200ms)',
    bestPractices: [
      'Confirm the execution ID before deleting',
      'Avoid deleting recent production incidents without audit'
    ],
    pitfalls: [
      'Deleted executions cannot be recovered'
    ],
    relatedTools: ['n8n_executions_list', 'n8n_executions_get']
  }
};
