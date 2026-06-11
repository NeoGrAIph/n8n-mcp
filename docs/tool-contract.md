# Tool Contract

Native n8n MCP owns core n8n operations. This server exposes only Synestra GitOps/file locator, parity and diagnostics tools for extracted workflow files. File edits are performed by normal filesystem tools outside MCP.

This server does not return Code/Set(raw) source content. `synestra_workflow_file_read` is a compatibility name for locator metadata: it returns `filesystemPath`, `containerPath`, `relativePath`, `uri`, `etag`, `kind`, `language`, locator status and `editReadiness`. `resources/read` returns the same locator metadata as JSON text with `mimeType: application/json`, not the underlying workflow file payload. `resources/list` may advertise the target file MIME type to help clients understand the external file kind, but `resources/read` is always a locator JSON payload. Resource entries and read responses include `_meta.locatorOnly=true`, `_meta.resourcePayloadKind=locator-json`, `_meta.externalMimeType`, `_meta.resourceReadMimeType=application/json` and `_meta.externalFilesystemPathAvailableWhen=locator.status=ready` so clients can distinguish locator JSON from the external file payload.

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

- A `ready` locator status means the file exists in the canonical `.index` path and matches a supported node in the workflow JSON projection. It permits path inspection, not a global write decision.
- `editReadiness.effectiveDecision=requires-platform-preflight` means the local locator is ready but external edits still require platform `fileLayerSafety.materializableEffectiveDecision=go`, `materializableExternalFileEditAllowed=true`, empty `materializableBlockers`, clean dirty-artifact safety for materializable targets and non-blocking Debezium freshness/log status.
- `editReadiness.platformBridge.aggregateField=fileLayerSafety.synestraMcpBridge` is the stable machine-readable bridge to the platform aggregate gate. MCP-side `externalFilesystemEditAllowed` is always `false`; ready locators set `readOnlyInspectionAllowed=true` and `filesystemToolPolicy=inspect-only-until-platform-go`. Aggregate readiness can prove global prerequisites only; final external edits require verified `n8nDbContract`, `fileLayerSafety.materializableEffectiveDecision=go`, `fileLayerSafety.materializableExternalFileEditAllowed=true`, `fileLayerSafety.materializableBlockers=[]`, and an exact-target gate for the same URI/ETag before `filesystemToolGuard.finalExternalFilesystemEditAllowed=true`.
- `editReadiness.effectiveDecision=no-go` means the local locator itself is unsafe; do not edit even if a platform report is green.
- `filesystemPath` is the path for external filesystem tools. `containerPath` is the MCP service mount path and is diagnostic-only for host-side editing. In `synestra_workflow_files_status.target`, `path` is kept only as a legacy alias of `filesystemPath`; clients must not infer host edit paths from container paths.
- `missing_file`, `stale_export`, `missing_workflow_json`, `ambiguous_workflow_json`, `invalid_workflow_json`, `nodes_empty`, `duplicate_code_dir`, `missing_node`, `unsupported_node_type`, and `null_set_raw_payload` are not safe file-edit targets.
- Code `.json` resources are JavaScript source files from `parameters.jsCode`, not JSON documents.
- Set(raw) resources may contain strict JSON or n8n expression content starting with `=`.
- Validation and observe tools may accept proposed content for comparison, but they must not echo that content back in `structuredContent`. Prefer `contentSha256` and `expectedContentSha256` for post-edit byte confirmation when callers can compute the hash outside MCP; these hash fields reduce source ingress and do not grant write permission.
- `synestra_workflow_file_validate.valid` and `safeToEdit` are local locator gates only. The response includes `safeToEditScope=local-locator-only`; use `validSyntax` for syntax-only results, `safeToEdit` for local path eligibility, and platform readiness fields for final external-edit permission.
- `synestra_workflow_export_diagnostics` returns local mount/artifact state, `mcpLocatorReadiness`, `productionReadiness.decision=requires-platform-preflight`, and read-only platform handoff commands. It must not claim production readiness from local MCP state alone.
- The primary production gate is `~/repo/synestra-platform/scripts/mcp/audit_n8n_two_mcp_production_readiness.sh`, which combines native n8n MCP service-local acceptance, gateway hardening and Camel K/DB-to-files preflight checks.
- Camel K, Debezium slot/publication and n8n DB-to-files parity are platform gates. They are checked through `~/repo/synestra-platform/scripts/mcp/preflight_n8n_camelk_recovery.sh`; Camel K operator/runtime, Debezium exporter and n8n Camel K workload sync planning uses `~/repo/synestra-platform/scripts/mcp/audit_n8n_camelk_upgrade_readiness.sh --json`; recovery planning uses `~/repo/synestra-platform/scripts/mcp/classify_n8n_recovery_candidates.sh`. None of these commands run from inside this MCP container.
- Platform `filesystemToolGuard`, `fileLayerSafety.synestraMcpBridge`, `fileLayerSafety.effectiveDecision`, `fileLayerSafety.n8nDbContract`, `fileLayerSafety.blockerEvidence`, `externalFileEditAllowed`, `applyForbiddenReasons`, `nextActions`, `upgradePolicy`, `prodSyncImpact.sourceOfTruth`, `dbFilesBackfillDryRun.dirtyArtifactSafety`, `debeziumCdcFreshness.status` and `debeziumLogRisk.overallStatus` are authoritative for global file-layer readiness. A ready MCP locator is not enough when `filesystemToolGuard.finalExternalFilesystemEditAllowed=false`, `filesystemToolGuard.exactTargetGatePresent=false`, `n8nDbContract.status!=verified`, `upgradePolicy.normalDriftCorrectionAllowed=false`, `prodSyncImpact.sourceOfTruth.decisionRequired=true`, or when these fields show dirty workflow blockers or active/inconclusive/historical Debezium blockers. Fresh Debezium problem logs inside `N8N_CAMELK_LOG_ACTIVE_WINDOW_SEC` are active blockers until the exporter has a quiet window.

Controlled errors use JSON-RPC error `data.code` values such as `FILE_NOT_FOUND`, `FILE_TOO_LARGE`, `DUPLICATE_CODE_DIR`, `ARCHIVED_TARGET`, `INVALID_SET_JSON`, and `INVALID_TOOL_ARGUMENTS`.
