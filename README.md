# Synestra n8n MCP Extensions

This repository is the Synestra-owned n8n MCP extensions repository. It is not the legacy n8n-mcp product and does not replace native n8n MCP.

## Status

The legacy n8n-mcp implementation was preserved before removal at commit `904200f`. To inspect or restore the old implementation, use `git show 904200f` or check out that commit in a separate worktree.

The active codebase is the lightweight `synestra-n8n-gitops-mcp` server. It is internal Synestra infrastructure and is deployed through `~/repo/synestra-platform`.

## Purpose

Native n8n MCP is the source of truth for core n8n operations: workflow discovery/details/update, executions/tests, credentials, projects/folders, workflow builder, node/runtime semantics and data tables.

Synestra n8n MCP extensions own only the GitOps/file-level gaps that native n8n MCP does not cover: locating extracted Code files, locating Set(raw) files, reporting file-layer parity, Git/worktree checks, mount diagnostics and export/sync diagnostics. In dev, ready Code/Set(raw) files are edited with normal filesystem tools and the platform sync controller is configured to apply valid changes to n8n automatically on save; this server does not publish MCP write tools.

The MCP does not return, persist or echo Code/Set(raw) source content. Use `synestra_workflow_file_read` or `resources/read` only to get locator metadata such as `filesystemPath`, `uri`, `etag`, `kind`, `language`, locator status and `editReadiness`, then use normal filesystem tools to inspect the file or edit an eligible dev target. `synestra_workflow_file_validate.content` and `synestra_workflow_sync_observe.expectedContent` may accept proposed content only for local comparison; the server still does not expose file content back to clients.

For post-edit checks, prefer `contentSha256` and `expectedContentSha256` when the caller can compute hashes outside MCP. These fields verify exact bytes without sending source content to the MCP server; they do not replace syntax validation for an off-disk proposed payload and do not grant write permission.

`synestra_workflow_export_diagnostics` reports local MCP locator readiness and explicit handoff commands for the platform aggregate readiness gate, Camel K/DB-to-files preflight, Camel K upgrade readiness audit, recovery candidate classifier and isolated DB snapshot render preview. It does not run Kubernetes checks from the MCP container and it never proves production readiness by itself.

The diagnostics output includes `productionReadiness.handoff`, a machine-readable routing contract for agents: use MCP/resource tools to obtain file paths and local eligibility; inspect `productionReadinessEvidence.gatewayStrict` from the platform aggregate gate before claiming native+extensions readiness; use the same platform diagnostics to verify live sync-controller, Camel K, DB and CDC health; run `scripts/n8n/audit_n8n_camelk_upgrade_readiness.sh --json` and follow `upgradePolicy` before Camel K operator/runtime changes, Debezium exporter syncs or n8n Camel K workload syncs; otherwise follow platform `nextActions`, preflight/classifier/render-preview commands and keep recovery artifacts outside the workflow root.

The architecture boundary is deliberately narrow: native n8n MCP handles n8n semantics, this server handles Synestra file locators, and filesystem tools perform approved dev edits outside MCP.

## Tool Contract

Read-only tools are always available when authenticated:

- `synestra_workflow_files_status`
- `synestra_workflow_files_list`
- `synestra_workflow_file_read`
- `synestra_workflow_file_validate`
- `synestra_workflow_reconcile_status`
- `synestra_workflow_sync_observe`
- `synestra_workflow_mount_diagnostics`
- `synestra_workflow_export_diagnostics`

## Resource URIs

The server uses Synestra workflow file URIs:

```text
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.py
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.json
synestra-n8n-workflows:///set/{workflowId}/{nodeId}.set.json
```

Targets are resolved through `workflows/.index/<workflowId>.path`. In dev, a `ready` locator reports `externalFilesystemEditAllowed=true`, `autoSyncOnSave=true` and `platformPreflightRequired=false`. This is local eligibility under the configured dev contract, not evidence that the live sync controller is healthy; use platform diagnostics for runtime verification. In prod, ready locators remain inspect-only.

`filesystemPath` is the path intended for external filesystem tools. `containerPath` is the service's in-pod mount path and is included only for diagnostics.

