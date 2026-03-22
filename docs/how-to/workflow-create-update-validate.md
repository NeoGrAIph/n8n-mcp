# How-to: Create and Update a Workflow via n8n API Tools

Этот сценарий предназначен для случаев, когда n8n-mcp сконфигурирован с доступом к n8n API и предоставляет management tools.

## Steps

1. Создайте workflow:
   ```json
   {
     "name": "n8n_workflow_create",
     "arguments": {
       "name": "Example workflow",
       "nodes": [],
       "connections": {}
     }
   }
   ```

2. Проверьте workflow на стороне n8n:
   ```json
   {
     "name": "n8n_workflow_validate",
     "arguments": {
       "id": "workflow-id-here"
     }
   }
   ```

3. Внесите минимальные изменения через diff-операции (предпочтительно):
   ```json
   {
     "name": "n8n_workflow_update_partial",
     "arguments": {
       "id": "workflow-id-here",
       "operations": [
         {
           "type": "addNode",
           "description": "Add HTTP Request node",
           "node": {
             "name": "Fetch",
             "type": "n8n-nodes-base.httpRequest",
             "position": [600, 300],
             "parameters": {
               "url": "https://api.example.com/data",
               "method": "GET"
             }
           }
         }
       ]
     }
   }
   ```

4. Запустите тестовое выполнение подходящим способом:
   ```json
   {
     "name": "n8n_workflow_test",
     "arguments": {
        "workflowId": "workflow-id-here",
       "triggerType": "webhook"
     }
   }
   ```

   Для manual-only workflow вместо этого используйте runner path:
   ```json
   {
     "name": "n8n_workflow_runner_test",
     "arguments": {
       "workflowId": "workflow-id-here",
       "dryRun": true
     }
   }
   ```

## Notes

- Для операций “папок” (`n8n_folders_list`, `n8n_folder_*`) сейчас фактически требуется `projectId` (см. примечания в per-tool reference).

## References

- Tools: `docs/reference/tools/n8n_workflow_create.md`, `docs/reference/tools/n8n_workflow_update_partial.md`, `docs/reference/tools/n8n_workflow_validate.md`, `docs/reference/tools/n8n_workflow_test.md`, `docs/reference/tools/n8n_workflow_runner_test.md`
- Examples: `docs/workflow-diff-examples.md`
