# Руководство по развертыванию Docker для n8n-MCP

В этом руководстве представлены подробные инструкции по развертыванию n8n-MCP с помощью Docker.

## 🚀 Быстрый старт

### Предварительные условия
- Docker Engine 20.10+ (Docker Desktop в Windows/macOS или Docker Engine в Linux)
- Docker Compose V2
- (Необязательно) openssl для генерации токенов аутентификации

### 1. Режим HTTP-сервера (рекомендуется)

Самый простой способ развернуть n8n-MCP — использовать Docker Compose в режиме HTTP:

```bash
# Clone the repository
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp

# Create .env file with auth token
cat > .env << EOF
AUTH_TOKEN=$(openssl rand -base64 32)
USE_FIXED_HTTP=true
EOF

# Start the server
docker compose up -d

# Check logs
docker compose logs -f

# Test the health endpoint
curl http://localhost:3000/health
```

### 2. Использование готовых изображений

Готовые образы доступны в реестре контейнеров GitHub:

```bash
# Pull the latest image (~280MB optimized)
docker pull ghcr.io/czlonkowski/n8n-mcp:latest

# Run with HTTP mode
docker run -d \
  --name n8n-mcp \
  -e MCP_MODE=http \
  -e USE_FIXED_HTTP=true \
  -e AUTH_TOKEN=your-secure-token \
  -p 3000:3000 \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

## 📋 Параметры конфигурации

### Переменные среды

| Переменная | Описание | По умолчанию | Требуется |
|----------|-------------|---------|----------|
| @@КОД0@@ | Режим сервера: `stdio` или `http` | `stdio` | Нет |
| @@КОД0@@ | Токен носителя для HTTP-аутентификации | - | Да (режим HTTP)* |
| @@КОД0@@ | Путь к файлу, содержащему токен аутентификации (v2.7.5+) | - | Да (режим HTTP)* |
| @@КОД0@@ | Порт HTTP-сервера | `3000` | Нет |
| @@КОД0@@ | Среда: `development` или `production` | `production` | Нет |
| @@КОД0@@ | Уровень ведения журнала: `debug`, `info`, `warn`, `error` | `info` | Нет |
| @@КОД0@@ | Пользовательский путь к базе данных (v2.7.16+) | `/app/data/nodes.db` | Нет |
| @@КОД0@@ | Окно ограничения скорости в мс (v2.16.3+) | `900000` (15 мин) | Нет |
| @@КОД0@@ | Максимальное количество попыток аутентификации на окно (v2.16.3+) | `20` | Нет |
| @@КОД0@@ | Защита SSRF: `strict`/`moderate`/`permissive` (v2.16.3+) | `strict` | Нет |

*Для режима HTTP должен быть установлен `AUTH_TOKEN` или `AUTH_TOKEN_FILE`. Если установлены оба параметра, `AUTH_TOKEN` имеет приоритет.

### Поддержка файлов конфигурации (v2.8.2+)

Вы можете смонтировать файл конфигурации JSON для установки переменных среды:

```bash
# Create config file
cat > config.json << EOF
{
  "MCP_MODE": "http",
  "AUTH_TOKEN": "your-secure-token",
  "LOG_LEVEL": "info",
  "N8N_API_URL": "https://your-n8n-instance.com",
  "N8N_API_KEY": "your-api-key"
}
EOF

# Run with config file
docker run -d \
  --name n8n-mcp \
  -v $(pwd)/config.json:/app/config.json:ro \
  -p 3000:3000 \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

Конфигурационный файл поддерживает:
- Все стандартные переменные среды
- Вложенные объекты (сглаживаются с помощью разделителей подчеркивания)
- Массивы, логические значения, числа и строки.
- Безопасное обращение с предотвращением внедрения команд.
- Опасная блокировка переменных в целях безопасности.

### Конфигурация Docker Compose

По умолчанию `docker-compose.yml` обеспечивает:
- Автоматический перезапуск при сбое
- Именованный том для сохранения данных.
- Ограничения памяти (максимум 512 МБ, зарезервировано 256 МБ)
- Проверка здоровья каждые 30 секунд.
- Контейнерные этикетки для организации.

### Пользовательская конфигурация

Создайте `docker-compose.override.yml` для локальных настроек:

```yaml
# docker-compose.override.yml
services:
  n8n-mcp:
    ports:
      - "8080:3000"  # Use different port
    environment:
      LOG_LEVEL: debug
      NODE_ENV: development
    volumes:
      - ./custom-data:/app/data  # Use local directory
```

## 🔧 Режимы использования

### Режим HTTP (удаленный доступ)

Идеально подходит для облачных развертываний и удаленного доступа:

```bash
# Start in HTTP mode
docker run -d \
  --name n8n-mcp-http \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=your-secure-token \
  -p 3000:3000 \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

Настройте Claude Desktop с помощью mcp-remote:
```json
{
  "mcpServers": {
    "n8n-remote": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/mcp-remote@latest",
        "connect",
        "http://your-server:3000/mcp"
      ],
      "env": {
        "MCP_AUTH_TOKEN": "your-secure-token"
      }
    }
  }
}
```

### Режим Stdio (локальный прямой доступ)

Для локальной интеграции Claude Desktop без HTTP:

```bash
# Run in stdio mode (interactive)
docker run --rm -i --init \
  -e MCP_MODE=stdio \
  -v n8n-mcp-data:/app/data \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

