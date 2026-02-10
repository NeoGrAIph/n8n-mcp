# Руководство по устранению неполадок Docker

Это руководство помогает решить распространенные проблемы при запуске n8n-mcp с Docker, особенно при подключении к экземплярам n8n.

## Оглавление
- [Общие проблемы](#common-issues)
- [502 неверные ошибки шлюза](#502-bad-gateway-errors)
- [Пользовательский путь к базе данных не работает](#custom-database-path-not-working-v27160)
- [Конфликты имен контейнеров](#container-name-conflicts)
- [Проблемы с подключением к API n8n](#n8n-api-connection-issues)
- [Сеть Docker](#docker-networking)
- [Быстрые решения](#quick-solutions)
- [Шаги отладки](#debugging-steps)

## Распространенные проблемы

### Файл конфигурации Docker не работает (v2.8.2+)

**Симптомы:**
- Файл конфигурации установлен, но переменные среды не заданы.
- Контейнер запускается, но игнорирует конфигурацию
- Получение ошибок «отказано в разрешении»

**Решения:**

1. **Убедитесь, что файл смонтирован правильно:**
```bash
# Correct - mount as read-only
docker run -v $(pwd)/config.json:/app/config.json:ro ...

# Check if file is accessible
docker exec n8n-mcp cat /app/config.json
```

2. **Проверьте синтаксис JSON:**
```bash
# Validate JSON file
cat config.json | jq .
```

3. **Проверьте журналы Docker на наличие ошибок анализа:**
```bash
docker logs n8n-mcp | grep -i config
```

4. **Распространенные проблемы:**
- Неверный синтаксис JSON (используйте валидатор JSON).
- Права доступа к файлам (должны быть доступны для чтения)
- Неправильный путь монтирования (должен быть `/app/config.json`)
- Заблокированы опасные переменные (PATH, LD_PRELOAD и т. д.)

### Пользовательский путь к базе данных не работает (v2.7.16+)

**Симптомы:**
- Переменная среды `NODE_DB_PATH` установлена, но игнорируется.
- База данных всегда создается по адресу `/app/data/nodes.db`.
- Пользовательская настройка пути не имеет эффекта.

**Основная причина:** исправлено в версии 2.7.16. В более ранних версиях пути были жестко закодированы в docker-entrypoint.sh.

**Решения:**

1. **Обновите версию 2.7.16 или более позднюю:**
```bash
docker pull ghcr.io/czlonkowski/n8n-mcp:latest
```

2. **Убедитесь, что путь заканчивается на .db:**
```bash
# Correct
NODE_DB_PATH=/app/data/custom/my-nodes.db

# Incorrect (will be rejected)
NODE_DB_PATH=/app/data/custom/my-nodes
```

3. **Используйте путь внутри смонтированного тома для сохранения:**
```yaml
services:
  n8n-mcp:
    environment:
      NODE_DB_PATH: /app/data/custom/nodes.db
    volumes:
      - n8n-mcp-data:/app/data  # Ensure parent directory is mounted
```

### 502 Неверные ошибки шлюза

**Симптомы:**
- `n8n_health_check` возвращает ошибку 502.
- Все вызовы API управления n8n завершаются неудачно.
- Веб-интерфейс n8n доступен, но API нет

**Основная причина:** Проблемы с сетевым подключением между контейнером n8n-mcp и экземпляром n8n.

**Решения:**

#### 1. Когда n8n работает в Docker на том же компьютере

Используйте специальные имена хостов Docker вместо `localhost`:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "N8N_API_URL=http://host.docker.internal:5678",
        "-e", "N8N_API_KEY=your-api-key",
        "ghcr.io/czlonkowski/n8n-mcp:latest"
      ]
    }
  }
}
```

**Альтернативные имена хостов, которые стоит попробовать:**
- `host.docker.internal` (Docker Desktop в macOS/Windows)
- `172.17.0.1` (IP-адрес моста Docker по умолчанию в Linux)
- Фактический IP-адрес вашего устройства (например, `192.168.1.100`)

#### 2. Когда оба контейнера находятся в одной сети Docker

```bash
# Create a shared network
docker network create n8n-network

# Run n8n in the network
docker run -d --name n8n --network n8n-network -p 5678:5678 n8nio/n8n

# Configure n8n-mcp to use container name
```

```json
{
  "N8N_API_URL": "http://n8n:5678"
}
```

#### 3. Для настроек Docker Compose

```yaml
# docker-compose.yml
services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    networks:
      - n8n-net
    ports:
      - "5678:5678"
  
  n8n-mcp:
    image: ghcr.io/czlonkowski/n8n-mcp:latest
    environment:
      N8N_API_URL: http://n8n:5678
      N8N_API_KEY: ${N8N_API_KEY}
    networks:
      - n8n-net

networks:
  n8n-net:
    driver: bridge
```

### Проблемы с очисткой контейнера (исправлено в версии 2.7.20+)

**Симптомы:**
- Контейнеры накапливаются после перезагрузки Claude Desktop.
- Контейнеры отображаются как «нездоровые», но не очищаются.
- Флаг `--rm` не работает должным образом.

**Основная причина:** Исправлено в версии 2.7.20: контейнеры неправильно обрабатывали сигналы завершения.

**Решения:**

1. **Обновите версию 2.7.20+ и используйте флаг --init (рекомендуется):**
```json
{
  "command": "docker",
  "args": [
    "run", "-i", "--rm", "--init",
    "ghcr.io/czlonkowski/n8n-mcp:latest"
  ]
}
```

2. **Ручная очистка старых контейнеров:**
```bash
# Remove all stopped n8n-mcp containers
docker ps -a | grep n8n-mcp | grep Exited | awk '{print $1}' | xargs -r docker rm
```

3. **Для версий до 2.7.20:**
- Периодически очищайте контейнеры вручную.
– Вместо этого рассмотрите возможность использования режима HTTP.

### Webhooks to Local n8n Fail (v2.16.3+)

**Симптомы:**
- `n8n_workflow_test` завершается с ошибкой «Защита SSRF».
- Сообщение об ошибке: «Защита SSRF: доступ к локальному хосту заблокирован».
- Вебхуки работают с пользовательским интерфейсом n8n, но не с n8n-MCP.

**Основная причина:** Строгая защита SSRF по умолчанию блокирует доступ к локальному узлу для предотвращения атак.

**Решение.** Используйте умеренный режим безопасности для локальной разработки.

```bash
# For Docker run
docker run -d \
  --name n8n-mcp \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=your-token \
  -e WEBHOOK_SECURITY_MODE=moderate \
  -p 3000:3000 \
  ghcr.io/czlonkowski/n8n-mcp:latest

# For Docker Compose - add to environment:
services:
  n8n-mcp:
    environment:
      WEBHOOK_SECURITY_MODE: moderate
```

**Описание режимов безопасности:**
- `strict` (по умолчанию): блокирует локальный хост + частные IP-адреса + облачные метаданные (производственная версия).
- `moderate`: разрешает локальный хост, блокирует частные IP-адреса + облачные метаданные (локальная разработка)
- `permissive`: разрешает локальный хост + частные IP-адреса, блокирует облачные метаданные (только тестирование)

**Важно!** Всегда используйте режим `strict` в рабочей среде. Облачные метаданные блокируются во всех режимах.

### Проблемы с подключением к API n8n

**Симптомы:**
- Вызовы API завершаются сбоем, но веб-интерфейс n8n работает.
- Ошибки аутентификации
- Конечные точки API возвращают 404.

**Решения:**

1. **Убедитесь, что API n8n включен:**
- Проверьте настройки n8n → REST API включен.
- Убедитесь, что ключ API действителен и срок его действия не истек.

2. **Проверьте API напрямую:**
```bash
# From host machine
curl -H "X-N8N-API-KEY: your-key" http://localhost:5678/api/v1/workflows

# From inside Docker container
docker run --rm curlimages/curl \
  -H "X-N8N-API-KEY: your-key" \
  http://host.docker.internal:5678/api/v1/workflows
```

3. **Проверьте переменные среды n8n:**
```yaml
environment:
  - N8N_BASIC_AUTH_ACTIVE=true
  - N8N_BASIC_AUTH_USER=user
  - N8N_BASIC_AUTH_PASSWORD=password
```

## Сеть Docker

### Понимание сетевых режимов Docker

| Сценарий | Используйте этот URL | Почему |
|----------|--------------|-----|
| n8n на хосте, n8n-mcp в Docker | @@КОД0@@ | Docker не может связаться с локальным хостом хоста |
| Оба в одной сети Docker | @@КОД0@@ | Прямой контейнер-контейнер |
| n8n за обратным прокси | @@КОД0@@ | Использовать общедоступный URL |
| Местное развитие | @@КОД0@@ | Использовать IP-адрес машины |

### Поиск вашей конфигурации

```bash
# Check if n8n is running in Docker
docker ps | grep n8n

# Find Docker network
docker network ls

# Get container details
docker inspect n8n | grep NetworkMode

# Find your local IP
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

## Быстрые решения

### Решение 1. Используйте хост-сеть (только Linux)
```json
{
  "command": "docker",
  "args": [
    "run", "-i", "--rm",
    "--network", "host",
    "-e", "N8N_API_URL=http://localhost:5678",
    "ghcr.io/czlonkowski/n8n-mcp:latest"
  ]
}
```

### Решение 2. Используйте IP-адрес вашего компьютера
```json
{
  "N8N_API_URL": "http://192.168.1.100:5678"  // Replace with your IP
}
```

### Решение 3. Развертывание в режиме HTTP
Разверните n8n-mcp в качестве HTTP-сервера, чтобы избежать проблем со stdio/Docker:

```bash
# Start HTTP server
docker run -d \
  -p 3000:3000 \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=your-token \
  -e N8N_API_URL=http://host.docker.internal:5678 \
  -e N8N_API_KEY=your-n8n-key \
  ghcr.io/czlonkowski/n8n-mcp:latest

# Configure Claude with mcp-remote
```

## Шаги отладки

### 1. Включить ведение журнала отладки
```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "DEBUG_MCP": "true"
  }
}
```

### 2. Проверка подключения
```bash
# Test from n8n-mcp container
docker run --rm ghcr.io/czlonkowski/n8n-mcp:latest \
  sh -c "apk add curl && curl -v http://host.docker.internal:5678/api/v1/workflows"
```

### 3. Проверьте журналы Docker
```bash
# View n8n-mcp logs
docker logs $(docker ps -q -f ancestor=ghcr.io/czlonkowski/n8n-mcp:latest)

# View n8n logs
docker logs n8n
```

### 4. Проверка среды
```bash
# Check what n8n-mcp sees
docker run --rm ghcr.io/czlonkowski/n8n-mcp:latest \
  sh -c "env | grep N8N"
```

### 5. Диагностика сети
```bash
# Check Docker networks
docker network inspect bridge

# Test DNS resolution
docker run --rm busybox nslookup host.docker.internal
```

## Примечания для конкретных платформ

### Рабочий стол Docker (macOS/Windows)
- `host.docker.internal` работает «из коробки»
- Убедитесь, что Docker Desktop работает.
- Проверьте настройки Docker Desktop → Ресурсы → Сеть.

### Линукс
- `host.docker.internal` требует Docker 20.10+.
- Альтернатива: используйте `--add-host=host.docker.internal:host-gateway`.
- Или используйте IP-адрес моста Docker: `172.17.0.1`.

### Windows с WSL2
- Используйте `host.docker.internal` или IP-адрес WSL2.
- Проверьте правила брандмауэра для порта 5678.
- Убедитесь, что n8n привязан к `0.0.0.0`, а не к `127.0.0.1`.

## Все еще возникают проблемы?

1. **Проверьте журналы n8n** на наличие ошибок, связанных с API.
2. **Убедитесь, что брандмауэр/безопасность** не блокирует соединения.
3. **Попробуйте более простую настройку** — запустите n8n-mcp на хосте вместо Docker.
4. **Сообщите о проблеме** с помощью журналов отладки на странице [GitHub Issues](https://github.com/czlonkowski/n8n-mcp/issues)

## Полезные команды

```bash
# Remove all n8n-mcp containers
docker rm -f $(docker ps -aq -f ancestor=ghcr.io/czlonkowski/n8n-mcp:latest)

# Test n8n API with curl
curl -H "X-N8N-API-KEY: your-key" http://localhost:5678/api/v1/workflows

# Run interactive debug session
docker run -it --rm \
  -e LOG_LEVEL=debug \
  -e N8N_API_URL=http://host.docker.internal:5678 \
  -e N8N_API_KEY=your-key \
  ghcr.io/czlonkowski/n8n-mcp:latest \
  sh

# Check container networking
docker run --rm alpine ping -c 4 host.docker.internal
```
