# How-to: Find a Template and Use It as a Starting Point

Этот сценарий показывает, как находить workflow templates локально (из базы templates n8n-mcp) и использовать их для ускорения сборки.

## Steps

1. Найдите шаблон по задаче:
   ```json
   {
     "name": "n8n_templates_search",
     "arguments": {
       "searchMode": "by_task",
       "task": "send_email",
       "limit": 5
     }
   }
   ```

2. Или найдите шаблон по нодам:
   ```json
   {
     "name": "n8n_templates_search",
     "arguments": {
       "searchMode": "by_nodes",
       "nodeTypes": ["n8n-nodes-base.httpRequest"],
       "limit": 5
     }
   }
   ```

3. Получите конкретный template:
   ```json
   {
     "name": "n8n_template_get",
     "arguments": {
       "templateId": "template-id-here",
       "mode": "full"
     }
   }
   ```

4. (Опционально, требует n8n API) Разверните template в вашем n8n:
   ```json
   {
     "name": "n8n_template_deploy",
     "arguments": {
       "templateId": "template-id-here",
       "name": "Deployed from template",
       "autoFix": true,
       "stripCredentials": true
     }
   }
   ```

## Typical errors

- `n8n_template_deploy` не появляется в `tools/list`: проверьте `N8N_API_URL` + `N8N_API_KEY` (см. `docs/N8N_DEPLOYMENT.md`).
  Каноничный документ: `docs/how-to/integrations/N8N_DEPLOYMENT.md`.

## References

- Tools: `docs/reference/tools/n8n_templates_search.md`, `docs/reference/tools/n8n_template_get.md`, `docs/reference/tools/n8n_template_deploy.md`
