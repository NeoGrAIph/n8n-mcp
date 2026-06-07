# synestra_workflow_mount_diagnostics

Return local diagnostics for the mounted workflow root, `.index`, Git state and Debezium offset file visibility.

## Inputs

No inputs.

## Output

Returns local mount and worktree diagnostics from the MCP container perspective, including display paths and summary status. It may report degraded read-only state when `.index` is missing and that mode was explicitly enabled.

## Safety

This tool is local-only diagnostics. It does not query Kubernetes, Argo CD, n8n DB or Camel K, and it does not prove production readiness.

## Example

```json
{}
```