Ready dev locators report `effectiveDecision=auto-sync-on-save` and `filesystemToolPolicy=edit-with-auto-sync-on-save`. Unsafe locators remain `no-go`, while ready non-dev locators report `effectiveDecision=inspect-only`. No additional platform approval fields are part of the locator contract.

Important file semantics:

- Code `.py` files contain Python source from `parameters.pythonCode`.
- Code `.json` files contain JavaScript source from `parameters.jsCode`; they are not JSON documents.
- Set `.set.json` files contain `parameters.jsonOutput` and may be strict JSON or an n8n expression string starting with `=`.

## Safety Contract

Production writes are not supported in v1, and the main MCP contract is read-only. Use normal filesystem tools for ready dev Code/Set(raw) edits; the dev controller is configured to sync valid saves automatically. Re-check with `synestra_workflow_file_validate`, `synestra_workflow_sync_observe` or `synestra_workflow_reconcile_status`, and use platform diagnostics when live controller health matters.

Camel K and Debezium changes are gated by platform upgrade evidence, not by this MCP. When `upgradePolicy.normalDriftCorrectionAllowed=false`, `prodSyncImpact.sourceOfTruth.decisionRequired=true` or `upgradePolicy.prodWorkloadSyncEligible=false`, do not infer permission to sync or restart workloads from local MCP readiness.

DB snapshot render previews are separate platform recovery artifacts, not MCP file writes. They must be created with an explicit reviewed workflow id and remain outside `~/repo/n8n-workflows/*`.

Do not put native n8n MCP tokens or Synestra MCP tokens into gateway adapter records, command arguments, logs or plaintext env stored by a control plane. Use SOPS/Kubernetes Secret backed files or an equivalent secret-backed injection path.

## Configuration

Required runtime settings:

- `N8N_WORKFLOWS_ROOT`: mounted workflow files root.
- `N8N_WORKFLOWS_GIT_ROOT`: Git worktree root used only for Git status diagnostics.
- `N8N_WORKFLOWS_DISPLAY_ROOT`: human-readable display root for diagnostics.
- `SYNESTRA_MCP_ENV`: `dev` or `prod`.
- `SYNESTRA_MCP_WRITE_POLICY`: must be `off`.
- `SYNESTRA_MCP_AUTH_TOKEN_FILE`: file containing the Bearer token; required for non-local binds.
- `SYNESTRA_MCP_ALLOW_UNAUTHENTICATED_LOCAL`: local development escape hatch for local-only `HOST`; never use in platform deployment.
- `SYNESTRA_MCP_EXPECTED_BRANCH`: optional diagnostic context for Git status output; it does not enable writes.
- `SYNESTRA_PLATFORM_DISPLAY_ROOT`: optional display path for platform readiness handoff commands, default `~/repo/synestra-platform`.

Numeric environment values must be unsigned integer strings. Boolean environment values must use documented true/false literals; malformed values fail startup.

Use `.env.example` as a local-only template. Platform deployment must inject tokens through secret-backed files, not plaintext environment values or gateway adapter records.

## HTTP Contract

- `GET /health`: unauthenticated minimal liveness response.
- `POST /mcp`: JSON-RPC MCP endpoint for `initialize`, `tools/list`, `tools/call`, `resources/list` and `resources/read`.

See `docs/reference/http-endpoints.md` for authentication and response expectations.

## Development

```bash
npm run verify
npm run smoke:docker
```

## Deployment Source Of Truth

Platform deployment, image publishing, SOPS secrets, Argo CD Applications and gateway routing live in `~/repo/synestra-platform`.

Relevant platform docs:

- `docs/explanation/SYNESTRA_PLATFORM_GITOPS_N8N_WORKFLOWS.md`
- `~/repo/synestra-platform/docs/reference/mcp.md`
- `~/repo/synestra-platform/docs/runbooks/mcp/synestra-n8n-gitops-mcp.md`
- `~/repo/synestra-platform/docs/runbooks/mcp/mcp-gateway.md`
- `docs/architecture-boundary.md`
