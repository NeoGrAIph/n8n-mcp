# Synestra n8n MCP Extensions

This repository is the Synestra-owned n8n MCP extensions repository. It is not the legacy n8n-mcp product and does not replace native n8n MCP.

## Status

The legacy n8n-mcp implementation was preserved before removal at commit `904200f`. To inspect or restore the old implementation, use `git show 904200f` or check out that commit in a separate worktree.

The active codebase is the lightweight `synestra-n8n-gitops-mcp` server. It is internal Synestra infrastructure and is deployed through `~/repo/synestra-platform`.

## Purpose

Native n8n MCP is the source of truth for core n8n operations: workflow discovery/details/update, executions/tests, credentials, projects/folders, workflow builder, node/runtime semantics and data tables.

Synestra n8n MCP extensions own only the GitOps/file-level gaps that native n8n MCP does not cover: extracted Code files, Set(raw) files, ETag-protected file patching, Git/worktree checks, mount diagnostics and export/sync diagnostics.

## Tool Contract

Read-only tools are always available when authenticated:

- `synestra_workflow_files_status`
- `synestra_workflow_files_list`
- `synestra_workflow_file_read`
- `synestra_workflow_file_validate`
- `synestra_workflow_sync_observe`
- `synestra_workflow_mount_diagnostics`

Write tools are hidden and unavailable when `SYNESTRA_MCP_WRITE_POLICY=off`:

- `synestra_workflow_file_patch`
- `synestra_workflow_file_replace`

## Resource URIs

The server uses Synestra workflow file URIs:

```text
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.py
synestra-n8n-workflows:///code/{workflowId}/{nodeId}.json
synestra-n8n-workflows:///set/{workflowId}/{nodeId}.set.json
```

Targets are resolved through `workflows/.index/<workflowId>.path`; mutation fails without canonical index resolution.

## Safety Contract

Production writes are not supported in v1. Dev writes are disabled by default and require an explicit write policy, canonical `.index/<workflowId>.path` resolution, `expectedEtag`, expected branch checks, clean Git state and read-after-write settle.

Do not put native n8n MCP tokens or Synestra MCP tokens into gateway adapter records, command arguments, logs or plaintext env stored by a control plane. Use SOPS/Kubernetes Secret backed files or an equivalent secret-backed injection path.

## Configuration

Required runtime settings:

- `N8N_WORKFLOWS_ROOT`: mounted workflow files root.
- `N8N_WORKFLOWS_DISPLAY_ROOT`: human-readable display root for diagnostics.
- `SYNESTRA_MCP_ENV`: `dev` or `prod`.
- `SYNESTRA_MCP_WRITE_POLICY`: `off`, `patch`, or `patch_replace`.
- `SYNESTRA_MCP_AUTH_TOKEN_FILE`: file containing the Bearer token.
- `SYNESTRA_MCP_EXPECTED_BRANCH`: required branch for write-enabled dev runs.

## Development

```bash
npm test
find src tests -name '*.mjs' -print0 | xargs -0 -n1 node --check
docker build -t synestra-n8n-gitops-mcp:local .
sh tests/smoke.sh synestra-n8n-gitops-mcp:local
```

## Deployment Source Of Truth

Platform deployment, image publishing, SOPS secrets, Argo CD Applications and gateway routing live in `~/repo/synestra-platform`.

Relevant platform docs:

- `~/repo/synestra-platform/docs/reference/mcp.md`
- `~/repo/synestra-platform/docs/runbooks/mcp/synestra-n8n-gitops-mcp.md`
- `~/repo/synestra-platform/docs/runbooks/mcp/mcp-gateway.md`
