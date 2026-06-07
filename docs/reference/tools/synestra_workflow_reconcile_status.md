# synestra_workflow_reconcile_status

Return workflow-level file-layer parity for the workflow JSON projection, `.index`, extracted Code files and extracted Set(raw) files.

## Inputs

- `workflowId` string, required. n8n workflow id matching `^[A-Za-z0-9_-]{8,}$`.

## Output

Returns workflow status, summary counts and target-level statuses. Common unsafe statuses include `missing_file`, `stale_export`, `missing_workflow_json`, `ambiguous_workflow_json`, `invalid_workflow_json`, `nodes_empty`, `missing_node`, `unsupported_node_type` and `null_set_raw_payload`.

## Safety

No Code/Set(raw) source content is returned. Use this tool before any external filesystem edit; only exact target statuses of `ready` are local file-layer candidates, and final edit permission still requires the platform aggregate gate to return `filesystemToolGuard.finalExternalFilesystemEditAllowed=true`.

## Example

```json
{
  "workflowId": "6Us3YRUh4tkTEqvCiN12M"
}
```
