# Synestra n8n GitOps MCP Tool Reference

This reference documents the active Synestra-only MCP tools exposed by `synestra-n8n-gitops-mcp`. Native n8n MCP owns workflow discovery/details/update, executions, credentials, projects, folders, data tables and node semantics.

All tools are read-only MCP tools. They do not write workflow files, do not call n8n write APIs, do not run Kubernetes/Argo operations, and do not return Code/Set(raw) source payloads.

## Tools

- [`synestra_workflow_files_status`](./synestra_workflow_files_status.md) — mount, index, Git and optional URI status.
- [`synestra_workflow_files_list`](./synestra_workflow_files_list.md) — Code and Set(raw) locator list for one workflow.
- [`synestra_workflow_file_read`](./synestra_workflow_file_read.md) — locator metadata for one resource URI, without file content.
- [`synestra_workflow_file_validate`](./synestra_workflow_file_validate.md) — syntax and safe-to-edit validation for an existing or proposed payload, without writing.
- [`synestra_workflow_reconcile_status`](./synestra_workflow_reconcile_status.md) — workflow-level file-layer parity.
- [`synestra_workflow_sync_observe`](./synestra_workflow_sync_observe.md) — ETag/content settle observation after an external filesystem edit.
- [`synestra_workflow_mount_diagnostics`](./synestra_workflow_mount_diagnostics.md) — local mount and `.index` diagnostics.
- [`synestra_workflow_export_diagnostics`](./synestra_workflow_export_diagnostics.md) — local export diagnostics plus platform readiness handoff metadata.

## Resource URI Forms

```text
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.py
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.json
synestra-n8n-workflows:///set/{workflowId}/{nodeId}.set.json
```

Code `.py` files are Python source. Code `.json` files are JavaScript source from `parameters.jsCode`, not JSON documents. Set `.set.json` files are Set(raw) output from `parameters.jsonOutput`, either strict JSON or an n8n expression string starting with `=`.
