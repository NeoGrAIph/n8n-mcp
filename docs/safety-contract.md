# Safety Contract

The MCP server is read-only: `SYNESTRA_MCP_WRITE_POLICY=off`.

Production writes are not supported in v1. Dev Code/Set(raw) edits are performed by normal filesystem tools when the MCP locator/parity status for that workflow/node is `ready`; the dev platform contract configures valid saves to sync automatically to n8n. After the edit, re-check with read-only validation, observe or reconcile tools.

`synestra_workflow_file_validate.valid=true` means the file is both syntactically acceptable and locally safe from the file-layer locator perspective. `safeToEditScope=local-locator-only` is intentional: if `safeToEdit=false`, external file tools must not edit that target even when `validSyntax=true`. Local readiness does not prove live sync-controller health.

MCP locator calls must not return Code/Set(raw) source content. They return paths, ETags and `editReadiness` so the caller can use normal filesystem tools for inspection and eligible dev edits.

Ready dev locators report `externalFilesystemEditAllowed=true`, `autoSyncOnSave=true`, `autoSyncRuntimeHealthVerified=false` and `platformPreflightRequired=false`. Ready non-dev locators remain inspect-only, and unsafe locators remain `no-go`. No additional platform approval fields are part of this contract.

ETags are strong SHA-256 hashes of exact file bytes. Treat them only as stale-read detection for external filesystem tools and `synestra_workflow_sync_observe`; an ETag match does not bypass locator safety or prove n8n DB/files production readiness.

Hash-only validation and observe fields reduce source ingress but do not grant write permission. `contentSha256` verifies current disk bytes when `content` is omitted; it cannot syntax-check an off-disk proposed payload. `expectedContentSha256` verifies the expected final file bytes after an external edit, while `expectedEtag` remains a stale-read token and is often the pre-edit hash.

MCP health, `tools/list`, local mount diagnostics and export diagnostics are not production-readiness proof. Production readiness requires separate platform read-only gates for native n8n MCP acceptance, gateway hardening and Camel K/DB-to-files parity. Before claiming the deployed native+extensions contour is ready, inspect `productionReadinessEvidence.gatewayStrict` from the platform aggregate gate and verify the Synestra MCP image/source pin, `buildAcceptance`, `exportDiagnosticsAcceptance` and `productionReadinessEvidence.canClaimProductionReadiness`.

Camel K operator/runtime changes, Debezium exporter syncs and n8n Camel K workload syncs require the platform `audit_n8n_camelk_upgrade_readiness.sh --json` evidence gate. Treat `upgradePolicy.normalDriftCorrectionAllowed=false`, non-empty `upgradePolicy.blockedByIssueCodes`, `upgradePolicy.prodWorkloadSyncEligible=false`, `prodSyncImpact.sourceOfTruth.decisionRequired=true` and `upgradePolicy.forbiddenActionsWhileNoGo` as binding blockers. This audit is still read-only evidence; it does not grant MCP permission to write workflow files, sync prod workloads or change n8n DB state.

Unauthenticated `/health` returns only `{ "status": "ok" }`. Detailed diagnostics are MCP tools behind Bearer auth.

Tokens must be read from secret-backed files. Do not store native n8n MCP tokens or Synestra MCP tokens in gateway adapter records, command arguments, logs, or plaintext control-plane environment records.
