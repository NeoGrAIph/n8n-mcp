# `n8n_workflow_update_full`

## Summary

Replace a workflow's nodes, connections, and settings in n8n. Use this for full workflow overwrites. For Code/Set node file edits, prefer n8n_workflow_file_patch or resources/write. Provide id and the updated fields; nodes/connections should be complete if you modify structure. Returns basic info about the updated workflow and writes changes to n8n.

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
| `connections` | object | no |  | Complete connections object (required if modifying workflow structure) |
| `id` | string | yes |  | Workflow ID to update |
| `name` | string | no |  | New workflow name |
| `nodes` | array | no |  | Complete array of workflow nodes (required if modifying workflow structure) |
| `settings` | object | no |  | Workflow settings to update |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_workflow_update_full",
  "arguments": {
    "id": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_workflow_update_full",
  "arguments": {
    "id": "example-id",
    "connections": {}
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
