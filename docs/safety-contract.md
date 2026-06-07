# Safety Contract

The MCP server is read-only: `SYNESTRA_MCP_WRITE_POLICY=off`.

Production writes are not supported in v1. Dev edits are performed by normal filesystem tools only after the MCP locator/parity status for that exact workflow/node is `ready` and the platform file-layer gate returns `fileLayerSafety.effectiveDecision=go` with `externalFileEditAllowed=true`; after the edit, re-check with read-only validation or reconcile tools.

`synestra_workflow_file_validate.valid=true` means the file is both syntactically acceptable and locally safe from the file-layer locator perspective. `safeToEditScope=local-locator-only` is intentional: if `safeToEdit=false`, external file tools must not edit that target even when `validSyntax=true`; if `safeToEdit=true`, final edit permission still requires the platform gate.

MCP locator calls must not return Code/Set(raw) source content. They return paths, ETags and `editReadiness` so the caller can use normal filesystem tools for inspection and, only after platform approval, edits.

ETags are strong SHA-256 hashes of exact file bytes. Treat them only as stale-read detection for external filesystem tools and `synestra_workflow_sync_observe`; an ETag match does not grant write permission, bypass locator safety, or prove n8n DB/files production readiness.

MCP health, `tools/list`, local mount diagnostics and export diagnostics are not production-readiness proof. Production readiness requires separate platform read-only gates for native n8n MCP acceptance, gateway hardening and Camel K/DB-to-files parity.

Unauthenticated `/health` returns only `{ "status": "ok" }`. Detailed diagnostics are MCP tools behind Bearer auth.

Tokens must be read from secret-backed files. Do not store native n8n MCP tokens or Synestra MCP tokens in gateway adapter records, command arguments, logs, or plaintext control-plane environment records.
