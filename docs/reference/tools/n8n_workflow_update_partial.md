# `n8n_workflow_update_partial`

## Summary

Apply diff-based updates to an existing workflow. Use this for targeted structure changes (add/remove/update nodes or connections). For code/Set file edits, prefer n8n_workflow_file_patch or resources/write. Provide id and an operations[] list plus optional validateOnly and continueOnError. Returns applied/failed operations and writes changes when validateOnly is false.

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
| `continueOnError` | boolean | no |  | If true, apply valid operations even if some fail (best-effort mode). Returns applied and failed operation indices. Default: false (atomic) |
| `id` | string | yes |  | Workflow ID to update |
| `operations` | array | yes |  | Array of diff operations to apply. Each operation must have a "type" field and relevant properties for that operation type. |
| `validateOnly` | boolean | no |  | If true, only validate operations without applying them |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_workflow_update_partial",
  "arguments": {
    "id": "example-id",
    "operations": {}
  }
}
```

### Advanced

```json
{
  "name": "n8n_workflow_update_partial",
  "arguments": {
    "id": "example-id",
    "operations": {},
    "continueOnError": true
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
