# Runbook: n8n MCP Client Tool → n8n-mcp (HTTP)

Status: active | Audience: developer | Last reviewed: 2026-02-09

## Goal

Подключить n8n (узел MCP Client Tool) к n8n-mcp, запущенному в режиме HTTP, чтобы использовать инструменты n8n-mcp внутри workflow n8n.

## Preconditions

- Развёрнут n8n-mcp в HTTP режиме (см. `docs/runbooks/deployment/http-server.md`)
- Секрет `AUTH_TOKEN` задан и доступен для n8n (как credential/secret)
- (Опционально) Для management tools: заданы `N8N_API_URL` + `N8N_API_KEY` либо включён multi-tenant

## Procedure

1. Поднимите n8n-mcp в `MCP_MODE=http` и убедитесь, что `GET /health` работает.

2. В n8n добавьте MCP server в MCP Client Tool:
- URL: `https://your-n8n-mcp.example.com/mcp`
- Header: `Authorization: Bearer <AUTH_TOKEN>`

3. Проверьте, что n8n успешно делает discovery и видит `protocolVersion`.

## Verification

- В n8n MCP Client Tool доступен список tools n8n-mcp.
- Вызов `n8n_nodes_search` из n8n возвращает результаты.

## References

- Каноничная инструкция (подробно): `docs/how-to/integrations/N8N_DEPLOYMENT.md`
- HTTP deploy: `docs/how-to/deployment/HTTP_DEPLOYMENT.md`
- Tool reference: `docs/reference/tools/README.md`
