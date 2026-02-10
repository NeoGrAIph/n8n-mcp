# Примеры различий рабочего процесса

В этом руководстве показано, как использовать инструмент `n8n_workflow_update_partial` для эффективного редактирования рабочего процесса.

## Обзор

Инструмент `n8n_workflow_update_partial` позволяет вносить целевые изменения в рабочие процессы без отправки всего JSON рабочего процесса. Это приводит к:
- Сокращение использования токенов на 80-90%.
- Более точные правки
- Более четкое намерение
- Снижен риск случайной модификации несвязанных деталей.

## Базовое использование

```json
{
  "id": "workflow-id-here",
  "operations": [
    {
      "type": "operation-type",
      "...operation-specific-fields..."
    }
  ]
}
```

## Типы операций

### 1. Операции с узлами

#### Добавить узел
```json
{
  "type": "addNode",
  "description": "Add HTTP Request node to fetch data",
  "node": {
    "name": "Fetch User Data",
    "type": "n8n-nodes-base.httpRequest",
    "position": [600, 300],
    "parameters": {
      "url": "https://api.example.com/users",
      "method": "GET",
      "authentication": "none"
    }
  }
}
```

#### Удалить узел
```json
{
  "type": "removeNode",
  "nodeName": "Old Node Name",
  "description": "Remove deprecated node"
}
```

#### Обновление узла
```json
{
  "type": "updateNode",
  "nodeName": "HTTP Request",
  "changes": {
    "parameters.url": "https://new-api.example.com/v2/users",
    "parameters.headers.parameters": [
      {
        "name": "Authorization",
        "value": "Bearer {{$credentials.apiKey}}"
      }
    ]
  },
  "description": "Update API endpoint to v2"
}
```

#### Переместить узел
```json
{
  "type": "moveNode",
  "nodeName": "Set Variable",
  "position": [800, 400],
  "description": "Reposition for better layout"
}
```

#### Включить/отключить узел
```json
{
  "type": "disableNode",
  "nodeName": "Debug Node",
  "description": "Disable debug output for production"
}
```

### 2. Операции подключения

#### Добавить соединение
```json
{
  "type": "addConnection",
  "source": "Webhook",
  "target": "Process Data",
  "sourceOutput": "main",
  "targetInput": "main",
  "description": "Connect webhook to processor"
}
```

#### Удалить соединение
```json
{
  "type": "removeConnection",
  "source": "Old Source",
  "target": "Old Target",
  "description": "Remove unused connection"
}
```

#### Переподключение соединения
```json
{
  "type": "rewireConnection",
  "source": "Webhook",
  "from": "Old Handler",
  "to": "New Handler",
  "description": "Rewire connection to new handler"
}
```

#### Интеллектуальные параметры для узлов IF
```json
{
  "type": "addConnection",
  "source": "IF",
  "target": "Success Handler",
  "branch": "true",  // Semantic parameter instead of sourceIndex
  "description": "Route true branch to success handler"
}
```

```json
{
  "type": "addConnection",
  "source": "IF",
  "target": "Error Handler",
  "branch": "false",  // Routes to false branch (sourceIndex=1)
  "description": "Route false branch to error handler"
}
```

#### Интеллектуальные параметры для узлов коммутатора
```json
{
  "type": "addConnection",
  "source": "Switch",
  "target": "Handler A",
  "case": 0,  // First output
  "description": "Route case 0 to Handler A"
}
```

### 3. Операции с метаданными рабочего процесса

#### Обновление имени рабочего процесса
```json
{
  "type": "updateName",
  "name": "Production User Sync v2",
  "description": "Update workflow name for versioning"
}
```

#### Обновить настройки
```json
{
  "type": "updateSettings",
  "settings": {
    "executionTimeout": 300,
    "saveDataErrorExecution": "all",
    "timezone": "America/New_York"
  },
  "description": "Configure production settings"
}
```

#### Управление тегами
```json
{
  "type": "addTag",
  "tag": "production",
  "description": "Mark as production workflow"
}
```

## Полные примеры

