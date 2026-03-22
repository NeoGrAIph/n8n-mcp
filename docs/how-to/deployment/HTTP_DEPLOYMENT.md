# Руководство по развертыванию HTTP для n8n-MCP

Разверните n8n-MCP в качестве удаленного HTTP-сервера, чтобы предоставлять знания n8n совместимому клиенту MCP из любой точки мира.

## 🎯 Обзор

Режим HTTP n8n-MCP позволяет:
- ☁️ Развертывание в облаке (VPS, Docker, Kubernetes)
- 🌐 Удаленный доступ с любого Claude Desktop/Windsurf/другого клиента MCP.
- 🔒 Аутентификация на основе токенов
- ⚡ Готовая к работе производительность (время отклика ~ 12 мс)
- 🚀 Дополнительные инструменты управления n8n (16 дополнительных инструментов при настройке)
- ❌ Не работает с n8n MCP Tool.

## 📐 Сценарии развертывания

### 1. Локальное развитие (самое простое)
Используйте **режим stdio** — Claude Desktop подключается напрямую к процессу Node.js:
```
Claude Desktop → n8n-mcp (stdio mode)
```
- ✅ HTTP-сервер не требуется
- ✅ Не требуется аутентификация
- ✅ Самая быстрая производительность
- ❌ Работает только локально

### 2. Локальный HTTP-сервер
Запустите HTTP-сервер локально для тестирования удаленных функций:
```
Claude Desktop → http-bridge.js → localhost:3000
```
- ✅ Тестируйте функции HTTP локально.
- ✅ Можно подключить несколько экземпляров Claude
- ✅ Полезно для развития
- ❌ По-прежнему только локальный доступ

### 3. Удаленный сервер
Развертывание в облаке для доступа из любого места:
```
Claude Desktop → mcp-remote → https://your-server.com
```
- ✅ Доступ из любого места
- ✅ Взаимодействие в команде
- ✅ Готовность к производству
- ❌ Требуется настройка сервера
- Развертывание на своем VPS. Если вам просто нужен удаленный доступ, рассмотрите возможность развертывания на железной дороге -> [Руководство по развертыванию на железной дороге](./RAILWAY_DEPLOYMENT.md)


## 📋 Предварительные условия

**Требования к серверу:**
- Node.js 16+ или Docker
- Минимум 512 МБ ОЗУ
- Публичный IP-адрес или доменное имя.
- (Рекомендуется) SSL-сертификат для HTTPS.

**Требования клиента:**
- Клод Рабочий стол
- Node.js 18+ (для mcp-remote)
- Или Claude Pro/Team (для встроенного удаленного MCP)

## 🚀 Быстрый старт

### Вариант 1. Развертывание Docker (рекомендуется для рабочей среды)

```bash
# 1. Create environment file
cat > .env << EOF
AUTH_TOKEN=$(openssl rand -base64 32)
USE_FIXED_HTTP=true
MCP_MODE=http
PORT=3000
# Optional: Enable n8n management tools
# N8N_API_URL=https://your-n8n-instance.com
# N8N_API_KEY=your-api-key-here
# Security Configuration (v2.16.3+)
# Rate limiting (default: 20 attempts per 15 minutes)
AUTH_RATE_LIMIT_WINDOW=900000
AUTH_RATE_LIMIT_MAX=20
# SSRF protection mode (default: strict)
# Use 'moderate' for local n8n, 'strict' for production
WEBHOOK_SECURITY_MODE=strict
EOF

# 2. Deploy with Docker
docker run -d \
  --name n8n-mcp \
  --restart unless-stopped \
  --env-file .env \
  -p 3000:3000 \
  ghcr.io/czlonkowski/n8n-mcp:latest

# 3. Verify deployment
curl http://localhost:3000/health
```

### Вариант 2: Локальная разработка (без Docker)

```bash
# 1. Clone and setup
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp
npm install
npm run build
npm run rebuild

# 2. Configure environment
export MCP_MODE=http
export USE_FIXED_HTTP=true  # Important: Use fixed implementation
export AUTH_TOKEN=$(openssl rand -base64 32)
export PORT=3000

# 3. Start server
npm run start:http
```

