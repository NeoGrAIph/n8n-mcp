# Руководство по использованию Docker для n8n-mcp

## Работа в режиме HTTP

Docker-контейнер n8n-mcp можно запустить в режиме HTTP несколькими способами:

### Способ 1: использование переменных среды (рекомендуется)

```bash
docker run -d -p 3000:3000 \
  --name n8n-mcp-server \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=your-secure-token-here \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

### Способ 2: использование docker-compose

```bash
# Create a .env file
cat > .env << EOF
MCP_MODE=http
AUTH_TOKEN=your-secure-token-here
PORT=3000
EOF

# Run with docker-compose
docker-compose up -d
```

### Способ 3: использование файла конфигурации

Создайте файл `config.json`:
```json
{
  "MCP_MODE": "http",
  "AUTH_TOKEN": "your-secure-token-here",
  "PORT": "3000",
  "LOG_LEVEL": "info"
}
```

Запускаем с конфигурационным файлом:
```bash
docker run -d -p 3000:3000 \
  --name n8n-mcp-server \
  -v $(pwd)/config.json:/app/config.json:ro \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

### Способ 4: использование команды n8n-mcp submit

```bash
docker run -d -p 3000:3000 \
  --name n8n-mcp-server \
  -e AUTH_TOKEN=your-secure-token-here \
  ghcr.io/czlonkowski/n8n-mcp:latest \
  n8n-mcp serve
```

## Важные примечания

1. **AUTH_TOKEN требуется** для режима HTTP. Создайте безопасный токен:
   ```bash
   openssl rand -base64 32
   ```

2. **Переменные среды имеют приоритет** над значениями файла конфигурации.

3. **Режим по умолчанию — stdio**, если MCP_MODE не указан.

4. **Конечная точка проверки работоспособности** доступна по адресу `http://localhost:3000/health`.

## Поиск неисправностей

### Контейнер немедленно завершает работу
- Проверить логи: `docker logs n8n-mcp-server`
- Убедитесь, что AUTH_TOKEN установлен для режима HTTP.

### Ошибка «n8n-mcp: не найден»
- Это исправлено в последней версии
- Используйте полную команду: `node /app/dist/mcp/index.js` в качестве обходного пути.

### Файл конфигурации не работает
- Убедитесь, что файл является действительным JSON.
- Монтировать как доступный только для чтения: `-v $(pwd)/config.json:/app/config.json:ro`
- Проверьте наличие парсера конфига: `docker exec n8n-mcp-server ls -la /app/docker/`
