# API сохранения сеансов — Руководство по производству

## Обзор

API сохранения сеансов обеспечивает развертывание контейнеров без простоев в мультитенантных средах n8n-mcp. Он позволяет экспортировать активное состояние сеанса MCP перед выключением и восстанавливать его после перезапуска, поддерживая непрерывность сеанса на протяжении всего жизненного цикла контейнера.

**Версия:** 2.24.1+
**Статус:** Готово к производству
**Примеры использования**: мультитенантное SaaS, развертывание Kubernetes, оркестровка контейнеров, непрерывные обновления.

## Архитектура

### Компоненты состояния сеанса

Каждый сохраняемый сеанс содержит:

1. **Метаданные сеанса**
- `sessionId`: уникальный идентификатор сеанса (UUID v4).
- `createdAt`: временная метка создания сеанса в формате ISO 8601.
- `lastAccess`: временная метка последнего действия в формате ISO 8601.

2. **Контекст экземпляра**
- `n8nApiUrl`: конечная точка API экземпляра n8n.
- `n8nApiKey`: ключ аутентификации API n8n (открытый текст)
- `instanceId`: дополнительный идентификатор клиента/экземпляра.
- `sessionId`: необязательный идентификатор сеанса.
- `metadata`: дополнительные данные пользовательского приложения.

3. **Шаблон бездействующего сеанса**
- Объекты транспортного сервера и сервера MCP НЕ сохраняются.
- Воссоздается автоматически по первому запросу после восстановления.
- Уменьшает объем памяти во время восстановления.

## Справочник по API

### N8NMCPEngine.exportSessionState()

Экспортирует все активное состояние сеанса для сохранения перед выключением.

```typescript
exportSessionState(): SessionState[]
```

**Возвраты:** Массив объектов состояния сеанса, содержащий метаданные и учетные данные.

**Пример:**
```typescript
const sessions = engine.exportSessionState();
// sessions = [
//   {
//     sessionId: '550e8400-e29b-41d4-a716-446655440000',
//     metadata: {
//       createdAt: '2025-11-24T10:30:00.000Z',
//       lastAccess: '2025-11-24T17:15:32.000Z'
//     },
//     context: {
//       n8nApiUrl: 'https://tenant1.n8n.cloud',
//       n8nApiKey: 'n8n_api_...',
//       instanceId: 'tenant-123',
//       metadata: { userId: 'user-456' }
//     }
//   }
// ]
```

**Основные правила поведения:**
- Экспортирует только сеансы с неистёкшим сроком действия (в пределах sessionTimeout)
- Обнаруживает и предупреждает о повторяющихся идентификаторах сеансов.
- Регистрирует события безопасности с количеством сеансов.
- Возвращает пустой массив, если нет активных сессий

### N8NMCPEngine.restoreSessionState()

Восстанавливает сеансы из ранее экспортированного состояния после перезапуска контейнера.

```typescript
restoreSessionState(sessions: SessionState[]): number
```

**Параметры:**
- `sessions`: Массив объектов состояния сеанса из `exportSessionState()`.

**Возвраты:** Количество успешно восстановленных сеансов.

**Пример:**
```typescript
const sessions = await loadFromEncryptedStorage();
const count = engine.restoreSessionState(sessions);
console.log(`Restored ${count} sessions`);
```

**Основные правила поведения:**
- Проверяет метаданные сеанса (метки времени, обязательные поля)
- Пропускает просроченные сеансы (возраст > sessionTimeout)
- Пропускает дублирующиеся сеансы (идемпотент)
- Соблюдает ограничение MAX_SESSIONS (по умолчанию 100, настраивается через N8N_MCP_MAX_SESSIONS env var)
- Лениво воссоздает транспорты/серверы по первому запросу.
- Регистрирует события безопасности для успешного/неудачного восстановления.

## Вопросы безопасности

### Критично: шифрование перед сохранением

**Экспортированное состояние сеанса содержит ключи API n8n в виде открытого текста.** Вы ДОЛЖНЫ зашифровать эти данные перед их сохранением на диске.

