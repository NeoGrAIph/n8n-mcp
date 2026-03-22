# `n8n_workflow_file_patch`

## Summary

Apply a unified diff patch to a workflow file (Code or Set). Wrapper-style patches (*** Begin/End Patch, ---/+++) are accepted and stripped. Use this when you need to edit part of a file without sending full contents. Provide uri, patch, and expectedEtag to protect against concurrent edits. Returns updated metadata (etag, size, lastModified).

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
| `expectedEtag` | string | no |  | Optional ETag for optimistic concurrency control |
| `ignoreWhitespaceInContext` | boolean | no |  | If true, ignores whitespace changes when matching context lines |
| `maxFuzz` | integer | no |  | Maximum fuzz to allow when matching context (default: 0, max: 2) |
| `minContextLines` | integer | no |  | Minimum number of context lines that must match (default: 0) |
| `patch` | string | yes |  | Unified diff patch to apply to the file contents (wrapper lines are tolerated) |
| `uri` | string | yes |  | Resource URI: n8n-workflows:///code/{workflowId}/{nodeId}.{ext} or n8n-workflows:///set/{workflowId}/{nodeId}.set.json |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_workflow_file_patch",
  "arguments": {
    "patch": {},
    "uri": "..."
  }
}
```

### Advanced

```json
{
  "name": "n8n_workflow_file_patch",
  "arguments": {
    "patch": {},
    "uri": "...",
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
