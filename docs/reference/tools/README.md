# Tools Reference

Каноничный справочник по MCP tools n8n-mcp: один файл на инструмент.

См. также: [Functional capabilities](../capabilities.md).

## Documentation Tools

Доступны всегда (если не отключены через `DISABLED_TOOLS`).

| Tool | Summary |
|---|---|
| [n8n_node_get](./n8n_node_get.md) | Retrieve metadata for a specific node type. Use this when you already know the nodeType and need its schema, docs, or property search. Provide nodeType plus optional detail/mode; use mode=docs for Markdown or mode=search_properties with propertyQuery. Returns node schema metadata and focused docs/search results. |
| [n8n_node_validate](./n8n_node_validate.md) | Validate a node configuration against its schema. Use this when you want to check required fields or perform full validation before building a workflow. Provide nodeType and config, and choose mode (minimal/full) with optional profile. Returns a structured validation result with errors, warnings, and suggestions. |
| [n8n_nodes_search](./n8n_nodes_search.md) | Search the local n8n node catalog by keyword. Use this when you need to discover node types that fit an integration or capability. Provide query and optional mode/limit/includeExamples to adjust matching and sample configs. Returns a ranked list of node types with basic metadata. |
| [n8n_template_get](./n8n_template_get.md) | Fetch a workflow template by templateId from the local template database. Use this when you already know the template ID and need its structure. Provide templateId and optional mode to control response size (nodes_only, structure, full). Returns template data suitable for analysis or import. |
| [n8n_templates_search](./n8n_templates_search.md) | Search the local workflow templates catalog. Use this when you want to discover templates by keyword, node types, task, or metadata filters. Provide searchMode and matching parameters plus limit/offset for pagination. Returns a list of templates with summary metadata and tips. |
| [n8n_tools_documentation](./n8n_tools_documentation.md) | Fetch the built-in documentation for n8n MCP tools and guides. Use this when you need usage guidance, examples, or the tool index. Provide topic for a specific tool or "overview", and set depth to control verbosity. Returns Markdown content. |
| [n8n_workflow_json_validate](./n8n_workflow_json_validate.md) | Validate a workflow JSON object locally without calling n8n. Use this when you want to check a workflow structure before API calls or deployment. Provide a workflow object (nodes and connections) and optional options for validation depth. Returns validity, summary, errors, warnings, and suggestions. |

## n8n Management Tools

Доступны при конфигурации n8n API (`N8N_API_URL` + `N8N_API_KEY`) или в multi-tenant режиме.