### Вариант 3: режим Direct stdio (самый простой для локального)

Полностью пропустите HTTP и используйте режим stdio напрямую:

```json
{
  "mcpServers": {
    "n8n-local": {
      "command": "node",
      "args": [
        "/path/to/n8n-mcp/dist/mcp/index.js"
      ],
      "env": {
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

💡 **Сохраните свой AUTH_TOKEN** — он понадобится клиентам для подключения!

## ⚙️ Конфигурация

### Обязательные переменные среды

| Переменная | Описание | Пример |
|----------|-------------|------|
| @@КОД0@@ | Должно быть установлено значение `http` | `http` |
| @@КОД0@@ | **Важно**: для стабильной реализации установите значение `true` | `true` |
| `AUTH_TOKEN` или `AUTH_TOKEN_FILE` | Метод аутентификации | См. раздел безопасности |

### Дополнительные настройки

| Переменная | Описание | По умолчанию | Поскольку |
|----------|-------------|---------|-------|
| @@КОД0@@ | Порт сервера | `3000` | v1.0 |
| @@КОД0@@ | Привязать адрес | `0.0.0.0` | v1.0 |
| @@КОД0@@ | Подробность журнала (ошибка/предупреждение/информация/отладка) | `info` | v1.0 |
| @@КОД0@@ | Окружающая среда | `production` | v1.0 |
| @@КОД0@@ | Доверительные заголовки прокси-сервера (0 = выключено, 1+ = прыжки) | `0` | v2.7.6 |
| @@КОД0@@ | Явный общедоступный URL-адрес | Автоматически обнаружено | v2.7.14 |
| @@КОД0@@ | Альтернатива BASE_URL | Автоматически обнаружено | v2.7.14 |
| @@КОД0@@ | CORS разрешено происхождение | `*` | v2.7.8 |
| @@КОД0@@ | Путь к файлу токена | - | v2.7.10 |

### Инструменты управления n8n (дополнительно)

Включите дополнительные инструменты для управления рабочими процессами n8n, настроив доступ к API:

⚠️ **Требуется версия 2.7.1+** — в более ранних версиях были проблемы с регистрацией инструмента в средах Docker.

| Переменная | Описание | Пример |
|----------|-------------|---------|
| @@КОД0@@ | URL-адрес вашего экземпляра n8n | `https://your-n8n.com` |
| @@КОД0@@ | Ключ API n8n (из «Настройки» > «API») | `n8n_api_key_xxx` |
| @@КОД0@@ | Тайм-аут запроса (мс) | `30000` |
| @@КОД0@@ | Максимальное количество повторных попыток | `3` |

#### Что это дает

При настройке вы получаете дополнительные инструменты управления n8n:

**Управление рабочим процессом:**
- `n8n_workflow_create` - ​​Создание новых рабочих процессов
- `n8n_workflow_get` - ​​Получить рабочий процесс по идентификатору (полный/детальный/структурный/минимальный режимы)
- `n8n_workflow_update_full` - ​​Обновление всего рабочего процесса.
- `n8n_workflow_update_partial` - ​​Обновление с использованием операций сравнения.
- `n8n_workflow_delete` - ​​Удаление рабочих процессов
- `n8n_workflows_list` — список рабочих процессов с фильтрами.
- `n8n_workflow_validate` - ​​Проверка рабочих процессов в n8n по идентификатору.
- `n8n_workflow_autofix` - ​​Автоматическое исправление распространенных ошибок рабочего процесса.
- `n8n_template_deploy` - ​​Развертывание шаблонов из n8n.io
- `n8n_workflow_versions_list` — просмотреть историю версий рабочего процесса.
- `n8n_workflow_versions_get` - ​​Получить конкретную версию рабочего процесса.
- `n8n_workflow_versions_rollback` - ​​Откат к предыдущей версии
- `n8n_workflow_versions_delete` - ​​Удаление версий рабочего процесса.
- `n8n_workflow_versions_prune` — сократить версии, чтобы сохранить N самых последних версий.
- `n8n_workflow_versions_truncate` - ​​Усекать ВСЕ версии (опасно)

