# Runbook: Connect Claude Desktop to n8n-mcp

Status: active | Audience: user | Last reviewed: 2026-02-09

## Goal

Подключить Claude Desktop к n8n-mcp (в режиме stdio) и убедиться, что инструменты доступны.

## Preconditions

- Установлен Claude Desktop
- Либо локальная установка n8n-mcp (Node.js), либо Docker

## Procedure

1. Выберите способ запуска:
- Локально: `node dist/mcp/index.js` (stdio)
- Docker: `docker run -i --rm -e MCP_MODE=stdio ...`

2. Обновите `claude_desktop_config.json` (пути зависят от OS; детали см. каноничный how-to):
- `docs/README_CLAUDE_SETUP.md`

3. Перезапустите Claude Desktop.

## Verification

- В UI Claude Desktop сервер MCP отображается как подключённый.
- Вызов `n8n_nodes_search` возвращает результаты.

## References

- Каноничная инструкция: `docs/how-to/clients/README_CLAUDE_SETUP.md`
- MCP tools reference: `docs/reference/tools/README.md`