| Tool | Summary |
|---|---|
| [n8n_code_node_test](./n8n_code_node_test.md) | Test a Code node or branch from an existing workflow by executing a generated sub-workflow through the utility runner. Supports modes full|node|subgraph and optional upstream/downstream inclusion. Provide workflowId and nodeId/nodeName (or startNode for subgraph). Returns minimal result by default; use responseMode=full or diagnostics to get full details. |
| [n8n_executions_delete](./n8n_executions_delete.md) | Delete an execution record by id. Use this when you need to remove stored execution data. Provide id. Returns confirmation of deletion. |
| [n8n_executions_get](./n8n_executions_get.md) | Get details for a specific execution by id. Use this when you need to inspect a run for debugging or audit. Provide id plus optional mode/nodeNames/itemsLimit to control response size and error detail. Returns the execution data, possibly filtered or summarized. |
| [n8n_executions_list](./n8n_executions_list.md) | List executions with filters such as status, workflowId, and limit. Use this to monitor recent runs or search for failures. Provide limit/cursor and optional workflowId, projectId, status, includeData. Returns a paginated list of execution records and cursors. |
| [n8n_folder_create](./n8n_folder_create.md) | Create a folder in a project (internal REST API). Use this to create root or nested folders. Provide name and optional projectId/parentFolderId. If projectId is omitted, the folder is created in the authenticated user's personal project. Returns the created folder metadata. |
| [n8n_folder_delete](./n8n_folder_delete.md) | Delete an empty folder in a project (internal REST API). Use this only for empty folders; non-empty deletes should fail. Provide folderId and optional projectId. If projectId is omitted, the authenticated user's personal project is used. Returns confirmation of deletion. |
| [n8n_folder_move](./n8n_folder_move.md) | Rename and/or move a folder within a project (internal REST API). Provide folderId plus name and/or parentFolderId. ProjectId is optional and defaults to the authenticated user's personal project. |
| [n8n_folders_list](./n8n_folders_list.md) | List folders in a project via n8n's internal REST API. Use this to browse folder structure and get folder IDs for move/delete operations. Provide projectId or omit it to use the authenticated user's personal project. Returns folder metadata and pagination cursors when available. |
| [n8n_health_check](./n8n_health_check.md) | Check n8n API connectivity and MCP server status. Use this when you need to verify credentials, versions, or network reachability. Provide mode=status or mode=diagnostic and optional verbose. Returns health status, version info, and troubleshooting hints. |
| [n8n_template_deploy](./n8n_template_deploy.md) | Deploy a workflow template from the local template database into n8n. Use this when you want to create a workflow from a known template ID. Provide templateId and optional name, autoUpgradeVersions, autoFix, and stripCredentials. Returns the new workflow id plus status and required credentials. |
| [n8n_workflow_autofix](./n8n_workflow_autofix.md) | Generate or apply automatic fixes for a workflow. Use this when validation finds common issues that can be corrected. Provide id and optional applyFixes, fixTypes, confidenceThreshold, and maxFixes; applyFixes=false previews only. Returns fix summaries and counts, and writes changes when applyFixes is true. |
| [n8n_workflow_create](./n8n_workflow_create.md) | Create a new workflow in n8n. Use this when you need to persist a workflow definition from JSON into the n8n instance. Provide name, nodes, and connections (node types must use full n8n-nodes-base.* form) plus optional settings; the workflow is created inactive. Returns the new workflow id/name and basic stats. |
| [n8n_workflow_delete](./n8n_workflow_delete.md) | Delete a workflow by id in n8n. Use this when you need to permanently remove a workflow. Provide id. Returns confirmation of deletion. |
| [n8n_workflow_execution_get](./n8n_workflow_execution_get.md) | Get execution results for a specific workflow. Provide workflowId and executionId to fetch the execution and return processed results. Useful when you only have /workflow/<id>/executions/<executionId> references. |
| [n8n_workflow_get](./n8n_workflow_get.md) | Fetch a workflow by id from n8n. Use this when you need the current workflow definition or metadata. Provide id and optionally mode to control detail (full, details, structure, minimal). Returns workflow data; details adds execution stats and webhook info. |
| [n8n_workflow_move_to_folder](./n8n_workflow_move_to_folder.md) | Move a workflow to a folder using REST transfer. Provide workflowId and parentFolderId (null to move to root). Optional projectId to move across projects. |
| [n8n_workflow_test](./n8n_workflow_test.md) | Trigger a workflow execution via webhook, form, or chat. Use this when you need to run a workflow and observe outputs or side effects. Provide workflowId and optional trigger parameters such as triggerType, message, or httpMethod. Returns execution details or response data when available. |
| [n8n_workflow_update_full](./n8n_workflow_update_full.md) | Replace a workflow's nodes, connections, and settings in n8n. Use this for full workflow overwrites. For Code/Set node file edits, prefer n8n_workflow_file_patch or resources/write. Provide id and the updated fields; nodes/connections should be complete if you modify structure. Returns basic info about the updated workflow and writes changes to n8n. |
| [n8n_workflow_update_partial](./n8n_workflow_update_partial.md) | Apply diff-based updates to an existing workflow. Use this for targeted structure changes (add/remove/update nodes or connections). For code/Set file edits, prefer n8n_workflow_file_patch or resources/write. Provide id and an operations[] list plus optional validateOnly and continueOnError. Returns applied/failed operations and writes changes when validateOnly is false. |
| [n8n_workflow_validate](./n8n_workflow_validate.md) | Validate an existing workflow in n8n by id. Use this when you need server-side validation of nodes, connections, and expressions. Provide id and optional options to control checks and profile. Returns validity, summary, errors, warnings, and suggestions for that workflow. |
| [n8n_workflow_versions_delete](./n8n_workflow_versions_delete.md) | Delete workflow versions for a workflow. Use this when you need to remove version history. Provide workflowId and optionally versionId or deleteAll to choose scope. Returns confirmation and permanently removes versions. |
| [n8n_workflow_versions_get](./n8n_workflow_versions_get.md) | Get a specific workflow version by versionId. Use this when you need the exact snapshot for analysis or rollback planning. Provide versionId. Returns the full version record. |
| [n8n_workflow_versions_list](./n8n_workflow_versions_list.md) | List stored version history for a workflow. Use this when you need to inspect version counts or pick a rollback target. Provide workflowId and optional limit. Returns version metadata and totals. |
| [n8n_workflow_versions_prune](./n8n_workflow_versions_prune.md) | Prune old workflow versions and keep the most recent N. Use this to limit version history size. Provide workflowId and maxVersions. Returns how many versions were removed. |
| [n8n_workflow_versions_rollback](./n8n_workflow_versions_rollback.md) | Rollback a workflow to a previous version. Use this when you want to revert to a known good snapshot. Provide workflowId and optional versionId/validateBefore. Returns rollback results and writes changes to n8n. |
| [n8n_workflow_versions_truncate](./n8n_workflow_versions_truncate.md) | Truncate all workflow versions globally. Use this only when you need a full reset of version history. Provide confirmTruncate=true to proceed. Returns the count of deleted versions. |
| [n8n_workflows_list](./n8n_workflows_list.md) | List workflows in n8n with optional filters. Use this when you need workflow IDs or to browse by tags/active status. Provide limit, cursor, active, tags, or projectId as needed. Returns minimal metadata and pagination cursors. |

