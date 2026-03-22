# How-to: Test Workflow Runs with `n8n-mcp`

Этот сценарий описывает, как исследовать и практически использовать тестовые запуски workflow через `n8n-mcp`, и фиксирует реальные результаты для workflow `iCrjIm7btusUuVAS27s8H` (`https://n8n.dev.synestra.tech/workflow/iCrjIm7btusUuVAS27s8H`).

## What `n8n-mcp` actually supports

У `n8n-mcp` есть четыре разных класса test-run tools:

1. `n8n_workflow_test`
   Используется только для externally triggerable workflows.
   Поддерживаемые trigger types:
   - `webhook`
   - `form`
   - `chat`

2. `n8n_workflow_full_test`
   Используется через native `POST /rest/workflows/:id/run`.
   Это preferred full test path для manual/editor workflows, когда нужны нативные semantics n8n.

3. `n8n_workflow_runner_test`
   Используется через utility runner и generated full sub-workflow.
   Подходит, когда нужен именно generated runner path: synthetic items, dry-run, diagnostics на generated workflow.

4. `n8n_code_node_test`
   Используется через utility runner и generated sub-workflow вокруг Code node.
   Поддерживаемые режимы:
   - `mode=node`
   - `mode=subgraph`

Это важно:
- `n8n_workflow_test` не умеет запускать `manualTrigger`.
- `n8n_workflow_full_test` закрывает native full workflow execution.
- `n8n_workflow_runner_test` закрывает generated runner-based full workflow execution.
- `n8n_code_node_test` в `mode=node` и `mode=subgraph` требует target Code node через `nodeId` или `nodeName`.

## Practical baseline for workflow `iCrjIm7btusUuVAS27s8H`

Подтверждённое состояние workflow:
- `active: false`
- trigger node: `n8n-nodes-base.manualTrigger`
- `hasWebhookTrigger: false`
- Code nodes отсутствуют
- есть `Set(raw)` node `Edit Fields` с `nodeId=216c0039-263c-44af-9633-1f4cea845d54`
- в истории есть успешные `manual` executions

Следствие:
- `n8n_workflow_test` для этого workflow сейчас неприменим
- `n8n_code_node_test(mode=node|subgraph)` сейчас неприменим
- `n8n_workflow_full_test` сейчас применим и является preferred full test path
- `n8n_workflow_runner_test` тоже применим, но это уже не native path

## Variant 1: `n8n_workflow_test`

### When it works

Используйте этот tool только если workflow содержит один из trigger nodes:
- Webhook Trigger
- Form Trigger
- Chat Trigger

Для всех этих путей workflow должен быть `active=true`.

### What happens on the target workflow

Для `iCrjIm7btusUuVAS27s8H` вызов:

```json
{
  "name": "n8n_workflow_test",
  "arguments": {
    "workflowId": "iCrjIm7btusUuVAS27s8H",
    "waitForResponse": true
  }
}
```

возвращает отказ:

```json
{
  "success": false,
  "error": "Workflow cannot be triggered externally",
  "details": {
    "reason": "Workflow has trigger nodes but none support external triggering (found: n8n-nodes-base.manualTrigger). Only webhook, form, and chat triggers can be triggered via the API."
  }
}
```

### How to use it after adaptation

Если вы хотите именно `n8n_workflow_test`, workflow нужно адаптировать:

1. `webhook`
   Добавить Webhook Trigger и активировать workflow.

   Пример вызова:
   ```json
   {
     "name": "n8n_workflow_test",
     "arguments": {
       "workflowId": "your-workflow-id",
       "triggerType": "webhook",
       "data": {
         "sample": true
       },
       "waitForResponse": true
     }
   }
   ```

2. `form`
   Добавить Form Trigger и активировать workflow.

   Пример вызова:
   ```json
   {
     "name": "n8n_workflow_test",
     "arguments": {
       "workflowId": "your-workflow-id",
       "triggerType": "form",
       "data": {
         "email": "test@example.com"
       },
       "waitForResponse": true
     }
   }
   ```

3. `chat`
   Добавить Chat Trigger, активировать workflow и передавать `message`.

   Пример вызова:
   ```json
   {
     "name": "n8n_workflow_test",
     "arguments": {
       "workflowId": "your-workflow-id",
       "triggerType": "chat",
       "message": "test message",
       "sessionId": "debug-session-1",
       "waitForResponse": true
     }
   }
   ```

### How to inspect results

После успешного запуска используйте:
- `n8n_workflow_execution_get`
- `n8n_executions_get`
- `n8n_executions_list`

## Variant 2: `n8n_workflow_full_test`

### When it works

Этот режим требует:
- `N8N_REST_EMAIL`
- `N8N_REST_PASSWORD`
- доступа к native REST path `/rest/workflows/:id/run`

Он:
- читает исходный workflow через API;
- выбирает `triggerNode`;
- выбирает `startNodes`;
- запускает исходный workflow через native full-test endpoint.

Это preferred full test path, если вам нужны semantics максимально близкие к кнопке `Execute workflow` в самом n8n.

### What happens on the target workflow

Для `iCrjIm7btusUuVAS27s8H` вызов:

```json
{
  "name": "n8n_workflow_full_test",
  "arguments": {
    "workflowId": "iCrjIm7btusUuVAS27s8H",
    "waitForCompletion": true,
    "responseMode": "result",
    "timeout": 180000
  }
}
```

должен использовать:
- `triggerNodeName = "When clicking \"Execute workflow\""`
- `startNodeNames = ["Edit Fields"]` или весь прямой downstream набор, если у trigger несколько children

Этот путь теперь является preferred способом инициировать full test run данного workflow через `n8n-mcp`.

