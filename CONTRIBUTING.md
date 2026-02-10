# Contributing

Спасибо за вклад в n8n-mcp.

## Development

Предпочитайте “официальные” команды из `package.json` scripts.

```bash
npm install
npm run build
npm run test
```

Полезные команды:
- `npm run rebuild` — пересборка БД нод
- `npm run validate` — базовая валидация данных/сборки
- `npm run start:http:fixed` — запуск HTTP режима (при `MCP_MODE=http`)

## Documentation

Документация ведётся по стандарту v2 (см. `docs/README.md`).

Обязательные артефакты:
- `docs/metadata/repo.yaml` (profile)
- `docs/reference/capabilities.md` (контракт + verification)
- `docs/adr/README.md` (индекс ADR)
- `docs/runbooks/` (для profile `service`)

Перед PR (по возможности) запустите проверки документации:
```bash
bash scripts/check-docs-structure.sh
bash scripts/check-docs-index-links.sh
bash scripts/check-runbooks-audience.sh
```