```typescript
// ❌ NEVER DO THIS
await fs.writeFile('sessions.json', JSON.stringify(sessions));

// ✅ ALWAYS ENCRYPT
const encrypted = await encryptSessionData(sessions, encryptionKey);
await saveToSecureStorage(encrypted);
```

### Рекомендуемый подход к шифрованию

```typescript
import crypto from 'crypto';

/**
 * Encrypt session data using AES-256-GCM
 */
async function encryptSessionData(
  sessions: SessionState[],
  encryptionKey: Buffer
): Promise<string> {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);

  const json = JSON.stringify(sessions);
  const encrypted = Buffer.concat([
    cipher.update(json, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // Return base64: iv:authTag:encrypted
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join(':');
}

/**
 * Decrypt session data
 */
async function decryptSessionData(
  encryptedData: string,
  encryptionKey: Buffer
): Promise<SessionState[]> {
  const [ivB64, authTagB64, encryptedB64] = encryptedData.split(':');

  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}
```

### Управление ключами

Надежно храните ключи шифрования:
- **Kubernetes:** используйте секреты Kubernetes с неактивным шифрованием.
- **AWS:** Используйте AWS Secrets Manager или хранилище параметров с KMS.
- **Azure:** используйте Azure Key Vault.
- **GCP:** использовать диспетчер секретов.
- **Локальная разработка:** Используйте переменные среды (НИКОГДА не используйте git).

### Ведение журнала безопасности

Все операции сохранения сеанса протоколируются с префиксом `[SECURITY]`:

```
[SECURITY] session_export { timestamp, count }
[SECURITY] session_restore { timestamp, sessionId, instanceId }
[SECURITY] session_restore_failed { timestamp, sessionId, reason }
[SECURITY] max_sessions_reached { timestamp, count }
```

Отслеживайте эти журналы в рабочей среде для отслеживания журналов аудита и анализа безопасности.

## Примеры реализации

### 1. Мультитенантный бэкэнд Express.js

```typescript
import express from 'express';
import { N8NMCPEngine } from 'n8n-mcp';

const app = express();
const engine = new N8NMCPEngine({
  sessionTimeout: 1800000, // 30 minutes
  logLevel: 'info'
});

// Startup: Restore sessions from encrypted storage
async function startup() {
  try {
    const encrypted = await redis.get('mcp:sessions');
    if (encrypted) {
      const sessions = await decryptSessionData(
        encrypted,
        process.env.ENCRYPTION_KEY
      );
      const count = engine.restoreSessionState(sessions);
      console.log(`Restored ${count} sessions`);
    }
  } catch (error) {
    console.error('Failed to restore sessions:', error);
  }
}

// Shutdown: Export sessions to encrypted storage
async function shutdown() {
  try {
    const sessions = engine.exportSessionState();
    const encrypted = await encryptSessionData(
      sessions,
      process.env.ENCRYPTION_KEY
    );
    await redis.set('mcp:sessions', encrypted, 'EX', 3600); // 1 hour TTL
    console.log(`Exported ${sessions.length} sessions`);
  } catch (error) {
    console.error('Failed to export sessions:', error);
  }

  await engine.shutdown();
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
await startup();
app.listen(3000);
```

### 2. Развертывание Kubernetes с помощью Init-контейнера

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n-mcp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      initContainers:
      - name: restore-sessions
        image: your-app:latest
        command: ['/app/restore-sessions.sh']
        env:
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: encryption-key
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: redis-url
        volumeMounts:
        - name: sessions
          mountPath: /sessions

      containers:
      - name: mcp-server
        image: your-app:latest
        lifecycle:
          preStop:
            exec:
              command: ['/app/export-sessions.sh']
        env:
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: encryption-key
        - name: SESSION_TIMEOUT
          value: "1800000"
        volumeMounts:
        - name: sessions
          mountPath: /sessions

        # Graceful shutdown configuration
        terminationGracePeriodSeconds: 30

      volumes:
      - name: sessions
        emptyDir: {}
