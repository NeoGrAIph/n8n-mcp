# `n8n_code_node_test`

## Summary

Execute a Code-node-focused generated sub-workflow through the utility runner. `mode=node` and `mode=subgraph` target a Code node and optionally include nearby non-Code nodes. Native full-workflow execution has moved to `n8n_workflow_full_test`; generated full-workflow runner execution stays in `n8n_workflow_runner_test`.

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
| `diagnostics` | string | no |  | Execution diagnostics mode (default: none) |
| `diagnosticsItemsLimit` | integer | no |  | Items per node for diagnostics (default: 2) |
| `endNodes` | array | no |  | Optional end nodes to limit subgraph expansion |
| `includeDownstream` | boolean | no |  | Include downstream descendants in subgraph (default: true for subgraph, false for node) |
| `includeUpstream` | boolean | no |  | Include upstream ancestors in subgraph (default: true for subgraph, false for node) |
| `item` | object | no |  | Optional single input object (used if items is not provided) |
| `items` | array | no |  | Optional array of input items. Each item can be a full n8n item ({json, binary}) or a plain object (will be wrapped as {json}). |
| `mode` | string | no |  | Execution mode for a single Code node or Code-node-centered subgraph (default: node). `mode=full` has moved to `n8n_workflow_full_test`. |
| `nodeId` | string | no |  | Code node ID (preferred for precision). Required for `mode=node`; also required for `mode=subgraph` unless `nodeName` is provided. |
| `nodeName` | string | no |  | Code node name (used if nodeId is not provided). Required for `mode=node`; also required for `mode=subgraph` unless `nodeId` is provided. |
| `responseMode` | string | no |  | Response shape: minimal result or full diagnostics payload (default: result) |
| `runnerWebhookPath` | string | no |  | Optional override for the runner webhook path (default: mcp-code-node-runner) |
| `runnerWorkflowId` | string | no |  | Optional override for the utility runner workflow ID |
| `startNode` | string | no |  | Start node for subgraph traversal (node name or id). Does not replace `nodeId`/`nodeName`. |
| `timeout` | integer | no |  | Timeout in ms for the runner webhook call |
| `waitForResponse` | boolean | no |  | Wait for workflow completion (default: true) |
| `workflowId` | string | yes |  | Workflow ID to execute through the utility runner |

## Outputs

- Возвращает JSON-результат операции.
- Формат результата зависит от tool и выбранного режима/параметров.

## Examples

### Basic

```json
{
  "name": "n8n_code_node_test",
  "arguments": {
    "workflowId": "example-id",
    "mode": "node",
    "nodeName": "My Code"
  }
}
```

### Advanced

```json
{
  "name": "n8n_code_node_test",
  "arguments": {
    "workflowId": "example-id",
    "mode": "subgraph",
    "nodeName": "My Code",
    "startNode": "Prepare Data",
    "includeDownstream": true,
    "diagnostics": "summary"
  }
}
```

## Errors / Failure Modes

- `invalid_arguments`: отсутствуют обязательные поля или неверные типы.
- `tool_disabled`: инструмент выключен через `DISABLED_TOOLS`.
- `not_configured`: требуется конфигурация (например, n8n API или workflow-files root) и она отсутствует.
- `Target node not found in workflow`: в `mode=node` или `mode=subgraph` не найден target node.
- `mode=full has moved to n8n_workflow_full_test`: используйте новый tool для native full-workflow execution.
- `Node "..." is not a Code node`: выбранная node существует, но её тип не `Code`.
- `Runner workflow not found`: отсутствует utility runner workflow.
- В HTTP режиме: `401/403` при отсутствии/неверном `Authorization: Bearer ...`.

## Security / Permissions

- Не логируйте и не коммитьте секреты: `AUTH_TOKEN`, `N8N_API_KEY`, `N8N_REST_PASSWORD`.
- Для инструментов управления workflow учитывайте, что операции могут быть разрушительными (delete/truncate/rollback).

## Source of Truth

- Tool definition: `src/mcp/tools-n8n-manager.ts`
- Dispatch: `src/mcp/server.ts`
