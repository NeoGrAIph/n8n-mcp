# `n8n_workflow_autofix`

## Summary

Generate or apply automatic fixes for a workflow. Use this when validation finds common issues that can be corrected. Provide id and optional applyFixes, fixTypes, confidenceThreshold, and maxFixes; applyFixes=false previews only. Returns fix summaries and counts, and writes changes when applyFixes is true.

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
| `applyFixes` | boolean | no |  | Apply fixes to workflow (default: false - preview mode) |
| `confidenceThreshold` | string | no |  | Minimum confidence level for fixes (default: medium) |
| `fixTypes` | array | no |  | Types of fixes to apply (default: all) |
| `id` | string | yes |  | Workflow ID to fix |
| `maxFixes` | integer | no |  | Maximum number of fixes to apply (default: 50) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_workflow_autofix",
  "arguments": {
    "id": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_workflow_autofix",
  "arguments": {
    "id": "example-id",
    "applyFixes": true
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
