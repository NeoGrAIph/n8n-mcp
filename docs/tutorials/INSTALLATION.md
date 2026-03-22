# Руководство по установке

В этом руководстве описаны все способы установки n8n-MCP.

## Оглавление

- [Быстрый старт](#quick-start)
- [Установка Docker](#docker-installation)
- [Ручная установка](#manual-installation)
- [Настройка разработки](#development-setup)
- [Устранение неполадок](#troubleshooting)

## Быстрый старт

Самый быстрый способ запустить n8n-MCP:

```bash
# Using Docker (recommended)
cat > .env << EOF
AUTH_TOKEN=$(openssl rand -base64 32)
USE_FIXED_HTTP=true
EOF
docker compose up -d
```

## Установка докера

### Предварительные условия

- Docker Engine (устанавливается через менеджер пакетов или Docker Desktop)
- Docker Compose V2 (входит в состав современных установок Docker)

### Способ 1: использование готовых изображений

1. **Создайте каталог проекта:**
   ```bash
   mkdir n8n-mcp && cd n8n-mcp
   ```

2. **Создайте docker-compose.yml:**
   ```yaml
   version: '3.8'
   
   services:
     n8n-mcp:
       image: ghcr.io/czlonkowski/n8n-mcp:latest
       container_name: n8n-mcp
       restart: unless-stopped
       
       environment:
         MCP_MODE: ${MCP_MODE:-http}
         USE_FIXED_HTTP: ${USE_FIXED_HTTP:-true}
         AUTH_TOKEN: ${AUTH_TOKEN:?AUTH_TOKEN is required}
         NODE_ENV: ${NODE_ENV:-production}
         LOG_LEVEL: ${LOG_LEVEL:-info}
         PORT: ${PORT:-3000}
       
       volumes:
         - n8n-mcp-data:/app/data
       
       ports:
         - "${PORT:-3000}:${PORT:-3000}"

       healthcheck:
         test: ["CMD", "sh", "-c", "curl -f http://127.0.0.1:$${PORT:-3000}/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   
   volumes:
     n8n-mcp-data:
       driver: local
   ```

3. **Создайте файл .env:**
   ```bash
   echo "AUTH_TOKEN=$(openssl rand -base64 32)" > .env
   ```

4. **Запустите контейнер:**
   ```bash
   docker compose up -d
   ```

5. **Проверьте установку:**
   ```bash
   curl http://localhost:3000/health
   ```

### Способ 2: сборка из исходного кода

1. **Клонировать репозиторий:**
   ```bash
   git clone https://github.com/czlonkowski/n8n-mcp.git
   cd n8n-mcp
   ```

2. **Создайте изображение:**
   ```bash
   docker build -t n8n-mcp:local .
   ```

3. **Запустите с помощью docker-compose:**
   ```bash
   docker compose up -d
   ```

### Команды управления Docker

```bash
# View logs
docker compose logs -f

# Stop the container
docker compose stop

# Remove container and volumes
docker compose down -v

# Update to latest image
docker compose pull
docker compose up -d

# Execute commands inside container
docker compose exec n8n-mcp npm run validate

# Backup database
docker cp n8n-mcp:/app/data/nodes.db ./nodes-backup.db
```

## Ручная установка

### Предварительные условия

- Node.js v16+ (рекомендуется v20+)
- нпм или пряжа
- Гит

### Пошаговая установка

1. **Клонировать репозиторий:**
   ```bash
   git clone https://github.com/czlonkowski/n8n-mcp.git
   cd n8n-mcp
   ```

2. **Клонировать документацию n8n (необязательно, но рекомендуется):**
   ```bash
   git clone https://github.com/n8n-io/n8n-docs.git ../n8n-docs
   ```

3. **Установить зависимости:**
   ```bash
   npm install
   ```

4. **Создайте проект:**
   ```bash
   npm run build
   ```

5. **Инициализируйте базу данных:**
   ```bash
   npm run rebuild
   ```

6. **Проверка установки:**
   ```bash
   npm run test-nodes
   ```

### Запуск сервера

#### режим stdio (для Claude Desktop)
```bash
npm start
```

#### Режим HTTP (для удаленного доступа)
```bash
npm run start:http
```

### Конфигурация среды

Создайте файл `.env` в корне проекта:

```env
# Server configuration
MCP_MODE=http          # or stdio
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info

# Authentication (required for HTTP mode)
AUTH_TOKEN=your-secure-token-here

# Database
NODE_DB_PATH=./data/nodes.db
REBUILD_ON_START=false
```

## Настройка разработки

### Предварительные условия

- Все необходимые условия для ручной установки.
- Знание TypeScript
- Знание протокола MCP.

### Этапы настройки

1. **Клонируйте и установите:**
   ```bash
   git clone https://github.com/czlonkowski/n8n-mcp.git
   cd n8n-mcp
   npm install
   ```

2. **Настройте среду разработки:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Команды разработки:**
   ```bash
   # Run in development mode with auto-reload
   npm run dev
   
   # Run tests
   npm test
   
   # Type checking
   npm run typecheck
   
   # Linting
   npm run lint
   ```

### Разработка Docker

1. **Используйте переопределение docker-compose:**
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```

2. **Изменить переопределение для разработки:**
   ```yaml
   version: '3.8'
   
   services:
     n8n-mcp:
       build: .
       environment:
         NODE_ENV: development
         LOG_LEVEL: debug
       volumes:
         - ./src:/app/src:ro
         - ./dist:/app/dist
   ```

3. **Запуск с живой перезагрузкой:**
   ```bash
   docker compose up --build
   ```

## Поиск неисправностей

### Распространенные проблемы

#### Порт уже используется
```bash
# Find process using port 3000
lsof -i :3000

# Use a different port
PORT=3001 docker compose up -d
```

#### Не удалось инициализировать базу данных
```bash
# For Docker
docker compose exec n8n-mcp npm run rebuild

# For manual installation
npm run rebuild
```

#### Ошибки отказа в доступе
```bash
# Fix permissions (Linux/macOS)
sudo chown -R $(whoami) ./data

# For Docker volumes
docker compose exec n8n-mcp chown -R nodejs:nodejs /app/data
```

#### Несоответствие версии узла
Проект включает автоматический переход на sql.js для обеспечения совместимости. Если у вас все еще есть проблемы:
```bash
# Check Node version
node --version

# Use nvm to switch versions
nvm use 20
```

### Получение помощи

1. Проверьте логи:
- Докер: `docker compose logs`
- Вручную: проверьте вывод консоли или `LOG_LEVEL=debug npm start`.

2. Проверьте базу данных:
   ```bash
   npm run validate
   ```

3. Запустите тесты:
   ```bash
   npm test
   ```

4. Сообщить о проблемах:
- Проблемы с GitHub: https://github.com/czlonkowski/n8n-mcp/issues.
- Включите журналы и сведения о среде.

## Следующие шаги

После установки настройте Claude Desktop на использование n8n-MCP:
- См. [Руководство по установке Claude Desktop](../how-to/clients/README_CLAUDE_SETUP.md)
- Для удаленного развертывания см. [Руководство по развертыванию HTTP](../how-to/deployment/HTTP_DEPLOYMENT.md)
- Подробности о Docker см. в [Docker README](../how-to/deployment/DOCKER_README.md).
