# n8n MCP Essentials Tools — Руководство пользователя

## Обзор

n8n MCP теперь предоставляет единственный инструмент `n8n_node_get` для информации об узлах. Используйте **уровни детализации**, чтобы получить только то, что вам нужно:
- `detail: "standard"` для основных свойств + примеры (рекомендуется по умолчанию)
- `detail: "minimal"` для минимально возможного ответа
- `detail: "full"` только тогда, когда вам действительно нужны исчерпывающие данные.

В этом руководстве основное внимание уделяется **основной настройке** с использованием `n8n_node_get` и `detail: "standard"`.

## Основной инструмент: `n8n_node_get` (детализация: стандартная/минимальная)

**Цель**: получить только 10–20 наиболее важных свойств узла вместо 200+.

**Когда использовать**:
- Начинаем настраивать новую ноду
- Нужен быстрый доступ к общим свойствам
- Хотите рабочие примеры
- Построение базовых рабочих процессов.

**Пример использования**:
```json
{
  "name": "n8n_node_get",
  "arguments": {
    "nodeType": "nodes-base.httpRequest",
    "detail": "standard",
    "includeExamples": true
  }
}
```

**Структура ответа (стандартная)**:
```json
{
  "nodeType": "nodes-base.httpRequest",
  "displayName": "HTTP Request",
  "description": "Makes HTTP requests and returns the response data",
  "requiredProperties": [
    {
      "name": "url",
      "displayName": "URL",
      "type": "string",
      "description": "The URL to make the request to",
      "placeholder": "https://api.example.com/endpoint"
    }
  ],
  "commonProperties": [
    {
      "name": "method",
      "type": "options",
      "options": [
        { "value": "GET", "label": "GET" },
        { "value": "POST", "label": "POST" }
      ],
      "default": "GET"
    }
  ],
  "examples": {
    "minimal": {
      "url": "https://api.example.com/data"
    },
    "common": {
      "method": "POST",
      "url": "https://api.example.com/users",
      "sendBody": true,
      "contentType": "json",
      "jsonBody": "{ \"name\": \"John\" }"
    }
  },
  "metadata": {
    "totalProperties": 245,
    "isAITool": false,
    "isTrigger": false
  }
}
```

**Преимущества**:
- На 95% меньше ответа (5 КБ против 100 КБ+)
- Показывает только те свойства, которые вам действительно нужны
- Включает рабочие примеры.
- Никаких дублирующих или запутанных свойств.
- Четкое указание того, что необходимо.

## Поиск свойств с помощью `n8n_node_get` (режим: search_properties)

**Цель**: найти определенные свойства внутри узла, не загружая все.

**Когда использовать**:
- Ищем варианты аутентификации
- Поиск конкретной конфигурации, такой как заголовки или тело
- Изучение возможных вариантов.
- Необходимо настроить расширенные функции

**Пример использования**:
```json
{
  "name": "n8n_node_get",
  "arguments": {
    "nodeType": "nodes-base.httpRequest",
    "mode": "search_properties",
    "propertyQuery": "auth"
  }
}
```

**Структура ответа**:
```json
{
  "nodeType": "nodes-base.httpRequest",
  "query": "auth",
  "matches": [
    {
      "name": "authentication",
      "displayName": "Authentication",
      "type": "options",
      "description": "Method of authentication to use",
      "path": "authentication",
      "options": [
        { "value": "none", "label": "None" },
        { "value": "basicAuth", "label": "Basic Auth" }
      ]
    }
  ],
  "totalMatches": 5,
  "searchedIn": "245 properties"
}
```

## Рекомендуемый рабочий процесс

### Для базовой конфигурации

1. **Начните с самого необходимого**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", detail: "standard", includeExamples: true})
   ```

2. **Используйте предоставленные примеры**:
- Начните с примера `minimal`.
- Обновите до `common` для типичных случаев использования.
- Изменить в соответствии с вашими потребностями

3. **Поиск конкретных функций** (при необходимости):
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", mode: "search_properties", propertyQuery: "header"})
   ```

### Для сложной конфигурации

1. **Сначала получите документацию**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", mode: "docs"})
   ```

2. **Получите все самое необходимое**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", detail: "standard", includeExamples: true})
   ```

3. **Поиск дополнительных свойств**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", mode: "search_properties", propertyQuery: "proxy"})
   ```

4. **Используйте полную информацию только в случае крайней необходимости**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", detail: "full"})
   ```

## Общие шаблоны

### Выполнение вызовов API
```javascript
// Start with essentials
const essentials = n8n_node_get({ nodeType: "nodes-base.httpRequest", detail: "standard", includeExamples: true });

// Use the POST example
const config = essentials.examples.common;

// Modify for your needs
config.url = "https://api.myservice.com/endpoint";
config.jsonBody = JSON.stringify({ my: "data" });
```

### Настройка вебхуков
```javascript
// Get webhook essentials
const essentials = n8n_node_get({ nodeType: "nodes-base.webhook", detail: "standard", includeExamples: true });

// Start with minimal
const config = essentials.examples.minimal;
config.path = "my-webhook-endpoint";
```

### Операции с базой данных
```javascript
// Get database essentials
const essentials = n8n_node_get({ nodeType: "nodes-base.postgres", detail: "standard", includeExamples: true });

// Check available operations
const operations = essentials.operations;

// Use appropriate example
const config = essentials.examples.common;
```

## Советы для ИИ-агентов

1. **Всегда начинайте с n8n_node_get (детализация: стандартная)** — в нем есть все необходимое для 90 % случаев использования.
2. **Используйте примеры в качестве шаблонов**. Это проверенные рабочие конфигурации.
3. **Искать, прежде чем углубляться**. Используйте search_properties, чтобы найти конкретные параметры.
4. **Проверьте метаданные**. Узнайте, нужны ли вам учетные данные, является ли это триггером и т. д.
5. **Постепенное раскрытие информации**. Начните с простого, усложняйте только при необходимости.

## Поддерживаемые узлы

В потоке Essentials оптимизированы конфигурации для более чем 20 часто используемых узлов:

- **Ядро**: httpRequest, вебхук, код, набор, if, слияние, SplitInBatches.
- **Базы данных**: postgres, mysql, mongodb, redis.
- **Общение**: слабина, электронная почта, разногласия.
- **Файлы**: ftp, ssh, googleSheets.
- **AI**: openAi, агент
- **Утилиты**: ExecuteCommand, функция.
