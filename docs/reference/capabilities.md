# Functional Capabilities

| ID | Capability | Description | Verification |
|---|---|---|---|
| CAP-mcp-stdio | MCP server (stdio) | MCP сервер запускается в режиме stdio для локальной интеграции с клиентами (Claude Desktop/Codex/Cursor и т.д.). | Runbook: [Connect Claude Desktop](../runbooks/integrations/claude-desktop.md) |
| CAP-http-health | HTTP health endpoint | В режиме `MCP_MODE=http` сервер поднимает HTTP API и отдаёт `/health`. | См. runbook: [HTTP deployment](../runbooks/deployment/http-server.md) |
| CAP-tools-documentation | Tools documentation | Сервер предоставляет инструмент документации (`n8n_tools_documentation`) и актуальные описания MCP tools. | `npm run build && node dist/scripts/test-tools-documentation.js` (см. также: [tool ref](./tools/n8n_tools_documentation.md)) |
| CAP-n8n-api-tools | n8n API management tools (optional) | При конфигурации `N8N_API_URL`/`N8N_API_KEY` доступны инструменты управления workflow через n8n API. | How-to: [Create/Update/Validate workflow](../how-to/workflow-create-update-validate.md) |
