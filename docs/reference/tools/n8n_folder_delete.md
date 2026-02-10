# `n8n_folder_delete`

## Summary

Delete an empty folder in a project (internal REST API). Use this only for empty folders; non-empty deletes should fail. Provide folderId and optional projectId. If projectId is omitted, the authenticated user's personal project is used. Returns confirmation of deletion.

- Доступность: появляется в `tools/list` при конфигурации n8n API (`N8N_API_URL` + `N8N_API_KEY`) или при включённом multi-tenant (`ENABLE_MULTI_TENANT=true`) / наличии instance context.
- Транспорт: stdio и http.

> Примечание: несмотря на то, что schema делает `projectId` опциональным, текущая runtime-валидация требует `projectId` (см. `src/mcp/server.ts`).


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
| `folderId` | string | yes |  | Folder ID to delete (must be empty) |
| `projectId` | string | no |  | Project ID (optional; defaults to the authenticated user's personal project) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_folder_delete",
  "arguments": {
    "folderId": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_folder_delete",
  "arguments": {
    "folderId": "example-id",
    "projectId": "..."
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
