# `n8n_workflow_runner_test`

## Summary

Execute a full workflow through the utility runner. Use this when you need a runner-based test execution path for manual-only or otherwise non-externally-triggerable workflows. Provide `workflowId` and optional input items, dry-run, diagnostics, or response controls.

- Доступность: появляется в `tools/list` при конфигурации n8n API (`N8N_API_URL` + `N8N_API_KEY`) или при включённом multi-tenant (`ENABLE_MULTI_TENANT=true`) / наличии instance context.
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
| `diagnostics` | string | no | `none` | Diagnostics mode: `none`, `preview`, `summary`, `full`, `error`. Нельзя использовать вместе с `dryRun=true`. |
| `diagnosticsItemsLimit` | integer | no |  | Items per node for diagnostics output |
| `dryRun` | boolean | no | `false` | Build generated full workflow and return metadata without executing runner |
| `item` | object | no |  | Optional single input object (used if `items` is not provided) |
| `items` | array | no |  | Optional array of input items. Plain objects are wrapped into `{json: ...}`. |
| `responseMode` | string | no | `result` | Response shape: `result` or `full` |
| `runnerWebhookPath` | string | no | `mcp-code-node-runner` | Optional override for the runner webhook path |
| `runnerWorkflowId` | string | no |  | Optional override for the utility runner workflow ID |
| `timeout` | integer | no |  | Timeout in ms for the runner webhook call |
| `waitForResponse` | boolean | no | `true` | Wait for workflow completion |
| `workflowId` | string | yes |  | Workflow ID to execute through the utility runner |

## Outputs

- Возвращает JSON-результат операции.
- В обычном режиме содержит `workflowId`, `mode=full`, `executionId` и `result`.
- В `dryRun=true` возвращает metadata generated workflow без фактического запуска.
- При `responseMode=full` или diagnostics дополнительно возвращает `selectedNodeNames`, `subWorkflowName`, `triggerNodeName`, runner metadata и response details.

## Examples

### Dry Run

```json
{
  "name": "n8n_workflow_runner_test",
  "arguments": {
    "workflowId": "example-id",
    "dryRun": true
  }
}
```

### Execute Manual-Only Workflow

```json
{
  "name": "n8n_workflow_runner_test",
  "arguments": {
    "workflowId": "example-id",
    "item": {
      "sample": true
    },
    "waitForResponse": true,
    "responseMode": "full"
  }
}
```

## Errors / Failure Modes

- `invalid_arguments`: отсутствуют обязательные поля или неверные типы.
- `tool_disabled`: инструмент выключен через `DISABLED_TOOLS`.
- `not_configured`: отсутствует n8n API config.
- `Runner workflow not found`: utility runner workflow отсутствует или не найден.
- `Cannot determine n8n base URL`: не удаётся вычислить base URL из `N8N_API_URL` / instance context.
- `diagnostics cannot be used when dryRun=true`: конфликт параметров.
- В HTTP режиме: `401/403` при отсутствии/неверном `Authorization: Bearer ...`.

## Security / Permissions

- Не логируйте и не коммитьте секреты: `AUTH_TOKEN`, `N8N_API_KEY`, `N8N_REST_PASSWORD`.
- `dryRun` безопаснее для первичного исследования, но не проверяет runtime execution.
- Обычный запуск выполняет реальные nodes и может вызвать внешние side effects.

## Source of Truth

- Tool definition: `src/mcp/tools-n8n-manager.ts`
- Dispatch: `src/mcp/server.ts`
