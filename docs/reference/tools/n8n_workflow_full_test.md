# `n8n_workflow_full_test`

## Summary

Execute a full workflow through n8n's native `/rest/workflows/:id/run` endpoint. Use this when you need editor-style full test execution for manual/editor workflows and want semantics close to n8n's own "Execute workflow" behavior.

- Доступность: появляется в `tools/list` при конфигурации n8n API (`N8N_API_URL` + `N8N_API_KEY`) и REST auth (`N8N_REST_EMAIL` + `N8N_REST_PASSWORD`), либо при наличии instance context в multi-tenant режиме.
- Транспорт: stdio и http.

## Audience

### User

- Как использовать инструмент: см. Examples.
- Как интерпретировать результат: см. Outputs и встроенную справку `n8n_tools_documentation`.

### Developer

- Контракт входов (`inputSchema`) и описание: `src/mcp/tools-n8n-manager.ts`.
- Диспетчеризация: `src/mcp/server.ts` (switch-case `executeTool`).

## Inputs / Parameters

| Parameter | Type | Required | Default | Notes |
|---|---:|:---:|---:|---|
| `diagnostics` | string | no | `none` | Diagnostics mode: `none`, `preview`, `summary`, `full`, `error`. Допустим только при `waitForCompletion=true`. |
| `diagnosticsItemsLimit` | integer | no |  | Items per node for diagnostics output |
| `pollIntervalMs` | integer | no | `1000` | Polling interval while waiting for execution completion |
| `responseMode` | string | no | `result` | Response shape: `result` or `full` |
| `startNodes` | array | no | auto | Explicit start nodes `[{name, sourceData}]`. По умолчанию используются прямые downstream-ноды выбранного trigger node |
| `timeout` | integer | no | `120000` | Total wait timeout in ms when `waitForCompletion=true` |
| `triggerNode` | object | no | auto | Explicit trigger selector `{name, data}`. Нужен, если в workflow несколько trigger nodes |
| `waitForCompletion` | boolean | no | `true` | Wait until the execution reaches a terminal state |
| `workflowId` | string | yes |  | Workflow ID to execute through the native REST run endpoint |

## Outputs

- Возвращает JSON-результат операции.
- При `waitForCompletion=false` обычно содержит `workflowId`, `executionId`, `status`, `triggerNodeName`, `startNodeNames` и `runResponse`.
- При `waitForCompletion=true` обычно содержит `workflowId`, `executionId`, `triggerNodeName`, `startNodeNames`, `status` и `result`.
- При `responseMode=full` или diagnostics дополнительно возвращает raw execution, processed diagnostics и polling metadata.

## Examples

### Native Full Test with Auto Selection

```json
{
  "name": "n8n_workflow_full_test",
  "arguments": {
    "workflowId": "example-id",
    "waitForCompletion": true
  }
}
```

### Explicit Trigger and Start Nodes

```json
{
  "name": "n8n_workflow_full_test",
  "arguments": {
    "workflowId": "example-id",
    "triggerNode": {
      "name": "When clicking \"Execute workflow\""
    },
    "startNodes": [
      {
        "name": "Prepare Data"
      }
    ],
    "diagnostics": "summary",
    "responseMode": "full"
  }
}
```

## Errors / Failure Modes

- `invalid_arguments`: отсутствуют обязательные поля или неверные типы.
- `tool_disabled`: инструмент выключен через `DISABLED_TOOLS`.
- `not_configured`: отсутствует n8n API config или REST auth.
- `REST authentication required for native full test mode`: не заданы `N8N_REST_EMAIL` / `N8N_REST_PASSWORD`.
- `Cannot auto-select trigger node`: в workflow несколько trigger nodes и `triggerNode` не передан.
- `No downstream start nodes found for selected trigger`: не удалось автоматически определить `startNodes`.
- `Native workflow run did not return an execution ID`: n8n принял запрос, но не вернул идентификатор выполнения.
- `EXECUTION_TIMEOUT`: workflow не завершился за отведённое время.

## Security / Permissions

- Не логируйте и не коммитьте секреты: `AUTH_TOKEN`, `N8N_API_KEY`, `N8N_REST_PASSWORD`.
- Native full test выполняет реальные nodes и реальные side effects.
- Для долгих или потенциально опасных workflow сначала используйте `waitForCompletion=false` или runner `dryRun`, если нужен только анализ generated path.

## Source of Truth

- Tool definition: `src/mcp/tools-n8n-manager.ts`
- Dispatch: `src/mcp/server.ts`
