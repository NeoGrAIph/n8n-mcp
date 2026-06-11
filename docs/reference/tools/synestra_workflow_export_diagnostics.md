# synestra_workflow_export_diagnostics

Return local export diagnostics and platform readiness handoff metadata.

## Inputs

No inputs.

## Output

Returns local mount/artifact state, `mcpLocatorReadiness`, `productionReadiness.decision=requires-platform-preflight`, allowed and forbidden actions, and handoff commands for platform readiness checks.

`productionReadiness.handoff` is a machine-readable routing contract:

- `mcpMustNotWriteWorkflow=true`;
- use MCP file/resource tools only to get `filesystemPath`, `etag` and locator status;
- first run the aggregate platform readiness gate so native MCP, gateway hardening and Camel K/DB/files checks stay in scope;
- before claiming native+extensions readiness, inspect `productionReadinessEvidence.gatewayStrict` from the aggregate gate and verify the deployed Synestra MCP image/source pin, `buildAcceptance`, `exportDiagnosticsAcceptance` and `canClaimProductionReadiness`;
- require verified platform global prerequisites plus an exact-target gate for the same URI/ETag before any normal filesystem edit;
- before Camel K operator/runtime changes, Debezium exporter syncs or n8n Camel K workload syncs, run the Camel K upgrade readiness audit and follow `upgradePolicy`;
- when the locator is not ready or Camel K/DB/files preflight is no-go, run platform preflight, classifier and then a reviewed render preview;
- render preview requires `--workflow-id '<reviewed-workflow-id>'` and writes sensitive artifacts outside the workflow root.

Important handoff commands include:

- `audit_n8n_two_mcp_production_readiness.sh` for the aggregate split-MCP gate;
- `preflight_n8n_camelk_recovery.sh --summary-json` for compact Camel K/DB/files readiness evidence;
- `audit_n8n_camelk_upgrade_readiness.sh --json` for Camel K operator/runtime, Debezium exporter and n8n Camel K workload sync policy;
- `classify_n8n_recovery_candidates.sh` for report-only recovery candidate grouping;
- `render_n8n_db_files_backfill_candidates.sh --workflow-id '<reviewed-workflow-id>' --render-no-go-candidates-for-review --json` for an isolated sensitive temp-dir preview after a workflow candidate has been reviewed.

When reading platform output, treat these fields as the edit/readiness contract:

- `filesystemToolGuard.finalExternalFilesystemEditAllowed`, `filesystemToolGuard.exactTargetGatePresent`, `filesystemToolGuard.blockerMatrix`, `filesystemToolGuard.failedChecks` and `filesystemToolGuard.checks` from the platform gate as the external filesystem edit guard;
- `productionReadinessEvidence.canClaimProductionReadiness`, `canClaimExactTargetEditReadiness` and `productionReadinessEvidence.gatewayStrict` from the aggregate gate as the native+extensions readiness evidence;
- `productionReadinessEvidence.gatewayStrict.synestraBuild.platformImageTag`, `sourceRef`, `buildAcceptance.platformImageTagMatchesExpected`, `buildAcceptance.sourceRefMatchesExpected` and `exportDiagnosticsAcceptance` from the aggregate gate before trusting a deployed MCP handoff;
- `fileLayerSafety.synestraMcpBridge` from the aggregate gate as the machine-readable bridge to local `editReadiness`;
- `fileLayerSafety.effectiveDecision` and `fileLayerSafety.blockers` from the aggregate gate;
- `fileLayerSafety.materializableEffectiveDecision`, `fileLayerSafety.materializableExternalFileEditAllowed` and `fileLayerSafety.materializableBlockers` from the aggregate gate as the Code/Set(raw) target edit contract;
- `externalFileEditAllowed` and `applyForbiddenReasons` from the Camel K/DB/files preflight;
- `nextActions` and `nextActionSummary` from the Camel K/DB/files preflight for read-only remediation routing;
- `dbFilesBackfillDryRun.dirtyArtifactSafety.externalEditBlockedByDirtyArtifacts` for dirty worktree classification;
- `debeziumCdcFreshness.status` and `debeziumLogRisk.overallStatus` for active/inconclusive/historical Debezium blockers.
- `upgradePolicy.normalDriftCorrectionAllowed`, `operatorSyncEligible`, `devWorkloadSyncEligible`, `prodWorkloadSyncEligible`, `blockedByIssueCodes`, `blockerEvidenceKeys`, `nextActionIds` and `forbiddenActionsWhileNoGo` from the Camel K upgrade readiness audit for sync/upgrade routing;
- `prodSyncImpact.sourceOfTruth.decisionRequired` and `prodSyncImpact.sourceOfTruth.blockerEvidence` from the Camel K upgrade readiness audit when prod DB/files source-of-truth is unresolved.

Any of these values blocks file edit readiness and production readiness claims: `filesystemToolGuard.finalExternalFilesystemEditAllowed=false`, `filesystemToolGuard.exactTargetGatePresent=false`, non-empty `filesystemToolGuard.failedChecks`, non-empty `filesystemToolGuard.blockerMatrix`, `n8nDbContract.status!=verified`, `fileLayerSafety.materializableEffectiveDecision!=go`, `fileLayerSafety.materializableExternalFileEditAllowed!=true`, non-empty `fileLayerSafety.materializableBlockers`, `externalFileEditAllowed=false`, non-empty `applyForbiddenReasons`, `dirtyArtifactSafety.externalEditBlockedByDirtyArtifacts=true`, `upgradePolicy.normalDriftCorrectionAllowed=false`, `prodSyncImpact.sourceOfTruth.decisionRequired=true`, or `debeziumCdcFreshness.status` in `active_blocker`, `inconclusive` or `historical_blocker`. In a no-go state, follow platform `nextActions`, use the classifier and, only after review, an isolated render preview.

## Safety

This tool never claims production readiness from MCP-local state. Live native n8n MCP acceptance, gateway hardening, Camel K/Debezium health and n8n DB-to-files parity are platform responsibilities in `~/repo/synestra-platform`.

Docs-only dirty artifacts in the workflow repository are review noise, but DB workflow dirty artifacts remain hard blockers through platform `dirtyArtifactSafety`. A fresh Debezium problem log inside `N8N_CAMELK_LOG_ACTIVE_WINDOW_SEC` remains an active blocker even if the offset file and replication slot look current; the exporter must have a quiet window before the signal can age into historical triage.

The render preview handoff is not permission to write workflow files. It writes sensitive preview artifacts only outside the workflow root and is intended for human review of DB snapshot recovery candidates.

## Example

```json
{}
```
