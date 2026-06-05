# Safety Contract

The default mode is read-only: `SYNESTRA_MCP_WRITE_POLICY=off`.

Production writes are not supported in v1. Dev writes require:

- explicit write policy;
- canonical `.index/<workflowId>.path` resolution;
- `expectedEtag`;
- expected branch checks;
- clean Git worktree and clean target file;
- atomic write;
- read-after-write settle.

Unauthenticated `/health` returns only `{ "status": "ok" }`. Detailed diagnostics are MCP tools behind Bearer auth.

Tokens must be read from secret-backed files. Do not store native n8n MCP tokens or Synestra MCP tokens in gateway adapter records, command arguments, logs, or plaintext control-plane environment records.
