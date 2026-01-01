import { ToolAnnotations, ToolDefinition } from '../types';

export const toolAnnotations: Record<string, ToolAnnotations> = {
  // Documentation tools (read-only)
  tools_documentation: { readOnlyHint: true },
  search_nodes: { readOnlyHint: true },
  get_node: { readOnlyHint: true },
  validate_node: { readOnlyHint: true },
  get_template: { readOnlyHint: true },
  search_templates: { readOnlyHint: true },
  validate_workflow: { readOnlyHint: true },

  // n8n management tools
  n8n_create_workflow: { readOnlyHint: false },
  n8n_get_workflow: { readOnlyHint: true },
  n8n_update_full_workflow: { readOnlyHint: false },
  n8n_update_partial_workflow: { readOnlyHint: false },
  n8n_delete_workflow: { readOnlyHint: false, destructiveHint: true },
  n8n_list_workflows: { readOnlyHint: true },
  n8n_validate_workflow: { readOnlyHint: true },
  n8n_autofix_workflow: { readOnlyHint: false },
  n8n_test_workflow: { readOnlyHint: false, openWorldHint: true },
  n8n_executions: { readOnlyHint: false, destructiveHint: true },
  n8n_health_check: { readOnlyHint: true },
  n8n_workflow_versions: { readOnlyHint: false, destructiveHint: true },
  n8n_deploy_template: { readOnlyHint: false },
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
