# `n8n_executions_list`

## Summary

List executions with filters such as status, workflowId, and limit. Use this to monitor recent runs or search for failures. Provide limit/cursor and optional workflowId, projectId, status, includeData. Returns a paginated list of execution records and cursors.

- Доступность: появляется в `tools/list` при конфигурации n8n API (`N8N_API_URL` + `N8N_API_KEY`) или при включённом multi-tenant (`ENABLE_MULTI_TENANT=true`) / наличии instance context.
- Транспорт: stdio и http.

## Audience

### User

- Как использовать инструмент: см. Examples.
- Как интерпретировать результат: см. Outputs и (при необходимости) встроенную справку `n8n_tools_documentation`.

### Developer

- Контракт входов (`inputSchema`) и описание: `src/mcp/tools-n8n-manager.ts`.
- Диспетчеризация: `src/mcp/server.ts` (switch-case `executeTool`).

## Inputs / Parameters

| Parameter | Type | Required | Default | Notes |
|---|---:|:---:|---:|---|
| `cursor` | string | no |  | Pagination cursor from previous response |
| `includeData` | boolean | no |  | Include execution data (default: false) |
| `limit` | integer | no |  | Number of executions to return (1-100, default: 100) |
| `projectId` | string | no |  | Filter by project ID (enterprise feature) |
| `status` | string | no |  | Filter by execution status |
| `workflowId` | string | no |  | Filter by workflow ID |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_executions_list",
  "arguments": {}
}
```

### Advanced

```json
{
  "name": "n8n_executions_list",
  "arguments": {
    "cursor": "..."
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

- Tool definition: `src/mcp/tools-n8n-manager.ts`
- Dispatch: `src/mcp/server.ts`
