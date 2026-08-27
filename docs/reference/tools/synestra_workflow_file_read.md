# synestra_workflow_file_read

Locate one extracted Code or Set(raw) workflow file and return metadata for external filesystem tools. Despite the compatibility name, this tool does not read or return file source content.

## Inputs

- `uri` string, required. Must be a Synestra workflow resource URI such as `synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb.py`.

## Output

Returns locator metadata including `workflowId`, `nodeId`, `kind`, optional `language`, `uri`, `etag`, `size`, `lastModified`, `filesystemPath`, `containerPath`, `relativePath`, `locator.status`, `editReadiness`, `locatorOnly=true`, `resourcePayloadKind=locator-json`, `externalMimeType` and `externalFilesystemPathAvailableWhen=locator.status=ready`.

`filesystemPath` is the host-facing path intended for normal filesystem tools. `containerPath` is diagnostic-only for the MCP container mount.

For a ready dev locator, `editReadiness` reports `effectiveDecision=auto-sync-on-save`, `externalFilesystemEditAllowed=true`, `autoSyncOnSave=true`, `platformPreflightRequired=false` and `filesystemToolPolicy=edit-with-auto-sync-on-save`. `autoSyncRuntimeHealthVerified=false` makes clear that this local result does not prove the deployed controller is healthy; use export/platform diagnostics for runtime evidence. Ready non-dev locators remain inspect-only.

## Safety

No Code, JavaScript, Python or Set(raw) payload is returned. A target can be inspected only when `locator.status` is `ready`; all other statuses are unsafe for external edits. This MCP remains read-only even when it reports that normal filesystem editing is allowed.

## Example

```json
{
  "uri": "synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb.py"
}
```