```

**restore-sessions.sh:**
```bash
#!/bin/bash
set -e

echo "Restoring sessions from Redis..."

# Fetch encrypted sessions from Redis
ENCRYPTED=$(redis-cli -u "$REDIS_URL" GET "mcp:sessions:${HOSTNAME}")

if [ -n "$ENCRYPTED" ]; then
  echo "$ENCRYPTED" > /sessions/encrypted.txt
  echo "Sessions fetched, will be restored on startup"
else
  echo "No sessions to restore"
fi
```

**export-sessions.sh:**
```bash
#!/bin/bash
set -e

echo "Exporting sessions to Redis..."

# Trigger session export via HTTP endpoint
curl -X POST http://localhost:3000/internal/export-sessions

echo "Sessions exported successfully"
```

### 3. Docker Compose с Redis

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  n8n-mcp:
    build: .
    environment:
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - REDIS_URL=redis://redis:6379
      - SESSION_TIMEOUT=1800000
    depends_on:
      - redis
    volumes:
      - ./data:/data
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
    stop_grace_period: 30s

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

**Код приложения:**
```typescript
import { N8NMCPEngine } from 'n8n-mcp';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const engine = new N8NMCPEngine();

// Export endpoint (called by preStop hook)
app.post('/internal/export-sessions', async (req, res) => {
  try {
    const sessions = engine.exportSessionState();
    const encrypted = await encryptSessionData(
      sessions,
      Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    );

    // Store with hostname as key for per-container tracking
    await redis.set(
      `mcp:sessions:${os.hostname()}`,
      encrypted,
      'EX',
      3600
    );

    res.json({ exported: sessions.length });
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Restore on startup
async function startup() {
  const encrypted = await redis.get(`mcp:sessions:${os.hostname()}`);
  if (encrypted) {
    const sessions = await decryptSessionData(
      encrypted,
      Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    );
    const count = engine.restoreSessionState(sessions);
    console.log(`Restored ${count} sessions`);
  }
}
```

## Лучшие практики

### 1. Настройка таймаута сеанса

Выберите подходящий тайм-аут в зависимости от варианта использования:

```typescript
const engine = new N8NMCPEngine({
  sessionTimeout: 1800000  // 30 minutes (recommended default)
});

// Development: 5 minutes
sessionTimeout: 300000

// Production SaaS: 30-60 minutes
sessionTimeout: 1800000 - 3600000

// Long-running workflows: 2-4 hours
sessionTimeout: 7200000 - 14400000
```

### 2. Выбор серверной части хранилища

**Redis (рекомендуется для производства)**
- Быстрое чтение/запись данных сеанса
- Поддержка TTL для автоматической очистки
- Pub/sub для распределенной координации
- Атомарные операции для обеспечения согласованности

**База данных (PostgreSQL/MySQL)**
- Столбец JSONB для состояния сеанса.
- Хорошо подходит для требований аудита
- Медленнее, чем Redis
- Требует периодической очистки.

**S3/Облачное хранилище**
- Хорошо подходит для резервного копирования после аварийного восстановления.
- Не подходит для горячего восстановления сеанса.
- Высокая задержка
- Подходит для долгосрочного архивирования сеансов.

### 3. Мониторинг и оповещение

Следите за этими показателями:

```typescript
// Session export metrics
const sessions = engine.exportSessionState();
metrics.gauge('mcp.sessions.exported', sessions.length);
metrics.gauge('mcp.sessions.export_size_kb',
  JSON.stringify(sessions).length / 1024
);

// Session restore metrics
const restored = engine.restoreSessionState(sessions);
metrics.gauge('mcp.sessions.restored', restored);
metrics.gauge('mcp.sessions.restore_success_rate',
  restored / sessions.length
);

// Runtime metrics
const info = engine.getSessionInfo();
metrics.gauge('mcp.sessions.active', info.active ? 1 : 0);
metrics.gauge('mcp.sessions.age_seconds', info.age || 0);
```

Оповещение:
- Сбои при экспорте (должны быть редки)
- Низкая вероятность успешного восстановления (<95%)
- Достигнут предел: MAX_SESSIONS
- Высокий возраст сеанса (потенциальные утечки)

### 4. Грамотное завершение работы

Обеспечьте достаточно времени для экспорта сеанса:

```typescript
// Kubernetes terminationGracePeriodSeconds
terminationGracePeriodSeconds: 30  // 30 seconds minimum

// Docker stop timeout
docker run --stop-timeout 30 your-image

// Process signal handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown...');

  // 1. Stop accepting new requests (5s)
  await server.close();

  // 2. Wait for in-flight requests (10s)
  await waitForInFlightRequests(10000);

  // 3. Export sessions (5s)
  const sessions = engine.exportSessionState();
  await saveEncryptedSessions(sessions);

  // 4. Cleanup (5s)
  await engine.shutdown();

  // 5. Exit (5s buffer)
  process.exit(0);
});
```

### 5. Обработка идемпотентности

Сеансы можно безопасно восстанавливать несколько раз:

```typescript
// First restore
const count1 = engine.restoreSessionState(sessions);
// count1 = 5

// Second restore (same sessions)
const count2 = engine.restoreSessionState(sessions);
// count2 = 0 (all already exist)
```

Это безопасно для:
- Повторные попытки инициализации контейнера
- Ручные операции восстановления
- Сценарии аварийного восстановления.

### 6. Координация нескольких экземпляров

Для нескольких экземпляров контейнера:

```typescript
// Option 1: Per-instance storage (simple)
const key = `mcp:sessions:${instance.hostname}`;

// Option 2: Centralized with distributed lock (advanced)
const lock = await acquireLock('mcp:session-export');
try {
  const allSessions = await getAllInstanceSessions();
  await saveToBackup(allSessions);
} finally {
  await lock.release();
}
```

## Вопросы производительности

### Использование памяти

```typescript
// Each session: ~1-2 KB in memory
// 100 sessions: ~100-200 KB
// 1000 sessions: ~1-2 MB

// Export serialized size
const sessions = engine.exportSessionState();
const sizeKB = JSON.stringify(sessions).length / 1024;
console.log(`Export size: ${sizeKB.toFixed(2)} KB`);
```

### Скорость экспорта/восстановления

```typescript
// Export: O(n) where n = active sessions
// Typical: 50-100 sessions in <10ms

// Restore: O(n) with validation
// Typical: 50-100 sessions in 20-50ms

// Factor in encryption:
// AES-256-GCM: ~1ms per 100 sessions
```

### Ограничение: MAX_SESSIONS

Ограничение по умолчанию: 100 сеансов на контейнер (настраивается через `N8N_MCP_MAX_SESSIONS` env var)

```typescript
// Restore respects limit
const sessions = createSessions(150); // 150 sessions
const restored = engine.restoreSessionState(sessions);
// restored = 100 (only first 100 restored, or N8N_MCP_MAX_SESSIONS value)
```

Для более высоких лимитов сеансов:
- Установите `N8N_MCP_MAX_SESSIONS=1000` (или желаемый лимит)
- Мониторинг использования памяти, поскольку сеансы потребляют ресурсы.
- В качестве альтернативы можно развернуть несколько контейнеров с маршрутизацией/шардингом сеанса.

## Поиск неисправностей

### Проблема: ни один сеанс не восстановлен.

**Симптомы:**
```
Restored 0 sessions
```

**Причины:**
1. Срок действия всех сессий истек (возраст > sessionTimeout)
2. Неверный формат даты в метаданных.
3. Отсутствуют обязательные поля контекста.

**Отлаживать:**
```typescript
const sessions = await loadFromEncryptedStorage();
console.log('Loaded sessions:', sessions.length);

// Check individual sessions
sessions.forEach((s, i) => {
  const age = Date.now() - new Date(s.metadata.lastAccess).getTime();
  console.log(`Session ${i}: age=${age}ms, expired=${age > sessionTimeout}`);
});
```

### Проблема: восстановление завершается сбоем из-за «недопустимого контекста».

**Симптомы:**
```
[SECURITY] session_restore_failed { sessionId: '...', reason: 'invalid context: ...' }
```

**Причины:**
1. Отсутствует n8nApiUrl или n8nApiKey.
2. Неверный формат URL.
3. Поврежденные данные сеанса.

**Исправить:**
```typescript
// Validate before restore
const valid = sessions.filter(s => {
  if (!s.context?.n8nApiUrl || !s.context?.n8nApiKey) {
    console.warn(`Invalid session ${s.sessionId}: missing credentials`);
    return false;
  }
  try {
    new URL(s.context.n8nApiUrl); // Validate URL
    return true;
  } catch {
    console.warn(`Invalid session ${s.sessionId}: malformed URL`);
    return false;
  }
});

const count = engine.restoreSessionState(valid);
```

### Проблема: достигнут лимит MAX_SESSIONS

**Симптомы:**
```
Reached MAX_SESSIONS limit (100), skipping remaining sessions
```

**Решения:**

1. Увеличение лимита: установите `N8N_MCP_MAX_SESSIONS=1000` (или желаемое значение).
2. Масштабируйте по горизонтали (больше контейнеров)
3. Реализовать сегментирование сеанса
4. Уменьшите sessionTimeout
5. Очистите неактивные сеансы

```typescript
// Pre-filter by activity
const recentSessions = sessions.filter(s => {
  const age = Date.now() - new Date(s.metadata.lastAccess).getTime();
  return age < 600000; // Only restore sessions active in last 10 min
});

const count = engine.restoreSessionState(recentSessions);
```

### Проблема: повторяющиеся идентификаторы сеансов

**Симптомы:**
```
Duplicate sessionId detected during export: 550e8400-...
```

**Причина:** Ошибка в логике управления сеансом.

**Исправление.** Это предупреждение, а не ошибка. Дубликат автоматически пропускается. Если проблема не исчезнет, ​​изучите логику создания сеанса.

### Проблема: высокое использование памяти после восстановления.

**Симптомы:** Контейнер OOM после восстановления многих сеансов.

**Причина.** Слишком много сеансов для ресурсов контейнера.

**Решение:**
```typescript
// Restore in batches
async function restoreInBatches(sessions: SessionState[], batchSize = 25) {
  let totalRestored = 0;

  for (let i = 0; i < sessions.length; i += batchSize) {
    const batch = sessions.slice(i, i + batchSize);
    const count = engine.restoreSessionState(batch);
    totalRestored += count;

    // Wait for GC between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return totalRestored;
}
```

## Совместимость версий

| Особенность | Версия | Статус |
|---------|---------|--------|
| экспортСессионСтате() | 2.3.0+ | Стабильный |
| восстановитьSessionState() | 2.3.0+ | Стабильный |
| Журналирование безопасности | 2.24.1+ | Стабильный |
| Обнаружение дубликатов | 2.24.1+ | Стабильный |
| Исправление условий гонки | 2.24.1+ | Стабильный |
| Проверка даты | 2.24.1+ | Стабильный |
| Необязательный идентификатор экземпляра | 2.24.1+ | Стабильный |

## Дополнительные ресурсы

- [Руководство по развертыванию HTTP](../how-to/deployment/HTTP_DEPLOYMENT.md) - Настройка мультитенантного HTTP-сервера
- [Руководство по использованию библиотеки](../explanation/LIBRARY_USAGE.md) - Встраивание n8n-mcp в ваше приложение
- [Руководство по Docker](../how-to/deployment/DOCKER_README.md) - Развертывание контейнера
- [Гибкая конфигурация экземпляра](../explanation/FLEXIBLE_INSTANCE_CONFIGURATION.md) - Шаблоны мультитенантности

## Поддерживать

По вопросам или проблемам:
- Проблемы с GitHub: https://github.com/czlonkowski/n8n-mcp/issues.
- Документация: https://github.com/czlonkowski/n8n-mcp#readme.

---

Автор идеи Ромуальд Члонковский - https://www.aiadvisors.pl/en
