# How-to: Discover a Node and Build a Valid Config

Этот сценарий показывает базовый “happy path” для подбора ноды, получения нужных параметров и проверки конфигурации до сборки workflow.

## Steps

1. Найдите подходящую ноду по ключевому слову:
   ```json
   {
     "name": "n8n_nodes_search",
     "arguments": {
       "query": "slack",
       "limit": 10
     }
   }
   ```

2. Получите “essentials” по конкретной ноде (рекомендуемый старт):
   ```json
   {
     "name": "n8n_node_get",
     "arguments": {
       "nodeType": "n8n-nodes-base.slack",
       "detail": "standard",
       "includeExamples": true
     }
   }
   ```

3. Если нужно — найдите конкретный параметр (например, auth/headers):
   ```json
   {
     "name": "n8n_node_get",
     "arguments": {
       "nodeType": "n8n-nodes-base.httpRequest",
       "mode": "search_properties",
       "propertyQuery": "auth"
     }
   }
   ```

4. Провалидируйте конфигурацию ноды до сборки workflow:
   ```json
   {
     "name": "n8n_node_validate",
     "arguments": {
       "nodeType": "n8n-nodes-base.httpRequest",
       "mode": "minimal",
       "config": {
         "url": "https://api.example.com/data",
         "method": "GET"
       }
     }
   }
   ```

## Typical errors

- “Property not allowed / missing required”: начните с `n8n_node_get(detail=standard)` и возьмите required/common properties.
- Ошибки “special type structure” (filter/resourceLocator/etc.): см. `docs/TYPE_STRUCTURE_VALIDATION.md`.

## References

- Tools: `docs/reference/tools/n8n_nodes_search.md`, `docs/reference/tools/n8n_node_get.md`, `docs/reference/tools/n8n_node_validate.md`
- Explanation: `docs/TYPE_STRUCTURE_VALIDATION.md`

