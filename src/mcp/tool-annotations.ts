import { ToolAnnotations, ToolDefinition } from '../types';

export const toolAnnotations: Record<string, ToolAnnotations> = {
  // Documentation tools (read-only)
  n8n_tools_documentation: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_search_nodes: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_get_node: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_validate_node: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_get_template: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_search_templates: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_validate_workflow_json: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },

  // n8n management tools (external system => openWorldHint: true)
  n8n_create_workflow: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_get_workflow: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_update_full_workflow: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_update_partial_workflow: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_delete_workflow: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_list_workflows: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_validate_workflow: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_autofix_workflow: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_test_workflow: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_executions_get: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_executions_list: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_executions_delete: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_health_check: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_workflow_versions_list: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_workflow_versions_get: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_workflow_versions_rollback: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_workflow_versions_delete: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_workflow_versions_prune: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_workflow_versions_truncate: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_deploy_template: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
};

export function withToolAnnotations(tools: ToolDefinition[]): ToolDefinition[] {
  return tools.map((tool) => {
    const annotations = toolAnnotations[tool.name];
    if (!annotations) {
      return tool;
    }
    return { ...tool, annotations };
  });
}
