# synestra_workflow_file_validate

Validate an existing or proposed Code/Set(raw) file payload without writing it. Set(raw) content gets JSON/expression syntax checks; Code content is not Python/JavaScript syntax-checked by this MCP.

## Inputs

- `uri` string, required. Synestra workflow resource URI for a Code or Set(raw) file.
- `content` string, optional. Proposed payload to validate. If omitted, the current file content is read internally for validation and is not echoed back.

## Output

Returns `valid`, `validSyntax`, `safeToEdit`, `diagnostics`, `locator` and `target`. For Set(raw), `validSyntax` reflects JSON/expression syntax. For Code files, `validSyntax` is not a language parser result; use external language tooling for Python/JavaScript checks. `safeToEdit` is the file-layer locator eligibility gate.

## Safety

The tool does not write files and does not echo proposed content in `structuredContent`. For Set(raw), strict JSON and n8n expression strings starting with `=` are syntactically valid forms.

## Example

```json
{
  "uri": "synestra-n8n-workflows:///set/6Us3YRUh4tkTEqvCiN12M/11111111-2222-3333-4444-555555555555.set.json",
  "content": "{\"ok\":true}"
}
```
