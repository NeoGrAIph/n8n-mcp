# Руководство по использованию библиотеки — многопользовательские/размещенные развертывания

В этом руководстве рассматривается использование n8n-mcp в качестве зависимости библиотеки для создания мультитенантных размещенных служб.

## Обзор

n8n-mcp можно использовать в качестве библиотеки Node.js для создания многопользовательских серверов, которые предоставляют услуги MCP нескольким пользователям или экземплярам. Пакет экспортирует все необходимые компоненты для интеграции в существующие сервисы.

## Установка

```bash
npm install n8n-mcp
```

## Основные понятия

### Режим библиотеки и режим CLI

- **Режим CLI** (по умолчанию): использование в одиночной игре через `npx n8n-mcp` или Docker.
- **Режим библиотеки**: многопользовательское использование путем импорта и использования класса `N8NMCPEngine`.

### Контекст экземпляра

Тип `InstanceContext` позволяет передавать конфигурацию каждого запроса в механизм MCP:

```typescript
interface InstanceContext {
  // Instance-specific n8n API configuration
  n8nApiUrl?: string;
  n8nApiKey?: string;
  n8nApiTimeout?: number;
  n8nApiMaxRetries?: number;

  // Instance identification
  instanceId?: string;
  sessionId?: string;

  // Extensible metadata
  metadata?: Record<string, any>;
}
```

## Базовый пример

```typescript
import express from 'express';
import { N8NMCPEngine } from 'n8n-mcp';

const app = express();
const mcpEngine = new N8NMCPEngine({
  sessionTimeout: 3600000, // 1 hour
  logLevel: 'info'
});

// Handle MCP requests with per-user context
app.post('/mcp', async (req, res) => {
  const instanceContext = {
    n8nApiUrl: req.user.n8nUrl,
    n8nApiKey: req.user.n8nApiKey,
    instanceId: req.user.id
  };

  await mcpEngine.processRequest(req, res, instanceContext);
});

app.listen(3000);
```

## Пример многотенантного бэкэнда

В этом примере показана полная мультитенантная реализация с аутентификацией пользователей и управлением экземплярами:

```typescript
import express from 'express';
import { N8NMCPEngine, InstanceContext, validateInstanceContext } from 'n8n-mcp';

const app = express();
const mcpEngine = new N8NMCPEngine({
  sessionTimeout: 3600000, // 1 hour
  logLevel: 'info'
});

// Start MCP engine
await mcpEngine.start();

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify token and attach user to request
  req.user = await getUserFromToken(token);
  next();
};

// Get instance configuration from database
const getInstanceConfig = async (instanceId: string, userId: string) => {
  // Your database logic here
  const instance = await db.instances.findOne({
    where: { id: instanceId, userId }
  });

  if (!instance) {
    throw new Error('Instance not found');
  }

  return {
    n8nApiUrl: instance.n8nUrl,
    n8nApiKey: await decryptApiKey(instance.encryptedApiKey),
    instanceId: instance.id
  };
};

// MCP endpoint with per-instance context
app.post('/api/instances/:instanceId/mcp', authenticate, async (req, res) => {
  try {
    // Get instance configuration
    const instance = await getInstanceConfig(req.params.instanceId, req.user.id);

    // Create instance context
    const context: InstanceContext = {
      n8nApiUrl: instance.n8nApiUrl,
      n8nApiKey: instance.n8nApiKey,
      instanceId: instance.instanceId,
      metadata: {
        userId: req.user.id,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    };

    // Validate context before processing
    const validation = validateInstanceContext(context);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid instance configuration',
        details: validation.errors
      });
    }

    // Process request with instance context
    await mcpEngine.processRequest(req, res, context);

  } catch (error) {
    console.error('MCP request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health endpoint
app.get('/health', async (req, res) => {
  const health = await mcpEngine.healthCheck();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await mcpEngine.shutdown();
  process.exit(0);
});

app.listen(3000);
```

## Справочник по API

### N8NMCPEngine

#### Конструктор

```typescript
new N8NMCPEngine(options?: {
  sessionTimeout?: number;  // Session TTL in ms (default: 1800000 = 30min)
  logLevel?: 'error' | 'warn' | 'info' | 'debug';  // Default: 'info'
})
```

#### Методы

##### `async processRequest(req, res, context?)`

Обработайте один запрос MCP с дополнительным контекстом экземпляра.

**Параметры:**
- `req`: объект экспресс-запроса.
- `res`: объект экспресс-ответа.
- `context` (необязательно): InstanceContext с настройкой для каждого экземпляра.

**Пример:**
```typescript
const context: InstanceContext = {
  n8nApiUrl: 'https://instance1.n8n.cloud',
  n8nApiKey: 'instance1-key',
  instanceId: 'tenant-123'
};

await engine.processRequest(req, res, context);
```

##### `async healthCheck()`

Получите состояние здоровья двигателя для мониторинга.

**Возврат:** `EngineHealth`
```typescript
{
  status: 'healthy' | 'unhealthy';
  uptime: number;  // seconds
  sessionActive: boolean;
  memoryUsage: {
    used: number;
    total: number;
    unit: string;
  };
  version: string;
}
```

