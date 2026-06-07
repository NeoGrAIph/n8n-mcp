# synestra_workflow_files_list

List extracted Code and Set(raw) files for one workflow resolved through `workflows/.index`.

## Inputs

- `workflowId` string, required. n8n workflow id matching `^[A-Za-z0-9_-]{8,}$`.

## Output

Returns `files`, sorted by URI. Each item is an existing extracted Code or Set(raw) file from the workflow code directory and includes resource URI, kind, language for Code files, path metadata, ETag, locator status and `editReadiness`.

## Safety

No file source content is returned. This is an existing-files list, not a complete expected-target inventory: missing Code/Set(raw) files do not appear here. Use `synestra_workflow_reconcile_status` for missing target counts and workflow-level parity. Archived workflow paths are rejected as controlled errors. A ready local locator allows path inspection; external edits still require platform global prerequisites, verified `n8nDbContract`, and an exact-target gate for the same URI/ETag to return `filesystemToolGuard.finalExternalFilesystemEditAllowed=true`.

## Example

```json
{
  "workflowId": "6Us3YRUh4tkTEqvCiN12M"
}
```
