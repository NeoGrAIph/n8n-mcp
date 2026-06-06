# Tool Contract

Native n8n MCP owns core n8n operations. This server exposes only Synestra GitOps/file tools for extracted workflow files.

Read-only tools:

- `synestra_workflow_files_status`
- `synestra_workflow_files_list`
- `synestra_workflow_file_read`
- `synestra_workflow_file_validate`
- `synestra_workflow_reconcile_status`
- `synestra_workflow_sync_observe`
- `synestra_workflow_mount_diagnostics`
- `synestra_workflow_export_diagnostics`

Write tools:

- `synestra_workflow_file_patch`
- `synestra_workflow_file_replace`

Write tools are hidden and rejected unless `SYNESTRA_MCP_WRITE_POLICY` explicitly allows them.

Resource URI forms:

```text
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.py
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.json
synestra-n8n-workflows:///set/{workflowId}/{nodeId}.set.json
```

Locator semantics:

- A `ready` locator status means the file exists in the canonical `.index` path and matches a supported node in the workflow JSON projection.
- `missing_file`, `stale_export`, `unsupported_node_type` and `ambiguous_index` are not safe file-edit targets.
- Code `.json` resources are JavaScript source files from `parameters.jsCode`, not JSON documents.
- Set(raw) resources may contain strict JSON or n8n expression content starting with `=`.

Controlled errors use JSON-RPC error `data.code` values such as `EXPECTED_ETAG_REQUIRED`, `EXPECTED_BRANCH_REQUIRED`, `ETAG_MISMATCH`, `WRITE_POLICY_DENIED`, `DIRTY_WORKTREE`, `DIRTY_TARGET`, `WRITE_SETTLE_MISMATCH`, `DUPLICATE_CODE_DIR`, `ARCHIVED_TARGET`, and `INVALID_SET_JSON`.