**Пример:**
```typescript
app.get('/health', async (req, res) => {
  const health = await engine.healthCheck();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

##### `getSessionInfo()`

Получите текущую информацию о сеансе для отладки.

**Возвраты:**
```typescript
{
  active: boolean;
  sessionId?: string;
  age?: number;  // milliseconds
  sessions?: {
    total: number;
    active: number;
    expired: number;
    max: number;
    sessionIds: string[];
  };
}
```

##### `async start()`

Запустите двигатель (для автономного режима). Не требуется при непосредственном использовании `processRequest()`.

##### `async shutdown()`

Плавное завершение работы для управления жизненным циклом службы.

**Пример:**
```typescript
process.on('SIGTERM', async () => {
  await engine.shutdown();
  process.exit(0);
});
```

### Типы

#### Контекст экземпляра

Конфигурация для конкретного экземпляра пользователя:

```typescript
interface InstanceContext {
  n8nApiUrl?: string;
  n8nApiKey?: string;
  n8nApiTimeout?: number;
  n8nApiMaxRetries?: number;
  instanceId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}
```

#### Функции проверки

##### `validateInstanceContext(context: InstanceContext)`

Проверьте и очистите контекст экземпляра.

**Возвраты:**
```typescript
{
  valid: boolean;
  errors?: string[];
}
```

**Пример:**
```typescript
import { validateInstanceContext } from 'n8n-mcp';

const validation = validateInstanceContext(context);
if (!validation.valid) {
  console.error('Invalid context:', validation.errors);
}
```

##### `isInstanceContext(obj: any)`

Введите Guard, чтобы проверить, является ли объект допустимым InstanceContext.

**Пример:**
```typescript
import { isInstanceContext } from 'n8n-mcp';

if (isInstanceContext(req.body.context)) {
  // TypeScript knows this is InstanceContext
  await engine.processRequest(req, res, req.body.context);
}
```

## Управление сеансами

### Стратегии сеансов

Движок MCP поддерживает гибкие форматы идентификаторов сеансов:

- **UUIDv4**: внутренний формат n8n-mcp (по умолчанию).
- **Префикс экземпляра**: `instance-{userId}-{hash}-{uuid}` для многопользовательской изоляции.
- **Пользовательские форматы**: любая непустая строка для mcp-remote и других прокси.

Проверка сеанса происходит посредством поиска транспорта, а не проверки формата. Это обеспечивает совместимость со всеми клиентами MCP.

### Мультитенантная конфигурация

Установите эти переменные среды для многопользовательского режима:

```bash
# Enable multi-tenant mode
ENABLE_MULTI_TENANT=true

# Session strategy: "instance" (default) or "shared"
MULTI_TENANT_SESSION_STRATEGY=instance
```

**Стратегии сеансов:**

- **экземпляр** (рекомендуется): каждый арендатор получает изолированные сеансы.
- Идентификатор сеанса: `instance-{instanceId}-{configHash}-{uuid}`
- Лучшая изоляция и безопасность
- Упрощенная отладка для каждого арендатора.

- **совместно**: несколько арендаторов совместно используют сеансы с переключением контекста.
- Более эффективен при большом количестве арендаторов.
- Требует тщательного управления контекстом.

## Вопросы безопасности

### Управление ключами API

Всегда шифруйте ключи API на стороне сервера:

```typescript
import { createCipheriv, createDecipheriv } from 'crypto';

// Encrypt before storing
const encryptApiKey = (apiKey: string) => {
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  return cipher.update(apiKey, 'utf8', 'hex') + cipher.final('hex');
};

// Decrypt before using
const decryptApiKey = (encrypted: string) => {
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};

// Use decrypted key in context
const context: InstanceContext = {
  n8nApiKey: await decryptApiKey(instance.encryptedApiKey),
  // ...
};
```

### Проверка ввода

Всегда проверяйте контекст экземпляра перед обработкой:

```typescript
import { validateInstanceContext } from 'n8n-mcp';

const validation = validateInstanceContext(context);
if (!validation.valid) {
  throw new Error(`Invalid context: ${validation.errors?.join(', ')}`);
}
```

### Ограничение скорости

Внедрить ограничение скорости на одного арендатора:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => req.user?.id || req.ip
});

app.post('/api/instances/:instanceId/mcp', authenticate, limiter, async (req, res) => {
  // ...
});
```

## Обработка ошибок

Всегда заключайте запросы MCP в блоки try-catch:

```typescript
app.post('/api/instances/:instanceId/mcp', authenticate, async (req, res) => {
  try {
    const context = await getInstanceConfig(req.params.instanceId, req.user.id);
    await mcpEngine.processRequest(req, res, context);
  } catch (error) {
    console.error('MCP error:', error);

    // Don't leak internal errors to clients
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Мониторинг

### Проверки работоспособности

Настройте периодические проверки работоспособности:

```typescript
setInterval(async () => {
  const health = await mcpEngine.healthCheck();

  if (health.status === 'unhealthy') {
    console.error('MCP engine unhealthy:', health);
    // Alert your monitoring system
  }

  // Log metrics
  console.log('MCP engine metrics:', {
    uptime: health.uptime,
    memory: health.memoryUsage,
    sessionActive: health.sessionActive
  });
}, 60000); // Every minute
```

### Мониторинг сеансов

Отслеживайте активные сеансы:

```typescript
app.get('/admin/sessions', authenticate, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sessionInfo = mcpEngine.getSessionInfo();
  res.json(sessionInfo);
});
```

## Тестирование

### Модульное тестирование

```typescript
import { N8NMCPEngine, InstanceContext } from 'n8n-mcp';

