# `n8n_workflow_create`

## Summary

Create a new workflow in n8n. Use this when you need to persist a workflow definition from JSON into the n8n instance. Provide name, nodes, and connections (node types must use full n8n-nodes-base.* form) plus optional settings; the workflow is created inactive. Returns the new workflow id/name and basic stats.

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
| `connections` | object | yes |  | Workflow connections object. Keys are source node names (the name field, not id), values define output connections |
| `name` | string | yes |  | Workflow name (required) |
| `nodes` | array | yes |  | Array of workflow nodes. Each node must have: id, name, type, typeVersion, position, and parameters |
| `parentFolderId` | ["string", "null"] | no |  | Optional folder ID to place workflow after creation (requires REST auth) |
| `projectId` | string | no |  | Optional destination project ID for folder placement (requires REST auth) |
| `settings` | object | no |  | Optional workflow settings (execution order, timezone, error handling) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_workflow_create",
  "arguments": {
    "connections": {},
    "name": "...",
    "nodes": {}
  }
}
```

### Advanced

```json
{
  "name": "n8n_workflow_create",
  "arguments": {
    "connections": {},
    "name": "...",
    "nodes": {},
    "parentFolderId": "..."
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
