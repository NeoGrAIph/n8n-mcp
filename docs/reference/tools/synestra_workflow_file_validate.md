# synestra_workflow_file_validate

Validate an existing or proposed Code/Set(raw) file payload without writing it. Set(raw) content gets JSON/expression syntax checks; Code content is not Python/JavaScript syntax-checked by this MCP.

## Inputs

- `uri` string, required. Synestra workflow resource URI for a Code or Set(raw) file.
- `content` string, optional. Proposed payload to validate. If omitted, the current file content is read internally for validation and is not echoed back.
- `contentSha256` string, optional. SHA-256 of the validation input bytes. When `content` is omitted, this is compared with the current file bytes; when `content` is provided, this is compared with that proposed payload.

`content` and `contentSha256` are mutually exclusive. Hash-only validation checks exact bytes currently on disk; it cannot syntax-check an off-disk proposed payload that was not sent to MCP.

## Output

Returns `valid`, `validSyntax`, `safeToEdit`, `safeToEditScope`, `validationInputSource`, `contentSha256Matches`, `editReadiness`, `diagnostics`, `locator` and `target`. For Set(raw), `validSyntax` reflects JSON/expression syntax. For Code files, `validSyntax` is not a language parser result; use external language tooling for Python/JavaScript checks. `safeToEdit` is the local file-layer locator eligibility gate. A ready dev target reports automatic sync-on-save eligibility; live controller health remains a separate platform diagnostic concern.

## Safety

The tool does not write files and does not echo proposed content in `structuredContent`. Prefer `contentSha256` for post-edit byte confirmation when syntax validation of a proposed payload is not needed. For Set(raw), strict JSON and n8n expression strings starting with `=` are syntactically valid forms.

## Example

```json
{
  "uri": "synestra-n8n-workflows:///set/6Us3YRUh4tkTEqvCiN12M/11111111-2222-3333-4444-555555555555.set.json",
  "content": "{\"ok\":true}"
}
```
