# synestra_workflow_sync_observe

Observe a workflow file after an external filesystem edit and report ETag/content settle status.

## Inputs

- `uri` string, required. Synestra workflow resource URI.
- `expectedEtag` string, optional. Previous 64-character SHA-256 ETag to compare against.
- `expectedContent` string, optional. Expected file content used only for internal comparison.
- `expectedContentSha256` string, optional. SHA-256 of the expected final file bytes, used for hash-only comparison without sending source content.
- `timeoutMs` integer, optional. Observation timeout from `100` to `120000` ms.

`expectedContent` and `expectedContentSha256` are mutually exclusive. `expectedEtag` may be used together with `expectedContentSha256`: the former is usually the pre-edit stale-read token, while the latter is the expected post-edit byte hash.

## Output

Returns settle state, elapsed time, latest ETag, ETag comparison, content comparison, content SHA-256 comparison and normalization metadata. It does not return full locator metadata; call `synestra_workflow_file_read` or `synestra_workflow_reconcile_status` after observe when locator status is needed.

## Safety

The tool does not write files and does not echo `expectedContent`. Prefer `expectedContentSha256` for post-edit byte confirmation when the caller can compute the expected hash locally. `expectedEtag` is a stale-read token, often the pre-edit ETag; `expectedContentSha256` is the expected final file hash. `etagMatches=false` after an edit is expected when `expectedEtag` is pre-edit, because bytes changed from the supplied previous ETag.

## Example

```json
{
  "uri": "synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb.py",
  "expectedEtag": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "timeoutMs": 15000
}
```
