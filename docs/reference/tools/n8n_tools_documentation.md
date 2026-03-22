# `n8n_tools_documentation`

## Summary

Fetch the built-in documentation for n8n MCP tools and guides. Use this when you need usage guidance, examples, or the tool index. Provide topic for a specific tool or "overview", and set depth to control verbosity. Returns Markdown content.

- Доступность: всегда доступен (если не отключён через `DISABLED_TOOLS`).
- Транспорт: stdio и http.

## Audience

### User

- Как использовать инструмент: см. Examples.
- Как интерпретировать результат: см. Outputs и (при необходимости) встроенную справку `n8n_tools_documentation`.

### Developer

- Контракт входов (`inputSchema`) и описание: `src/mcp/tools.ts`.
- Диспетчеризация: `src/mcp/server.ts` (switch-case `executeTool`).

## Inputs / Parameters

| Parameter | Type | Required | Default | Notes |
|---|---:|:---:|---:|---|
| `depth` | string | no | essentials | Level of detail. "essentials" (default) for quick reference, "full" for comprehensive docs. |
| `topic` | string | no |  | Tool name (e.g., "n8n_nodes_search") or "overview" for general guide. Leave empty for quick reference. |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_tools_documentation",
  "arguments": {}
}
```

### Advanced

```json
{
  "name": "n8n_tools_documentation",
  "arguments": {
    "depth": "essentials"
  }
}
```

## Errors / Failure Modes

- `invalid_arguments`: отсутствуют обязательные поля или неверные типы.
- `tool_disabled`: инструмент выключен через `DISABLED_TOOLS`.
- `not_configured`: требуется конфигурация (например, n8n API или workflow-files root) и она отсутствует.
- В HTTP режиме: `401/403` при отсутствии/неверном `Authorization: Bearer ...`.

## Security / Permissions

- Не логируйте и не коммитьте секреты: `AUTH_TOKEN`, `N8N_API_KEY`, `N8N_REST_PASSWORD`.
- Для инструментов управления workflow учитывайте, что операции могут быть разрушительными (delete/truncate/rollback).

## Source of Truth

- Tool definition: `src/mcp/tools.ts`
- Dispatch: `src/mcp/server.ts`
