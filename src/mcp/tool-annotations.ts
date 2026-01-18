import { ToolAnnotations, ToolDefinition } from '../types';

export const toolAnnotations: Record<string, ToolAnnotations> = {
  // Documentation tools (read-only)
  n8n_tools_documentation: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_nodes_search: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_node_get: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_node_validate: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_template_get: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_templates_search: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  n8n_workflow_json_validate: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },

  // n8n management tools (external system => openWorldHint: true)
  n8n_workflow_create: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_workflow_get: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_workflow_update_full: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_workflow_update_partial: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_workflow_delete: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_workflows_list: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_folders_list: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_folder_create: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_folder_move: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_folder_delete: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  n8n_workflow_move_to_folder: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_workflow_validate: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_workflow_autofix: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_workflow_test: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
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
  n8n_template_deploy: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  // Workflow file tools (filesystem access)
  n8n_code_files_list: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_code_file_read: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_code_file_write: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_set_files_list: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_set_file_read: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  n8n_set_file_write: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  n8n_workflow_file_patch: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
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
