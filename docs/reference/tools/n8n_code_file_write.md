# `n8n_code_file_write`

## Summary

Write a Code node source file by workflowId and nodeId. Use this when you need to update or create Code node content. Provide content and expectedEtag to protect against concurrent edits; include language when creating a new file so the extension is chosen correctly. Returns updated metadata (etag, size, uri) after the write.

- Доступность: появляется в `tools/list`, когда workflow-files root существует и доступен процессу (`N8N_WORKFLOWS_ROOT` -> `WORKFLOWS_ROOT` -> `/workflows`).
- Транспорт: stdio и http.

## Audience

### User

- Как использовать инструмент: см. Examples.
- Как интерпретировать результат: см. Outputs и (при необходимости) встроенную справку `n8n_tools_documentation`.

### Developer

- Контракт входов (`inputSchema`) и описание: `src/mcp/tools-workflow-files.ts`.
- Диспетчеризация: `src/mcp/server.ts` (switch-case `executeTool`).

## Inputs / Parameters

| Parameter | Type | Required | Default | Notes |
|---|---:|:---:|---:|---|
| `content` | string | yes |  | Full file contents to write |
| `expectedEtag` | string | no |  | Optional ETag for optimistic concurrency control |
| `language` | string | no |  | Required when creating a new file. Accepted values: python/py, javascript/js/json. |
| `nodeId` | string | yes |  | Node UUID for the Code node file |
| `workflowId` | string | yes |  | Workflow ID (directory is code_nodes_<workflowId> under workflows; pass raw workflowId) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_code_file_write",
  "arguments": {
    "content": "...",
    "nodeId": "example-id",
    "workflowId": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_code_file_write",
  "arguments": {
    "content": "...",
    "nodeId": "example-id",
    "workflowId": "example-id",
    "expectedEtag": "..."
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

- Tool definition: `src/mcp/tools-workflow-files.ts`
- Dispatch: `src/mcp/server.ts`