### When to use it

Используйте этот tool, когда:
- workflow manual-only или editor-style;
- нужен нативный full-run путь без генерации sub-workflow;
- вы хотите semantics, близкие к встроенному запуску n8n.

### Risks

Этот tool запускает реальные nodes внутри workflow.
Если в workflow есть внешние side effects, они тоже сработают.

## Variant 3: `n8n_workflow_runner_test`

### When it works

Этот режим не требует externally triggerable workflow и не требует native `/rest/workflows/:id/run`.

Он:
- читает исходный workflow через API;
- удаляет trigger nodes из generated sub-workflow;
- добавляет `Execute Workflow Trigger`;
- запускает resulting workflow через utility runner.

Target Code node здесь не нужен, но semantics у этого режима уже не нативные: workflow переписывается в generated sub-workflow.

### What happens on the target workflow

Для `iCrjIm7btusUuVAS27s8H` вызов:

```json
{
  "name": "n8n_workflow_runner_test",
  "arguments": {
    "workflowId": "iCrjIm7btusUuVAS27s8H",
    "waitForResponse": true,
    "responseMode": "result",
    "timeout": 180000
  }
}
```

успешно отработал и вернул `executionId=2471` вместе с итоговым результатом workflow.

Этот путь остаётся рабочим fallback/alternative, когда нужен dry-run, synthetic input items или именно generated runner path.

### When to use it

Используйте этот tool, когда:
- нужен `dryRun`;
- нужно прогнать synthetic `item/items`;
- нужна именно generated runner semantics для сравнения или изоляции.

### Risks

Этот tool запускает реальные nodes внутри workflow.
Если в workflow есть внешние side effects, они тоже сработают.

## Variant 4: `n8n_code_node_test(mode=node)`

### When it works

Этот режим требует:
- `nodeId` или `nodeName`
- и выбранная node должна быть именно Code node

### What happens on the target workflow

Для текущего workflow попытка:

```json
{
  "name": "n8n_code_node_test",
  "arguments": {
    "workflowId": "iCrjIm7btusUuVAS27s8H",
    "mode": "node",
    "nodeName": "Edit Fields",
    "waitForResponse": true
  }
}
```

возвращает:

```json
{
  "success": false,
  "error": "Node \"Edit Fields\" is not a Code node"
}
```

### When to use it

Используйте `mode=node`, когда нужно:
- изолированно проверить JS/Python Code node;
- подать synthetic input через `item` или `items`;
- не гонять весь workflow.

## Variant 5: `n8n_code_node_test(mode=subgraph)`

### When it works

Этот режим требует:
- `nodeId` или `nodeName` target Code node
- optional `startNode`
- optional `includeUpstream`
- optional `includeDownstream`
- optional `endNodes`

На практике `startNode` не заменяет target Code node.

### What happens on the target workflow

Для текущего workflow путь неприменим:
- `startNode` без `nodeId/nodeName` приводит к `Target node not found in workflow`
- `nodeName` на non-Code node приводит к `Node "... " is not a Code node`

### When to use it

Используйте `mode=subgraph`, когда:
- вокруг Code node есть preparatory Set/Transform nodes;
- нужно запускать только relevant branch;
- нужно включить upstream/downstream graph, но не весь workflow.

## Read-only inspection that is useful today

Даже без изменения workflow через `n8n-mcp` уже полезно делать следующее.

### 1. Read workflow topology

```json
{
  "name": "n8n_workflow_get",
  "arguments": {
    "id": "iCrjIm7btusUuVAS27s8H",
    "mode": "structure"
  }
}
```

### 2. Read `Set(raw)` fixture

Для этого workflow fixture лежит в `Edit Fields`:

```json
{
  "name": "n8n_set_file_read",
  "arguments": {
    "workflowId": "iCrjIm7btusUuVAS27s8H",
    "nodeId": "216c0039-263c-44af-9633-1f4cea845d54"
  }
}
```

Это источник тестовых кейсов для workflow.

### 3. Read recent executions

```json
{
  "name": "n8n_executions_list",
  "arguments": {
    "workflowId": "iCrjIm7btusUuVAS27s8H",
    "limit": 5
  }
}
```

На момент исследования последние execution этого workflow были `manual` и `success`.

### 4. Read execution result

```json
{
  "name": "n8n_workflow_execution_get",
  "arguments": {
    "workflowId": "iCrjIm7btusUuVAS27s8H",
    "executionId": "2470",
    "mode": "summary",
    "includeInputData": true
  }
}
```

Это удобно для сравнения:
- baseline ручного execution;
- результата `n8n_workflow_runner_test`.

## Recommended workflow for this specific workflow

Для `iCrjIm7btusUuVAS27s8H` рекомендуемый operational path такой:

1. Прочитать topology через `n8n_workflow_get`.
2. Прочитать `Set(raw)` fixture через `n8n_set_file_read`.
3. Прочитать 1-2 последних `manual` executions через `n8n_executions_list` и `n8n_workflow_execution_get`.
4. Выполнить `n8n_workflow_runner_test` как воспроизводимый тестовый прогон через `n8n-mcp`.
5. При необходимости сравнить result runner execution с baseline ручного execution.

Если нужен именно `n8n_workflow_test`, workflow сначала надо перевести на `webhook`, `form` или `chat`.

## Related tools

- `n8n_workflow_test`
- `n8n_workflow_runner_test`
- `n8n_code_node_test`
- `n8n_workflow_get`
- `n8n_executions_list`
- `n8n_executions_get`
- `n8n_workflow_execution_get`
- `n8n_set_files_list`
- `n8n_set_file_read`
