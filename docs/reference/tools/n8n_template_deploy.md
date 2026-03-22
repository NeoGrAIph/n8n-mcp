# `n8n_template_deploy`

## Summary

Deploy a workflow template from the local template database into n8n. Use this when you want to create a workflow from a known template ID. Provide templateId and optional name, autoUpgradeVersions, autoFix, and stripCredentials. Returns the new workflow id plus status and required credentials.

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
| `autoFix` | boolean | no | True | Auto-apply fixes after deployment for expression format issues, missing = prefix, etc. (default: true) |
| `autoUpgradeVersions` | boolean | no | True | Automatically upgrade node typeVersions to latest supported (default: true) |
| `name` | string | no |  | Custom workflow name (default: template name) |
| `stripCredentials` | boolean | no | True | Remove credential references from nodes - user configures in n8n UI (default: true) |
| `templateId` | integer | yes |  | Template ID from n8n.io (required) |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_template_deploy",
  "arguments": {
    "templateId": "example-id"
  }
}
```

### Advanced

```json
{
  "name": "n8n_template_deploy",
  "arguments": {
    "templateId": "example-id",
    "autoFix": true
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
