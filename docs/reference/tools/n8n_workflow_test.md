# `n8n_workflow_test`

## Summary

Trigger a workflow execution via webhook, form, or chat. Use this when you need to run an externally-triggerable workflow and observe outputs or side effects. Manual, schedule, and other non-HTTP triggers are not supported here; use `n8n_workflow_runner_test` for runner-based full-workflow execution.

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
| `data` | object | no |  | Input data/payload for webhook, form fields, or execution data |
| `headers` | object | no |  | Custom HTTP headers |
| `httpMethod` | string | no |  | For webhook: HTTP method (default: from workflow config or POST) |
| `message` | string | no |  | For chat: message to send (required for chat triggers) |
| `sessionId` | string | no |  | For chat: session ID for conversation continuity |
| `timeout` | integer | no |  | Timeout in ms (default: 120000) |
| `triggerType` | string | no |  | Trigger type. Auto-detected if not specified. Workflow must have a matching trigger node. |
| `waitForResponse` | boolean | no |  | Wait for workflow completion (default: true) |
| `webhookPath` | string | no |  | For webhook: override the webhook path |
| `workflowId` | string | yes |  | Workflow ID to execute (required) |

Supported trigger types:
- `webhook`
- `form`
- `chat`

Unsupported workflow trigger classes:
- `manualTrigger`
- `schedule`
- other triggers without external HTTP entrypoint

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_workflow_test",
  "arguments": {
    "workflowId": "example-id",
    "triggerType": "webhook",
    "data": {
      "sample": true
    }
  }
}
```

### Advanced

```json
{
  "name": "n8n_workflow_test",
  "arguments": {
    "workflowId": "example-id",
    "triggerType": "chat",
    "message": "hello",
    "sessionId": "debug-session-1",
    "waitForResponse": true
  }
}
```

## Errors / Failure Modes

- `invalid_arguments`: отсутствуют обязательные поля или неверные типы.
- `tool_disabled`: инструмент выключен через `DISABLED_TOOLS`.
- `not_configured`: требуется конфигурация (например, n8n API или workflow-files root) и она отсутствует.
- `Workflow cannot be triggered externally`: workflow не содержит `webhook`, `form` или `chat` trigger.
- `Workflow must be active to trigger via this method`: externally-triggerable workflow найден, но workflow не активирован.
- Для manual-only workflows используйте `n8n_workflow_runner_test`.
- В HTTP режиме: `401/403` при отсутствии/неверном `Authorization: Bearer ...`.

## Security / Permissions

- Не логируйте и не коммитьте секреты: `AUTH_TOKEN`, `N8N_API_KEY`, `N8N_REST_PASSWORD`.
- Для инструментов управления workflow учитывайте, что операции могут быть разрушительными (delete/truncate/rollback).

## Source of Truth

- Tool definition: `src/mcp/tools-n8n-manager.ts`
- Dispatch: `src/mcp/server.ts`
