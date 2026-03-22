# Runbooks — Deployment

Owner: <owner> | Scope: deployment
Status: active | Audience: developer | Last reviewed: 2026-02-09

Этот раздел содержит практические runbook'и по развёртыванию n8n-mcp.

## Источник правды (контракты)

- Переменные окружения: [../../../.env.example](../../../.env.example)
- HTTP server (single/fixed): `src/http-server-single-session.ts`, `src/http-server.ts`
- Entrypoint/режимы запуска: `src/mcp/index.ts`

## Runbooks

| Runbook | Audience | Description |
|---|---|---|
| [http-server.md](./http-server.md) | developer | Поднять HTTP MCP сервер и проверить доступность. |
