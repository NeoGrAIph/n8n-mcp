# Synestra n8n MCP Extensions

This repository is the Synestra-owned n8n MCP extensions repository. It is not the legacy n8n-mcp product and does not replace native n8n MCP.

## Status

The legacy n8n-mcp implementation was preserved before removal at commit `904200f`. To inspect or restore the old implementation, use `git show 904200f` or check out that commit in a separate worktree.

The active codebase is the lightweight `synestra-n8n-gitops-mcp` server. It is internal Synestra infrastructure and is deployed through `~/repo/synestra-platform`.

## Purpose

Native n8n MCP is the source of truth for core n8n operations: workflow discovery/details/update, executions/tests, credentials, projects/folders, workflow builder, node/runtime semantics and data tables.

Synestra n8n MCP extensions own only the GitOps/file-level gaps that native n8n MCP does not cover: locating extracted Code files, locating Set(raw) files, reporting file-layer parity, Git/worktree checks, mount diagnostics and export/sync diagnostics. Editing is done by normal filesystem tools after the MCP locator/parity checks pass; this server does not publish MCP write tools.

The MCP does not transport Code/Set(raw) source content. Use `synestra_workflow_file_read` or `resources/read` only to get locator metadata such as `filesystemPath`, `uri`, `etag`, `kind`, `language` and locator status, then use normal filesystem tools to inspect or edit the file.

`synestra_workflow_export_diagnostics` reports local MCP locator readiness and explicit handoff commands for platform Camel K/DB-to-files gates. It does not run Kubernetes checks from the MCP container and it never proves production readiness by itself.

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

Targets are resolved through `workflows/.index/<workflowId>.path`. A file is an edit candidate only when the returned locator status is `ready`.

`filesystemPath` is the path intended for external filesystem tools. `containerPath` is the service's in-pod mount path and is included only for diagnostics.

Important file semantics:

- Code `.py` files contain Python source from `parameters.pythonCode`.
- Code `.json` files contain JavaScript source from `parameters.jsCode`; they are not JSON documents.
- Set `.set.json` files contain `parameters.jsonOutput` and may be strict JSON or an n8n expression string starting with `=`.

## Safety Contract

Production writes are not supported in v1, and the main MCP contract is read-only. Use normal filesystem tools for approved dev edits, then re-check the file with `synestra_workflow_file_validate`, `synestra_workflow_sync_observe` or `synestra_workflow_reconcile_status`.

Do not put native n8n MCP tokens or Synestra MCP tokens into gateway adapter records, command arguments, logs or plaintext env stored by a control plane. Use SOPS/Kubernetes Secret backed files or an equivalent secret-backed injection path.

## Configuration

Required runtime settings:

- `N8N_WORKFLOWS_ROOT`: mounted workflow files root.
- `N8N_WORKFLOWS_DISPLAY_ROOT`: human-readable display root for diagnostics.
- `SYNESTRA_MCP_ENV`: `dev` or `prod`.
- `SYNESTRA_MCP_WRITE_POLICY`: must be `off`.
- `SYNESTRA_MCP_AUTH_TOKEN_FILE`: file containing the Bearer token.
- `SYNESTRA_MCP_EXPECTED_BRANCH`: optional diagnostic context for Git status output; it does not enable writes.
- `SYNESTRA_PLATFORM_DISPLAY_ROOT`: optional display path for platform readiness handoff commands, default `~/repo/synestra-platform`.

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
- `docs/architecture-boundary.md`
