# `n8n_set_file_read`

## Summary

Read a Set(raw) node JSON file by workflowId and nodeId. Use this when you need the current raw JSON payload for a Set node. Provide workflowId and nodeId. Returns file content plus metadata (etag, size, lastModified) for concurrency control.

- Доступность: появляется в `tools/list` только если настроен workflow-files root (`N8N_WORKFLOWS_ROOT` или `WORKFLOWS_ROOT`) и директория существует.
- Транспорт: stdio и http.
 - Примечание: ответы также включают `relativePath` (относительно `N8N_WORKFLOWS_ROOT`) и `path` (display-путь; настраивается через `N8N_WORKFLOWS_DISPLAY_ROOT`).

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
| `nodeId` | string | yes |  | Node UUID for the Set(raw) node file |
| `workflowId` | string | yes |  | Workflow ID (directory is code_nodes_<workflowId> under workflows; pass raw workflowId) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_set_file_read",
  "arguments": {
    "nodeId": "example-id",
    "workflowId": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_set_file_read",
  "arguments": {
    "nodeId": "example-id",
    "workflowId": "example-id"
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
