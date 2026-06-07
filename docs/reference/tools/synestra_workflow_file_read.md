# synestra_workflow_file_read

Locate one extracted Code or Set(raw) workflow file and return metadata for external filesystem tools. Despite the compatibility name, this tool does not read or return file source content.

## Inputs

- `uri` string, required. Must be a Synestra workflow resource URI such as `synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb.py`.

## Output

Returns locator metadata including `workflowId`, `nodeId`, `kind`, optional `language`, `uri`, `etag`, `size`, `lastModified`, `filesystemPath`, `containerPath`, `relativePath`, `locator.status` and `editReadiness`.

`filesystemPath` is the host-facing path intended for normal filesystem tools. `containerPath` is diagnostic-only for the MCP container mount.

`editReadiness.platformBridge.aggregateField` points to platform `fileLayerSafety.synestraMcpBridge`. A ready local locator sets `readOnlyInspectionAllowed=true` and `filesystemToolPolicy=inspect-only-until-platform-go`; MCP-side `externalFilesystemEditAllowed` remains `false`. Final external-edit permission requires the aggregate platform gate to return `filesystemToolGuard.finalExternalFilesystemEditAllowed=true`.

## Safety

No Code, JavaScript, Python or Set(raw) payload is returned. A target can be inspected only when `locator.status` is `ready`; all other statuses are unsafe for external edits. `editReadiness.effectiveDecision=requires-platform-preflight` means the local locator is ready but final edit permission still requires the platform Camel K/DB/files gate.

## Example

```json
{
  "uri": "synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb.py"
}
```
