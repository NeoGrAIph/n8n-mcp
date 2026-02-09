# Настройка Кодекса

Подключите n8n-MCP к Codex для улучшения разработки рабочих процессов n8n.

## Обновите конфигурацию Кодекса

Перейдите в настройки Кодекса по адресу `~/.codex/config.toml` и добавьте следующую конфигурацию:

### Базовая конфигурация (только инструменты документирования):
```toml
[mcp_servers.n8n]
command = "npx"
args = ["n8n-mcp"]
env = { "MCP_MODE" = "stdio", "LOG_LEVEL" = "error", "DISABLE_CONSOLE_OUTPUT" = "true" }
```

### Полная конфигурация (со средствами управления n8n):
```toml
[mcp_servers.n8n]
command = "npx"
args = ["n8n-mcp"]
env = { "MCP_MODE" = "stdio", "LOG_LEVEL" = "error", "DISABLE_CONSOLE_OUTPUT" = "true", "N8N_API_URL" = "https://your-n8n-instance.com", "N8N_API_KEY" = "your-api-key" }
```

Обязательно замените `https://your-n8n-instance.com` своим фактическим URL-адресом n8n и `your-api-key` своим ключом API n8n.

## Управление вашим сервером MCP
Войдите в CLI Кодекса и используйте команду `/mcp`, чтобы просмотреть состояние сервера и доступные инструменты.

![n8n-MCP подключен и показывает 39 доступных инструментов](./img/codex_connected.png)

## Инструкции по проекту

Для достижения оптимальных результатов создайте файл `AGENTS.md` в корне вашего проекта, следуя инструкциям, аналогичным [основному разделу настройки проекта Claude в README](../README.md#-claude-project-setup).