describe('MCP Engine', () => {
  let engine: N8NMCPEngine;

  beforeEach(() => {
    engine = new N8NMCPEngine({ logLevel: 'error' });
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  it('should process request with context', async () => {
    const context: InstanceContext = {
      n8nApiUrl: 'https://test.n8n.io',
      n8nApiKey: 'test-key',
      instanceId: 'test-instance'
    };

    const mockReq = createMockRequest();
    const mockRes = createMockResponse();

    await engine.processRequest(mockReq, mockRes, context);

    expect(mockRes.status).toBe(200);
  });
});
```

### Интеграционное тестирование

```typescript
import request from 'supertest';
import { createApp } from './app';

describe('Multi-tenant MCP API', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await createApp();
    authToken = await getTestAuthToken();
  });

  it('should handle MCP request for instance', async () => {
    const response = await request(app)
      .post('/api/instances/test-instance/mcp')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {}
        },
        id: 1
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toBeDefined();
  });
});
```

## Рекомендации по развертыванию

### Переменные среды

```bash
# Required for multi-tenant mode
ENABLE_MULTI_TENANT=true
MULTI_TENANT_SESSION_STRATEGY=instance

# Optional: Logging
LOG_LEVEL=info
DISABLE_CONSOLE_OUTPUT=false

# Optional: Session configuration
SESSION_TIMEOUT=1800000  # 30 minutes in milliseconds
N8N_MCP_MAX_SESSIONS=100  # Maximum concurrent sessions (default: 100)

# Optional: Performance
NODE_ENV=production
```

### Развертывание Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV ENABLE_MULTI_TENANT=true
ENV LOG_LEVEL=info

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Развертывание Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n-mcp-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: n8n-mcp-backend
  template:
    metadata:
      labels:
        app: n8n-mcp-backend
    spec:
      containers:
      - name: backend
        image: your-registry/n8n-mcp-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: ENABLE_MULTI_TENANT
          value: "true"
        - name: LOG_LEVEL
          value: "info"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

## Примеры

### Полный пример мультитенантного SaaS

Полный пример реализации см. в разделе:
- [n8n-mcp-backend](https://github.com/czlonkowski/n8n-mcp-backend) - Полная реализация размещенного сервиса.

### Миграция из одиночной игры

Если вы переходите с однопользовательской игры (CLI/Docker) на многопользовательскую:

1. **Сохранять обратную совместимость** – использовать резервную версию среды:
```typescript
const context: InstanceContext = {
  n8nApiUrl: instanceUrl || process.env.N8N_API_URL,
  n8nApiKey: instanceKey || process.env.N8N_API_KEY,
  instanceId: instanceId || 'default'
};
```

2. **Постепенное внедрение**. Начните с отметки функции:
```typescript
const isMultiTenant = process.env.ENABLE_MULTI_TENANT === 'true';

if (isMultiTenant) {
  const context = await getInstanceConfig(req.params.instanceId);
  await engine.processRequest(req, res, context);
} else {
  // Legacy single-player mode
  await engine.processRequest(req, res);
}
```

## Поиск неисправностей

### Распространенные проблемы

#### Ошибки разрешения модуля

Если вы видите `Cannot find module 'n8n-mcp'`:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify package has types field
npm info n8n-mcp

# Check TypeScript can resolve it
npx tsc --noEmit
```

#### Ошибки проверки идентификатора сеанса

Если вы видите ошибки `Invalid session ID format`:

- Убедитесь, что вы используете n8n-mcp v2.18.9 или новее.
- Идентификаторы сеансов могут быть любой непустой строкой.
- Нет необходимости генерировать UUID - используйте свой собственный формат

#### Утечки памяти

Если использование памяти со временем увеличивается:

```typescript
// Ensure proper cleanup
process.on('SIGTERM', async () => {
  await engine.shutdown();
  process.exit(0);
});

// Monitor session count
const sessionInfo = engine.getSessionInfo();
console.log('Active sessions:', sessionInfo.sessions?.active);
```

## Дальнейшее чтение

- [Спецификация протокола MCP](https://modelcontextprotocol.io/docs)
- [Документация по API n8n](https://docs.n8n.io/api/)
- [Руководство по Express.js](https://expressjs.com/en/guide/routing.html)
- [Основной README n8n-mcp](../README.md)

## Поддерживать

- **Проблемы**: [Проблемы GitHub](https://github.com/czlonkowski/n8n-mcp/issues)
- **Обсуждения**: [Обсуждения GitHub](https://github.com/czlonkowski/n8n-mcp/discussions)
- **Безопасность**. По вопросам безопасности см. [SECURITY.md](../SECURITY.md)
