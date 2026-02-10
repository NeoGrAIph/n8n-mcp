# Security

Этот документ описывает практики безопасного использования n8n-mcp.

## Secrets

Не коммитьте и не логируйте полностью:
- `AUTH_TOKEN` / `AUTH_TOKEN_FILE` (HTTP auth)
- `N8N_API_KEY` (управление workflow)
- `N8N_REST_PASSWORD` (REST credentials)

Рекомендуется хранить секреты в менеджере секретов и прокидывать их через окружение/файлы, а не через аргументы командной строки.

## HTTP Mode (Auth, Rate limit)

В режиме `MCP_MODE=http` все вызовы `POST /mcp` должны быть защищены Bearer token.
Дополнительно доступны настройки rate limiting аутентификации (см. `docs/HTTP_DEPLOYMENT.md` и `.env.example`).

## SSRF / Webhook Security

При использовании инструментов, которые конфигурируют webhooks/HTTP запросы, включайте SSRF-защиту (см. `WEBHOOK_SECURITY_MODE` в `.env.example` и `docs/HTTP_DEPLOYMENT.md`).

## References

- `.env.example`
- `docs/HTTP_DEPLOYMENT.md`
- `docs/DOCKER_README.md`
- `docs/DOCKER_TROUBLESHOOTING.md`

