# synestra_workflow_files_status

Return read-only status for the workflow file mount, `.index`, Git worktree and optionally one resource URI target path.

## Inputs

- `uri` string, optional. When provided, the response includes resolved target path and Git status for that target URI.

## Output

Returns mount/index/Git status diagnostics and, when `uri` is supplied, target path/Git metadata or a controlled error. Use `synestra_workflow_file_read` or `synestra_workflow_reconcile_status` for locator status, ETag and safe-to-edit details.

When `target` is present, `target.filesystemPath` is the host-facing path intended for normal filesystem tools, `target.path` is a legacy alias of `filesystemPath`, and `target.containerPath` is the MCP container mount path for diagnostics only.

## Safety

This is a diagnostics tool only. It does not prove production readiness and does not grant permission to edit files. Production readiness requires the platform aggregate gate in `~/repo/synestra-platform/scripts/mcp/audit_n8n_two_mcp_production_readiness.sh`.

## Example

```json
{
  "uri": "synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb.py"
}
```
