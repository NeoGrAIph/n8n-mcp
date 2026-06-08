# HTTP Endpoints

The server exposes a small HTTP surface for the Synestra GitOps/file MCP extension. It does not proxy native n8n MCP and it does not merge native n8n tools into its catalog.

## `GET /health`

Unauthenticated health endpoint for container and gateway liveness checks.

Response body is intentionally minimal:

```json
{
  "status": "ok"
}
```

Do not add workflow, mount, token, Git or platform diagnostics to `/health`; those details belong in authenticated MCP tools.

## `POST /mcp`

JSON-RPC MCP endpoint for tools and resources.

Authentication:

- Non-local binds require `Authorization: Bearer <token>`.
- The token is read from `SYNESTRA_MCP_AUTH_TOKEN_FILE`.
- Local unauthenticated development is allowed only when `SYNESTRA_MCP_ALLOW_UNAUTHENTICATED_LOCAL=true` and `HOST` is `127.0.0.1`, `::1` or `localhost`.

Supported MCP methods include:

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`

The tool catalog is Synestra-only and read-only. It must not expose native n8n core operations such as workflow search/update, executions, credentials, projects or builder tools; those belong to the native n8n MCP server.

`resources/read` returns locator JSON for a `synestra-n8n-workflows:///...` URI. It does not return Code or Set(raw) source content.

Example authenticated `tools/list` request:

```bash
curl -sS \
  -H "Authorization: Bearer $(tr -d '\n' < "$SYNESTRA_MCP_AUTH_TOKEN_FILE")" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  http://127.0.0.1:3000/mcp
```

Expected unauthenticated behavior for non-local/manual auth mode:

- `/health` returns `200`.
- `/mcp` returns `401` and does not leak diagnostics or token material.
