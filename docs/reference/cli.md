# CLI Reference

Этот документ описывает CLI команды и режимы запуска `n8n-mcp`.

## Summary

`n8n-mcp` — npm package с бинарём `n8n-mcp`, который запускает MCP server в режиме stdio (по умолчанию) или HTTP (по `MCP_MODE=http`).

## Commands

### Telemetry

```bash
n8n-mcp telemetry enable
n8n-mcp telemetry disable
n8n-mcp telemetry status
```

## Modes

| Mode | How to enable | Notes |
|---|---|---|
| stdio | default (`MCP_MODE=stdio`) | для локального подключения клиентов MCP |
| http | `MCP_MODE=http` | требуется `AUTH_TOKEN`/`AUTH_TOKEN_FILE` |

## Source of truth

- CLI entrypoint: `src/mcp/index.ts`
- Env vars: `.env.example`

