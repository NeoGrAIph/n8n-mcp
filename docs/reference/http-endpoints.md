# HTTP Endpoints Reference

Этот документ описывает HTTP endpoints, доступные при запуске `n8n-mcp` в режиме `MCP_MODE=http`.

## Summary

В HTTP режиме сервер экспонирует:
- healthcheck endpoint
- MCP endpoint (`/mcp`) для discovery и JSON-RPC вызовов tools
- (в fixed реализации) дополнительные endpoints вроде `/version`

## Security / Auth

- `GET /health` и `GET /` обычно доступны без авторизации.
- `POST /mcp` требует `Authorization: Bearer <AUTH_TOKEN>` (см. `.env.example`).
- Токен можно задавать через `AUTH_TOKEN` или `AUTH_TOKEN_FILE`.

## Endpoints

### Common

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | no | Информация о сервере/эндпоинтах |
| GET | `/health` | no | Healthcheck |
| GET | `/mcp` | (depends) | MCP discovery / transport negotiation |
| POST | `/mcp` | yes | MCP JSON-RPC calls (tools/list, tools/call, resources/...) |

### Fixed HTTP implementation (`USE_FIXED_HTTP=true`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/version` | no | Версия сервера |

## Source of truth

- Fixed HTTP: `src/http-server.ts`
- Single-session HTTP: `src/http-server-single-session.ts`
- Entrypoint: `src/mcp/index.ts`