**Управление выполнением:**
- `n8n_workflow_test` - ​​Запустить externally-triggerable workflow (`webhook` / `form` / `chat`).
- `n8n_workflow_runner_test` - Выполнить full workflow через utility runner, включая manual-only сценарии.
- `n8n_executions_get` - ​​Получить подробности выполнения
- `n8n_executions_list` - ​​Список выполнений
- `n8n_executions_delete` - ​​Удалить записи выполнения

**Системные инструменты:**
- `n8n_health_check` - ​​Проверьте подключение n8n

#### Получение ключа API n8n

1. Войдите в свой экземпляр n8n.
2. Откройте **Настройки** > **API**.
3. Нажмите **Создать ключ API**.
4. Скопируйте сгенерированный ключ

⚠️ **Примечание по безопасности**: надежно храните ключи API и никогда не передайте их контролю версий.

## 🏗️ Архитектура

### Как работает режим HTTP

```
┌─────────────────┐        ┌─────────────┐        ┌──────────────┐
│ Claude Desktop  │ stdio  │ mcp-remote  │  HTTP  │  n8n-MCP     │
│ (stdio only)    ├───────►│ (bridge)    ├───────►│  HTTP Server │
└─────────────────┘        └─────────────┘        └──────────────┘
                                                           │
                                                           ▼
                                                   ┌──────────────┐
                                                   │ Your n8n     │
                                                   │ Instance     │
                                                   └──────────────┘
```

**Ключевые моменты:**
- Claude Desktop **поддерживает только связь stdio**.
- `mcp-remote` действует как мост, преобразуя stdio ↔ HTTP.
- Сервер n8n-MCP подключается к **одному экземпляру n8n** (настроенному на стороне сервера)
- Все клиенты используют один и тот же экземпляр n8n (одноарендная конструкция).

## 🌐 Конфигурация обратного прокси

### Конфигурация URL-адреса (v2.7.14+)

n8n-MCP интеллектуально определяет ваш общедоступный URL-адрес:

#### Приоритетный порядок:
1. **Явная конфигурация** (высший приоритет):
   ```bash
   BASE_URL=https://n8n-mcp.example.com  # Full public URL
   # or
   PUBLIC_URL=https://api.company.com:8443/mcp
   ```

2. **Автоопределение** (когда TRUST_PROXY включен):
   ```bash
   TRUST_PROXY=1  # Required for proxy header detection
   # Server reads X-Forwarded-Proto and X-Forwarded-Host
   ```

3. **Резервный вариант** (локальная привязка):
   ```bash
   # No configuration needed
   # Shows: http://localhost:3000 (or configured HOST:PORT)
   ```

#### Что вы увидите в журналах:
```
[INFO] Starting n8n-MCP HTTP Server v2.7.17...
[INFO] Server running at https://n8n-mcp.example.com
[INFO] Endpoints:
[INFO]   Health: https://n8n-mcp.example.com/health
[INFO]   MCP:    https://n8n-mcp.example.com/mcp
```

### Доверительный прокси для правильной регистрации IP-адресов

При запуске n8n-MCP за обратным прокси-сервером (Nginx, Traefik и т. д.) включите доверенный прокси-сервер для регистрации реальных IP-адресов клиентов вместо IP-адресов прокси:

```bash
# Enable trust proxy in your environment
TRUST_PROXY=1  # Trust 1 proxy hop (standard setup)
# or
TRUST_PROXY=2  # Trust 2 proxy hops (CDN → Load Balancer → n8n-mcp)
```

**Без TRUST_PROXY:**
```
[INFO] GET /health { ip: '172.19.0.2' }  # Docker internal IP
```

**При TRUST_PROXY=1:**
```
[INFO] GET /health { ip: '203.0.113.1' }  # Real client IP
```

Это особенно важно, когда:
- Запуск в Docker/Kubernetes
- Использование балансировщиков нагрузки.
- Отладка проблем с клиентом.
- Реализация ограничения скорости

## 🔐 Настройка безопасности

### Аутентификация

Все запросы требуют аутентификации токена на предъявителя:

```bash
# Test authentication
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     https://your-server.com/health
```