### Режим сервера (командная строка)

Вы также можете использовать команду `serve` для запуска в режиме HTTP:

```bash
# Using the serve command (v2.8.2+)
docker run -d \
  --name n8n-mcp \
  -e AUTH_TOKEN=your-secure-token \
  -p 3000:3000 \
  ghcr.io/czlonkowski/n8n-mcp:latest serve
```

Настройте рабочий стол Claude:
```json
{
  "mcpServers": {
    "n8n-docker": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--init",
        "-e", "MCP_MODE=stdio",
        "-v", "n8n-mcp-data:/app/data",
        "ghcr.io/czlonkowski/n8n-mcp:latest"
      ]
    }
  }
}
```

## 🏗️ Сборка из исходного кода

### Сборка локально

```bash
# Clone repository
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp

# Build image
docker build -t n8n-mcp:local .

# Run your local build
docker run -d \
  --name n8n-mcp-local \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=test-token \
  -p 3000:3000 \
  n8n-mcp:local
```

### Мультиархитектурная сборка

Сборка для нескольких платформ:

```bash
# Enable buildx
docker buildx create --use

# Build for amd64 and arm64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t n8n-mcp:multiarch \
  --load \
  .
```

## 🔍 Мониторинг здоровья

### Конечная точка проверки работоспособности

Контейнер включает проверку работоспособности, которая выполняется каждые 30 секунд:

```bash
# Check health status
curl http://localhost:3000/health
```

Пример ответа:
```json
{
  "status": "healthy",
  "uptime": 120.5,
  "memory": {
    "used": "8.5 MB",
    "rss": "45.2 MB",
    "external": "1.2 MB"
  },
  "version": "2.3.0",
  "mode": "http",
  "database": {
    "adapter": "better-sqlite3",
    "ready": true
  }
}
```

### Статус работоспособности Docker

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View health check logs
docker inspect n8n-mcp | jq '.[0].State.Health'
```

## 🔒 Функции безопасности (v2.16.3+)

### Ограничение скорости

Защищает от атак грубой силы аутентификации:

```bash
# Configure in .env or docker-compose.yml
AUTH_RATE_LIMIT_WINDOW=900000  # 15 minutes in milliseconds
AUTH_RATE_LIMIT_MAX=20         # 20 attempts per IP per window
```

### SSRF-защита

Предотвращает подделку запросов на стороне сервера при использовании триггеров веб-перехватчика:

```bash
# For production (blocks localhost + private IPs + cloud metadata)
WEBHOOK_SECURITY_MODE=strict

# For local development with local n8n instance
WEBHOOK_SECURITY_MODE=moderate

# For internal testing only (allows private IPs)
WEBHOOK_SECURITY_MODE=permissive
```

**Примечание.** Конечные точки облачных метаданных (169.254.169.254, Metadata.google.internal и т. д.) ВСЕГДА блокируются во всех режимах.

## 🔒 Аутентификация

### Аутентификация

n8n-MCP поддерживает два метода аутентификации для режима HTTP:

#### Способ 1: AUTH_TOKEN (переменная среды)
- Установите токен непосредственно как переменную среды.
- Просто и понятно для базового развертывания.
- Всегда используйте надежный токен (минимум 32 символа).

```bash
# Generate secure token
openssl rand -base64 32

# Use in Docker
docker run -e AUTH_TOKEN=your-secure-token ...
```

#### Способ 2: AUTH_TOKEN_FILE (путь к файлу) — НОВОЕ в версии 2.7.5
- Чтение токена из файла (совместимо с секретами Docker)
- Более безопасный для производственных развертываний.
- Предотвращает раскрытие токенов в списках процессов.

```bash
# Create token file
echo "your-secure-token" > /path/to/token.txt

# Use with Docker secrets
docker run -e AUTH_TOKEN_FILE=/run/secrets/auth_token ...
```

#### Лучшие практики
- Никогда не фиксируйте токены под контролем версий.
- Регулярно меняйте жетоны
- Используйте AUTH_TOKEN_FILE с секретами Docker для производства.
- Убедитесь, что файлы токенов имеют ограниченные разрешения (600).

### Сетевая безопасность

Для производственных развертываний:

1. **Используйте HTTPS**. Установите обратный прокси-сервер (nginx, Caddy) впереди.
2. **Брандмауэр** – ограничить доступ только доверенным IP-адресам.
3. **VPN** – рассмотрите возможность доступа к VPN для внутреннего использования.

Пример с Кэдди:
```
your-domain.com {
  reverse_proxy n8n-mcp:3000
  basicauth * {
    admin $2a$14$... # bcrypt hash
  }
}
```

### Безопасность контейнера

- Запускается от имени пользователя без полномочий root (uid 1001)
- Совместимость с корневой файловой системой только для чтения
- Никаких ненужных пакетов не установлено.
- Регулярные обновления безопасности через GitHub Actions.

## 📊 Управление ресурсами

### Ограничения памяти

Ограничения по умолчанию в docker-compose.yml:
- Максимум: 512 МБ
- Зарезервировано: 256 МБ.

Настройте в соответствии с вашими потребностями:
```yaml
services:
  n8n-mcp:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Управление томами

