# `n8n_folder_create`

## Summary

Create a folder in a project (internal REST API). Use this to create root or nested folders. Provide name and optional projectId/parentFolderId. If projectId is omitted, the folder is created in the authenticated user's personal project. Returns the created folder metadata.

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
| `name` | string | yes |  | Folder name |
| `parentFolderId` | ["string", "null"] | no |  | Parent folder ID (null or omit for root) |
| `projectId` | string | no |  | Project ID (optional; defaults to the authenticated user's personal project) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_folder_create",
  "arguments": {
    "name": "..."
  }
}
```

### Advanced

```json
{
  "name": "n8n_folder_create",
  "arguments": {
    "name": "...",
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
