# `n8n_code_files_list`

## Summary

List Code node source files for a workflow. Use this when you need the available Code node files and their metadata for a specific workflow. Provide workflowId to target the workflow folder. Returns file descriptors with nodeId, language, uri, etag, size, and lastModified.

- Доступность: появляется в `tools/list` только если настроен workflow-files root (`N8N_WORKFLOWS_ROOT` или `WORKFLOWS_ROOT`) и директория существует.
- Транспорт: stdio и http.
 - Примечание: ответы также включают `relativePath` (относительно `N8N_WORKFLOWS_ROOT`, с учётом подпапок workflow) и `path` (display-путь; настраивается через `N8N_WORKFLOWS_DISPLAY_ROOT`).

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
| `workflowId` | string | yes |  | Workflow ID (directory is code_nodes_<workflowId> under workflows; pass raw workflowId) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_code_files_list",
  "arguments": {
    "workflowId": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_code_files_list",
  "arguments": {
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
