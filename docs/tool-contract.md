# Tool Contract

Native n8n MCP owns core n8n operations. This server exposes only Synestra GitOps/file locator, parity and diagnostics tools for extracted workflow files. File edits are performed by normal filesystem tools outside MCP.

This server does not return Code/Set(raw) source content. `synestra_workflow_file_read` is a compatibility name for locator metadata: it returns `filesystemPath`, `containerPath`, `relativePath`, `uri`, `etag`, `kind`, `language` and locator status. `resources/read` returns the same locator metadata as JSON text with `mimeType: application/json`, not the underlying workflow file payload. `resources/list` may advertise the target file MIME type to help clients understand the external file kind, but `resources/read` is always a locator JSON payload.

`resources/list` returns a bounded page of `resources` plus `_meta.summary` and `_meta.skippedWorkflows`. Clients may pass the opaque `params.cursor` returned as `nextCursor` to fetch the next page. `_meta.summary.resourceCount`, `indexedWorkflows` and `skippedWorkflowCount` describe the full scanned catalog, while `returnedResourceCount`, `pageOffset`, `pageLimit` and `hasNextPage` describe the current page. A skipped workflow means the index entry exists but that workflow could not be resolved/listed; clients must not treat the resource list as complete when `skippedWorkflowCount > 0`.

ETags are strong SHA-256 hashes of the exact target file bytes. They are read/observe concurrency tokens for external filesystem edits, not HTTP cache validators and not permission to write. Any external edit changes the ETag. No content normalization is applied to ETags; normalization status is reported separately by locator/reconcile diagnostics where relevant.

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
- `filesystemPath` is the path for external filesystem tools. `containerPath` is the MCP service mount path and is diagnostic-only for host-side editing.
- `missing_file`, `stale_export`, `missing_workflow_json`, `ambiguous_workflow_json`, `invalid_workflow_json`, `nodes_empty`, `missing_node`, `unsupported_node_type`, and `null_set_raw_payload` are not safe file-edit targets.
- Code `.json` resources are JavaScript source files from `parameters.jsCode`, not JSON documents.
- Set(raw) resources may contain strict JSON or n8n expression content starting with `=`.
- Validation and observe tools may accept proposed content for comparison, but they must not echo that content back in `structuredContent`.
- `synestra_workflow_file_validate.valid` is a safety gate: it is true only when the payload syntax is valid and the locator is safe to edit. Use `validSyntax` for syntax-only results and `safeToEdit` for file-layer edit eligibility.
- `synestra_workflow_export_diagnostics` returns local mount/artifact state, `mcpLocatorReadiness`, `productionReadiness.decision=requires-platform-preflight`, and read-only platform handoff commands. It must not claim production readiness from local MCP state alone.
- The primary production gate is `~/repo/synestra-platform/scripts/mcp/audit_n8n_two_mcp_production_readiness.sh`, which combines native n8n MCP service-local acceptance, gateway hardening and Camel K/DB-to-files preflight checks.
- Camel K, Debezium slot/publication and n8n DB-to-files parity are platform gates. They are checked through `~/repo/synestra-platform/scripts/mcp/preflight_n8n_camelk_recovery.sh`; recovery planning uses `~/repo/synestra-platform/scripts/mcp/classify_n8n_recovery_candidates.sh`. Neither command runs from inside this MCP container.

Controlled errors use JSON-RPC error `data.code` values such as `FILE_NOT_FOUND`, `FILE_TOO_LARGE`, `DUPLICATE_CODE_DIR`, `ARCHIVED_TARGET`, `INVALID_SET_JSON`, and `INVALID_TOOL_ARGUMENTS`.
