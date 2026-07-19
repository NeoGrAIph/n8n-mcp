# Synestra Platform GitOps n8n Workflows

This document is the stable repository-local entrypoint for agents that need to connect `synestra-n8n-gitops-mcp` with the Synestra platform workflow-file contour. It intentionally does not duplicate the full platform runbooks; `~/repo/synestra-platform` remains the source of truth for deployment, Argo CD, SOPS secrets, Camel K, Debezium and n8n DB/files readiness gates.

## Boundary

- Native n8n MCP owns core n8n semantics and API-backed operations: workflow discovery/details/update, executions/tests, credentials, projects/folders, workflow builder, node/runtime semantics and data tables.
- `synestra-n8n-gitops-mcp` owns only local GitOps/file locator metadata for extracted Code and Set(raw) nodes.
- This server is read-only. It returns locator metadata, paths, ETags, readiness state and platform handoff commands; it does not return Code/Set(raw) source content and does not expose MCP write tools.
- Normal filesystem tools perform approved dev edits outside MCP, and only after both the local locator and the platform exact-target gate approve the same URI/ETag.

## Workflow File Layout

The platform materializes n8n workflow files under `~/repo/n8n-workflows/<env>/workflows`.

- Workflow JSON: `workflows/<folder>/<workflowId>.<slug>.json`
- Code node Python: `workflows/<folder>/code_nodes_<workflowId>/<nodeId>.py`
- Code node JavaScript: `workflows/<folder>/code_nodes_<workflowId>/<nodeId>.json`
- Set(raw): `workflows/<folder>/code_nodes_<workflowId>/<nodeId>.set.json`
- Runtime state: sibling `.hash` files, `workflows/.index/<workflowId>.path`, Debezium offset files and controller state

Runtime state files are DB/materializer state, not manual source-of-truth artifacts.

## Readiness Handoff

MCP-local readiness is not production readiness. A ready locator means the exact file path is inspectable; it does not grant write permission.

For global readiness, use the platform aggregate gate:

```bash
cd ~/repo/synestra-platform
scripts/mcp/audit_n8n_two_mcp_production_readiness.sh --env dev --safe-workflow-id '<disposable-or-known-safe-workflow-id>' --json
```

For a specific dev file edit, rerun the same gate with the exact URI/ETag and require `productionReadinessEvidence.canClaimExactTargetEditReadiness=true`:

```bash
scripts/mcp/audit_n8n_two_mcp_production_readiness.sh --env dev --uri '<exact-synestra-uri>' --expected-etag '<pre-edit-sha256>' --json
```

Then create the runtime one-shot permit through the platform script. Do not create `.sync-allow` files manually.

```bash
scripts/mcp/create_n8n_sync_allow_permit.sh --env dev --uri '<exact-synestra-uri>' --expected-etag '<pre-edit-sha256>' --target-json /tmp/n8n-target-gate.json --readiness-json /tmp/n8n-readiness-gate.json --hmac-key-file '<secure-hmac-key-file>' --json
```

## Platform References

- `~/repo/synestra-platform/docs/runbooks/mcp/synestra-n8n-gitops-mcp.md`
- `~/repo/synestra-platform/docs/runbooks/workloads/n8n-camelk-recovery.md`
- `~/repo/synestra-platform/scripts/mcp/audit_n8n_two_mcp_production_readiness.sh`
- `~/repo/synestra-platform/scripts/n8n/preflight_n8n_camelk_recovery.sh`
- `~/repo/synestra-platform/scripts/mcp/audit_n8n_filesystem_edit_target.sh`
- `~/repo/synestra-platform/scripts/mcp/create_n8n_sync_allow_permit.sh`

