# `n8n_node_get`

## Summary

Retrieve metadata for a specific node type. Use this when you already know the nodeType and need its schema, docs, or property search. Provide nodeType plus optional detail/mode; use mode=docs for Markdown or mode=search_properties with propertyQuery. Returns node schema metadata and focused docs/search results.

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
| `detail` | string | no | standard | Information detail level. standard=essential properties (recommended), full=everything |
| `fromVersion` | string | no |  | Source version for compare/breaking/migrations modes (e.g., "1.0") |
| `includeExamples` | boolean | no | False | Include real-world configuration examples from templates. Only applies to mode=info with detail=standard. Adds ~200-400 tokens per example. |
| `includeTypeInfo` | boolean | no | False | Include type structure metadata (type category, JS type, validation rules). Only applies to mode=info. Adds ~80-120 tokens per property. |
| `maxPropertyResults` | integer | no | 20 | For mode=search_properties: max results (default 20) |
| `mode` | string | no | info | Operation mode. info=node schema, docs=readable markdown documentation, search_properties=find specific properties, versions/compare/breaking/migrations=version info |
| `nodeType` | string | yes |  | Full node type: "nodes-base.httpRequest" or "nodes-langchain.agent" |
| `propertyQuery` | string | no |  | For mode=search_properties: search term to find properties (e.g., "auth", "header", "body") |
| `toVersion` | string | no |  | Target version for compare mode (e.g., "2.0"). Defaults to latest if omitted. |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_node_get",
  "arguments": {
    "nodeType": "..."
  }
}
```

### Advanced

```json
{
  "name": "n8n_node_get",
  "arguments": {
    "nodeType": "...",
    "detail": "standard"
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
