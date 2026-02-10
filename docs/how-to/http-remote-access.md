# How-to: Run n8n-mcp as Remote HTTP MCP Server

Этот сценарий предназначен для удалённого доступа к n8n-mcp (например, из Claude Desktop через `mcp-remote`).

## Steps

1. Разверните HTTP сервер (см. runbook):
- `docs/runbooks/deployment/http-server.md`

2. Подключите клиент (пример для Claude Desktop через `mcp-remote`):
```json
{
  "mcpServers": {
    "n8n-remote": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-server.example.com/mcp",
        "--header",
        "Authorization: Bearer YOUR_AUTH_TOKEN"
      ]
    }
  }
}
```

3. Проверьте, что tools доступны через `tools/list` в клиенте.

## Typical errors

- `401/403`: неправильный/отсутствующий Bearer token (`AUTH_TOKEN`).
- `USE_FIXED_HTTP` выключен и вы видите проблемы транспорта: включите `USE_FIXED_HTTP=true` (см. `.env.example`).

## References

- Runbook: `docs/runbooks/deployment/http-server.md`
- Reference: `docs/how-to/deployment/HTTP_DEPLOYMENT.md`, `docs/how-to/deployment/RAILWAY_DEPLOYMENT.md`
