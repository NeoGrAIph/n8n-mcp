import { ToolDocumentation } from './types';

// Import all tool documentations
import { searchNodesDoc } from './discovery';
import { getNodeDoc } from './configuration';
import { validateNodeDoc, validateWorkflowDoc } from './validation';
import { getTemplateDoc, searchTemplatesDoc } from './templates';
import {
  toolsDocumentationDoc,
  n8nHealthCheckDoc
} from './system';
import { aiAgentsGuide } from './guides';
import {
  n8nCreateWorkflowDoc,
  n8nGetWorkflowDoc,
  n8nUpdateFullWorkflowDoc,
  n8nUpdatePartialWorkflowDoc,
  n8nDeleteWorkflowDoc,
  n8nListWorkflowsDoc,
  n8nValidateWorkflowDoc,
  n8nAutofixWorkflowDoc,
  n8nTestWorkflowDoc,
  n8nExecutionsGetDoc,
  n8nExecutionsListDoc,
  n8nExecutionsDeleteDoc,
  n8nWorkflowVersionsListDoc,
  n8nWorkflowVersionsGetDoc,
  n8nWorkflowVersionsRollbackDoc,
  n8nWorkflowVersionsDeleteDoc,
  n8nWorkflowVersionsPruneDoc,
  n8nWorkflowVersionsTruncateDoc,
  n8nDeployTemplateDoc
} from './workflow_management';

// Combine all tool documentations into a single object
export const toolsDocumentation: Record<string, ToolDocumentation> = {
  // System tools
  n8n_tools_documentation: toolsDocumentationDoc,
  n8n_health_check: n8nHealthCheckDoc,

  // Guides
  ai_agents_guide: aiAgentsGuide,

  // Discovery tools
  n8n_nodes_search: searchNodesDoc,

  // Configuration tools
  n8n_node_get: getNodeDoc,

  // Validation tools
  n8n_node_validate: validateNodeDoc,
  n8n_workflow_json_validate: validateWorkflowDoc,

  // Template tools
  n8n_template_get: getTemplateDoc,
  n8n_templates_search: searchTemplatesDoc,

  // Workflow Management tools (n8n API)
  n8n_workflow_create: n8nCreateWorkflowDoc,
  n8n_workflow_get: n8nGetWorkflowDoc,
  n8n_workflow_update_full: n8nUpdateFullWorkflowDoc,
  n8n_workflow_update_partial: n8nUpdatePartialWorkflowDoc,
  n8n_workflow_delete: n8nDeleteWorkflowDoc,
  n8n_workflows_list: n8nListWorkflowsDoc,
  n8n_workflow_validate: n8nValidateWorkflowDoc,
  n8n_workflow_autofix: n8nAutofixWorkflowDoc,
  n8n_workflow_test: n8nTestWorkflowDoc,
  n8n_executions_get: n8nExecutionsGetDoc,
  n8n_executions_list: n8nExecutionsListDoc,
  n8n_executions_delete: n8nExecutionsDeleteDoc,
  n8n_workflow_versions_list: n8nWorkflowVersionsListDoc,
  n8n_workflow_versions_get: n8nWorkflowVersionsGetDoc,
  n8n_workflow_versions_rollback: n8nWorkflowVersionsRollbackDoc,
  n8n_workflow_versions_delete: n8nWorkflowVersionsDeleteDoc,
  n8n_workflow_versions_prune: n8nWorkflowVersionsPruneDoc,
  n8n_workflow_versions_truncate: n8nWorkflowVersionsTruncateDoc,
  n8n_template_deploy: n8nDeployTemplateDoc
};

// Re-export types
export type { ToolDocumentation } from './types';
