# `n8n_nodes_search`

## Summary

Search the local n8n node catalog by keyword. Use this when you need to discover node types that fit an integration or capability. Provide query and optional mode/limit/includeExamples to adjust matching and sample configs. Returns a ranked list of node types with basic metadata.

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
| `includeExamples` | boolean | no | False | Include top 2 real-world configuration examples from popular templates (default: false) |
| `limit` | integer | no | 20 | Max results (default 20) |
| `mode` | string | no | OR | OR=any word, AND=all words, FUZZY=typo-tolerant |
| `query` | string | yes |  | Search terms. Use quotes for exact phrase. |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_nodes_search",
  "arguments": {
    "query": "..."
  }
}
```

### Advanced

```json
{
  "name": "n8n_nodes_search",
  "arguments": {
    "query": "...",
    "includeExamples": true
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
