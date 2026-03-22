# `n8n_node_validate`

## Summary

Validate a node configuration against its schema. Use this when you want to check required fields or perform full validation before building a workflow. Provide nodeType and config, and choose mode (minimal/full) with optional profile. Returns a structured validation result with errors, warnings, and suggestions.

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
| `config` | object | yes |  | Configuration as object. For simple nodes use {}. For complex nodes include fields like {resource:"channel",operation:"create"} |
| `mode` | string | no | full | Validation mode. full=comprehensive validation with errors/warnings/suggestions, minimal=quick required fields check only. Default is "full" |
| `nodeType` | string | yes |  | Node type as string. Example: "nodes-base.slack" |
| `profile` | string | no | ai-friendly | Profile for mode=full: "minimal", "runtime", "ai-friendly", or "strict". Default is "ai-friendly" |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_node_validate",
  "arguments": {
    "config": {},
    "nodeType": "..."
  }
}
```

### Advanced

```json
{
  "name": "n8n_node_validate",
  "arguments": {
    "config": {},
    "nodeType": "...",
    "mode": "full"
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
