# Руководство по развертыванию n8n-MCP

В этом руководстве описано, как развернуть n8n-MCP и подключить его к вашему экземпляру n8n. Независимо от того, тестируете ли вы локально или развертываете продукт, мы покажем вам, как настроить n8n-MCP для использования с узлом клиентского инструмента MCP n8n.

## Оглавление
- [Обзор](#overview)
- [Локальное тестирование](#local-testing)
- [Производственное развертывание](#production-deployment)
- [Тот же сервер, что и n8n](#same-server-as-n8n)
- [Другой сервер (развертывание в облаке)](#different-server-cloud-deployment)
- [Подключение n8n к n8n-MCP](#connecting-n8n-to-n8n-mcp)
- [Безопасность и лучшие практики](#security--best-practices)
- [Устранение неполадок](#troubleshooting)

## Обзор

n8n-MCP — это сервер протокола контекста модели, который предоставляет ИИ-помощникам полный доступ к документации узла n8n и возможностям управления. При подключении к n8n через узел MCP Client Tool он позволяет:
- Создание и проверка рабочих процессов на базе искусственного интеллекта.
- Доступ к документации для более чем 500 узлов n8n
- Управление рабочим процессом через n8n API
- Проверка конфигурации в реальном времени

## Локальное тестирование

### Сценарий быстрого тестирования

Проверьте n8n-MCP локально с помощью предоставленного тестового сценария:

```bash
# Clone the repository
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp

# Build the project
npm install
npm run build

# Run the integration test script
./scripts/test-n8n-integration.sh
```

Этот скрипт будет:
1. Запустите реальный экземпляр n8n в Docker.
2. Запустите сервер n8n-MCP, настроенный для n8n.
3. Поможем вам настроить ключ API для управления рабочими процессами.
4. Проверьте полную интеграцию между n8n и n8n-MCP.

### Локальная настройка вручную

Для разработки или индивидуального тестирования:

1. **Предварительные условия**:
- экземпляр n8n работает (локально или удаленно)
- Ключ API n8n (из Настройки n8n → API)

2. **Запустите n8n-MCP**:
```bash
# Set environment variables
export N8N_MODE=true
export MCP_MODE=http                       # Required for HTTP mode
export N8N_API_URL=http://localhost:5678  # Your n8n instance URL
export N8N_API_KEY=your-api-key-here       # Your n8n API key
export MCP_AUTH_TOKEN=test-token-minimum-32-chars-long
export AUTH_TOKEN=test-token-minimum-32-chars-long  # Same value as MCP_AUTH_TOKEN
export PORT=3001

# Start the server
npm start
```

3. **Убедитесь, что он работает**:
```bash
# Check health
curl http://localhost:3001/health

# Check MCP protocol endpoint (this is the endpoint n8n connects to)
curl http://localhost:3001/mcp
# Should return: {"protocolVersion":"2024-11-05"} for n8n compatibility
```

## Справочник по переменным среды

| Переменная | Требуется | Описание | Пример значения |
|----------|----------|-------------|---------------|
| @@КОД0@@ | Да | Включает режим интеграции n8n | `true` |
| @@КОД0@@ | Да | Включает режим HTTP для клиента MCP n8n | `http` |
| @@КОД0@@ | Да* | URL-адрес вашего экземпляра n8n | `http://localhost:5678` |
| @@КОД0@@ | Да* | ключ API n8n для управления рабочими процессами | `n8n_api_xxx...` |
| @@КОД0@@ | Да | Токен аутентификации для запросов MCP (минимум 32 символа) | `secure-random-32-char-token` |
| @@КОД0@@ | Да | **ДОЛЖЕН точно соответствовать MCP_AUTH_TOKEN** | `secure-random-32-char-token` |
| @@КОД0@@ | Нет | Порт для HTTP-сервера | `3000` (по умолчанию) |
| @@КОД0@@ | Нет | Подробность регистрации | `info`, `debug`, `error` |

*Требуется только для функций управления рабочим процессом. Инструменты документирования работают и без них.

## Изменения сборки Docker (v2.9.2+)

Начиная с версии 2.9.2 мы используем один оптимизированный Dockerfile для всех развертываний:
- Предыдущий `Dockerfile.n8n` удален как ненужный.
- Функциональность N8N_MODE включается через переменную среды `N8N_MODE=true`.
- Это уменьшает размер образа более чем на 500 МБ и сокращает время сборки с 8+ минут до 1-2 минут.
- Во всех примерах теперь используется стандарт `Dockerfile`.

## Производственное развертывание

> **⚠️ Критично**: Docker кэширует изображения локально. Всегда запускайте `docker pull ghcr.io/czlonkowski/n8n-mcp:latest` перед развертыванием, чтобы убедиться, что у вас установлена ​​последняя версия. Этот простой шаг предотвращает большинство проблем с развертыванием.

### Тот же сервер, что и у n8n

Если вы используете n8n-MCP на том же сервере, что и ваш экземпляр n8n:

### Использование готового образа (рекомендуется)

Предварительно созданные образы автоматически обновляются с каждым выпуском и представляют собой самый простой способ начать работу.

**ВАЖНО**. Всегда загружайте самое последнее изображение, чтобы не использовать кэшированные версии:

```bash
# ALWAYS pull the latest image first
docker pull ghcr.io/czlonkowski/n8n-mcp:latest

# Generate a secure token (save this!)
AUTH_TOKEN=$(openssl rand -hex 32)
echo "Your AUTH_TOKEN: $AUTH_TOKEN"

# Create a Docker network if n8n uses one
docker network create n8n-net

# Run n8n-MCP container
docker run -d \
  --name n8n-mcp \
  --network n8n-net \
  -p 3000:3000 \
  -e N8N_MODE=true \
  -e MCP_MODE=http \
  -e N8N_API_URL=http://n8n:5678 \
  -e N8N_API_KEY=your-n8n-api-key \
  -e MCP_AUTH_TOKEN=$AUTH_TOKEN \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e LOG_LEVEL=info \
  --restart unless-stopped \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

### Сборка из исходного кода (опытные пользователи)

Создавайте из исходного кода только в том случае, если вам нужны пользовательские модификации или вы участвуете в разработке:

```bash
# Clone and build
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp

# Build Docker image
docker build -t n8n-mcp:latest .

# Run using your local image
docker run -d \
  --name n8n-mcp \
  -p 3000:3000 \
  -e N8N_MODE=true \
  -e MCP_MODE=http \
  -e MCP_AUTH_TOKEN=$(openssl rand -hex 32) \
  -e AUTH_TOKEN=$(openssl rand -hex 32) \
  # ... other settings
  n8n-mcp:latest
```

### Использование systemd (для собственной установки)

```bash
# Create service file
sudo cat > /etc/systemd/system/n8n-mcp.service << EOF
[Unit]
Description=n8n-MCP Server
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/n8n-mcp
Environment="N8N_MODE=true"
Environment="MCP_MODE=http"
Environment="N8N_API_URL=http://localhost:5678"
Environment="N8N_API_KEY=your-n8n-api-key"
Environment="MCP_AUTH_TOKEN=your-secure-token-32-chars-min"
Environment="AUTH_TOKEN=your-secure-token-32-chars-min"
Environment="PORT=3000"
ExecStart=/usr/bin/node /opt/n8n-mcp/dist/mcp/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable n8n-mcp
sudo systemctl start n8n-mcp
```

### Другой сервер (облачное развертывание)

Разверните n8n-MCP на сервере, отдельном от вашего экземпляра n8n:

#### Быстрое развертывание Docker (рекомендуется)

**Всегда загружайте последний образ, чтобы убедиться, что у вас актуальная версия:**

```bash
# On your cloud server (Hetzner, AWS, DigitalOcean, etc.)
# ALWAYS pull the latest image first
docker pull ghcr.io/czlonkowski/n8n-mcp:latest

# Generate auth tokens
AUTH_TOKEN=$(openssl rand -hex 32)
echo "Save this AUTH_TOKEN: $AUTH_TOKEN"

# Run the container
docker run -d \
  --name n8n-mcp \
  -p 3000:3000 \
  -e N8N_MODE=true \
  -e MCP_MODE=http \
  -e N8N_API_URL=https://your-n8n-instance.com \
  -e N8N_API_KEY=your-n8n-api-key \
  -e MCP_AUTH_TOKEN=$AUTH_TOKEN \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e LOG_LEVEL=info \
  --restart unless-stopped \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

#### Сборка из исходного кода (продвинутый уровень)

Требуется только в том случае, если вы изменяете код:

```bash
# Clone and build
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp
docker build -t n8n-mcp:latest .

# Run using local image
docker run -d \
  --name n8n-mcp \
  -p 3000:3000 \
  # ... same environment variables as above
  n8n-mcp:latest
```

#### Полная настройка производства (Hetzner/AWS/DigitalOcean)

1. **Требования к серверу**:
- **Минимально**: 1 виртуальный ЦП, 1 ГБ ОЗУ (CX11 на Hetzner)
- **Рекомендуется**: 2 виртуальных ЦП, 2 ГБ ОЗУ.
- **ОС**: Ubuntu 22.04 LTS.

2. **Первоначальная настройка**:
```bash
# SSH into your server
ssh root@your-server-ip

# Update and install Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
```

3. **Развертывание n8n-MCP с SSL** (с использованием Caddy для автоматического HTTPS):

**Использование Docker Compose (рекомендуется)**
```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  n8n-mcp:
    image: ghcr.io/czlonkowski/n8n-mcp:latest
    pull_policy: always  # Always pull latest image
    container_name: n8n-mcp
    restart: unless-stopped
    environment:
      - N8N_MODE=true
      - MCP_MODE=http
      - N8N_API_URL=${N8N_API_URL}
      - N8N_API_KEY=${N8N_API_KEY}
      - MCP_AUTH_TOKEN=${MCP_AUTH_TOKEN}
      - AUTH_TOKEN=${AUTH_TOKEN}
      - PORT=3000
      - LOG_LEVEL=info
    networks:
      - web

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - web

networks:
  web:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
EOF
```

**Примечание**. `pull_policy: always` гарантирует, что вы всегда получите самую последнюю версию.

**Сборка из исходного кода (при необходимости)**
```bash
# Only if you need custom modifications
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp
docker build -t n8n-mcp:local .

# Then update docker-compose.yml to use:
# image: n8n-mcp:local
    container_name: n8n-mcp
    restart: unless-stopped
    environment:
      - N8N_MODE=true
      - MCP_MODE=http
      - N8N_API_URL=${N8N_API_URL}
      - N8N_API_KEY=${N8N_API_KEY}
      - MCP_AUTH_TOKEN=${MCP_AUTH_TOKEN}
      - AUTH_TOKEN=${AUTH_TOKEN}
      - PORT=3000
      - LOG_LEVEL=info
    networks:
      - web

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - web

networks:
  web:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
EOF
```

**Завершите настройку**
```bash
# Create Caddyfile
cat > Caddyfile << 'EOF'
mcp.yourdomain.com {
    reverse_proxy n8n-mcp:3000
}
EOF

# Create .env file
AUTH_TOKEN=$(openssl rand -hex 32)
cat > .env << EOF
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key-here
MCP_AUTH_TOKEN=$AUTH_TOKEN
AUTH_TOKEN=$AUTH_TOKEN
EOF

# Save the AUTH_TOKEN!
echo "Your AUTH_TOKEN is: $AUTH_TOKEN"
echo "Save this token - you'll need it in n8n MCP Client Tool configuration"

# Start services
docker compose up -d
```

#### Советы облачных провайдеров

**AWS EC2**:
- Группа безопасности: открыть порт 3000 (или 443 с HTTPS).
- Тип экземпляра: достаточно t3.micro.
- Используйте Elastic IP для стабильной адресации.

**Цифровой океан**:
- Капелька: достаточно базовой (6 долларов в месяц).
- Включить резервное копирование для производственного использования.

**Облако Google**:
- Тип машины: e2-micro (доступен уровень бесплатного пользования)
- Используйте Cloud Load Balancer для SSL.

## Подключение n8n к n8n-MCP

### Настройка клиентского инструмента n8n MCP

1. **В рабочий процесс n8n** добавьте узел **Клиентский инструмент MCP**.

2. **Настройте соединение**:
   ```
   Server URL (MUST include /mcp endpoint): 
   - Same server: http://localhost:3000/mcp
   - Docker network: http://n8n-mcp:3000/mcp
   - Different server: https://mcp.yourdomain.com/mcp
   
   Auth Token: [Your MCP_AUTH_TOKEN/AUTH_TOKEN value]
   
   Transport: HTTP Streamable (SSE)
   ```
   
⚠️ **Критично**: URL-адрес сервера должен включать путь к конечной точке `/mcp`. Без этого соединение не удастся.

3. **Проверьте соединение**, выбрав простой инструмент, например `n8n_nodes_search`.

### Доступные инструменты

После подключения вы можете использовать эти инструменты MCP в n8n:

**Инструменты документирования** (ключ API не требуется):
- `n8n_tools_documentation` - ​​Документация по инструменту и руководство по использованию.
- `n8n_nodes_search` - ​​Поиск узлов по ключевому слову
- `n8n_node_get` - ​​Информация об узле (минимальная/стандартная/полная), документы, поиск свойств, версии
- `n8n_node_validate` - ​​Проверка конфигурации узла.
- `n8n_workflow_json_validate` - ​​Проверка конфигураций рабочего процесса.
- `n8n_templates_search` - ​​Поиск шаблонов рабочих процессов
- `n8n_template_get` - ​​Получить информацию о шаблоне по идентификатору

**Инструменты управления** (требуется ключ API n8n):
- `n8n_workflow_create` - ​​Создание новых рабочих процессов
- `n8n_workflow_get` - ​​Получить подробную информацию о рабочем процессе
- `n8n_workflow_update_full` - ​​Обновление существующих рабочих процессов (полная замена)
- `n8n_workflow_update_partial` - ​​Обновление через операции сравнения.
- `n8n_workflow_delete` - ​​Удаление рабочих процессов
- `n8n_workflows_list` - ​​Список рабочих процессов
- `n8n_workflow_validate` - ​​Проверка рабочих процессов в n8n по идентификатору.
- `n8n_workflow_autofix` - ​​Автоматическое исправление распространенных ошибок.
- `n8n_workflow_test` - ​​Запустить externally-triggerable workflow (`webhook` / `form` / `chat`).
- `n8n_workflow_runner_test` - Выполнить full workflow через utility runner, включая manual-only сценарии.
- `n8n_executions_get` - ​​Получить подробности выполнения
- `n8n_executions_list` - ​​Список выполнений
- `n8n_executions_delete` - ​​Удалить записи выполнения
- `n8n_health_check` - ​​Проверьте подключение n8n
- `n8n_template_deploy` - ​​Развертывание шаблонов из n8n.io
- `n8n_workflow_versions_list` — просмотреть историю версий рабочего процесса.
- `n8n_workflow_versions_get` - ​​Получить конкретную версию рабочего процесса.
- `n8n_workflow_versions_rollback` - ​​Откат к предыдущей версии
- `n8n_workflow_versions_delete` - ​​Удаление версий рабочего процесса.
- `n8n_workflow_versions_prune` — сократить версии, чтобы сохранить N самых последних версий.
- `n8n_workflow_versions_truncate` - ​​Усекать ВСЕ версии (опасно)

### Использование с ИИ-агентами

Подключите n8n-MCP к узлам AI Agent для интеллектуальной автоматизации:

1. **Добавьте узел AI Agent** (например, OpenAI, Anthropic).
2. **Подключите клиентский инструмент MCP** к входу инструмента агента.
3. **Настройте запросы** для создания рабочего процесса:

```
You are an n8n workflow expert. Use the MCP tools to:
1. Search for appropriate nodes using n8n_nodes_search
2. Get configuration details with n8n_node_get
3. Validate configurations with n8n_workflow_json_validate
4. Create the workflow if all validations pass
```

## Безопасность и лучшие практики

### Аутентификация
- **MCP_AUTH_TOKEN**: всегда используйте надежный случайный токен (более 32 символов).
- **N8N_API_KEY**: требуется только для функций управления рабочим процессом.
- Храните токены в переменных среды или безопасных хранилищах.

### Сетевая безопасность
- **Использовать HTTPS** в рабочей среде (Caddy/Nginx/Traefik).
- **Брандмауэр**: открывайте только необходимые порты (3000 или 443).
- **Белый список IP**: рассмотрите возможность ограничения доступа к известным экземплярам n8n.

### Безопасность докера
- **Всегда извлекайте последние изображения**: Docker кэширует изображения локально, поэтому запустите `docker pull` перед развертыванием.
- Запускайте контейнеры с флагом `--read-only`, если это возможно.
- Используйте определенные версии изображений вместо `:latest` в производстве.
- Регулярные обновления: `docker pull ghcr.io/czlonkowski/n8n-mcp:latest`

## Поиск неисправностей

### Проблемы с изображениями Docker

**Использование устаревших кэшированных изображений**
- **Симптом**: отсутствуют функции, появляются старые ошибки, функции не работают так, как описано в документации.
- **Причина**: Docker использует локально кэшированные изображения вместо получения последней версии.
- **Решение**: всегда запускайте `docker pull ghcr.io/czlonkowski/n8n-mcp:latest` перед развертыванием.
- **Проверка**: проверьте возраст изображения с помощью `docker images | grep n8n-mcp`.

### Распространенные проблемы с конфигурацией

**Отсутствует переменная среды `MCP_MODE=http`**
- **Симптом**: клиентский инструмент n8n MCP не может подключиться, сервер не отвечает на конечной точке `/mcp`.
- **Решение**: добавьте `MCP_MODE=http` в переменные среды.
- **Почему**: без этого сервер работает в режиме stdio, который несовместим с n8n.

**Отсутствует URL-адрес сервера `/mcp` Конечная точка**
- **Симптом**: «Соединение отклонено» или «Неверный ответ» в клиентском инструменте n8n MCP.
- **Решение**: убедитесь, что URL-адрес вашего сервера включает `/mcp` (например, `http://localhost:3000/mcp`).
- **Почему**: n8n подключается именно к конечной точке `/mcp`, а не к корневому URL-адресу.

**Несовпадающие токены аутентификации**
- **Симптом**: «Ошибка аутентификации» или «Неверный токен аутентификации».
- **Решение**: убедитесь, что `MCP_AUTH_TOKEN` и `AUTH_TOKEN` имеют одинаковое значение.
- **Почему**: для правильной аутентификации обе переменные должны совпадать.

### Проблемы с подключением

** «Соединение отклонено» в клиентском инструменте n8n MCP**
1. **Проверьте, работает ли n8n-MCP**:
   ```bash
   # Docker
   docker ps | grep n8n-mcp
   docker logs n8n-mcp --tail 20
   
   # Systemd
   systemctl status n8n-mcp
   journalctl -u n8n-mcp --tail 20
   ```

2. **Убедитесь, что конечные точки доступны**:
   ```bash
   # Health check (should return status info)
   curl http://your-server:3000/health
   
   # MCP endpoint (should return protocol version)
   curl http://your-server:3000/mcp
   ```

3. **Проверьте брандмауэр и сеть**:
   ```bash
   # Test port accessibility from n8n server
   telnet your-mcp-server 3000
   
   # Check firewall rules (Ubuntu/Debian)
   sudo ufw status
   
   # Check if port is bound correctly
   netstat -tlnp | grep :3000
   ```

** «Неверный токен аутентификации» или «Ошибка аутентификации»**
1. **Проверьте формат токена**:
   ```bash
   # Check token length (should be 64 chars for hex-32)
   echo $MCP_AUTH_TOKEN | wc -c
   
   # Verify both tokens match
   echo "MCP_AUTH_TOKEN: $MCP_AUTH_TOKEN"
   echo "AUTH_TOKEN: $AUTH_TOKEN"
   ```

2. **Распространенные проблемы с токенами**:
- Токен слишком короткий (минимум 32 символа).
- Дополнительные пробелы или новые строки в токене.
- Различные значения для `MCP_AUTH_TOKEN` и `AUTH_TOKEN`.
- Специальные символы не экранируются должным образом в файлах окружения.

**"Невозможно подключиться к API n8n"**
1. **Проверьте конфигурацию n8n**:
   ```bash
   # Test n8n API accessibility
   curl -H "X-N8N-API-KEY: your-api-key" \
        https://your-n8n-instance.com/api/v1/workflows
   ```

2. **Распространённые проблемы с API n8n**:
- `N8N_API_URL` отсутствует протокол (http:// или https://)
- Срок действия ключа API n8n истек или недействителен.
- Экземпляр n8n недоступен с сервера n8n-MCP
- n8n API отключен в настройках

### Проблемы совместимости версий

**"Функции не работают должным образом"**
- **Симптом**: отсутствуют функции, старые ошибки или проблемы совместимости.
- **Решение**: извлеките последнее изображение: `docker pull ghcr.io/czlonkowski/n8n-mcp:latest`.
- **Проверка**: проверьте дату изображения с помощью `docker inspect ghcr.io/czlonkowski/n8n-mcp:latest | grep Created`.

**"Несоответствие версии протокола"**
- n8n-MCP автоматически использует версию 2024-11-05 для совместимости с n8n.
- Обновите до последней версии n8n-MCP, если проблемы не исчезнут.
- Убедитесь, что конечная точка `/mcp` возвращает правильную версию.

### Проблемы с переменными среды

**Полный контрольный список переменных среды**:
```bash
# Required for all deployments
export N8N_MODE=true                                    # Enables n8n integration
export MCP_MODE=http                                   # Enables HTTP mode for n8n
export MCP_AUTH_TOKEN=your-secure-32-char-token       # Auth token
export AUTH_TOKEN=your-secure-32-char-token           # Same value as MCP_AUTH_TOKEN

# Required for workflow management features
export N8N_API_URL=https://your-n8n-instance.com      # Your n8n URL
export N8N_API_KEY=your-n8n-api-key                   # Your n8n API key

# Optional
export PORT=3000                                       # HTTP port (default: 3000)
export LOG_LEVEL=info                                  # Logging level
```

### Проблемы, специфичные для Docker

**Ошибки сборки контейнера**
```bash
# Clear Docker cache and rebuild
docker system prune -f
docker build --no-cache -t n8n-mcp:latest .
```

**Проблемы выполнения контейнера**
```bash
# Check container logs for detailed errors
docker logs n8n-mcp -f --timestamps

# Inspect container environment
docker exec n8n-mcp env | grep -E "(N8N|MCP|AUTH)"

# Test container connectivity
docker exec n8n-mcp curl -f http://localhost:3000/health
```

### Проблемы с сетью и SSL

**Проблемы HTTPS/SSL**
```bash
# Test SSL certificate
openssl s_client -connect mcp.yourdomain.com:443

# Check Caddy logs
docker logs caddy -f --tail 50
```

**Проблемы с сетью Docker**
```bash
# Check if containers can communicate
docker network ls
docker network inspect bridge

# Test inter-container connectivity
docker exec n8n curl http://n8n-mcp:3000/health
```

### Шаги отладки

1. **Включить комплексное ведение журнала**:
```bash
# For Docker
docker run -d \
  --name n8n-mcp \
  -e DEBUG_MCP=true \
  -e LOG_LEVEL=debug \
  -e N8N_MODE=true \
  -e MCP_MODE=http \
  # ... other settings

# For systemd, add to service file:
Environment="DEBUG_MCP=true"
Environment="LOG_LEVEL=debug"
```

2. **Систематически тестируйте все конечные точки**:
```bash
# 1. Health check (basic server functionality)
curl -v http://localhost:3000/health

# 2. MCP protocol endpoint (what n8n connects to)
curl -v http://localhost:3000/mcp

# 3. Test authentication (if working, returns tools list)
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# 4. Test a simple tool (documentation only, no n8n API needed)
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_database_statistics","arguments":{}},"id":2}'
```

3. **Общие шаблоны журналов, на которые следует обратить внимание**:
```bash
# Success patterns
grep "Server started" /var/log/n8n-mcp.log
grep "Protocol version" /var/log/n8n-mcp.log

# Error patterns
grep -i "error\|failed\|invalid" /var/log/n8n-mcp.log
grep -i "auth\|token" /var/log/n8n-mcp.log
grep -i "connection\|network" /var/log/n8n-mcp.log
```

### Получение помощи

Если у вас все еще возникают проблемы:

1. **Соберите диагностическую информацию**:
```bash
# System info
docker --version
docker-compose --version
uname -a

# n8n-MCP version
docker exec n8n-mcp node dist/index.js --version

# Environment check
docker exec n8n-mcp env | grep -E "(N8N|MCP|AUTH)" | sort

# Container status
docker ps | grep n8n-mcp
docker stats n8n-mcp --no-stream
```

2. **Создайте минимальную тестовую установку**:
```bash
# Test with minimal configuration
docker run -d \
  --name n8n-mcp-test \
  -p 3001:3000 \
  -e N8N_MODE=true \
  -e MCP_MODE=http \
  -e MCP_AUTH_TOKEN=test-token-minimum-32-chars-long \
  -e AUTH_TOKEN=test-token-minimum-32-chars-long \
  -e LOG_LEVEL=debug \
  n8n-mcp:latest

# Test basic functionality
curl http://localhost:3001/health
curl http://localhost:3001/mcp
```

3. **Сообщить о проблемах**: включите диагностическую информацию при открытии проблемы на [GitHub](https://github.com/czlonkowski/n8n-mcp/issues)

## Советы по производительности

- **Минимальное развертывание**: достаточно 1 виртуального ЦП и 1 ГБ ОЗУ.
- **База данных**: предварительно созданная база данных SQLite (~15 МБ) загружается быстро.
- **Время ответа**: в среднем 12 мс для запросов.
- **Кэширование**: встроенный 15-минутный кеш для повторяющихся запросов.

## Следующие шаги

- Проверьте свою настройку с помощью [MCP Client Tool в n8n](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.mcpclienttool/)
- Изучите [доступные инструменты MCP](../README.md#-available-mcp-tools)
- Создавайте рабочие процессы на основе искусственного интеллекта с помощью [узлов AI Agent](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmagent/)
- Присоединяйтесь к [n8n Community](https://community.n8n.io) для идей и поддержки.

---

Нужна помощь? Откройте проблему на [GitHub](https://github.com/czlonkowski/n8n-mcp/issues) или посетите [форумы n8n](https://community.n8n.io)
