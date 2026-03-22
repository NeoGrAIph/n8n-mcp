# n8n-mcp

MCP (Model Context Protocol) сервер и Node.js библиотека для работы с n8n: документация по нодам, поиск, валидация конфигураций, а также (опционально) управление workflow через n8n API.

## Quick start

### Локально (stdio)
```bash
npm install
npm run build
node dist/mcp/index.js
```

### HTTP-сервер (Docker)
```bash
AUTH_TOKEN="$(openssl rand -base64 32)" \
  MCP_MODE=http \
  USE_FIXED_HTTP=true \
  docker compose up -d
curl http://localhost:3000/health
```

## Структура
- `docs/` — документация и индексы (start here: `docs/README.md`)
- `docs/reference/capabilities.md` — каноничный список функциональных возможностей и как их верифицировать
- `src/` — исходный код
- `scripts/` — вспомогательные скрипты (build/release/tests/docs checks)
- `docker/` — docker entrypoint/утилиты
- `deploy/` — вспомогательные материалы для деплоя
- `tests/` — тесты
- `data/` — данные (в т.ч. SQLite БД с нодами)

## Documentation
- `docs/README.md`

## 🧰 Available MCP tools

Каноничный справочник по инструментам:
- `docs/reference/tools/README.md`

Примечания по доступности:
- “documentation tools” доступны всегда (если не отключены через `DISABLED_TOOLS`).
- “management tools” доступны при конфигурации n8n API (`N8N_API_URL` + `N8N_API_KEY`) или в multi-tenant режиме.
- “workflow files tools” доступны при наличии workflow root (`N8N_WORKFLOWS_ROOT`/`WORKFLOWS_ROOT`, дефолт `/workflows`) и существующей директории.
- Подробная настройка и troubleshooting: `docs/how-to/workflow-files-code-set.md`.

## 🤖 Claude project setup

Если вы используете n8n-mcp из IDE/AI-клиента (Claude Desktop/Claude Code/Codex/Cursor/VS Code), рекомендуемый путь:
- начните с `docs/README.md` (индекс по Diátaxis);
- настройка Claude Desktop: `docs/how-to/clients/README_CLAUDE_SETUP.md`.

## Contributing
- `CONTRIBUTING.md`


## Synestra Platform (n8n-workflows as code)

В платформе Synestra workflow n8n ведутся в Git как артефакты (репозиторий `n8n-workflows`).
- Dev: двунаправленная синхронизация UI/API <-> files (для быстрого DevOps-цикла).
- Prod: однонаправленная синхронизация UI/API -> files (для фиксации боевого состояния).

Подробности: `docs/explanation/SYNESTRA_PLATFORM_GITOPS_N8N_WORKFLOWS.md`.
