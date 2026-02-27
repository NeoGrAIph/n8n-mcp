# How-to: Work with Code/Set Node Files (Workflow Files Tools)

Этот сценарий предназначен для случаев, когда вы храните/синхронизируете содержимое нод Code/Set как файлы в репозитории/директории.

## Configuration model (critical)

- `N8N_WORKFLOWS_ROOT` (или legacy `WORKFLOWS_ROOT`) задаёт **реальный** корень файлов, из которого `n8n-mcp` читает/пишет Code/Set файлы.
- Если обе переменные не заданы, используется дефолт `'/workflows'`.
- Workflow files tools доступны только когда итоговая директория реально существует (read/write).
- `N8N_WORKFLOWS_DISPLAY_ROOT` (или `WORKFLOWS_DISPLAY_ROOT`) влияет только на поле `path` в ответах.
- `N8N_WORKFLOWS_DISPLAY_ROOT` **не влияет** на поиск файлов, `workflowId`-резолвинг и запись.

## Preconditions

- Настроен workflow-files root (`N8N_WORKFLOWS_ROOT` или `WORKFLOWS_ROOT`) и директория доступна процессу n8n-mcp.
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
   Примечание: ответы включают:
   - `uri` (стабильный виртуальный идентификатор вида `n8n-workflows:///code/...`)
   - `relativePath` (путь к файлу относительно `N8N_WORKFLOWS_ROOT`, включая подпапки workflow)
   - `path` (display-путь; строится из `N8N_WORKFLOWS_DISPLAY_ROOT` или `HOME`)

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
       "uri": "n8n-workflows:///code/workflow-id/node-id.json",
       "patch": "*** Begin Patch\\n*** Update File: node-id.json\\n@@\\n- old\\n+ new\\n*** End Patch\\n"
     }
   }
   ```

## Typical errors and recovery

### Tools не появляются в `tools/list`

Проверьте по порядку:
1. Директория workflow root существует внутри процесса/контейнера n8n-mcp.
2. Процесс видит корректные env (`N8N_WORKFLOWS_ROOT`/`WORKFLOWS_ROOT`).
3. У процесса есть права чтения/записи в этой директории.
4. Используйте `tools/list` как источник истины по доступности tools; `n8n_health_check` в некоторых сборках может ориентироваться только на `N8N_WORKFLOWS_ROOT`.

### `Workflow directory not found for workflowId ...`

Это означает, что по текущему workflow root не найден каталог с нужным `workflowId`.

Проверьте:
1. `workflowId` передан корректно (без slug, только raw id).
2. В файловом дереве есть `code_nodes_<workflowId>` (или legacy-структура под этот id).
3. Корень в n8n-mcp действительно смотрит на актуальный слой файлов (`n8n-workflows/.../workflows`).

Если у вас Synestra dev (Camel K + Debezium + n8n-sync-controller):
1. Сравните содержимое `/workflows` в `mcp-n8n` и `n8n-sync-controller` pod'ах.
2. При рассинхроне mount (в других pod файлы есть, а в mcp-n8n нет) выполните restart pod `mcp-n8n`.
3. После рестарта повторите `n8n_code_files_list`/`n8n_set_files_list`.

### `etag_mismatch`

Файл был изменён параллельно. Перечитайте файл, возьмите новый `etag` и повторите запись/patch.

### `path` в ответе выглядит "не там"

Обычно это настройка display-root. Поле `path` формируется от `N8N_WORKFLOWS_DISPLAY_ROOT` и может отличаться от физического mount path. Это не ошибка само по себе.

## References

- Tools: `docs/reference/tools/n8n_code_files_list.md`, `docs/reference/tools/n8n_code_file_read.md`, `docs/reference/tools/n8n_code_file_write.md`, `docs/reference/tools/n8n_workflow_file_patch.md`
- Synestra explanation: `docs/explanation/SYNESTRA_PLATFORM_GITOPS_N8N_WORKFLOWS.md`