### Пример 1. Добавление уведомлений Slack в рабочий процесс
```json
{
  "id": "workflow-123",
  "operations": [
    {
      "type": "addNode",
      "node": {
        "name": "Send Slack Alert",
        "type": "n8n-nodes-base.slack",
        "position": [1000, 300],
        "parameters": {
          "resource": "message",
          "operation": "post",
          "channel": "#alerts",
          "text": "Workflow completed successfully!"
        }
      }
    },
    {
      "type": "addConnection",
      "source": "Process Data",
      "target": "Send Slack Alert"
    }
  ]
}
```

### Пример 2. Обновление нескольких путей веб-перехватчиков
```json
{
  "id": "workflow-456",
  "operations": [
    {
      "type": "updateNode",
      "nodeName": "Webhook 1",
      "changes": {
        "parameters.path": "v2/webhook1"
      }
    },
    {
      "type": "updateNode",
      "nodeName": "Webhook 2",
      "changes": {
        "parameters.path": "v2/webhook2"
      }
    },
    {
      "type": "updateName",
      "name": "API v2 Webhooks"
    }
  ]
}
```

### Пример 3: Структура рабочего процесса рефакторинга
```json
{
  "id": "workflow-789",
  "operations": [
    {
      "type": "removeNode",
      "nodeName": "Legacy Processor"
    },
    {
      "type": "addNode",
      "node": {
        "name": "Modern Processor",
        "type": "n8n-nodes-base.code",
        "position": [600, 300],
        "parameters": {
          "mode": "runOnceForEachItem",
          "jsCode": "// Process items\nreturn item;"
        }
      }
    },
    {
      "type": "addConnection",
      "source": "HTTP Request",
      "target": "Modern Processor"
    },
    {
      "type": "addConnection",
      "source": "Modern Processor",
      "target": "Save to Database"
    }
  ]
}
```

### Пример 4. Добавление обработки ошибок
```json
{
  "id": "workflow-999",
  "operations": [
    {
      "type": "addNode",
      "node": {
        "name": "Error Handler",
        "type": "n8n-nodes-base.errorTrigger",
        "position": [200, 500]
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Send Error Email",
        "type": "n8n-nodes-base.emailSend",
        "position": [400, 500],
        "parameters": {
          "toEmail": "admin@example.com",
          "subject": "Workflow Error: {{$node['Error Handler'].json.error.message}}",
          "text": "Error details: {{$json}}"
        }
      }
    },
    {
      "type": "addConnection",
      "source": "Error Handler",
      "target": "Send Error Email"
    },
    {
      "type": "updateSettings",
      "settings": {
        "errorWorkflow": "workflow-999"
      }
    }
  ]
}
```

### Пример 5: Рефакторинг крупнопакетного рабочего процесса
Демонстрирует обработку множества операций в одном запросе — больше не ограничивается 5 операциями!

