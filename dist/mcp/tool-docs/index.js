"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsDocumentation = void 0;
const discovery_1 = require("./discovery");
const configuration_1 = require("./configuration");
const validation_1 = require("./validation");
const templates_1 = require("./templates");
const system_1 = require("./system");
const guides_1 = require("./guides");
const workflow_management_1 = require("./workflow_management");
const workflow_files_1 = require("./workflow_files");
exports.toolsDocumentation = {
    n8n_tools_documentation: system_1.toolsDocumentationDoc,
    n8n_health_check: system_1.n8nHealthCheckDoc,
    ai_agents_guide: guides_1.aiAgentsGuide,
    workflow_files_resources_guide: guides_1.workflowFilesResourcesGuide,
    n8n_nodes_search: discovery_1.searchNodesDoc,
    n8n_node_get: configuration_1.getNodeDoc,
    n8n_node_validate: validation_1.validateNodeDoc,
    n8n_workflow_json_validate: validation_1.validateWorkflowDoc,
    n8n_template_get: templates_1.getTemplateDoc,
    n8n_templates_search: templates_1.searchTemplatesDoc,
    n8n_workflow_create: workflow_management_1.n8nCreateWorkflowDoc,
    n8n_workflow_get: workflow_management_1.n8nGetWorkflowDoc,
    n8n_workflow_update_full: workflow_management_1.n8nUpdateFullWorkflowDoc,
    n8n_workflow_update_partial: workflow_management_1.n8nUpdatePartialWorkflowDoc,
    n8n_workflow_delete: workflow_management_1.n8nDeleteWorkflowDoc,
    n8n_workflows_list: workflow_management_1.n8nListWorkflowsDoc,
    n8n_workflow_validate: workflow_management_1.n8nValidateWorkflowDoc,
    n8n_workflow_autofix: workflow_management_1.n8nAutofixWorkflowDoc,
    n8n_workflow_test: workflow_management_1.n8nTestWorkflowDoc,
    n8n_executions_get: workflow_management_1.n8nExecutionsGetDoc,
    n8n_executions_list: workflow_management_1.n8nExecutionsListDoc,
    n8n_executions_delete: workflow_management_1.n8nExecutionsDeleteDoc,
    n8n_workflow_versions_list: workflow_management_1.n8nWorkflowVersionsListDoc,
    n8n_workflow_versions_get: workflow_management_1.n8nWorkflowVersionsGetDoc,
    n8n_workflow_versions_rollback: workflow_management_1.n8nWorkflowVersionsRollbackDoc,
    n8n_workflow_versions_delete: workflow_management_1.n8nWorkflowVersionsDeleteDoc,
    n8n_workflow_versions_prune: workflow_management_1.n8nWorkflowVersionsPruneDoc,
    n8n_workflow_versions_truncate: workflow_management_1.n8nWorkflowVersionsTruncateDoc,
    n8n_template_deploy: workflow_management_1.n8nDeployTemplateDoc,
    n8n_code_files_list: workflow_files_1.n8nCodeFilesListDoc,
    n8n_code_file_read: workflow_files_1.n8nCodeFileReadDoc,
    n8n_code_file_write: workflow_files_1.n8nCodeFileWriteDoc,
    n8n_set_files_list: workflow_files_1.n8nSetFilesListDoc,
    n8n_set_file_read: workflow_files_1.n8nSetFileReadDoc,
    n8n_set_file_write: workflow_files_1.n8nSetFileWriteDoc,
    n8n_workflow_file_patch: workflow_files_1.n8nWorkflowFilePatchDoc
};
//# sourceMappingURL=index.js.map