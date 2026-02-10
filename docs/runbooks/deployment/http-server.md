# Runbook: HTTP MCP Server (Deploy & Verify)

Status: active | Audience: developer | Last reviewed: 2026-02-09

## Goal

Поднять n8n-mcp в режиме HTTP (`MCP_MODE=http`) и проверить, что MCP endpoint и healthcheck работают.

## Preconditions

- Docker Engine + Docker Compose v2 (или Node.js 16+ для запуска без Docker)
- Секрет: `AUTH_TOKEN` (не коммить, не логировать полностью)

## Procedure

1. Сгенерируйте токен и создайте `.env`:
   ```bash
   cat > .env << EOF
   MCP_MODE=http
   USE_FIXED_HTTP=true
   AUTH_TOKEN=$(openssl rand -base64 32)
   PORT=3000
   LOG_LEVEL=info
   EOF
   ```

2. Поднимите сервис:
   ```bash
   docker compose up -d
   ```

3. Проверьте health endpoint:
   ```bash
   curl -fsS http://localhost:3000/health
   ```

4. Проверьте MCP endpoint (требуется Bearer token):
   ```bash
   curl -fsS http://localhost:3000/mcp \
     -H "Authorization: Bearer $(rg -n \"^AUTH_TOKEN=\" .env | sed -E \"s/^AUTH_TOKEN=//\")"
   ```

## Verification

- `GET /health` отвечает HTTP 200.
- `GET /mcp` отвечает JSON с `protocolVersion` (или discovery payload).
- При обращении к `POST /mcp` без токена сервер отвечает 401/403 (ожидаемое поведение).

## References

- Конфиг: [../../../.env.example](../../../.env.example)
- Документация: `docs/how-to/deployment/HTTP_DEPLOYMENT.md`, `docs/how-to/deployment/DOCKER_README.md`
- Реализация: `src/http-server.ts`, `src/http-server-single-session.ts`, `src/mcp/index.ts`
