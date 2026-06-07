# Tool Contract

Native n8n MCP owns core n8n operations. This server exposes only Synestra GitOps/file locator, parity and diagnostics tools for extracted workflow files. File edits are performed by normal filesystem tools outside MCP.

Read-only tools:

- `synestra_workflow_files_status`
- `synestra_workflow_files_list`
- `synestra_workflow_file_read`
- `synestra_workflow_file_validate`
- `synestra_workflow_reconcile_status`
- `synestra_workflow_sync_observe`
- `synestra_workflow_mount_diagnostics`
- `synestra_workflow_export_diagnostics`

Resource URI forms:

```text
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.py
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.json
synestra-n8n-workflows:///set/{workflowId}/{nodeId}.set.json
```

Locator semantics:

- A `ready` locator status means the file exists in the canonical `.index` path and matches a supported node in the workflow JSON projection.
- `missing_file`, `stale_export`, `missing_workflow_json`, `invalid_workflow_json`, `missing_node`, `unsupported_node_type`, `null_set_raw_payload` and `ambiguous_index` are not safe file-edit targets.
- Code `.json` resources are JavaScript source files from `parameters.jsCode`, not JSON documents.
- Set(raw) resources may contain strict JSON or n8n expression content starting with `=`.

Controlled errors use JSON-RPC error `data.code` values such as `FILE_NOT_FOUND`, `FILE_TOO_LARGE`, `DUPLICATE_CODE_DIR`, `ARCHIVED_TARGET`, `INVALID_SET_JSON`, and `INVALID_TOOL_ARGUMENTS`.