```bash
# List volumes
docker volume ls | grep n8n-mcp

# Inspect volume
docker volume inspect n8n-mcp-data

# Backup data
docker run --rm \
  -v n8n-mcp-data:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/n8n-mcp-backup.tar.gz -C /source .

# Restore data
docker run --rm \
  -v n8n-mcp-data:/target \
  -v $(pwd):/backup:ro \
  alpine tar xzf /backup/n8n-mcp-backup.tar.gz -C /target
```

### Пользовательский путь к базе данных (v2.7.16+)

Вы можете указать местоположение пользовательской базы данных, используя `NODE_DB_PATH`:

```bash
# Use custom path within mounted volume
docker run -d \
  --name n8n-mcp \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=your-token \
  -e NODE_DB_PATH=/app/data/custom/my-nodes.db \
  -v n8n-mcp-data:/app/data \
  -p 3000:3000 \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

**Важные примечания:**
- Путь должен заканчиваться на `.db`.
- Для сохранения данных убедитесь, что путь находится внутри смонтированного тома.
— Пути за пределами смонтированных томов будут потеряны при перезапуске контейнера.
- Каталог будет создан автоматически, если он не существует.

## 🐛 Устранение неполадок

### Распространенные проблемы

#### Контейнер немедленно завершает работу
```bash
# Check logs
docker logs n8n-mcp

# Common causes:
# - Missing AUTH_TOKEN in HTTP mode
# - Database initialization failure
# - Port already in use
```

#### База данных не инициализирована
```bash
# Manually initialize database
docker exec n8n-mcp node dist/scripts/rebuild.js

# Or recreate container with fresh volume
docker compose down -v
docker compose up -d
```

#### Ошибки разрешений
```bash
# Fix volume permissions
docker exec n8n-mcp chown -R nodejs:nodejs /app/data
```

### Режим отладки

Включите ведение журнала отладки:
```bash
docker run -d \
  --name n8n-mcp-debug \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=test \
  -e LOG_LEVEL=debug \
  -p 3000:3000 \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

### Доступ к оболочке контейнера

```bash
# Access running container
docker exec -it n8n-mcp sh

# Run as root for debugging
docker exec -it -u root n8n-mcp sh
```

## 🚀 Развертывание производства

### Рекомендуемая настройка

1. **Используйте Docker Compose** для упрощения управления.
2. **Включить HTTPS** с обратным прокси-сервером.
3. **Настроить мониторинг** (Прометей, Графана)
4. **Настройте резервное копирование** для тома данных.
5. **Используйте управление секретами** для AUTH_TOKEN.

### Пример производственного стека

```yaml
# docker-compose.prod.yml
services:
  n8n-mcp:
    image: ghcr.io/czlonkowski/n8n-mcp:latest
    restart: always
    environment:
      MCP_MODE: http
      AUTH_TOKEN_FILE: /run/secrets/auth_token
      NODE_ENV: production
    secrets:
      - auth_token
    networks:
      - internal
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
  
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    networks:
      - internal
      - external

networks:
  internal:
  external:

secrets:
  auth_token:
    file: ./secrets/auth_token.txt
```

## 📦 Доступные изображения

- `ghcr.io/czlonkowski/n8n-mcp:latest` - ​​Последняя стабильная версия
- `ghcr.io/czlonkowski/n8n-mcp:2.3.0` - ​​Конкретная версия
- `ghcr.io/czlonkowski/n8n-mcp:main-abc123` - ​​Девелоперские сборки

### Подробности изображения

- База: `node:22-alpine`
- Размер: ~280 МБ в сжатом виде.
- Особенности: предварительно созданная база данных со всей информацией об узлах.
- База данных: полный SQLite с более чем 525 узлами.
- Архитектуры: `linux/amd64`, `linux/arm64`
- Обновлено: автоматически через действия GitHub.

## 🔄 Обновления и обслуживание

### Обновление

```bash
# Pull latest image
docker compose pull

# Recreate container
docker compose up -d

# View update logs
docker compose logs -f
```

### Автоматические обновления (Сторожевая башня)

```yaml
# Add to docker-compose.yml
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 86400 n8n-mcp
```

## 📚 Дополнительные ресурсы

- [Основная документация](../../README.md)
- [Руководство по развертыванию HTTP](./HTTP_DEPLOYMENT.md)
- [Руководство по устранению неполадок](../../TROUBLESHOOTING.md)
- [Руководство по установке](../../tutorials/INSTALLATION.md)

## 🤝 Поддержка

- Проблемы: [Проблемы GitHub](https://github.com/czlonkowski/n8n-mcp/issues)
- Обсуждения: [Обсуждения GitHub](https://github.com/czlonkowski/n8n-mcp/discussions)

---

*Последнее обновление: июль 2025 г. — реализация Docker v1.1*
