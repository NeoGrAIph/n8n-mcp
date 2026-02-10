# `n8n_workflow_execution_get`

## Summary

Get execution results for a specific workflow. Provide workflowId and executionId to fetch the execution and return processed results. Useful when you only have /workflow/<id>/executions/<executionId> references.

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
| `errorItemsLimit` | integer | no |  | For mode=error: sample items from upstream node (default: 2) |
| `executionId` | string | yes |  | Execution ID to retrieve |
| `fetchWorkflow` | boolean | no |  | Fetch workflow for accurate processing (default: true) |
| `includeExecutionPath` | boolean | no |  | For mode=error: include execution path leading to error (default: true) |
| `includeInputData` | boolean | no |  | Include input data in results (default: false) |
| `includeStackTrace` | boolean | no |  | For mode=error: include full stack trace (default: false) |
| `itemsLimit` | integer | no |  | Items per node to return (for filtered/summary modes) |
| `mode` | string | no |  | Detail level for execution data (default: summary) |
| `nodeNames` | array | no |  | Filter to specific nodes (for filtered mode) |
| `workflowId` | string | yes |  | Workflow ID that owns the execution |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_workflow_execution_get",
  "arguments": {
    "executionId": "example-id",
    "workflowId": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_workflow_execution_get",
  "arguments": {
    "executionId": "example-id",
    "workflowId": "example-id",
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
