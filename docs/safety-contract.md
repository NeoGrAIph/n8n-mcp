# Safety Contract

The MCP server is read-only: `SYNESTRA_MCP_WRITE_POLICY=off`.

Production writes are not supported in v1. Dev edits are performed by normal filesystem tools only after the MCP locator/parity status for that exact workflow/node is `ready`; after the edit, re-check with read-only validation or reconcile tools.

Unauthenticated `/health` returns only `{ "status": "ok" }`. Detailed diagnostics are MCP tools behind Bearer auth.

Tokens must be read from secret-backed files. Do not store native n8n MCP tokens or Synestra MCP tokens in gateway adapter records, command arguments, logs, or plaintext control-plane environment records.