## Workflow Files Tools

Доступны, когда итоговый workflow-files root существует и доступен процессу (используется `N8N_WORKFLOWS_ROOT`, fallback `WORKFLOWS_ROOT`, затем дефолт `/workflows`).

`N8N_WORKFLOWS_DISPLAY_ROOT` влияет только на display-поле `path` в ответах и не меняет фактический root для чтения/записи.

| Tool | Summary |
|---|---|
| [n8n_code_file_read](./n8n_code_file_read.md) | Read a Code node source file by workflowId and nodeId. Use this when you need the current file contents before making edits. Provide workflowId and nodeId; the server resolves .py or .json automatically. Returns file content plus metadata (etag, size, language, lastModified) for concurrency control. |
| [n8n_code_file_write](./n8n_code_file_write.md) | Write a Code node source file by workflowId and nodeId. Use this when you need to update or create Code node content. Provide content and expectedEtag to protect against concurrent edits; include language when creating a new file so the extension is chosen correctly. Returns updated metadata (etag, size, uri) after the write. |
| [n8n_code_files_list](./n8n_code_files_list.md) | List Code node source files for a workflow. Use this when you need the available Code node files and their metadata for a specific workflow. Provide workflowId to target the workflow folder. Returns file descriptors with nodeId, language, uri, etag, size, and lastModified. |
| [n8n_set_file_read](./n8n_set_file_read.md) | Read a Set(raw) node JSON file by workflowId and nodeId. Use this when you need the current raw JSON payload for a Set node. Provide workflowId and nodeId. Returns file content plus metadata (etag, size, lastModified) for concurrency control. |
| [n8n_set_file_write](./n8n_set_file_write.md) | Write a Set(raw) node JSON file by workflowId and nodeId. Use this when you need to update the raw JSON payload for a Set node. Provide content and expectedEtag to protect against concurrent edits. Returns updated metadata (etag, size, uri) after the write. |
| [n8n_set_files_list](./n8n_set_files_list.md) | List Set(raw) node JSON files for a workflow. Use this when you need the available Set(raw) files and their metadata for a specific workflow. Provide workflowId to target the workflow folder. Returns file descriptors with nodeId, uri, etag, size, and lastModified. |
| [n8n_workflow_file_patch](./n8n_workflow_file_patch.md) | Apply a unified diff patch to a workflow file (Code or Set). Wrapper-style patches (*** Begin/End Patch, ---/+++) are accepted and stripped. Use this when you need to edit part of a file without sending full contents. Provide uri, patch, and expectedEtag to protect against concurrent edits. Returns updated metadata (etag, size, lastModified). |

