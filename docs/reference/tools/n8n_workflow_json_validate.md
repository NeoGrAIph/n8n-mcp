# `n8n_workflow_json_validate`

## Summary

Validate a workflow JSON object locally without calling n8n. Use this when you want to check a workflow structure before API calls or deployment. Provide a workflow object (nodes and connections) and optional options for validation depth. Returns validity, summary, errors, warnings, and suggestions.

- Доступность: всегда доступен (если не отключён через `DISABLED_TOOLS`).
- Транспорт: stdio и http.

## Audience

### User

- Как использовать инструмент: см. Examples.
- Как интерпретировать результат: см. Outputs и (при необходимости) встроенную справку `n8n_tools_documentation`.

### Developer

- Контракт входов (`inputSchema`) и описание: `src/mcp/tools.ts`.
- Диспетчеризация: `src/mcp/server.ts` (switch-case `executeTool`).

## Inputs / Parameters

| Parameter | Type | Required | Default | Notes |
|---|---:|:---:|---:|---|
| `options` | object | no |  | Optional validation settings |
| `workflow` | object | yes |  | The complete workflow JSON to validate. Must include nodes array and connections object. |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_workflow_json_validate",
  "arguments": {
    "workflow": {}
  }
}
```

### Advanced

```json
{
  "name": "n8n_workflow_json_validate",
  "arguments": {
    "workflow": {},
    "options": {}
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

- Tool definition: `src/mcp/tools.ts`
- Dispatch: `src/mcp/server.ts`