```json
{
  "id": "workflow-batch",
  "operations": [
    // Add 10 processing nodes
    {
      "type": "addNode",
      "node": {
        "name": "Filter Active Users",
        "type": "n8n-nodes-base.filter",
        "position": [400, 200],
        "parameters": { "conditions": { "boolean": [{ "value1": "={{$json.active}}", "value2": true }] } }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Transform User Data",
        "type": "n8n-nodes-base.set",
        "position": [600, 200],
        "parameters": { "values": { "string": [{ "name": "formatted_name", "value": "={{$json.firstName}} {{$json.lastName}}" }] } }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Validate Email",
        "type": "n8n-nodes-base.if",
        "position": [800, 200],
        "parameters": { "conditions": { "string": [{ "value1": "={{$json.email}}", "operation": "contains", "value2": "@" }] } }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Enrich with API",
        "type": "n8n-nodes-base.httpRequest",
        "position": [1000, 150],
        "parameters": { "url": "https://api.example.com/enrich", "method": "POST" }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Log Invalid Emails",
        "type": "n8n-nodes-base.code",
        "position": [1000, 350],
        "parameters": { "jsCode": "console.log('Invalid email:', $json.email);\nreturn $json;" }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Merge Results",
        "type": "n8n-nodes-base.merge",
        "position": [1200, 250]
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Deduplicate",
        "type": "n8n-nodes-base.removeDuplicates",
        "position": [1400, 250],
        "parameters": { "propertyName": "id" }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Sort by Date",
        "type": "n8n-nodes-base.sort",
        "position": [1600, 250],
        "parameters": { "sortFieldsUi": { "sortField": [{ "fieldName": "created_at", "order": "descending" }] } }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Batch for DB",
        "type": "n8n-nodes-base.splitInBatches",
        "position": [1800, 250],
        "parameters": { "batchSize": 100 }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Save to Database",
        "type": "n8n-nodes-base.postgres",
        "position": [2000, 250],
        "parameters": { "operation": "insert", "table": "processed_users" }
      }
    },
    // Connect all the nodes
    {
      "type": "addConnection",
      "source": "Get Users",
      "target": "Filter Active Users"
    },
    {
      "type": "addConnection",
      "source": "Filter Active Users",
      "target": "Transform User Data"
    },
    {
      "type": "addConnection",
      "source": "Transform User Data",
      "target": "Validate Email"
    },
    {
      "type": "addConnection",
      "source": "Validate Email",
      "sourceOutput": "true",
      "target": "Enrich with API"
    },
    {
      "type": "addConnection",
      "source": "Validate Email",
      "sourceOutput": "false",
      "target": "Log Invalid Emails"
    },
    {
      "type": "addConnection",
      "source": "Enrich with API",
      "target": "Merge Results"
    },
    {
      "type": "addConnection",
      "source": "Log Invalid Emails",
      "target": "Merge Results",
      "targetInput": "input2"
    },
    {
      "type": "addConnection",
      "source": "Merge Results",
      "target": "Deduplicate"
    },
    {
      "type": "addConnection",
      "source": "Deduplicate",
      "target": "Sort by Date"
    },
    {
      "type": "addConnection",
      "source": "Sort by Date",
      "target": "Batch for DB"
    },
    {
      "type": "addConnection",
      "source": "Batch for DB",
      "target": "Save to Database"
    },
    // Update workflow metadata
    {
      "type": "updateName",
      "name": "User Processing Pipeline v2"
    },
    {
      "type": "updateSettings",
      "settings": {
        "executionOrder": "v1",
        "timezone": "UTC",
        "saveDataSuccessExecution": "all"
      }
    },
    {
      "type": "addTag",
      "tag": "production"
    },
    {
      "type": "addTag",
      "tag": "user-processing"
    },
    {
      "type": "addTag",
      "tag": "v2"
    }
  ]
}
```

В этом примере показано 26 операций в одном запросе, создающих полный конвейер обработки данных с правильной обработкой ошибок, проверкой и пакетной обработкой.

## Лучшие практики

1. **Используйте описательные имена**: всегда предоставляйте понятные имена узлов и описания операций.
2. **Пакетные изменения**: Группируйте связанные операции в одном запросе.
3. **Сначала проверьте**: используйте `validateOnly: true`, чтобы проверить свои операции перед применением.
4. **Ссылка по имени**: для лучшей читаемости отдавайте предпочтение именам узлов вместо идентификаторов.
5. **Небольшие целенаправленные изменения**: вносите целенаправленные изменения, а не крупные структурные изменения.

## Общие шаблоны

### Добавить этап обработки
```json
{
  "operations": [
    {
      "type": "removeConnection",
      "source": "Source Node",
      "target": "Target Node"
    },
    {
      "type": "addNode",
      "node": {
        "name": "Process Step",
        "type": "n8n-nodes-base.set",
        "position": [600, 300],
        "parameters": { /* ... */ }
      }
    },
    {
      "type": "addConnection",
      "source": "Source Node",
      "target": "Process Step"
    },
    {
      "type": "addConnection",
      "source": "Process Step",
      "target": "Target Node"
    }
  ]
}
```

