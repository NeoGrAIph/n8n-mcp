# How-to: Work with Code/Set Node Files (Workflow Files Tools)

Этот сценарий предназначен для случаев, когда вы храните/синхронизируете содержимое нод Code/Set как файлы в репозитории/директории.

## Preconditions

- Настроен workflow-files root: `N8N_WORKFLOWS_ROOT` или `WORKFLOWS_ROOT` указывает на существующую директорию.
- В `tools/list` присутствуют workflow files tools (см. `docs/reference/tools/README.md`).

## Steps

1. Получите список файлов Code нод:
   ```json
   {
     "name": "n8n_code_files_list",
     "arguments": {
       "workflowId": "workflow-id-here"
     }
   }
   ```

2. Прочитайте файл конкретной Code ноды:
   ```json
   {
     "name": "n8n_code_file_read",
     "arguments": {
       "workflowId": "workflow-id-here",
       "nodeId": "node-id-here"
     }
   }
   ```

3. Запишите обновлённый контент (используйте `expectedEtag` для защиты от гонок):
   ```json
   {
     "name": "n8n_code_file_write",
     "arguments": {
       "workflowId": "workflow-id-here",
       "nodeId": "node-id-here",
       "content": "export default async function() { return items; }",
       "language": "javascript",
       "expectedEtag": "etag-from-read"
     }
   }
   ```

4. Примените patch к workflow-файлу по URI:
   ```json
   {
     "name": "n8n_workflow_file_patch",
     "arguments": {
       "uri": "n8n-workflows:///code/workflow-id/node-id.js",
       "patch": "*** Begin Patch\\n*** Update File: code.js\\n@@\\n- old\\n+ new\\n*** End Patch\\n"
     }
   }
   ```

## Typical errors

- Tools не появляются: проверьте, что директория `WORKFLOWS_ROOT` существует и доступна на чтение/запись для процесса.
- Ошибки `etag_mismatch`: перечитайте файл и повторите запись с актуальным ETag.

## References

- Tools: `docs/reference/tools/n8n_code_files_list.md`, `docs/reference/tools/n8n_code_file_read.md`, `docs/reference/tools/n8n_code_file_write.md`, `docs/reference/tools/n8n_workflow_file_patch.md`

