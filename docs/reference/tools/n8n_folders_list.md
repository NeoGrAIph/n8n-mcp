# `n8n_folders_list`

## Summary

List folders in a project via n8n's internal REST API. Use this to browse folder structure and get folder IDs for move/delete operations. Provide projectId or omit it to use the authenticated user's personal project. Returns folder metadata and pagination cursors when available.

- Доступность: появляется в `tools/list` при конфигурации n8n API (`N8N_API_URL` + `N8N_API_KEY`) или при включённом multi-tenant (`ENABLE_MULTI_TENANT=true`) / наличии instance context.
- Транспорт: stdio и http.

> Примечание: несмотря на то, что schema делает `projectId` опциональным, текущая runtime-валидадация требует `projectId` (см. `src/mcp/server.ts`).


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
| `filter` | object | no |  | Optional filter object (will be JSON-stringified and passed as filter=...) |
| `limit` | integer | no |  | Max folders to return (server-dependent) |
| `parentFolderId` | string | no |  | Optional parent folder ID to list direct children only |
| `projectId` | string | no |  | Project ID (optional; defaults to the authenticated user's personal project) |
| `projectRelation` | boolean | no |  | Include project relation metadata (internal API flag) |
| `projectRole` | boolean | no |  | Include project role metadata (internal API flag) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_folders_list",
  "arguments": {}
}
```

### Advanced

```json
{
  "name": "n8n_folders_list",
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