### Заменить узел
```json
{
  "operations": [
    {
      "type": "addNode",
      "node": {
        "name": "New Implementation",
        "type": "n8n-nodes-base.httpRequest",
        "position": [600, 300],
        "parameters": { /* ... */ }
      }
    },
    {
      "type": "removeConnection",
      "source": "Previous Node",
      "target": "Old Implementation"
    },
    {
      "type": "removeConnection",
      "source": "Old Implementation",
      "target": "Next Node"
    },
    {
      "type": "addConnection",
      "source": "Previous Node",
      "target": "New Implementation"
    },
    {
      "type": "addConnection",
      "source": "New Implementation",
      "target": "Next Node"
    },
    {
      "type": "removeNode",
      "nodeName": "Old Implementation"
    }
  ]
}
```

## Обработка ошибок

Инструмент проверяет все операции перед применением каких-либо изменений. К частым ошибкам относятся:

- **Повторяющиеся имена узлов**: каждый узел должен иметь уникальное имя.
- **Недопустимые типы узлов**: используйте полные префиксы пакета (например, `n8n-nodes-base.webhook`).
- **Отсутствуют соединения**: указанные узлы должны существовать.
- **Циркулярные зависимости**: соединения не могут создавать циклы.

Всегда проверяйте ответ на наличие ошибок проверки и соответствующим образом корректируйте свои операции.

## Обновления транзакций

Механизм сравнения теперь поддерживает транзакционные обновления, используя подход **двухпроходной обработки**:

### Как это работает

1. **Без ограничений по операциям**: обработка неограниченного количества операций в одном запросе.
2. **Двухпроходная обработка**:
- **Шаг 1**: все операции с узлами (добавление, удаление, обновление, перемещение, включение, отключение).
- **Шаг 2**: все остальные операции (подключения, настройки, метаданные).

Это позволяет добавлять узлы и соединять их в одном запросе:

```json
{
  "id": "workflow-id",
  "operations": [
    // These will be processed in Pass 2 (but work because nodes are added first)
    {
      "type": "addConnection",
      "source": "Webhook",
      "target": "Process Data"
    },
    {
      "type": "addConnection", 
      "source": "Process Data",
      "target": "Send Email"
    },
    // These will be processed in Pass 1
    {
      "type": "addNode",
      "node": {
        "name": "Process Data",
        "type": "n8n-nodes-base.set",
        "position": [400, 300],
        "parameters": {}
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Send Email",
        "type": "n8n-nodes-base.emailSend",
        "position": [600, 300],
        "parameters": {
          "to": "user@example.com"
        }
      }
    }
  ]
}
```

### Преимущества

- **Независимость порядка**: вам не нужно беспокоиться о порядке операций.
- **Атомарные обновления**: все операции выполняются успешно или все завершаются неудачей (если не включен параметр continueOnError).
- **Интуитивное использование**: добавляйте сложные структуры рабочих процессов за один вызов.
- **Нет жестких ограничений**: эффективно обрабатывайте неограниченное количество операций.

### Пример: полное добавление рабочего процесса

```json
{
  "id": "workflow-id",
  "operations": [
    // Add three nodes
    {
      "type": "addNode",
      "node": {
        "name": "Schedule",
        "type": "n8n-nodes-base.schedule",
        "position": [200, 300],
        "parameters": {
          "rule": {
            "interval": [{ "field": "hours", "intervalValue": 1 }]
          }
        }
      }
    },
    {
      "type": "addNode", 
      "node": {
        "name": "Get Data",
        "type": "n8n-nodes-base.httpRequest",
        "position": [400, 300],
        "parameters": {
          "url": "https://api.example.com/data"
        }
      }
    },
    {
      "type": "addNode",
      "node": {
        "name": "Save to Database",
        "type": "n8n-nodes-base.postgres",
        "position": [600, 300],
        "parameters": {
          "operation": "insert"
        }
      }
    },
    // Connect them all
    {
      "type": "addConnection",
      "source": "Schedule",
      "target": "Get Data"
    },
    {
      "type": "addConnection",
      "source": "Get Data", 
      "target": "Save to Database"
    }
  ]
}
```

Все операции будут обработаны корректно вне зависимости от заказа!