### SSL/HTTPS (настоятельно рекомендуется)

Используйте обратный прокси-сервер для завершения SSL:

**Пример Nginx:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /mcp {
        proxy_pass http://localhost:3000;
        proxy_set_header Authorization $http_authorization;
        # Important: Forward client IP headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Пример Caddy (автоматический HTTPS):**
```caddy
your-domain.com {
    reverse_proxy /mcp localhost:3000
}
```

## 💻 Конфигурация клиента

⚠️ **Требования**: на клиентском компьютере для `mcp-remote` должен быть установлен Node.js 18+.

### Способ 1: использование mcp-remote (рекомендуется)

```json
{
  "mcpServers": {
    "n8n-remote": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-server.com/mcp",
        "--header",
        "Authorization: Bearer YOUR_AUTH_TOKEN_HERE"
      ]
    }
  }
}
```

**Примечание**. Замените `YOUR_AUTH_TOKEN_HERE` своим действительным токеном. НЕ используйте синтаксис `${AUTH_TOKEN}` — Claude Desktop не поддерживает замену переменных среды в args.

### Способ 2: использование пользовательского сценария моста

Для локального тестирования или когда mcp-remote недоступен:

```json
{
  "mcpServers": {
    "n8n-local-http": {
      "command": "node",
      "args": [
        "/path/to/n8n-mcp/scripts/http-bridge.js"
      ],
      "env": {
        "MCP_URL": "http://localhost:3000/mcp",
        "AUTH_TOKEN": "your-auth-token-here"
      }
    }
  }
}
```

### Локальная разработка с помощью Docker

При локальном тестировании с помощью Docker:

```json
{
  "mcpServers": {
    "n8n-docker-http": {
      "command": "node",
      "args": [
        "/path/to/n8n-mcp/scripts/http-bridge.js"
      ],
      "env": {
        "MCP_URL": "http://localhost:3001/mcp",
        "AUTH_TOKEN": "docker-test-token"
      }
    }
  }
}
```

## 🌐 Развертывание производства

### Docker Compose (полный пример)

```yaml
version: '3.8'

services:
  n8n-mcp:
    image: ghcr.io/czlonkowski/n8n-mcp:latest
    container_name: n8n-mcp
    restart: unless-stopped
    environment:
      # Core configuration
      MCP_MODE: http
      USE_FIXED_HTTP: true
      NODE_ENV: production
      
      # Security - Using file-based secret
      AUTH_TOKEN_FILE: /run/secrets/auth_token
      
      # Networking
      HOST: 0.0.0.0
      PORT: 3000
      TRUST_PROXY: 1  # Behind Nginx/Traefik
      CORS_ORIGIN: https://app.example.com  # Restrict in production
      
      # URL Configuration
      BASE_URL: https://n8n-mcp.example.com
      
      # Logging
      LOG_LEVEL: info
      
      # Optional: n8n API Integration
      N8N_API_URL: ${N8N_API_URL}
      N8N_API_KEY_FILE: /run/secrets/n8n_api_key
      
    secrets:
      - auth_token
      - n8n_api_key
      
    ports:
      - "127.0.0.1:3000:3000"  # Only expose to localhost
      
    volumes:
      - n8n-mcp-data:/app/data:ro  # Read-only database
      
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
      
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 128M
          cpus: '0.1'
    
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

secrets:
  auth_token:
    file: ./secrets/auth_token.txt
  n8n_api_key:
    file: ./secrets/n8n_api_key.txt

volumes:
  n8n-mcp-data:
```

### Служба Systemd (производственная Linux)

```ini
# /etc/systemd/system/n8n-mcp.service
[Unit]
Description=n8n-MCP HTTP Server
Documentation=https://github.com/czlonkowski/n8n-mcp
After=network.target
Requires=network.target

[Service]
Type=simple
User=n8n-mcp
Group=n8n-mcp
WorkingDirectory=/opt/n8n-mcp

# Use file-based secret
Environment="AUTH_TOKEN_FILE=/etc/n8n-mcp/auth_token"
Environment="MCP_MODE=http"
Environment="USE_FIXED_HTTP=true"
Environment="NODE_ENV=production"
Environment="TRUST_PROXY=1"
Environment="BASE_URL=https://n8n-mcp.example.com"

# Additional config from file
EnvironmentFile=-/etc/n8n-mcp/config.env

ExecStartPre=/usr/bin/test -f /etc/n8n-mcp/auth_token
ExecStart=/usr/bin/node dist/mcp/index.js --http

# Restart configuration
Restart=always
RestartSec=10
StartLimitBurst=5
StartLimitInterval=60s

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/n8n-mcp/data
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true

# Resource limits
LimitNOFILE=65536
MemoryLimit=512M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
```

**Настраивать:**
```bash
# Create user and directories
sudo useradd -r -s /bin/false n8n-mcp
sudo mkdir -p /opt/n8n-mcp /etc/n8n-mcp
sudo chown n8n-mcp:n8n-mcp /opt/n8n-mcp

# Create secure token
sudo sh -c 'openssl rand -base64 32 > /etc/n8n-mcp/auth_token'
sudo chmod 600 /etc/n8n-mcp/auth_token
sudo chown n8n-mcp:n8n-mcp /etc/n8n-mcp/auth_token

# Deploy application
sudo -u n8n-mcp git clone https://github.com/czlonkowski/n8n-mcp.git /opt/n8n-mcp
cd /opt/n8n-mcp
sudo -u n8n-mcp npm install --production
sudo -u n8n-mcp npm run build
sudo -u n8n-mcp npm run rebuild

# Start service
sudo systemctl daemon-reload
sudo systemctl enable n8n-mcp
sudo systemctl start n8n-mcp
```

Давать возможность:
```bash
sudo systemctl enable n8n-mcp
sudo systemctl start n8n-mcp
```

## 📡 Мониторинг и обслуживание

### Сведения о конечной точке работоспособности

```bash
# Basic health check
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     https://your-server.com/health

# Response:
{
  "status": "ok",
  "mode": "http-fixed",
  "version": "2.7.17",
  "uptime": 3600,
  "memory": {
    "used": 95,
    "total": 512,
    "percentage": 18.5
  },
  "node": {
    "version": "v20.11.0",
    "platform": "linux"
  },
  "features": {
    "n8nApi": true,  // If N8N_API_URL configured
    "authFile": true  // If using AUTH_TOKEN_FILE
  }
}
```

## 🔒 Функции безопасности (v2.16.3+)

### Ограничение скорости

Встроенное ограничение скорости защищает конечные точки аутентификации от атак методом перебора:

**Конфигурация:**
```bash
# Defaults (15 minutes window, 20 attempts per IP)
AUTH_RATE_LIMIT_WINDOW=900000  # milliseconds
AUTH_RATE_LIMIT_MAX=20
```

**Функции:**
- Ограничение скорости по IP с настраиваемым окном и максимальным количеством попыток.
- Стандартные заголовки ограничения скорости (RateLimit-Limit, RateLimit-Remaining, RaceLimit-Reset)
- Ответы об ошибках в формате JSON-RPC.
- Автоматическое отслеживание IP-адресов за обратными прокси (требуется TRUST_PROXY=1)

**Поведение:**
- Первые 20 попыток: возврат 401 Unauthorized для неверных учетных данных.
- Попытки 21+: возврат слишком большого количества запросов 429 с заголовком Retry-After.
- Счетчик сбрасывается через 15 минут (настраивается)

### SSRF-защита

Предотвращает атаки подделки запросов на стороне сервера при использовании триггеров веб-перехватчика:

**Три режима безопасности:**

1. **Строгий режим (по умолчанию)** — рабочие развертывания.
   ```bash
   WEBHOOK_SECURITY_MODE=strict
   ```
- ✅ Заблокировать локальный хост (127.0.0.1, ::1)
- ✅ Блокировать частные IP-адреса (10.x, 192.168.x, 172.16-31.x)
- ✅ Блокировать облачные метаданные (169.254.169.254, Metadata.google.internal)
- ✅ Предотвращение перепривязки DNS
- 🎯 **Использование**: облачные развертывания, производственные среды.

2. **Умеренный режим** – локальная разработка с использованием локального n8n.
   ```bash
   WEBHOOK_SECURITY_MODE=moderate
   ```
- ✅ Разрешить localhost (для локальных экземпляров n8n)
- ✅ Блокировать частные IP-адреса
- ✅ Блокировать облачные метаданные
- ✅ Предотвращение перепривязки DNS
- 🎯 **Использовать для**: Разработка с помощью n8n на локальном хосте: 5678.

3. **Разрешительный режим** – только внутренние сети.
   ```bash
   WEBHOOK_SECURITY_MODE=permissive
   ```
- ✅ Разрешить локальный хост и частные IP-адреса
- ✅ Блокировать метаданные облака (всегда заблокировано)
- ✅ Предотвращение перепривязки DNS
- 🎯 **Использовать для**: внутреннее тестирование (НЕ для производства)

**Важно!** Конечные точки облачных метаданных ВСЕГДА блокируются во всех режимах в целях безопасности.

## 🔒 Лучшие практики безопасности

### 1. Управление токенами

**ДЕЛАТЬ:**
- ✅ Используйте жетоны с 32+ символами
- ✅ Храните токены в защищенных файлах или в секретных файлах.
- ✅ Регулярная ротация токенов (минимум ежемесячно)
- ✅ Используйте разные токены для каждой среды.
- ✅ Мониторинг журналов на предмет ошибок аутентификации.

**НЕ:**
- ❌ Используйте токены по умолчанию или примеры.
- ❌ Зафиксировать токены для контроля версий
- ❌ Делитесь токенами между средами
- ❌ Токены журналов в виде обычного текста

```bash
# Generate strong token
openssl rand -base64 32

# Secure storage options:
# 1. Docker secrets (recommended)
echo $(openssl rand -base64 32) | docker secret create auth_token -

# 2. Kubernetes secrets
kubectl create secret generic n8n-mcp-auth \
  --from-literal=token=$(openssl rand -base64 32)

# 3. HashiCorp Vault
vault kv put secret/n8n-mcp token=$(openssl rand -base64 32)
```

### 2. Сетевая безопасность

- ✅ **Всегда используйте HTTPS** в производстве
- ✅ **Правила брандмауэра** для ограничения доступа.
- ✅ **VPN** для внутреннего развертывания
- ✅ **Ограничение скорости** на уровне прокси

### 3. Безопасность контейнера

```bash
# Run as non-root user (already configured)
# Read-only filesystem
docker run --read-only \
  --tmpfs /tmp \
  -v n8n-mcp-data:/app/data \
  n8n-mcp

# Security scanning
docker scan ghcr.io/czlonkowski/n8n-mcp:latest
```

## 🔍 Устранение неполадок

### Распространенные проблемы и решения

#### Проблемы с аутентификацией

**Ошибка «Несанкционировано»:**
```bash
# Check token is set correctly
docker exec n8n-mcp env | grep AUTH

# Test with curl
curl -v -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-server.com/health

# Common causes:
# - Extra spaces in token
# - Missing "Bearer " prefix
# - Token file has newline at end
# - Wrong quotes in JSON config
```

**Предупреждение токена по умолчанию:**
```
⚠️ SECURITY WARNING: Using default AUTH_TOKEN
```
- Немедленно изменить токен через переменную среды.
- Сервер показывает это предупреждение каждые 5 минут.

#### Проблемы с подключением

**"TransformStream не определен":**
```bash
# Check Node.js version on CLIENT machine
node --version  # Must be 18+

# Update Node.js
# macOS: brew upgrade node
# Linux: Use NodeSource repository
# Windows: Download from nodejs.org
```

**"Невозможно подключиться к серверу":**
```bash
# 1. Check server is running
docker ps | grep n8n-mcp

# 2. Check logs for errors
docker logs n8n-mcp --tail 50

# 3. Test locally first
curl http://localhost:3000/health

# 4. Check firewall
sudo ufw status  # Linux
```

**"Поток не читается":**
- Убедитесь, что `USE_FIXED_HTTP=true` установлен.
- Исправлено в версии 2.3.2+

**Скрипт моста не работает:**
```bash
# Test the bridge manually
export MCP_URL=http://localhost:3000/mcp
export AUTH_TOKEN=your-token
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node /path/to/http-bridge.js
```

**В соединении отказано:**
```bash
# Check server is running
curl http://localhost:3000/health

# Check Docker status
docker ps
docker logs n8n-mcp

# Check firewall
sudo ufw status
```

**Аутентификация не удалась:**
- Убедитесь, что AUTH_TOKEN точно соответствует
- Проверьте наличие лишних пробелов или кавычек.
- Сначала протестируйте с помощью Curl

#### Проблемы с настройкой моста

**"Зачем использовать "узел" вместо "докер" в конфигурации Клода?"**

Claude Desktop поддерживает только stdio. Архитектура:
```
Claude → stdio → mcp-remote → HTTP → Docker container
```

Команда `node` запускает mcp-remote (мост), а не сервер напрямую.

**"Команда не найдена: npx":**
```bash
# Install Node.js 18+ which includes npx
# Or use full path:
which npx  # Find npx location
# Use that path in Claude config
```

### Режим отладки

```bash
# 1. Enable debug logging
docker run -e LOG_LEVEL=debug ...

# 2. Test MCP endpoint
curl -X POST https://your-server.com/mcp \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# 3. Test with mcp-remote directly
MCP_URL=https://your-server.com/mcp \
AUTH_TOKEN=your-token \
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  npx mcp-remote $MCP_URL --header "Authorization: Bearer $AUTH_TOKEN"
```

### Развертывание облачной платформы

**Железная дорога:** см. наше [Руководство по развертыванию железной дороги](./RAILWAY_DEPLOYMENT.md)

## 🔧 Использование инструментов управления n8n

Когда API n8n настроен, Клод может напрямую управлять рабочими процессами:

### Пример: создание рабочего процесса с помощью Claude

```bash
# Test n8n connectivity first
curl -X POST https://your-server.com/mcp \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "n8n_health_check",
    "params": {},
    "id": 1
  }'
```

### Распространенные случаи использования

1. **Автоматизация рабочих процессов**: Клод может создавать, обновлять рабочие процессы и управлять ими.
2. **Интеграция CI/CD**: развертывание рабочих процессов из системы контроля версий.
3. **Шаблоны рабочих процессов**: Клод может применять шаблоны к новым рабочим процессам.
4. **Мониторинг**: отслеживание статуса выполнения и ошибок отладки.
5. **Дополнительные обновления**: используйте обновления на основе различий для эффективных изменений.

### Рекомендации по обеспечению безопасности для API n8n

- 🔐 Используйте отдельные ключи API для разных сред.
- 🔄 Регулярно меняйте ключи API
- 📝 Аудит изменений рабочего процесса через журнал аудита n8n.
- 🚫 Никогда не открывайте n8n API напрямую в Интернет.
- ✅ Используйте сервер MCP в качестве уровня безопасности.

## 📦 Обновления и обслуживание

### Обновления версий

```bash
# Check current version
docker exec n8n-mcp node -e "console.log(require('./package.json').version)"

# Update to latest
docker pull ghcr.io/czlonkowski/n8n-mcp:latest
docker stop n8n-mcp
docker rm n8n-mcp
# Re-run with same environment

# Update to specific version
docker pull ghcr.io/czlonkowski/n8n-mcp:v2.7.17
```

### Управление базой данных

```bash
# The database is read-only and pre-built
# No backups needed for the node database
# Updates include new database versions

# Check database stats
curl -X POST https://your-server.com/mcp \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "get_database_statistics",
    "id": 1
  }'
```

## 🆘 Получение помощи

- 📚 [Полная документация](https://github.com/czlonkowski/n8n-mcp)
- 🚂 [Руководство по развертыванию на железной дороге](./RAILWAY_DEPLOYMENT.md) – Самый простой вариант развертывания
- 🐛 [Сообщить о проблемах](https://github.com/czlonkowski/n8n-mcp/issues)
- 💬 [Обсуждения сообщества](https://github.com/czlonkowski/n8n-mcp/discussions)
