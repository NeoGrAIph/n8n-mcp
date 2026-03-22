# `n8n_executions_get`

## Summary

Get details for a specific execution by id. Use this when you need to inspect a run for debugging or audit. Provide id plus optional mode/nodeNames/itemsLimit to control response size and error detail. Returns the execution data, possibly filtered or summarized.

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
| `errorItemsLimit` | integer | no |  | For mode=error: sample items from upstream node (default: 2, max: 100) |
| `fetchWorkflow` | boolean | no |  | For mode=error: fetch workflow for accurate upstream detection (default: true) |
| `id` | string | yes |  | Execution ID (required) |
| `includeExecutionPath` | boolean | no |  | For mode=error: include execution path leading to error (default: true) |
| `includeInputData` | boolean | no |  | Include input data in addition to output (default: false) |
| `includeStackTrace` | boolean | no |  | For mode=error: include full stack trace (default: false, shows truncated) |
| `itemsLimit` | integer | no |  | For mode=filtered: items per node (0=structure, 2=default, -1=unlimited) |
| `mode` | string | no |  | Detail level: preview, summary (default), filtered, full, or error |
| `nodeNames` | array | no |  | For mode=filtered: filter to specific nodes by name |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_executions_get",
  "arguments": {
    "id": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_executions_get",
  "arguments": {
    "id": "example-id",
    "errorItemsLimit": 1
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
