"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.n8nDeleteWorkflowDoc = void 0;
exports.n8nDeleteWorkflowDoc = {
    name: 'n8n_workflow_delete',
    category: 'workflow_management',
    essentials: {
        description: 'Permanently delete a workflow. This action cannot be undone.',
        keyParameters: ['id'],
        example: 'n8n_workflow_delete({id: "workflow_123"})',
        performance: 'Fast (50-150ms)',
        tips: [
            'Action is irreversible',
            'Deletes all execution history',
            'Check workflow first with n8n_workflow_get({mode: "minimal"})'
        ]
    },
    full: {
        description: 'Permanently deletes a workflow from n8n including all associated data, execution history, and settings. This is an irreversible operation that should be used with caution. The workflow must exist and the user must have appropriate permissions.',
        parameters: {
            id: { type: 'string', required: true, description: 'Workflow ID to delete permanently' }
        },
        returns: 'Minimal confirmation (id, name, deleted: true) for token efficiency.',
        examples: [
            'n8n_workflow_delete({id: "abc123"}) - Delete specific workflow',
            'if (confirm) { n8n_workflow_delete({id: wf.id}); } // With confirmation'
        ],
        useCases: [
            'Remove obsolete workflows',
            'Clean up test workflows',
            'Delete failed experiments',
            'Manage workflow limits',
            'Remove duplicates'
        ],
        performance: 'Fast operation - typically 50-150ms. May take longer if workflow has extensive execution history.',
        bestPractices: [
            'Always confirm before deletion',
            'Check workflow with n8n_workflow_get({mode: "minimal"}) first',
            'Consider deactivating instead of deleting',
            'Export workflow before deletion for backup'
        ],
        pitfalls: [
            'Requires N8N_API_URL and N8N_API_KEY configured',
            'Cannot be undone - permanent deletion',
            'Deletes all execution history',
            'Active workflows can be deleted',
            'No built-in confirmation'
        ],
        relatedTools: ['n8n_workflow_get', 'n8n_workflows_list', 'n8n_workflow_update_partial', 'n8n_executions']
    }
};
//# sourceMappingURL=n8n-delete-workflow.js.map