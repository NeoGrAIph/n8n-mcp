# `n8n_templates_search`

## Summary

Search the local workflow templates catalog. Use this when you want to discover templates by keyword, node types, task, or metadata filters. Provide searchMode and matching parameters plus limit/offset for pagination. Returns a list of templates with summary metadata and tips.

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
| `category` | string | no |  | For searchMode=by_metadata: filter by category (e.g., "automation", "integration") |
| `complexity` | string | no |  | For searchMode=by_metadata: filter by complexity level |
| `fields` | array | no |  | For searchMode=keyword: fields to include in response. Default: all fields. |
| `limit` | integer | no | 20 | Maximum number of results. Default 20. |
| `maxSetupMinutes` | integer | no |  | For searchMode=by_metadata: maximum setup time in minutes |
| `minSetupMinutes` | integer | no |  | For searchMode=by_metadata: minimum setup time in minutes |
| `nodeTypes` | array | no |  | For searchMode=by_nodes: array of node types (e.g., ["n8n-nodes-base.httpRequest", "n8n-nodes-base.slack"]) |
| `offset` | integer | no | 0 | Pagination offset. Default 0. |
| `query` | string | no |  | For searchMode=keyword: search keyword (e.g., "chatbot") |
| `requiredService` | string | no |  | For searchMode=by_metadata: filter by required service (e.g., "openai", "slack") |
| `searchMode` | string | no | keyword | Search mode. keyword=text search (default), by_nodes=find by node types, by_task=curated task templates, by_metadata=filter by complexity/services |
| `targetAudience` | string | no |  | For searchMode=by_metadata: filter by target audience (e.g., "developers", "marketers") |
| `task` | string | no |  | For searchMode=by_task: the type of task |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_templates_search",
  "arguments": {}
}
```

### Advanced

```json
{
  "name": "n8n_templates_search",
  "arguments": {
    "category": "..."
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
