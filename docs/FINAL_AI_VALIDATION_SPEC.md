# Окончательная спецификация проверки узла AI

> ✅ В этой спецификации используется текущий набор инструментов (`n8n_node_get`, `n8n_nodes_search`, `n8n_node_validate` и т. д.).

## Глубокий анализ архитектуры AI-агента

### 1. Быстрое создание и поток сообщений

Узел AI Agent обрабатывает запросы пользователя в двух различных режимах, управляемых `promptType`:

#### Режим 1: Авто (триггер подключенного чата)
```typescript
{
  "promptType": "auto",
  "text": "={{ $json.chatInput }}"  // Default value
}
```
- **Поведение**: ожидает ввода от узла Chat Trigger через соединение `main`.
- **Источник сообщений пользователя**: `$json.chatInput` из Chat Trigger.
- **Пример использования**: интерактивные чат-боты с постоянным общением.
- **Проверка**: ОБЯЗАТЕЛЬНО наличие основного соединения Chat Trigger → AI Agent.

#### Режим 2: Определите ниже
```typescript
{
  "promptType": "define",
  "text": "Your custom prompt or ={{ $json.someField }}"
}
```
- **Поведение**: сообщение пользователя, определенное в параметрах узла.
- **Источник сообщения пользователя**: статический текст или выражение из предыдущего узла.
- **Сценарий использования**: автоматическая обработка, преобразование данных, пакетные операции.
- **Проверка**: текстовое поле НЕОБХОДИМО, если PromptType="define"

**Примеры из реальной жизни**:
```typescript
// Example 1: WhatsApp message processing
{
  "promptType": "define",
  "text": "={{ $json.messages[0].text.body }}"
}

// Example 2: Content generation with structured input
{
  "promptType": "define",
  "text": "Generate a creative concept involving:\n\n[[\nA solid, hard material..."
}
```

### 2. Системное сообщение: основные инструкции агента

Системные сообщения определяют **роль, возможности, ограничения и формат вывода** агента. Это наиболее важный параметр поведения AI-агента.

#### Шаблон структуры системного сообщения:
```typescript
{
  "options": {
    "systemMessage": `
**Role:**
[Define agent's persona and primary function]

**Capabilities:**
[List what the agent can do, tools it has access to]

**Rules:**
[Constraints, formatting requirements, behavior guidelines]

**Output Format:**
[Specific structure for responses]

**Process:**
[Step-by-step execution flow]
    `
  }
}
```

#### Примеры реальных системных сообщений:

**Пример 1: Помощник по работе с базами данных** (шаблон 2985)
```typescript
{
  "options": {
    "systemMessage": "You are an assistant working for a company who sells Yamaha Powered Loudspeakers and helping the user navigate the product catalog for the year 2024. Your goal is not to facilitate a sale but if the user enquires, direct them to the appropriate website, url or contact information.\n\nDo your best to answer any questions factually. If you don't know the answer or unable to obtain the information from the datastore, then tell the user so."
  }
}
```
**Шаблон**: четкая роль, конкретная сфера деятельности, ограничения поведения.

**Пример 2. Генератор контента с форматом вывода** (шаблон 214907)
```typescript
{
  "options": {
    "systemMessage": "**Role:**  \nYou are an AI designed to generate **one immersive, realistic idea** based on a user-provided topic. Your output must be formatted as a **single-line JSON array** and follow the rules below exactly.\n\n### RULES\n\n1. **Number of ideas**  \n   - Return **only one idea**.\n\n2. **Topic**  \n   - The user will provide a keyword (e.g., \"glass cutting ASMR\").\n\n3. **Idea**  \n   - Maximum 13 words.  \n   - Describe a viral-worthy, original, or surreal moment.\n\n4. **Caption**  \n   - Short, punchy, viral-friendly.  \n   - Include **one emoji**.  \n   - Exactly **12 hashtags** in this order:  \n     1. 4 topic-relevant hashtags  \n     2. 4 all-time most popular hashtags  \n     3. 4 currently trending hashtags\n\n### OUTPUT FORMAT (single-line JSON array)\n\n```json\n[\n  {\n    \"Caption\": \"...\",\n    \"Idea\": \"...\",\n    \"Environment\": \"...\",\n    \"Sound\": \"...\",\n    \"Status\": \"for production\"\n  }\n]\n```"
  }
}
```
**Шаблон**: подробные правила, строгий формат вывода (JSON), ограничения проверки.

**Пример 3: Агент многоэтапной обработки** (шаблон 5296)
```typescript
{
  "options": {
    "systemMessage": "You are an assistant that helps YouTube creators uncover what topics are trending in a given niche over the past two days.\n\n1. Niche Check\n\nIf the user has not yet specified a niche, respond with a short list of 5 popular niches and ask them to choose one.\n\n2. Trend Search\n\nOnce you know the niche, choose up to three distinct search queries that reflect different angles of that niche.\n\nFor each query, call the youtube_search tool to retrieve videos published in the last 2 days.\n\n3. Data Handling\n\nThe tool returns multiple JSON entries, each with fields:\n  \"video_id\": \"...\", \n  \"view_count\": ..., \n  ...\n\n4. Insight Generation\n\nAggregate results across all queries. Don't discuss individual videos; instead, synthesize overall patterns:\n\n5. Final Output\n\nSummarize the top 2–3 trending topics or formats in this niche over the last 48 hours."
  }
}
```
**Шаблон**: пошаговый процесс, инструкции по использованию инструментов, логика агрегирования.

#### Рекомендации по работе с системными сообщениями:
1. **Всегда определяйте роль**. Какова цель агента?
2. **Укажите ограничения**. Чего НЕ следует делать?
3. **Определить формат вывода** – JSON, уценка, конкретная структура?
4. **Включить руководство по использованию инструментов**. Когда какие инструменты вызывать?
5. **Добавить правила проверки**. Что делает ответ действительным?

### 3. Резервные модели: повышение надежности

Резервные модели обеспечивают автоматическое переключение при сбое основного LLM (ограничения скорости, ошибки, время простоя).

#### Конфигурация:
```typescript
{
  "needsFallback": true  // Default: false, only in version 2.1+
}
```

#### Схема подключения:
```
[Primary LLM] --ai_languageModel[0]--> [AI Agent]
[Fallback LLM] --ai_languageModel[1]--> [AI Agent]
```

#### Правила проверки:
```typescript
if (node.parameters.needsFallback === true) {
  const languageModelConnections = reverseConnections
    .get(node.name)
    .filter(c => c.type === 'ai_languageModel');

  if (languageModelConnections.length < 2) {
    issues.push({
      severity: 'error',
      message: `AI Agent "${node.name}" has needsFallback=true but only ${languageModelConnections.length} language model connection(s). Connect a second language model as fallback.`
    });
  }
} else {
  // Normal case: exactly 1 language model required
  const languageModelConnections = reverseConnections
    .get(node.name)
    .filter(c => c.type === 'ai_languageModel');

  if (languageModelConnections.length !== 1) {
    issues.push({
      severity: 'error',
      message: `AI Agent "${node.name}" requires exactly 1 language model connection, found ${languageModelConnections.length}.`
    });
  }
}
```

#### Когда использовать резервные модели:
- **Производственные системы** с высокими требованиями к доступности
- **Стратегии мульти-LLM** (например, основной GPT-4, резервный вариант Claude)
– **Оптимизация затрат** (дорогая основная, более дешевая резервная версия).
- **Уменьшение ограничения скорости** (автоматическое включение при 429 ошибках)

### 4. Анализаторы вывода: обеспечение соблюдения структурированных данных

Синтаксические анализаторы вывода гарантируют, что LLM возвращает данные в определенном машиночитаемом формате (JSON, XML, структурированный текст).

#### Конфигурация:
```typescript
{
  "hasOutputParser": true  // Default: false
}
```

#### Схема подключения:
```
[Output Parser] --ai_outputParser--> [AI Agent]
```

#### Доступные парсеры вывода:
- **Парсер структурированного вывода**: JSON со строгой проверкой схемы.
- **Парсер вывода с автоматическим исправлением**: пытается исправить неверный формат JSON.
- **Парсер вывода уценки**: структурированная уценка.
- **Пользовательский анализатор вывода**: определяемый пользователем формат.

#### Правила проверки:
```typescript
if (node.parameters.hasOutputParser === true) {
  const outputParserConnections = reverseConnections
    .get(node.name)
    .filter(c => c.type === 'ai_outputParser');

  if (outputParserConnections.length === 0) {
    issues.push({
      severity: 'error',
      message: `AI Agent "${node.name}" has hasOutputParser=true but no ai_outputParser connection. Connect an Output Parser node.`
    });
  } else if (outputParserConnections.length > 1) {
    issues.push({
      severity: 'warning',
      message: `AI Agent "${node.name}" has ${outputParserConnections.length} output parser connections. Only the first will be used.`
    });
  }
}
```

#### Реальное использование (шаблон 214907):
```typescript
{
  "hasOutputParser": true,
  "options": {
    "systemMessage": "... Your output must be formatted as a **single-line JSON array** ..."
  }
}
// Connected to Structured Output Parser with JSON schema
```

**Шаблон**: системное сообщение определяет правила формата, синтаксический анализатор вывода обеспечивает проверку схемы.

### 5. Коллекция дополнительных опций

Коллекция `options` содержит расширенную конфигурацию:

```typescript
{
  "options": {
    "systemMessage": string,          // Agent's core instructions
    "maxIterations": number,          // Max tool call loops (default: 10)
    "returnIntermediateSteps": boolean, // Include reasoning steps in output
    "passthroughBinaryImages": boolean, // Handle binary image data
    "batching": object                // Batch processing config
  }
}
```

#### макситераций
```typescript
{
  "options": {
    "maxIterations": 15  // Default: 10
  }
}
```
- **Цель**: предотвращает бесконечные циклы вызова инструментов.
- **Пример использования**: сложные рабочие процессы с использованием нескольких инструментов (например, исследование → поиск → обобщение → проверка).
- **Проверка**: должно быть разумным (1–50), предупреждение, если > 20.

#### returnIntermediateSteps
```typescript
{
  "options": {
    "returnIntermediateSteps": true  // Default: false
  }
}
```
- **Цель**: возвращает пошаговые рассуждения и вызовы инструментов.
- **Сценарий использования**: отладка, прозрачность, контрольный журнал.
- **Выход**: включает промежуточные мысли, входные/выходные данные инструментов.
- **Производительность**: увеличивает использование токена и время отклика.

#### passthroughBinaryImages
```typescript
{
  "options": {
    "passthroughBinaryImages": true  // Default: false
  }
}
```
- **Цель**: позволяет моделям машинного зрения обрабатывать изображения.
- **Сценарий использования**: анализ изображений, распознавание текста, визуальный ответ на вопросы.
- **Требование**: LLM должен поддерживать видение (GPT-4 Vision, Claude 3 Opus).

#### пакетная обработка
```typescript
{
  "options": {
    "batching": {
      "enabled": true,
      "batchSize": 10
    }
  }
}
```
- **Цель**: параллельная обработка нескольких входов.
- **Пример использования**: массовая обработка данных, пакетные вызовы API.
- **Оптимизация**: сокращает общее время выполнения.

### 6. Различия версий и миграция

#### Версия 1.x (устаревшая)
```typescript
{
  "typeVersion": 1.7,
  "parameters": {
    "promptType": "auto",
    "text": "...",
    "options": {
      "systemMessage": "..."
    }
  }
}
```
- Нет опции `needsFallback`
- Нет опции `hasOutputParser`
- Ограниченная коллекция опций

#### Версия 2.1+ (текущая)
```typescript
{
  "typeVersion": 2.2,
  "parameters": {
    "promptType": "auto",
    "text": "...",
    "hasOutputParser": true,
    "needsFallback": true,
    "options": {
      "systemMessage": "...",
      "maxIterations": 15,
      "returnIntermediateSteps": true,
      "passthroughBinaryImages": true,
      "batching": {...}
    }
  }
}
```
- Добавлен флаг `needsFallback`.
- Добавлен флаг `hasOutputParser`.
- Расширенная коллекция опций
- Улучшенная поддержка потоковой передачи

#### Рекомендации по проверке:
```typescript
function validateAIAgentVersion(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (node.parameters.needsFallback && node.typeVersion < 2.1) {
    issues.push({
      severity: 'error',
      message: `AI Agent "${node.name}" uses needsFallback but typeVersion ${node.typeVersion} does not support it. Upgrade to version 2.1+.`
    });
  }

  return issues;
}
```

### 7. Полная спецификация проверки агента AI.

```typescript
interface AIAgentRequirements {
  // Required Properties
  text: {
    required: true;
    default: "={{ $json.chatInput }}" | "";  // Based on promptType
    validation: "Must not be empty when promptType='define'";
  };

  // Connection Requirements
  connections: {
    ai_languageModel: {
      min: 1;
      max: 1;  // or 2 if needsFallback=true
      required: true;
    };
    ai_memory: {
      min: 0;
      max: 1;
      optional: true;
    };
    ai_tool: {
      min: 0;
      max: Infinity;
      optional: true;
    };
    ai_outputParser: {
      min: 0;
      max: 1;
      optional: true;
      requiredIf: "hasOutputParser === true";
    };
    main: {
      input: {
        typical: 1;
        source: "Chat Trigger or other node";
        requiredIf: "promptType === 'auto'";
      };
      output: {
        allowed: true;
        forbiddenIf: "upstream Chat Trigger has responseMode='streaming'";
      };
    };
  };

  // Optional Enhancements
  options: {
    systemMessage: {
      recommended: true;
      purpose: "Define agent role, capabilities, constraints";
      validation: "Should be clear, specific, include tool usage instructions";
    };
    maxIterations: {
      default: 10;
      range: [1, 50];
      warning: "Values > 20 may cause long execution times";
    };
    returnIntermediateSteps: {
      default: false;
      impact: "Increases output size and token usage";
    };
    passthroughBinaryImages: {
      default: false;
      requires: "LLM with vision capabilities";
    };
  };

  // Version-Specific Features
  features: {
    needsFallback: {
      sinceVersion: 2.1;
      requiresConnections: 2;  // 2x ai_languageModel
    };
    hasOutputParser: {
      sinceVersion: 2.0;
      requiresConnection: "ai_outputParser";
    };
  };
}
```

### 8. Улучшение ответов инструмента MCP для агента AI

На основе этого анализа инструменты MCP должны вернуть:

#### Для `n8n_node_get` (детализация: стандартная/минимальная):
```typescript
{
  "essentials": {
    // Highlight prompt configuration
    "promptConfiguration": {
      "promptType": "auto (Chat Trigger) or define (Custom)",
      "textField": "REQUIRED when promptType='define'",
      "defaultValue": "={{ $json.chatInput }}"
    },

    // Emphasize system message importance
    "systemMessage": {
      "location": "options.systemMessage",
      "importance": "CRITICAL - defines agent behavior",
      "bestPractices": [
        "Define clear role and purpose",
        "Specify output format requirements",
        "Include tool usage instructions",
        "Add constraints and validation rules"
      ]
    },

    // Document fallback feature
    "fallbackModels": {
      "flag": "needsFallback",
      "sinceVersion": 2.1,
      "requires": "2 ai_languageModel connections",
      "useCase": "High-availability production systems"
    },

    // Document output parser integration
    "outputParsers": {
      "flag": "hasOutputParser",
      "requires": "1 ai_outputParser connection",
      "useCase": "Structured JSON/XML output"
    }
  }
}
```

#### Для `n8n_nodes_search` с запросом «Агент AI»:
```typescript
{
  "results": [
    {
      "node": "AI Agent",
      "keyFeatures": [
        "Multi-tool orchestration",
        "Conversation memory integration",
        "System message for role definition",
        "Fallback model support (v2.1+)",
        "Output format enforcement via parsers"
      ],
      "criticalConnections": [
        "ai_languageModel (REQUIRED, 1-2 connections)",
        "ai_memory (OPTIONAL, 0-1 connections)",
        "ai_tool (OPTIONAL, 0-N connections)",
        "ai_outputParser (OPTIONAL, 0-1 connections)"
      ],
      "commonPatterns": [
        "Chat Trigger → AI Agent (streaming chatbots)",
        "AI Agent + Memory + Tools (conversational agents)",
        "AI Agent + Output Parser (structured data extraction)"
      ]
    }
  ]
}
```

#### Для `n8n_node_get` (режим: "документы"):
```markdown
# AI Agent

## Overview
The AI Agent node orchestrates complex workflows by combining language models, tools, and memory to solve multi-step problems.

## Critical Configuration

### 1. User Prompt
- **promptType**: "auto" (from Chat Trigger) or "define" (custom)
- **text**: User message (REQUIRED when promptType="define")

### 2. System Message (CRITICAL)
- **Location**: options.systemMessage
- **Purpose**: Defines agent's role, capabilities, constraints
- **Best Practices**:
  - Start with role definition
  - List available tools and when to use them
  - Specify output format requirements
  - Add behavioral constraints

### 3. Fallback Models (v2.1+)
- **Flag**: needsFallback
- **Requires**: 2 ai_languageModel connections
- **Use Case**: Production reliability, rate limit handling

### 4. Output Parsers
- **Flag**: hasOutputParser
- **Requires**: 1 ai_outputParser connection
- **Use Case**: JSON/XML structured output validation

## Connection Requirements
- **ai_languageModel**: REQUIRED (1 or 2 if fallback enabled)
- **ai_memory**: OPTIONAL (conversation context)
- **ai_tool**: OPTIONAL (external capabilities)
- **ai_outputParser**: OPTIONAL (output formatting)

## Common Mistakes
1. Missing system message → Generic, unhelpful responses
2. Too many maxIterations → Infinite loops, high costs
3. hasOutputParser=true but no parser connected → Runtime error
4. Streaming mode + main output → Response lost
```

## Критическая архитектура: направление потока соединений

### CRITICAL INSIGHT: поток подключений ИИ к потребителям

В отличие от стандартных узлов n8n, где данные передаются ОТ источника К цели через соединения `main`, **соединения, специфичные для AI, передаются К узлам AI Agent/Chain**, а не от них:

```
Standard n8n pattern:
[HTTP Request] --main--> [Set] --main--> [Slack]

AI pattern (REVERSED):
[Language Model] --ai_languageModel--> [AI Agent]
[Memory Buffer]  --ai_memory--------> [AI Agent]
[Tool Node]      --ai_tool----------> [AI Agent]
[Chat Trigger]   --main-------------> [AI Agent]
[AI Agent]       --main (optional)--> [Next Node]
```

**Почему это важно для проверки:**
- Стандартные проверки: `workflow.connections[sourceName][outputType]`
- Для проверки ИИ необходимо: **обратная карта соединений**, чтобы проверить, что соединяется с каждым узлом.
- Необходимо построить: `Map<targetNodeName, Connection[]>` для проверки узлов AI.

**Реальный пример из шаблона №2985:**
```json
{
  "connections": {
    "Groq Chat Model": {
      "ai_languageModel": [[{
        "node": "AI Agent",
        "type": "ai_languageModel",
        "index": 0
      }]]
    },
    "Chat History": {
      "ai_memory": [[{
        "node": "AI Agent",
        "type": "ai_memory",
        "index": 0
      }]]
    }
  }
}
```

Примечание. Соединения определяются в **исходных узлах**, но передаются **К AI-агенту**.

## Полная экосистема инструментов искусственного интеллекта

В нашей базе данных **всего 269 узлов**, которые можно использовать в качестве инструментов ИИ:
- **21 узел** от `@n8n/n8n-nodes-langchain` (компоненты AI)
- **248 узлов** из `n8n-nodes-base` (обычные узлы)

### Специальные подузлы инструментов искусственного интеллекта

Это **13 специализированных узлов инструментов** от `@n8n/n8n-nodes-langchain`, разработанных специально для подключения инструментов AI Agent:

| Тип узла | Отображаемое имя | Цель | Особые требования |
|-----------|--------------|---------|---------------------|
| @@КОД0@@ | Инструмент «Исполнитель» | Запуск инструментов без AI-агента | Подключение AI-агента не требуется |
| @@КОД0@@ | Инструмент AI-агента | AI-агент в виде инструмента | Должно быть ai_languageModel |
| @@КОД0@@ | Вызов инструмента дополнительного рабочего процесса n8n | Выполнение дополнительных рабочих процессов | Подпроцесс должен существовать |
| @@КОД0@@ | Инструмент кода | Выполнение JavaScript/Python | Должна иметь входную схему |
| @@КОД0@@ | Инструмент HTTP-запросов | Вызовы HTTP API | Должны быть определения заполнителей |
| @@КОД0@@ | Клиентский инструмент MCP | Инструменты подключения сервера MCP | Требуется конфигурация сервера MCP |
| @@КОД0@@ | Инструмент «Думайте» | AI отражение/мышление | Никаких особых требований |
| @@КОД0@@ | Инструмент вопросов и ответов для векторного магазина | ТРЯПКА из векторного магазина | Требуется цепочка ai_vectorStore + ai_embedding |
| @@КОД0@@ | Калькулятор | Арифметические операции | Никаких особых требований |
| @@КОД0@@ | ИскатьXNG | Поиск SearXNG | Требуются учетные данные |
| @@КОД0@@ | SerpApi (поиск Google) | Поиск в Google через SerpAPI | Требуются учетные данные |
| @@КОД0@@ | Википедия | Поиск в Википедии | Никаких особых требований |
| @@КОД0@@ | Вольфрам\|Альфа | Вычислительные запросы | Требуются учетные данные |

### Обычные узлы n8n, используемые в качестве инструментов

**248 обычных узлов** из `n8n-nodes-base` можно использовать в качестве инструментов ИИ, если `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`:

**Примеры включают**:
- Action Network, ActiveCampaign, Adalo, Affinity, Agile CRM.
- Airtable, Airtop, отправитель AMQP, Асана, автопилот
- Сервисы AWS (Lambda, SES, SNS, Textract, Transcribe)
- Общение (Slack, Discord, Telegram, WhatsApp, электронная почта)
- Базы данных (MySQL, PostgreSQL, MongoDB, Redis)
- Облачное хранилище (Google Диск, Dropbox, S3)
- Управление проектами (Jira, Trello, ClickUp, Asana)
- CRM (Salesforce, HubSpot, Pipedrive)
- И еще 200+...

**Общая проверка инструмента** (применяется ко всем 248 узлам):
```typescript
interface RegularNodeAsToolValidation {
  connection: 'ai_tool';  // MUST connect via ai_tool output
  description: {
    // Tool description helps LLM decide when to use it
    source: 'node.parameters.toolDescription' | 'node.parameters.description';
    recommended: true;
  };
  credentials: {
    // Credentials are handled by n8n, not exposed to LLM
    validated: boolean;
  };
  parameters: {
    // All parameters should be valid for the node's operation
    validated: boolean;
  };
}
```

**Когда предупреждать**: Обычный узел, используемый в качестве инструмента, должен иметь:
1. Подключение к AI Agent через выход `ai_tool`.
2. Настроены действительные учетные данные (при необходимости).
3. Выбрана правильная операция/ресурс.
4. Необязательно, но рекомендуется: описание специального инструмента.

## Матрица проверки типа соединения

### AI-агент (@n8n/n8n-nodes-langchain.agent)

| Тип подключения | Мощность | Направление | Проверка |
|----------------|-------------|-----------|------------|
| @@КОД0@@ | **ОБЯЗАТЕЛЬНО** (1 или 2) | LLM → Агент | Ровно 1 (или 2, если нужноFallback=true) |
| @@КОД0@@ | Необязательно (0-1) | Память → Агент | разрешено 0 или 1 |
| @@КОД0@@ | Необязательно (0-N) | Инструмент → Агент | Допускается любое количество |
| @@КОД0@@ | Необязательно (0-1) | Парсер → Агент | разрешено 0 или 1 (обязательно, если hasOutputParser=true) |
| `main` (ввод) | Типичный (1) | Триггер → Агент | Обычно из Chat Trigger |
| `main` (выход) | Условное | Агент → Узел | ЗАПРЕЩЕНО в потоковом режиме |

**Правила проверки**:

1. **Требования к языковой модели**:
```typescript
if (node.parameters.needsFallback === true) {
  // MUST have exactly 2 ai_languageModel connections
  if (languageModelCount !== 2) {
    ERROR: "AI Agent with needsFallback=true requires 2 language models"
  }
} else {
  // MUST have exactly 1 ai_languageModel connection
  if (languageModelCount !== 1) {
    ERROR: "AI Agent requires exactly 1 language model"
  }
}
```

2. **Требования к выходному анализатору**:
```typescript
if (node.parameters.hasOutputParser === true) {
  // MUST have exactly 1 ai_outputParser connection
  if (outputParserCount === 0) {
    ERROR: "AI Agent with hasOutputParser=true requires an output parser connection"
  }
}
```

3. **Правило потокового режима**:
```typescript
IF (Chat Trigger → AI Agent with responseMode="streaming")
THEN (AI Agent MUST NOT have main output connections)
```

4. **Правило типа запроса**:
```typescript
if (node.parameters.promptType === "auto") {
  // Should have Chat Trigger as input
  if (!hasChatTriggerInput) {
    WARNING: "AI Agent with promptType='auto' should receive input from Chat Trigger"
  }
}

if (node.parameters.promptType === "define") {
  // Text field must not be empty
  if (!node.parameters.text || node.parameters.text.trim() === "") {
    ERROR: "AI Agent with promptType='define' must have non-empty text field"
  }
}
```

### Базовая цепочка LLM (@n8n/n8n-nodes-langchain.chainLlm)

| Тип подключения | Мощность | Направление | Проверка |
|----------------|-------------|-----------|------------|
| @@КОД0@@ | **ОБЯЗАТЕЛЬНО** (1) | LLM → Сеть | ДОЛЖЕН иметь ровно 1 |
| @@КОД0@@ | Необязательно (0-1) | Парсер → Цепочка | разрешено 0 или 1 |
| @@КОД0@@ | **ЗАПРЕЩЕНО** | - | НЕ ДОЛЖНО иметь |
| @@КОД0@@ | **ЗАПРЕЩЕНО** | - | НЕ ДОЛЖНО иметь |

### Инструмент векторного хранилища (@n8n/n8n-nodes-langchain.toolVectorStore)

| Тип подключения | Мощность | Направление | Проверка |
|----------------|-------------|-----------|------------|
| @@КОД0@@ | **ОБЯЗАТЕЛЬНО** (1) | VectorStore → Инструмент | ДОЛЖЕН иметь ровно 1 |
| `ai_tool` (выход) | Типичный (1) | Инструмент → Агент | Следует подключиться к AI Agent |

**Проверка цепочки**:
```
Vector Store Tool
  ← ai_vectorStore ← Vector Store
    ← ai_embedding ← Embeddings Model
    ← ai_document ← Document Loader
      ← ai_textSplitter ← Text Splitter (optional)
```

### Триггер чата (@n8n/n8n-nodes-langchain.chatTrigger)

**Цель**: триггерный узел, специально разработанный для рабочих процессов чат-ботов с искусственным интеллектом. Предоставляет веб-интерфейс для взаимодействия в чате.

**Основные характеристики**:
- **Триггер**: Да (запускает рабочий процесс)
- **Является ли Webhook**: Да (обеспечивает конечную точку HTTP)
- **Тип вывода**: `main` (подключение к AI-агенту или логике рабочего процесса)

**Уникальные особенности**:
- Интерфейс размещенного чата (`mode: "hostedChat"`)
- Встроенный виджет чата (`mode: "webhook"`)
- Поддержка загрузки файлов
- Управление сеансами
- Возможность потокового ответа
- Пользовательский стиль CSS.

| Недвижимость | Ценности | Влияние на валидацию |
|----------|--------|---------------------|
| @@КОД0@@ | "потоковая передача" | AI-агент НЕ должен иметь основной вывод (потоки ответов возвращаются через триггер) |
| | "последний узел" | Разрешен обычный рабочий процесс (возвращаются данные из последнего выполненного узла) |
| | "Узел ответа" | В рабочем процессе должен быть узел «Ответить на Webhook» |
| | "узлы ответа" | Должны быть настроены узлы ответа |
| @@КОД0@@ | "hostedChat" | Предоставляет интерфейс чата, размещенный на n8n |
| | "вебхук" | Встраиваемый виджет чата |

**Требования для проверки**:
```typescript
function validateChatTrigger(
  node: WorkflowNode,
  workflow: WorkflowJson,
  result: WorkflowValidationResult
): void {
  const connections = workflow.connections[node.name];

  // 1. Check has downstream connections
  if (!connections?.main || connections.main.flat().filter(c => c).length === 0) {
    result.errors.push({
      type: 'error',
      nodeId: node.id,
      nodeName: node.name,
      message: `Chat Trigger "${node.name}" has no downstream connections. Connect it to an AI Agent or workflow logic.`
    });
    return;
  }

  // 2. Check responseMode compatibility
  const responseMode = node.parameters?.options?.responseMode || 'lastNode';
  const firstConnection = connections.main[0]?.[0];

  if (firstConnection) {
    const targetNode = workflow.nodes.find(n => n.name === firstConnection.node);
    const targetType = targetNode ? NodeTypeNormalizer.normalizeToFullForm(targetNode.type) : '';

    if (responseMode === 'streaming') {
      // Must connect to streaming-capable node
      if (targetType !== '@n8n/n8n-nodes-langchain.agent') {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: `Chat Trigger "${node.name}" has responseMode="streaming" but does not connect to an AI Agent. Only AI Agent supports streaming responses.`
        });
      } else {
        // Check AI Agent has enableStreaming option
        const enableStreaming = targetNode?.parameters?.options?.enableStreaming;
        if (enableStreaming === false) {
          result.warnings.push({
            type: 'warning',
            nodeId: targetNode.id,
            nodeName: targetNode.name,
            message: `AI Agent "${targetNode.name}" has enableStreaming=false but Chat Trigger uses responseMode="streaming". Enable streaming in the AI Agent options.`
          });
        }

        // CRITICAL: Check AI Agent has NO main output
        const agentMainOutput = workflow.connections[targetNode.name]?.main;
        if (agentMainOutput && agentMainOutput.flat().some(c => c)) {
          result.errors.push({
            type: 'error',
            nodeId: targetNode.id,
            nodeName: targetNode.name,
            message: `AI Agent "${targetNode.name}" is connected from Chat Trigger with responseMode="streaming". It must NOT have outgoing main connections. The response streams back through the Chat Trigger.`
          });
        }
      }
    }

    if (responseMode === 'responseNode') {
      // Must have Respond to Webhook in workflow
      const hasRespondNode = workflow.nodes.some(n =>
        n.type.toLowerCase().includes('respondtowebhook')
      );
      if (!hasRespondNode) {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: `Chat Trigger "${node.name}" has responseMode="responseNode" but no "Respond to Webhook" node found in workflow.`
        });
      }
    }
  }

  // 3. Recommend connecting to AI nodes
  const downstreamNodes = connections.main.flat()
    .map(c => c?.node)
    .filter(Boolean) || [];

  const hasAINode = downstreamNodes.some(nodeName => {
    const targetNode = workflow.nodes.find(n => n.name === nodeName);
    return targetNode && (
      targetNode.type.includes('agent') ||
      targetNode.type.includes('chainLlm')
    );
  });

  if (!hasAINode) {
    result.warnings.push({
      type: 'warning',
      nodeId: node.id,
      nodeName: node.name,
      message: `Chat Trigger "${node.name}" is not connected to an AI Agent or LLM Chain. Consider connecting to an AI node for chat functionality.`
    });
  }
}
```

## Правила проверки для конкретного инструмента

### 1. Инструмент HTTP-запросов (`toolHttpRequest`)

**Цель**: выполняет запросы HTTP API с параметрами, заполненными LLM, позволяя агентам ИИ динамически взаимодействовать с внешними API REST.

**Параметры конфигурации**:
- `toolDescription`: Описание для LLM (ОБЯЗАТЕЛЬНО)
- `method`: метод HTTP — GET, POST, PUT, DELETE, PATCH (по умолчанию: GET)
- `url`: URL-адрес конечной точки API (ОБЯЗАТЕЛЬНО, может содержать {заполнители}).
- `authentication`: нет, предопределенные учетные данные, общие учетные данные.
- `placeholderDefinitions`: определения для {placeholders} в URL/body/headers/query.
- `sendQuery`: отправлять ли параметры запроса.
- `queryParameters`: параметры строки запроса (могут содержать {заполнители}).
- `sendHeaders`: отправлять ли пользовательские заголовки.
- `headerParameters`: заголовки HTTP (могут содержать {заполнители}).
- `sendBody`: отправлять ли тело запроса.
- `jsonBody`: тело запроса в формате JSON (может содержать {заполнители}).
- `options`: Расширенные параметры (оптимизация ответа и т. д.)

**Система заполнителей**:
LLM динамически заполняет значения `{placeholder}` в URL-адресе, запросе, заголовках и теле на основе пользовательского ввода.

**Критические требования**:
1. Каждый `{placeholder}` должен быть определен в `placeholderDefinitions`.
2. Имена заполнителей должны точно совпадать (с учетом регистра).
3. В описании инструмента должно быть указано, к какому API он обращается.

```typescript
function validateHTTPRequestTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check for tool description (REQUIRED)
  if (!node.parameters.toolDescription) {
    issues.push({
      severity: 'error',
      message: `HTTP Request Tool "${node.name}" has no toolDescription. Add one to help the LLM know when to use this tool.`
    });
  }

  // 2. Check for URL (REQUIRED)
  if (!node.parameters.url) {
    issues.push({
      severity: 'error',
      message: `HTTP Request Tool "${node.name}" has no URL. Provide the API endpoint URL.`
    });
  }

  // 3. Validate placeholders
  const hasPlaceholders =
    node.parameters.url?.includes('{') ||
    node.parameters.jsonBody?.includes('{') ||
    node.parameters.queryParameters?.includes('{') ||
    node.parameters.headerParameters?.includes('{');

  if (hasPlaceholders) {
    const definitions = node.parameters.placeholderDefinitions?.values || [];
    if (definitions.length === 0) {
      issues.push({
        severity: 'error',
        message: `HTTP Request Tool "${node.name}" uses placeholders but has no placeholderDefinitions. Define all placeholders.`
      });
    }

    // Extract all placeholders from all fields
    const allText = `${node.parameters.url || ''} ${JSON.stringify(node.parameters.jsonBody || '')} ${JSON.stringify(node.parameters.queryParameters || '')} ${JSON.stringify(node.parameters.headerParameters || '')}`;
    const placeholderRegex = /\{([^}]+)\}/g;
    const placeholders = new Set<string>();
    let match;
    while ((match = placeholderRegex.exec(allText)) !== null) {
      placeholders.add(match[1]);
    }

    // Check each placeholder is defined
    const definedNames = new Set(definitions.map((d: any) => d.name));
    for (const placeholder of placeholders) {
      if (!definedNames.has(placeholder)) {
        issues.push({
          severity: 'error',
          message: `HTTP Request Tool "${node.name}" uses placeholder {${placeholder}} but it is not defined in placeholderDefinitions.`
        });
      }
    }

    // Validate placeholder definitions have required fields
    for (const def of definitions) {
      if (!def.name) {
        issues.push({
          severity: 'error',
          message: `HTTP Request Tool "${node.name}" has a placeholder definition without a name.`
        });
      }
      if (!def.description) {
        issues.push({
          severity: 'warning',
          message: `HTTP Request Tool "${node.name}" placeholder "${def.name}" has no description. Add one to help the LLM provide correct values.`
        });
      }
    }
  }

  // 4. Validate authentication if specified
  if (node.parameters.authentication === 'predefinedCredentialType' ||
      node.parameters.authentication === 'genericCredentialType') {
    if (!node.credentials || Object.keys(node.credentials).length === 0) {
      issues.push({
        severity: 'error',
        message: `HTTP Request Tool "${node.name}" uses authentication but no credentials are configured.`
      });
    }
  }

  // 5. Validate method
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (node.parameters.method && !validMethods.includes(node.parameters.method.toUpperCase())) {
    issues.push({
      severity: 'error',
      message: `HTTP Request Tool "${node.name}" has invalid method "${node.parameters.method}". Must be one of: ${validMethods.join(', ')}.`
    });
  }

  // 6. Validate body for methods that support it
  if (['POST', 'PUT', 'PATCH'].includes(node.parameters.method?.toUpperCase() || 'GET')) {
    if (node.parameters.sendBody && !node.parameters.jsonBody) {
      issues.push({
        severity: 'warning',
        message: `HTTP Request Tool "${node.name}" has sendBody enabled but no jsonBody specified.`
      });
    }
  }

  return issues;
}
```

**Примеры проверки**:

✅ **ПРАВИЛЬНО — Простой запрос GET**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "name": "Get User Info",
  "parameters": {
    "toolDescription": "Retrieves user information by user ID",
    "method": "GET",
    "url": "https://api.example.com/users/{userId}",
    "placeholderDefinitions": {
      "values": [
        {
          "name": "userId",
          "description": "The unique identifier for the user",
          "type": "string"
        }
      ]
    }
  }
}
```

✅ **ПРАВИЛЬНО — ПОСТ с телом и заголовками**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "name": "Create Order",
  "parameters": {
    "toolDescription": "Creates a new order with specified items and quantity",
    "method": "POST",
    "url": "https://api.example.com/orders",
    "authentication": "predefinedCredentialType",
    "sendHeaders": true,
    "headerParameters": {
      "Content-Type": "application/json"
    },
    "sendBody": true,
    "jsonBody": {
      "product": "{productId}",
      "quantity": "{quantity}",
      "customer": "{customerId}"
    },
    "placeholderDefinitions": {
      "values": [
        {
          "name": "productId",
          "description": "Product identifier",
          "type": "string"
        },
        {
          "name": "quantity",
          "description": "Number of items to order",
          "type": "number"
        },
        {
          "name": "customerId",
          "description": "Customer ID",
          "type": "string"
        }
      ]
    }
  }
}
```

❌ **НЕПРАВИЛЬНО – отсутствует URL**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "parameters": {
    "toolDescription": "Get data",
    "method": "GET"
    // Missing url!
  }
}
```

❌ **НЕПРАВИЛЬНО – заполнитель не определен**:
```json
{
  "parameters": {
    "toolDescription": "Get user",
    "url": "https://api.example.com/users/{userId}",
    "placeholderDefinitions": {
      "values": [
        {
          "name": "id",  // Wrong! URL uses {userId} not {id}
          "description": "User ID",
          "type": "string"
        }
      ]
    }
  }
}
```

❌ **НЕПРАВИЛЬНО: отсутствует описание инструмента**:
```json
{
  "parameters": {
    "method": "GET",
    "url": "https://api.example.com/data"
    // Missing toolDescription! LLM won't know when to use this
  }
}
```

### 2. Инструмент кода (`toolCode`)

**Цель**: выполняет собственный код JavaScript или Python в качестве инструмента искусственного интеллекта, позволяя LLM выполнять вычисления, преобразования или бизнес-логику, недоступные с помощью стандартных инструментов.

**Параметры конфигурации**:
- `name` (строка, ОБЯЗАТЕЛЬНО): имя функции, которую вызывает LLM (должно содержать только буквы, цифры и символы подчеркивания).
- `description` (строка, ОБЯЗАТЕЛЬНО): объясняет LLM, что делает инструмент и когда его использовать.
- `code` (строка, ОБЯЗАТЕЛЬНО): фактический код JavaScript или Python для выполнения.
- `language` (строка): язык программирования — «javaScript» или «python» (по умолчанию: «javaScript»)
- `specifyInputSchema` (логическое значение): определять ли схему входных параметров (РЕКОМЕНДУЕТСЯ для проверки)
- `schemaType` (строка): как определить схему - «fromJson» (автоматически генерировать из примера) или «вручную».
- `jsonSchemaExample` (строка): пример ввода JSON для автоматического создания схемы (когда SchemaType="fromJson")
- `inputSchema` (строка): определение схемы JSON вручную (когда SchemaType="manual")

**Как работает инструмент кода**:
LLM вызывает функцию по имени с параметрами. Код выполняется в изолированной среде и возвращает результаты в LLM. Для JavaScript код должен возвращать значение. Для Python используйте операторы `return`.

**Критические требования**:
1. Функция `name` должна быть действительным идентификатором (только буквы, цифры и символы подчеркивания).
2. `description` необходим, чтобы помочь LLM понять, когда использовать этот инструмент.
3. `code` должен быть синтаксически допустимым и возвращать значение.
4. Схема ввода НАСТОЯТЕЛЬНО РЕКОМЕНДУЕТСЯ для проверки параметров, предоставленных LLM.

**Логика проверки**:
```typescript
function validateCodeTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check function name (REQUIRED)
  if (!node.parameters.name) {
    issues.push({
      severity: 'error',
      message: `Code Tool "${node.name}" has no function name. Add a name property.`
    });
  } else if (!/^[a-zA-Z0-9_]+$/.test(node.parameters.name)) {
    issues.push({
      severity: 'error',
      message: `Code Tool "${node.name}" function name "${node.parameters.name}" contains invalid characters. Use only letters, numbers, and underscores.`
    });
  } else if (/^\d/.test(node.parameters.name)) {
    issues.push({
      severity: 'error',
      message: `Code Tool "${node.name}" function name "${node.parameters.name}" cannot start with a number.`
    });
  }

  // 2. Check description (REQUIRED)
  if (!node.parameters.description) {
    issues.push({
      severity: 'error',
      message: `Code Tool "${node.name}" has no description. Add one to help the LLM understand the tool's purpose.`
    });
  } else if (node.parameters.description.trim().length < 10) {
    issues.push({
      severity: 'warning',
      message: `Code Tool "${node.name}" description is too short. Provide more detail about what the tool does.`
    });
  }

  // 3. Check code exists (REQUIRED)
  if (!node.parameters.code || node.parameters.code.trim().length === 0) {
    issues.push({
      severity: 'error',
      message: `Code Tool "${node.name}" has no code. Add the JavaScript or Python code to execute.`
    });
  }

  // 4. Check language validity
  if (node.parameters.language && !['javaScript', 'python'].includes(node.parameters.language)) {
    issues.push({
      severity: 'error',
      message: `Code Tool "${node.name}" has invalid language "${node.parameters.language}". Use "javaScript" or "python".`
    });
  }

  // 5. Recommend input schema
  if (!node.parameters.specifyInputSchema) {
    issues.push({
      severity: 'warning',
      message: `Code Tool "${node.name}" does not specify an input schema. Consider adding one to validate LLM inputs.`
    });
  } else {
    // 6. Validate schema if specified
    if (node.parameters.schemaType === 'fromJson') {
      if (!node.parameters.jsonSchemaExample) {
        issues.push({
          severity: 'error',
          message: `Code Tool "${node.name}" uses schemaType="fromJson" but has no jsonSchemaExample.`
        });
      } else {
        try {
          JSON.parse(node.parameters.jsonSchemaExample);
        } catch (e) {
          issues.push({
            severity: 'error',
            message: `Code Tool "${node.name}" has invalid JSON schema example.`
          });
        }
      }
    } else if (node.parameters.schemaType === 'manual') {
      if (!node.parameters.inputSchema) {
        issues.push({
          severity: 'error',
          message: `Code Tool "${node.name}" uses schemaType="manual" but has no inputSchema.`
        });
      } else {
        try {
          const schema = JSON.parse(node.parameters.inputSchema);
          if (!schema.type) {
            issues.push({
              severity: 'warning',
              message: `Code Tool "${node.name}" manual schema should have a 'type' field.`
            });
          }
          if (!schema.properties && schema.type === 'object') {
            issues.push({
              severity: 'warning',
              message: `Code Tool "${node.name}" object schema should have 'properties' field.`
            });
          }
        } catch (e) {
          issues.push({
            severity: 'error',
            message: `Code Tool "${node.name}" has invalid JSON schema.`
          });
        }
      }
    }
  }

  // 7. Check for common code mistakes
  if (node.parameters.code) {
    const lang = node.parameters.language || 'javaScript';
    if (lang === 'javaScript') {
      // Check if code has return statement or expression
      const hasReturn = /\breturn\b/.test(node.parameters.code);
      const isSingleExpression = !node.parameters.code.includes(';') &&
                                 !node.parameters.code.includes('\n');
      if (!hasReturn && !isSingleExpression) {
        issues.push({
          severity: 'warning',
          message: `Code Tool "${node.name}" JavaScript code should return a value. Add a return statement.`
        });
      }
    }
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример 1** — Простой инструмент расчета:
```typescript
{
  type: 'toolCode',
  name: 'Calculate Tax',
  parameters: {
    name: 'calculate_tax',
    description: 'Calculates sales tax for a given price and tax rate percentage',
    language: 'javaScript',
    code: 'return price * (taxRate / 100);',
    specifyInputSchema: true,
    schemaType: 'fromJson',
    jsonSchemaExample: '{"price": 100, "taxRate": 8.5}'
  }
}
// Valid: Has function name, description, code with return statement, and input schema
```

✅ **Правильный пример 2** — преобразование данных Python:
```typescript
{
  type: 'toolCode',
  name: 'Format Date',
  parameters: {
    name: 'format_date',
    description: 'Converts ISO date string to human-readable format',
    language: 'python',
    code: `from datetime import datetime
date_obj = datetime.fromisoformat(iso_date)
return date_obj.strftime('%B %d, %Y')`,
    specifyInputSchema: true,
    schemaType: 'manual',
    inputSchema: '{"type": "object", "properties": {"iso_date": {"type": "string"}}, "required": ["iso_date"]}'
  }
}
// Valid: Python code with proper return, manual schema with type and properties
```

✅ **Правильный пример 3** — Бизнес-логика без схемы:
```typescript
{
  type: 'toolCode',
  name: 'Discount Calculator',
  parameters: {
    name: 'apply_discount',
    description: 'Applies tiered discount based on order total: 10% off over $100, 20% off over $500',
    language: 'javaScript',
    code: `if (total >= 500) return total * 0.8;
if (total >= 100) return total * 0.9;
return total;`
  }
}
// Valid even without schema: Has name, description, and working code
// WARNING will be issued recommending schema
```

❌ **Неправильный пример 1** — Неверное имя функции:
```typescript
{
  type: 'toolCode',
  name: 'Calculate Tax',
  parameters: {
    name: '3rd_party_calculator',  // ❌ Starts with number
    description: 'Calculates sales tax',
    code: 'return price * 0.085;'
  }
}
// ERROR: Function name cannot start with a number
```

❌ **Неверный пример 2** – отсутствуют обязательные поля:
```typescript
{
  type: 'toolCode',
  name: 'My Tool',
  parameters: {
    name: 'my_tool',
    // ❌ No description
    code: ''  // ❌ Empty code
  }
}
// ERROR: Missing description (required for LLM)
// ERROR: No code provided
```

❌ **Неправильный пример 3** — Неверная конфигурация схемы:
```typescript
{
  type: 'toolCode',
  name: 'Data Processor',
  parameters: {
    name: 'process_data',
    description: 'Processes input data',
    code: 'return data.toUpperCase();',
    specifyInputSchema: true,
    schemaType: 'fromJson',
    // ❌ No jsonSchemaExample when using fromJson
  }
}
// ERROR: schemaType="fromJson" requires jsonSchemaExample
```

❌ **Неверный пример 4** — Недопустимые символы в имени:
```typescript
{
  type: 'toolCode',
  name: 'Format Name',
  parameters: {
    name: 'format-name-helper',  // ❌ Contains hyphens
    description: 'Formats user names',
    code: 'return firstName + " " + lastName;'
  }
}
// ERROR: Function name contains invalid characters (hyphens not allowed)
// Only letters, numbers, and underscores permitted
```

### 3. Инструмент векторного хранилища (`toolVectorStore`)

**Цель**: позволяет агенту ИИ выполнять семантический поиск в базе знаний путем запроса к хранилищу векторов. LLM может извлекать соответствующие документы или данные на основе запросов на естественном языке.

**Параметры конфигурации**:
- `name` (строка, ОБЯЗАТЕЛЬНО): имя инструмента, который LLM использует для запуска поиска.
- `description` (строка, ОБЯЗАТЕЛЬНО): объясняет, в какой базе знаний выполняется поиск и когда ее использовать.
- `topK` (число): количество возвращаемых наиболее релевантных результатов (по умолчанию: 4).

**Как работает инструмент векторного хранилища**:
LLM вызывает этот инструмент с помощью поискового запроса. Инструмент преобразует запрос во встраивания, ищет в векторном хранилище похожие вложения и возвращает наиболее релевантные документы/фрагменты. Это позволяет использовать шаблоны RAG (дополненная генерация извлечения).

**Критические требования**:
1. ДОЛЖНО иметь соединение `ai_vectorStore` с узлом хранилища векторов (например, Pinecone, хранилище векторов в памяти).
2. Хранилище векторов ДОЛЖНО иметь соединение `ai_embedding` с узлом Embeddings (например, Embeddings OpenAI).
3. Хранилище векторов ДОЛЖНО иметь соединение `ai_document` для заполнения его данными.
4. `description` ТРЕБУЕТСЯ, чтобы помочь LLM понять, какие знания доступны для поиска.

**Архитектура подключения**:
```
[Document Loader] --ai_document--> [Vector Store] <--ai_vectorStore-- [Vector Store Tool]
[Embeddings]      --ai_embedding--> [Vector Store]
                                     [Vector Store] --ai_vectorStore--> [AI Agent]
```

**Логика проверки**:
```typescript
function validateVectorStoreTool(
  node: WorkflowNode,
  reverseConnections: Map<string, Connection[]>,
  workflow: WorkflowJson
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check tool name (REQUIRED)
  if (!node.parameters.name) {
    issues.push({
      severity: 'error',
      message: `Vector Store Tool "${node.name}" has no tool name. Add a name property.`
    });
  }

  // 2. Check description (REQUIRED)
  if (!node.parameters.description) {
    issues.push({
      severity: 'error',
      message: `Vector Store Tool "${node.name}" has no description. Add one to explain what data it searches.`
    });
  } else if (node.parameters.description.trim().length < 15) {
    issues.push({
      severity: 'warning',
      message: `Vector Store Tool "${node.name}" description is too short. Explain what knowledge base is being searched.`
    });
  }

  // 3. Check ai_vectorStore connection (REQUIRED)
  const incoming = reverseConnections.get(node.name) || [];
  const vectorStoreConn = incoming.find(c => c.type === 'ai_vectorStore');

  if (!vectorStoreConn) {
    issues.push({
      severity: 'error',
      message: `Vector Store Tool "${node.name}" requires an ai_vectorStore connection. Connect a Vector Store node (e.g., Pinecone, In-Memory Vector Store).`
    });
    return issues;  // Can't continue without this
  }

  // 4. Validate Vector Store node exists
  const vectorStoreNode = workflow.nodes.find(n => n.name === vectorStoreConn.sourceName);
  if (!vectorStoreNode) {
    issues.push({
      severity: 'error',
      message: `Vector Store Tool "${node.name}" connects to non-existent node "${vectorStoreConn.sourceName}".`
    });
    return issues;
  }

  // 5. Validate Vector Store has embedding (REQUIRED)
  const vsIncoming = reverseConnections.get(vectorStoreNode.name) || [];
  const embeddingConn = vsIncoming.find(c => c.type === 'ai_embedding');

  if (!embeddingConn) {
    issues.push({
      severity: 'error',
      message: `Vector Store "${vectorStoreNode.name}" requires an ai_embedding connection. Connect an Embeddings node (e.g., Embeddings OpenAI, Embeddings Google Gemini).`
    });
  }

  // 6. Check for document loader (RECOMMENDED)
  const documentConn = vsIncoming.find(c => c.type === 'ai_document');
  if (!documentConn) {
    issues.push({
      severity: 'warning',
      message: `Vector Store "${vectorStoreNode.name}" has no ai_document connection. Without documents, the vector store will be empty. Connect a Document Loader to populate it.`
    });
  }

  // 7. Validate topK parameter if specified
  if (node.parameters.topK !== undefined) {
    if (typeof node.parameters.topK !== 'number' || node.parameters.topK < 1) {
      issues.push({
        severity: 'error',
        message: `Vector Store Tool "${node.name}" has invalid topK value. Must be a positive number.`
      });
    } else if (node.parameters.topK > 20) {
      issues.push({
        severity: 'warning',
        message: `Vector Store Tool "${node.name}" has topK=${node.parameters.topK}. Large values may overwhelm the LLM context. Consider reducing to 10 or less.`
      });
    }
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример 1** — Полная настройка RAG:
```typescript
{
  type: 'toolVectorStore',
  name: 'Search Knowledge Base',
  parameters: {
    name: 'search_docs',
    description: 'Searches our product documentation and knowledge base articles to answer customer questions',
    topK: 5
  }
}
// Connected to:
// - In-Memory Vector Store (with ai_vectorStore connection)
//   - Embeddings OpenAI (with ai_embedding connection)
//   - Default Data Loader (with ai_document connection)
// Valid: Has name, description, proper connection chain
```

✅ **Правильный пример 2** — интеграция сосновой шишки:
```typescript
{
  type: 'toolVectorStore',
  name: 'Search Customer History',
  parameters: {
    name: 'search_customer_data',
    description: 'Searches previous customer interactions, support tickets, and feedback to provide context for current conversation',
    topK: 3
  }
}
// Connected to:
// - Pinecone Vector Store (with ai_vectorStore connection)
//   - Embeddings Google Gemini (with ai_embedding connection)
//   - CSV File Loader (with ai_document connection)
// Valid: All required connections present
```

✅ **Правильный пример 3** — Минимальная настройка:
```typescript
{
  type: 'toolVectorStore',
  name: 'Search Company Policies',
  parameters: {
    name: 'search_policies',
    description: 'Searches company policies, procedures, and guidelines to answer employee questions'
  }
}
// Connected to vector store with embeddings
// Valid: Uses default topK=4, has all required components
// WARNING will be issued if no document loader connected
```

❌ **Неверный пример 1** — Отсутствует подключение к векторному хранилищу:
```typescript
{
  type: 'toolVectorStore',
  name: 'Search Tool',
  parameters: {
    name: 'search',
    description: 'Searches documents'
  }
}
// ❌ No ai_vectorStore connection
// ERROR: Vector Store Tool requires an ai_vectorStore connection
```

❌ **Неверный пример 2** — в векторном хранилище отсутствуют вложения:
```typescript
{
  type: 'toolVectorStore',
  name: 'Search Documents',
  parameters: {
    name: 'search_docs',
    description: 'Searches our document collection'
  }
}
// Connected to: In-Memory Vector Store (no ai_embedding connection)
// ERROR: Vector Store requires an ai_embedding connection
// Without embeddings, semantic search cannot function
```

❌ **Неверный пример 3** – Отсутствуют обязательные поля:
```typescript
{
  type: 'toolVectorStore',
  name: 'Search Tool',
  parameters: {
    // ❌ No name property
    description: 'Search'  // ❌ Description too short
  }
}
// ERROR: No tool name
// WARNING: Description too short (provide more detail)
```

❌ **Неверный пример 4** — Неверный topK:
```typescript
{
  type: 'toolVectorStore',
  name: 'Search Everything',
  parameters: {
    name: 'search_all',
    description: 'Searches all available documents in the knowledge base',
    topK: 50  // ❌ Too many results
  }
}
// WARNING: topK=50 may overwhelm LLM context
// Large result sets reduce response quality
```

### 4. Инструмент рабочего процесса (`toolWorkflow`)

**Цель**: выполняет другой рабочий процесс n8n в качестве инструмента, позволяющего упаковать сложную повторно используемую логику в качестве возможностей агента.

**Параметры конфигурации**:
- `source`: «база данных» (существующий рабочий процесс) или «параметр» (встроенный рабочий процесс JSON)
- `workflowId`: идентификатор рабочего процесса для выполнения (когда source="database")
- `workflowJson`: определение встроенного рабочего процесса (когда source="parameter").
- `description`: описание инструмента для LLM (ОБЯЗАТЕЛЬНО)
- `specifyInputSchema`: определять ли схему ввода (рекомендуется)
- `workflowInputs`: сопоставление полей из LLM с входными данными рабочего процесса.

**Критическое требование**: подпроцесс ДОЛЖЕН начинаться с узла «Выполнение триггера рабочего процесса».

```typescript
function validateWorkflowTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check description (REQUIRED for LLM to understand tool)
  if (!node.parameters.description) {
    issues.push({
      severity: 'error',
      message: `Workflow Tool "${node.name}" has no description. Add a clear description to help the LLM know when to use this sub-workflow.`
    });
  }

  // 2. Check source parameter exists
  if (!node.parameters.source) {
    issues.push({
      severity: 'error',
      message: `Workflow Tool "${node.name}" has no source parameter. Set source to "database" or "parameter".`
    });
    return issues;  // Can't continue without source
  }

  // 3. Validate based on source type
  if (node.parameters.source === 'database') {
    // When using database, workflowId is required
    if (!node.parameters.workflowId) {
      issues.push({
        severity: 'error',
        message: `Workflow Tool "${node.name}" has source="database" but no workflowId specified. Select a sub-workflow to execute.`
      });
    }

    // Note: We can't validate if the sub-workflow exists at validation time
    // because workflows are deployed independently. This should be checked at runtime.
    // The sub-workflow MUST start with "Execute Workflow Trigger" node.

  } else if (node.parameters.source === 'parameter') {
    // When using parameter, workflowJson is required
    if (!node.parameters.workflowJson) {
      issues.push({
        severity: 'error',
        message: `Workflow Tool "${node.name}" has source="parameter" but no workflowJson specified. Provide inline workflow definition.`
      });
    } else {
      // Validate workflowJson is valid JSON
      try {
        const workflow = typeof node.parameters.workflowJson === 'string'
          ? JSON.parse(node.parameters.workflowJson)
          : node.parameters.workflowJson;

        // Check if workflow has nodes
        if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
          issues.push({
            severity: 'error',
            message: `Workflow Tool "${node.name}" has invalid workflowJson. Missing or invalid nodes array.`
          });
        } else {
          // Check if workflow starts with Execute Workflow Trigger
          const hasTrigger = workflow.nodes.some((n: any) =>
            n.type && (
              n.type.includes('executeWorkflowTrigger') ||
              n.type.includes('executeWorkflow')
            )
          );

          if (!hasTrigger) {
            issues.push({
              severity: 'error',
              message: `Workflow Tool "${node.name}" sub-workflow does not start with "Execute Workflow Trigger". Add this trigger node to the sub-workflow.`
            });
          }
        }
      } catch (e) {
        issues.push({
          severity: 'error',
          message: `Workflow Tool "${node.name}" has invalid workflowJson. Must be valid JSON: ${(e as Error).message}`
        });
      }
    }
  } else {
    issues.push({
      severity: 'error',
      message: `Workflow Tool "${node.name}" has invalid source="${node.parameters.source}". Must be "database" or "parameter".`
    });
  }

  // 4. Recommend input schema for better LLM integration
  if (!node.parameters.specifyInputSchema) {
    issues.push({
      severity: 'info',
      message: `Workflow Tool "${node.name}" does not specify an input schema. Consider adding one to validate LLM inputs and provide better guidance.`
    });
  } else {
    // Validate input schema if specified
    if (node.parameters.schemaType === 'fromJson') {
      try {
        JSON.parse(node.parameters.jsonSchemaExample || '{}');
      } catch (e) {
        issues.push({
          severity: 'error',
          message: `Workflow Tool "${node.name}" has invalid JSON schema example.`
        });
      }
    } else if (node.parameters.schemaType === 'manual') {
      try {
        const schema = JSON.parse(node.parameters.inputSchema || '{}');
        if (!schema.type || !schema.properties) {
          issues.push({
            severity: 'warning',
            message: `Workflow Tool "${node.name}" manual schema should have 'type' and 'properties' fields.`
          });
        }
      } catch (e) {
        issues.push({
          severity: 'error',
          message: `Workflow Tool "${node.name}" has invalid JSON schema.`
        });
      }
    }
  }

  // 5. Check workflowInputs configuration
  if (!node.parameters.workflowInputs) {
    issues.push({
      severity: 'info',
      message: `Workflow Tool "${node.name}" has no workflowInputs defined. Map fields to help LLM provide correct data to sub-workflow.`
    });
  }

  return issues;
}
```

**Примеры проверки**:

✅ **ПРАВИЛЬНО – Источник базы данных**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
  "name": "Search Knowledge Base",
  "parameters": {
    "description": "Searches the company knowledge base for documentation and answers",
    "source": "database",
    "workflowId": "abc123",
    "specifyInputSchema": true,
    "jsonSchemaExample": "{\"query\": \"search term\"}"
  }
}
```

✅ **ПРАВИЛЬНО – Источник параметра**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
  "name": "Process Order",
  "parameters": {
    "description": "Processes a customer order and returns confirmation",
    "source": "parameter",
    "workflowJson": {
      "nodes": [
        {
          "type": "n8n-nodes-base.executeWorkflowTrigger",
          "name": "Execute Workflow Trigger"
        }
      ]
    }
  }
}
```

❌ **НЕПРАВИЛЬНО – отсутствует идентификатор рабочего процесса**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
  "parameters": {
    "description": "Search KB",
    "source": "database"
    // Missing workflowId!
  }
}
```

❌ **НЕПРАВИЛЬНО: отсутствует триггер выполнения рабочего процесса**:
```json
{
  "parameters": {
    "source": "parameter",
    "workflowJson": {
      "nodes": [
        {
          "type": "n8n-nodes-base.httpRequest"  // Wrong! Should be executeWorkflowTrigger
        }
      ]
    }
  }
}
```

### 5. Инструменты поиска (SerpApi, Wikipedia, SearXNG, WolframAlpha)

#### 5а. Инструмент SerpApi (`toolSerpApi`)

**Цель**: выполняет поиск в Google через службу SerpApi, возвращая результаты веб-поиска агенту ИИ. Обеспечивает доступ к текущей веб-информации и результатам поиска.

**Параметры конфигурации**:
- `description` (строка, НЕОБЯЗАТЕЛЬНО): пользовательское описание того, когда использовать поиск Google.
- Учетные данные: ключ API SerpApi (ОБЯЗАТЕЛЬНО)

**Как работает инструмент SerpApi**:
LLM предоставляет поисковый запрос. Инструмент использует SerpApi для выполнения поиска в Google и возвращает релевантные результаты поиска, включая заголовки, фрагменты и URL-адреса.

**Примеры использования**:
- Поиск текущей информации, отсутствующей в данных обучения LLM.
- Веб-исследования и проверка фактов.
- Поиск конкретных веб-сайтов или ресурсов.
- Новости и актуальные темы

**Критические требования**:
1. ДОЛЖНЫ быть настроены действительные учетные данные SerpApi.
2. Требуется активная подписка SerpApi с доступными кредитами.
3. Рекомендуется использовать собственное описание, чтобы отличать его от других инструментов поиска.

**Логика проверки**:
```typescript
function validateSerpApiTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check credentials (REQUIRED)
  if (!node.credentials || !node.credentials.serpApi) {
    issues.push({
      severity: 'error',
      message: `SerpApi Tool "${node.name}" requires SerpApi credentials. Configure your API key.`
    });
  }

  // 2. Check description (RECOMMENDED)
  if (!node.parameters.description) {
    issues.push({
      severity: 'info',
      message: `SerpApi Tool "${node.name}" has no custom description. Add one to explain when to use Google search vs. other search tools.`
    });
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример**:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolSerpApi',
  name: 'Google Search',
  credentials: {
    serpApi: 'serpapi_credentials_id'
  },
  parameters: {
    description: 'Search Google for current news, recent events, and general web information. Use when you need up-to-date information from the internet.'
  }
}
// Valid: Has credentials and helpful description
```

❌ **Неверный пример**:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolSerpApi',
  name: 'Search'
  // ❌ No credentials configured
}
// ERROR: SerpApi Tool requires credentials
```

#### 5б. Инструмент Википедии (`toolWikipedia`)

**Цель**: ищет и извлекает информацию из Википедии, предоставляя агенту ИИ доступ к энциклопедическим знаниям по широкому кругу тем.

**Параметры конфигурации**:
- `description` (строка, НЕОБЯЗАТЕЛЬНО): пользовательское описание того, когда использовать Википедию.
- `language` (строка): код языка Википедии (по умолчанию: «en»)
- `returnType` (строка): «краткое» или «полное» содержание статьи.

**Как работает инструмент Википедии**:
LLM предоставляет тему или поисковый запрос. Инструмент выполняет поиск в Википедии и возвращает содержимое статьи в виде краткого или полного текста.

**Примеры использования**:
- Общие вопросы знаний
- Историческая информация
- Биографии и известные личности
- Научно-технические концепции
- Географическая информация

**Критические требования**:
1. Учетные данные не требуются (публичный API)
2. Лучше всего подходит для фактической, энциклопедической информации.
3. Не идеально подходит для текущих событий (Википедия работает с задержкой)

**Логика проверки**:
```typescript
function validateWikipediaTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check description (RECOMMENDED)
  if (!node.parameters.description) {
    issues.push({
      severity: 'info',
      message: `Wikipedia Tool "${node.name}" has no custom description. Add one to explain when to use Wikipedia vs. other knowledge sources.`
    });
  }

  // 2. Validate language if specified
  if (node.parameters.language) {
    const validLanguageCodes = /^[a-z]{2,3}$/;  // ISO 639 codes
    if (!validLanguageCodes.test(node.parameters.language)) {
      issues.push({
        severity: 'warning',
        message: `Wikipedia Tool "${node.name}" has potentially invalid language code "${node.parameters.language}". Use ISO 639 codes (e.g., "en", "es", "fr").`
      });
    }
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример 1** — английский по умолчанию:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolWikipedia',
  name: 'Wikipedia',
  parameters: {
    description: 'Search Wikipedia for encyclopedic information on historical events, people, places, and concepts. Best for factual, well-established knowledge.'
  }
}
// Valid: Simple configuration with helpful description
```

✅ **Правильный пример 2** — Многоязычный:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolWikipedia',
  name: 'Wikipedia Spanish',
  parameters: {
    description: 'Search Spanish Wikipedia for information in Spanish',
    language: 'es'
  }
}
// Valid: Configured for Spanish Wikipedia
```

#### 5в. Инструмент SearXNG (`toolSearXng`)

**Цель**: поиск с использованием автономной метапоисковой системы SearXNG, обеспечивающей веб-поиск, ориентированный на конфиденциальность, агрегированный из нескольких поисковых систем.

**Параметры конфигурации**:
- `description` (строка, НЕОБЯЗАТЕЛЬНО): пользовательское описание того, когда использовать SearXNG.
– Учетные данные: URL-адрес экземпляра SearXNG и дополнительный ключ API (ОБЯЗАТЕЛЬНО).
- `categories` (массив): Категории поиска (общие, изображения, новости и т. д.)

**Как работает инструмент SearXNG**:
LLM предоставляет поисковый запрос. Инструмент запрашивает ваш экземпляр SearXNG, который объединяет результаты из нескольких поисковых систем (Google, Bing, DuckDuckGo и т. д.) и возвращает объединенные результаты.

**Примеры использования**:
- Веб-поиск, ориентированный на конфиденциальность
- Совокупные результаты из нескольких источников
- Самостоятельная поисковая инфраструктура
- Конфигурация пользовательской поисковой системы.

**Критические требования**:
1. ДОЛЖЕН быть настроен URL-адрес экземпляра SearXNG.
2. Экземпляр должен быть доступен с n8n
3. Дополнительный ключ API, если экземпляр требует аутентификации.
4. Требуется собственный или сторонний экземпляр SearXNG.

**Логика проверки**:
```typescript
function validateSearXngTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check credentials (REQUIRED)
  if (!node.credentials || !node.credentials.searXng) {
    issues.push({
      severity: 'error',
      message: `SearXNG Tool "${node.name}" requires SearXNG instance credentials. Configure your instance URL.`
    });
  }

  // 2. Check description (RECOMMENDED)
  if (!node.parameters.description) {
    issues.push({
      severity: 'info',
      message: `SearXNG Tool "${node.name}" has no custom description. Add one to explain when to use SearXNG vs. other search tools.`
    });
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример**:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolSearXng',
  name: 'Privacy Search',
  credentials: {
    searXng: 'searxng_credentials_id'  // Contains instance URL
  },
  parameters: {
    description: 'Privacy-focused metasearch aggregating results from multiple search engines. Use for general web searches.',
    categories: ['general', 'news']
  }
}
// Valid: Has credentials and configuration
```

❌ **Неверный пример**:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolSearXng',
  name: 'Search'
  // ❌ No credentials configured
}
// ERROR: SearXNG Tool requires instance credentials
```

#### 5д. Инструмент WolframAlpha (`toolWolframAlpha`)

**Цель**: Запросы к системе вычислительных знаний Wolfram|Alpha для математических вычислений, научных данных, статистики и фактических запросов.

**Параметры конфигурации**:
- `description` (строка, НЕОБЯЗАТЕЛЬНО): пользовательское описание того, когда использовать Wolfram|Alpha.
- Учетные данные: ключ API Wolfram|Alpha (ОБЯЗАТЕЛЬНО)

**Как работает инструмент WolframAlpha**:
LLM предоставляет вычислительный или фактический запрос. Инструмент отправляет его в API Wolfram|Alpha и возвращает вычисленные результаты, данные или ответы.

**Примеры использования**:
- Сложные математические вычисления
- Научные расчеты и преобразования
- Запросы статистических данных
- Расчеты по физике, химии, астрономии
- Преобразование единиц измерения
- Фактические данные (население, даты, расстояния и т.д.)

**Критические требования**:
1. ДОЛЖЕН иметь действительный идентификатор приложения Wolfram|Alpha (ключ API).
2. Лучше всего подходит для вычислительных и научных запросов.
3. Не идеален для общего поиска в Интернете или текущих новостей.

**Логика проверки**:
```typescript
function validateWolframAlphaTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check credentials (REQUIRED)
  if (!node.credentials || !node.credentials.wolframAlpha) {
    issues.push({
      severity: 'error',
      message: `WolframAlpha Tool "${node.name}" requires Wolfram|Alpha API credentials. Configure your App ID.`
    });
  }

  // 2. Check description (RECOMMENDED)
  if (!node.parameters.description) {
    issues.push({
      severity: 'info',
      message: `WolframAlpha Tool "${node.name}" has no custom description. Add one to explain when to use Wolfram|Alpha for computational queries.`
    });
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример**:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolWolframAlpha',
  name: 'Wolfram Computation',
  credentials: {
    wolframAlpha: 'wolfram_credentials_id'
  },
  parameters: {
    description: 'Use for complex mathematical calculations, scientific computations, unit conversions, and factual data queries (population, distances, dates). NOT for general web search.'
  }
}
// Valid: Has credentials and clear usage guidance
```

❌ **Неверный пример**:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolWolframAlpha',
  name: 'Calculator'
  // ❌ No credentials configured
}
// ERROR: WolframAlpha Tool requires API credentials
```

### 6. Простые инструменты (калькулятор, мышление)

#### 6а. Калькулятор (`toolCalculator`)

**Цель**: выполняет математические вычисления и арифметические операции. LLM может использовать этот инструмент, когда ему необходимо вычислить точные числовые результаты.

**Параметры конфигурации**:
- `description` (строка, НЕОБЯЗАТЕЛЬНО): пользовательское описание того, когда LLM должен использовать этот калькулятор.

**Как работает калькулятор**:
LLM называет этот инструмент математическими выражениями в виде строк. Инструмент оценивает выражение и возвращает числовой результат. Обрабатывает базовую арифметику, показатели степени и математические функции.

**Примеры использования**:
- Точные арифметические расчеты
- Финансовые расчеты
- Преобразования единиц измерения, требующие математики
- Любая задача, требующая точных числовых результатов

**Критические требования**:
1. Никакой специальной настройки не требуется — работает «из коробки».
2. Не требуется подключение к искусственному интеллекту (автономное)
3. Пользовательское описание необязательно, но может помочь в использовании LLM.

**Логика проверки**:
```typescript
function validateCalculatorTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Calculator is self-contained and requires no configuration
  // Optional: Check for custom description
  if (node.parameters.description) {
    if (node.parameters.description.trim().length < 10) {
      issues.push({
        severity: 'info',
        message: `Calculator Tool "${node.name}" has a very short description. Consider being more specific about when to use it.`
      });
    }
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример 1** — Калькулятор по умолчанию:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolCalculator',
  name: 'Calculator'
}
// Valid: No configuration needed, works with defaults
```

✅ **Правильный пример 2** — Пользовательское описание:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolCalculator',
  name: 'Financial Calculator',
  parameters: {
    description: 'Use for precise financial calculations, tax computations, and percentage calculations. Always use this instead of estimating numbers.'
  }
}
// Valid: Custom description guides LLM on specific use case
```

#### 6б. Инструмент мышления (`toolThink`)

**Цель**: дает ИИ-агенту время подумать, обдумать и спланировать действия, прежде чем предпринимать действия. Агент может «думать вслух», чтобы шаг за шагом решать сложные проблемы.

**Параметры конфигурации**:
- `description` (строка, НЕОБЯЗАТЕЛЬНО): пользовательское описание того, когда LLM должен сделать паузу, чтобы подумать.

**Как работает инструмент Think Tool**:
Когда LLM вызывает этот инструмент, он возвращает содержимое мышления обратно агенту. Это создает цикл обратной связи, в котором агент может анализировать проблемы, рассматривать альтернативы и планировать многоэтапные подходы перед выполнением действий.

**Примеры использования**:
- Решение сложных задач, требующее многоэтапного рассуждения.
- Планирование последовательности действий.
- Рассмотрение компромиссов и альтернатив.
- Разбираем сложные задачи.
- Самокоррекция и проверка.

**Критические требования**:
1. Никакой специальной настройки не требуется.
2. Не требуется подключение к искусственному интеллекту (автономное)
3. Наиболее полезен, когда агент сталкивается со сложными, многоэтапными проблемами.

**Логика проверки**:
```typescript
function validateThinkTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Think tool is self-contained and requires no configuration
  // Optional: Check for custom description
  if (node.parameters.description) {
    if (node.parameters.description.trim().length < 15) {
      issues.push({
        severity: 'info',
        message: `Think Tool "${node.name}" has a very short description. Explain when the agent should use thinking vs. action.`
      });
    }
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример 1** — Инструмент анализа по умолчанию:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolThink',
  name: 'Think'
}
// Valid: No configuration needed, works with defaults
```

✅ **Правильный пример 2** — Специальное описание для сложных рассуждений:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolThink',
  name: 'Strategic Planner',
  parameters: {
    description: 'Use this tool when you need to plan a complex multi-step approach, consider trade-offs between options, or validate your reasoning before taking action. Think through edge cases and potential failures.'
  }
}
// Valid: Detailed description guides agent on when to think vs. act
```

✅ **Правильный пример 3** — Фокус на решении проблем:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.toolThink',
  name: 'Reasoning Tool',
  parameters: {
    description: 'Break down complex problems into steps, identify what information is missing, and plan your approach before using other tools'
  }
}
// Valid: Focuses agent on structured problem-solving
```

### 7. Инструмент AI Agent (`agentTool`)

**Цель**: Создает вложенный ИИ-агент, который действует как инструмент для родительского ИИ-агента. Обеспечивает создание сложных иерархий агентов, в которых специализированные субагенты выполняют определенные задачи, каждый из которых имеет свою собственную модель, инструменты и возможности.

**Параметры конфигурации**:
- `name` (строка, ОБЯЗАТЕЛЬНО): имя инструмента, который родительский агент использует для вызова этого субагента.
- `description` (строка, ОБЯЗАТЕЛЬНО): поясняет возможности субагента и указывает, когда родительский агент должен его использовать.
- `promptType` (строка): "auto" или "define" - как формировать подсказки для этого субагента
- `text` (строка): пользовательское системное приглашение (когда PromptType="define")
- `systemMessage` (строка): системное сообщение, определяющее роль субагента.
- `maxIterations` (число): максимальное количество итераций вызова инструмента (по умолчанию: 10).
- `returnIntermediateSteps` (логическое значение): вернуть родительскому элементу действия субагента.

**Как работает инструмент AI Agent**:
Родительский ИИ-агент может вызывать этот субагент в качестве инструмента. Субагент имеет собственную языковую модель, инструменты и конфигурацию. Он обрабатывает запрос независимо и возвращает результаты родителю. Это создает иерархическую архитектуру агентов.

**Примеры использования**:
- Специализированные эксперты (например, субагент «Эксперт по SQL-запросам» с инструментами базы данных)
- Сложные многоэтапные рабочие процессы (например, «Помощник по исследованиям», использующий поиск + обобщение)
- Обработка, специфичная для предметной области (например, «Агент финансового анализа» с инструментами расчета)

**Критические требования**:
1. ДОЛЖНО иметь ровно 1 соединение `ai_languageModel` (модель субагента)
2. `name` и `description` ТРЕБУЮТСЯ для правильного вызова родительского агента.
3. Может иметь собственные соединения `ai_tool` (набор инструментов субагента)
4. Может иметь соединение `ai_memory` (память субагента)
5. Должен иметь четкое системное сообщение, определяющее специализированную роль субагента.

**Архитектура подключения**:
```
[Language Model] --ai_languageModel--> [AI Agent Tool] --ai_tool--> [Parent AI Agent]
[Tool 1]         --ai_tool-----------> [AI Agent Tool]
[Tool 2]         --ai_tool-----------> [AI Agent Tool]
```

**Логика проверки**:
```typescript
function validateAIAgentTool(
  node: WorkflowNode,
  reverseConnections: Map<string, Connection[]>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // This is an AI Agent packaged as a tool
  // It has the same requirements as a regular AI Agent

  // 1. Check ai_languageModel connection (REQUIRED, exactly 1)
  const incoming = reverseConnections.get(node.name) || [];
  const languageModelConn = incoming.filter(c => c.type === 'ai_languageModel');

  if (languageModelConn.length === 0) {
    issues.push({
      severity: 'error',
      message: `AI Agent Tool "${node.name}" requires an ai_languageModel connection. Connect a language model node.`
    });
  } else if (languageModelConn.length > 1) {
    issues.push({
      severity: 'error',
      message: `AI Agent Tool "${node.name}" has ${languageModelConn.length} ai_languageModel connections. AI Agent Tool only supports 1 language model (no fallback).`
    });
  }

  // 2. Check tool name (REQUIRED)
  if (!node.parameters.name) {
    issues.push({
      severity: 'error',
      message: `AI Agent Tool "${node.name}" has no tool name. Add a name so the parent agent can invoke this sub-agent.`
    });
  }

  // 3. Check description (REQUIRED)
  if (!node.parameters.description) {
    issues.push({
      severity: 'error',
      message: `AI Agent Tool "${node.name}" has no description. Add one to help the parent agent know when to use this sub-agent.`
    });
  } else if (node.parameters.description.trim().length < 20) {
    issues.push({
      severity: 'warning',
      message: `AI Agent Tool "${node.name}" description is too short. Explain the sub-agent's specific expertise and capabilities.`
    });
  }

  // 4. Check system message (RECOMMENDED)
  if (!node.parameters.systemMessage && node.parameters.promptType !== 'define') {
    issues.push({
      severity: 'warning',
      message: `AI Agent Tool "${node.name}" has no systemMessage. Add one to define the sub-agent's specialized role and constraints.`
    });
  }

  // 5. Validate promptType configuration
  if (node.parameters.promptType === 'define') {
    if (!node.parameters.text || node.parameters.text.trim() === '') {
      issues.push({
        severity: 'error',
        message: `AI Agent Tool "${node.name}" has promptType="define" but no text field. Provide the custom prompt.`
      });
    }
  }

  // 6. Check if sub-agent has its own tools
  const toolConnections = incoming.filter(c => c.type === 'ai_tool');
  if (toolConnections.length === 0) {
    issues.push({
      severity: 'info',
      message: `AI Agent Tool "${node.name}" has no ai_tool connections. Consider giving the sub-agent tools to enhance its capabilities.`
    });
  }

  // 7. Validate maxIterations if specified
  if (node.parameters.maxIterations !== undefined) {
    if (typeof node.parameters.maxIterations !== 'number' || node.parameters.maxIterations < 1) {
      issues.push({
        severity: 'error',
        message: `AI Agent Tool "${node.name}" has invalid maxIterations. Must be a positive number.`
      });
    }
  }

  return issues;
}
```

**Примеры проверки**:

✅ **Правильный пример 1** — Специализированный субагент SQL-эксперта:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.agentTool',
  name: 'SQL Expert',
  parameters: {
    name: 'sql_expert',
    description: 'Expert SQL analyst that can query databases, analyze data patterns, and generate complex queries. Use when you need database insights or data analysis.',
    systemMessage: 'You are a SQL expert. Generate optimized SQL queries and explain query plans. Always validate input before querying.',
    maxIterations: 5
  }
}
// Connected to:
// - OpenAI Chat Model (with ai_languageModel connection)
// - Postgres Tool (with ai_tool connection)
// - Code Tool for data analysis (with ai_tool connection)
// Valid: Has model, name, description, tools, specialized system message
```

✅ **Правильный пример 2** — Субагент-ассистент по исследованиям:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.agentTool',
  name: 'Research Assistant',
  parameters: {
    name: 'research_assistant',
    description: 'Specialized research agent that searches the web, analyzes sources, and synthesizes information. Use for fact-finding and research tasks.',
    systemMessage: 'You are a research assistant. Search multiple sources, verify information, cite sources, and provide comprehensive summaries.',
    returnIntermediateSteps: true
  }
}
// Connected to:
// - Anthropic Chat Model (with ai_languageModel connection)
// - SerpApi Tool (with ai_tool connection)
// - Wikipedia Tool (with ai_tool connection)
// - Vector Store Tool (with ai_tool connection)
// Valid: Multi-tool sub-agent with clear specialization
```

✅ **Правильный пример 3** — Минимальный субагент:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.agentTool',
  name: 'Calculator Agent',
  parameters: {
    name: 'calculator',
    description: 'Simple calculator agent for basic arithmetic operations',
    systemMessage: 'You are a calculator. Perform accurate arithmetic calculations.'
  }
}
// Connected to:
// - OpenAI Chat Model (with ai_languageModel connection)
// - Calculator Tool (with ai_tool connection)
// Valid: Simple but complete configuration
// INFO will suggest adding more tools
```

❌ **Неверный пример 1** – Отсутствует языковая модель:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.agentTool',
  name: 'Helper Agent',
  parameters: {
    name: 'helper',
    description: 'Helps with tasks'
  }
}
// ❌ No ai_languageModel connection
// ERROR: AI Agent Tool requires an ai_languageModel connection
```

❌ **Неверный пример 2** – отсутствуют обязательные поля:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.agentTool',
  name: 'Agent Tool',
  parameters: {
    // ❌ No name property
    description: 'Agent'  // ❌ Description too short
  }
}
// ERROR: No tool name
// WARNING: Description too short (explain sub-agent's expertise)
```

❌ **Неверный пример 3** – Несколько языковых моделей:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.agentTool',
  name: 'Dual Model Agent',
  parameters: {
    name: 'dual_agent',
    description: 'Agent with fallback model support'
  }
}
// Connected to:
// - OpenAI Chat Model (with ai_languageModel connection)
// - Anthropic Chat Model (with ai_languageModel connection)  // ❌ Second model
// ERROR: AI Agent Tool has 2 ai_languageModel connections. Only 1 allowed (no fallback support)
```

❌ **Неправильный пример 4** — Неверная конфигурация PromptType:
```typescript
{
  type: '@n8n/n8n-nodes-langchain.agentTool',
  name: 'Custom Agent',
  parameters: {
    name: 'custom',
    description: 'Custom agent with specific prompt',
    promptType: 'define',
    // ❌ No text field when using define mode
  }
}
// ERROR: promptType="define" requires text field with custom prompt
```

### 8. Клиентский инструмент MCP (`mcpClientTool`)

**Цель**: подключается к серверам протокола контекста модели (MCP) для доступа к внешним инструментам и ресурсам, позволяя агентам ИИ использовать инструменты, совместимые с MCP.

**Параметры конфигурации**:
- `mcpServer`: конфигурация подключения к серверу MCP (ОБЯЗАТЕЛЬНО)
- Можно ссылаться на существующий сервер или определять новый
- `tool`: специальный инструмент MCP для использования с сервера (ОБЯЗАТЕЛЬНО)
- `description`: описание инструмента для LLM (ОБЯЗАТЕЛЬНО)
- `toolParameters`: параметры, специфичные для инструмента.
- `useCustomInputSchema`: переопределить схему ввода инструмента.

**Конфигурация сервера MCP**:
- `transport`: "stdio" или "sse" (события, отправленные сервером)
- `command`: исполняемая команда (для stdio)
- `args`: аргументы команды (для stdio)
- `url`: URL-адрес сервера (для SSE).
- `env`: переменные среды.

**Критические требования**:
1. Сервер MCP должен быть правильно настроен и доступен.
2. Выбранный инструмент должен существовать на сервере MCP.
3. Параметры инструмента должны соответствовать входной схеме инструмента.

```typescript
function validateMCPClientTool(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check description (REQUIRED for LLM to understand tool)
  if (!node.parameters.description) {
    issues.push({
      severity: 'error',
      message: `MCP Client Tool "${node.name}" has no description. Add a clear description to help the LLM know when to use this MCP tool.`
    });
  }

  // 2. Check MCP server is configured (REQUIRED)
  if (!node.parameters.mcpServer) {
    issues.push({
      severity: 'error',
      message: `MCP Client Tool "${node.name}" has no MCP server configured. Select or configure an MCP server connection.`
    });
    return issues;  // Can't continue without server
  }

  // 3. Validate MCP server configuration
  const mcpServer = node.parameters.mcpServer;

  if (typeof mcpServer === 'object') {
    // Inline server configuration
    if (!mcpServer.transport) {
      issues.push({
        severity: 'error',
        message: `MCP Client Tool "${node.name}" has MCP server with no transport specified. Set transport to "stdio" or "sse".`
      });
    } else if (mcpServer.transport === 'stdio') {
      // Stdio transport requires command
      if (!mcpServer.command) {
        issues.push({
          severity: 'error',
          message: `MCP Client Tool "${node.name}" uses stdio transport but has no command specified. Provide the executable command.`
        });
      }
    } else if (mcpServer.transport === 'sse') {
      // SSE transport requires URL
      if (!mcpServer.url) {
        issues.push({
          severity: 'error',
          message: `MCP Client Tool "${node.name}" uses SSE transport but has no URL specified. Provide the server URL.`
        });
      } else {
        // Validate URL format
        try {
          new URL(mcpServer.url);
        } catch (e) {
          issues.push({
            severity: 'error',
            message: `MCP Client Tool "${node.name}" has invalid server URL: ${mcpServer.url}`
          });
        }
      }
    } else {
      issues.push({
        severity: 'error',
        message: `MCP Client Tool "${node.name}" has invalid transport "${mcpServer.transport}". Must be "stdio" or "sse".`
      });
    }
  }

  // 4. Check tool is selected (REQUIRED)
  if (!node.parameters.tool) {
    issues.push({
      severity: 'error',
      message: `MCP Client Tool "${node.name}" has no tool selected. Select which MCP tool to use from the server.`
    });
  }

  // 5. Validate tool parameters if specified
  if (node.parameters.toolParameters) {
    try {
      // Check if toolParameters is valid JSON
      if (typeof node.parameters.toolParameters === 'string') {
        JSON.parse(node.parameters.toolParameters);
      }
    } catch (e) {
      issues.push({
        severity: 'error',
        message: `MCP Client Tool "${node.name}" has invalid toolParameters. Must be valid JSON.`
      });
    }
  }

  // 6. Validate custom input schema if specified
  if (node.parameters.useCustomInputSchema) {
    if (!node.parameters.inputSchema) {
      issues.push({
        severity: 'error',
        message: `MCP Client Tool "${node.name}" has useCustomInputSchema=true but no inputSchema provided.`
      });
    } else {
      try {
        const schema = typeof node.parameters.inputSchema === 'string'
          ? JSON.parse(node.parameters.inputSchema)
          : node.parameters.inputSchema;

        if (!schema.type || !schema.properties) {
          issues.push({
            severity: 'warning',
            message: `MCP Client Tool "${node.name}" input schema should have 'type' and 'properties' fields for proper validation.`
          });
        }
      } catch (e) {
        issues.push({
          severity: 'error',
          message: `MCP Client Tool "${node.name}" has invalid inputSchema. Must be valid JSON Schema.`
        });
      }
    }
  }

  // 7. Recommend server name for better management
  if (typeof mcpServer === 'object' && !mcpServer.name) {
    issues.push({
      severity: 'info',
      message: `MCP Client Tool "${node.name}" MCP server has no name. Add a name for better server management and debugging.`
    });
  }

  return issues;
}
```

**Примеры проверки**:

✅ **ПРАВИЛЬНО — Stdio Transport**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.mcpClientTool",
  "name": "Filesystem Access",
  "parameters": {
    "description": "Access filesystem to read and write files",
    "mcpServer": {
      "name": "filesystem-server",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
      "env": {}
    },
    "tool": "read_file"
  }
}
```

✅ **ПРАВИЛЬНО – SSE Transport**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.mcpClientTool",
  "name": "Remote API Access",
  "parameters": {
    "description": "Access remote API through MCP server",
    "mcpServer": {
      "name": "api-server",
      "transport": "sse",
      "url": "https://mcp.example.com/api"
    },
    "tool": "fetch_data",
    "toolParameters": "{\"endpoint\": \"/users\"}"
  }
}
```

✅ **ПРАВИЛЬНО — с пользовательской схемой ввода**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.mcpClientTool",
  "parameters": {
    "description": "Search database with custom validation",
    "mcpServer": "server-ref-123",
    "tool": "search",
    "useCustomInputSchema": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {"type": "string"},
        "limit": {"type": "number", "maximum": 100}
      },
      "required": ["query"]
    }
  }
}
```

❌ **НЕПРАВИЛЬНО – отсутствует сервер MCP**:
```json
{
  "type": "@n8n/n8n-nodes-langchain.mcpClientTool",
  "parameters": {
    "description": "Access files",
    "tool": "read_file"
    // Missing mcpServer!
  }
}
```

❌ **НЕПРАВИЛЬНО — Stdio без команды**:
```json
{
  "parameters": {
    "mcpServer": {
      "transport": "stdio"
      // Missing command!
    },
    "tool": "read_file"
  }
}
```

❌ **НЕПРАВИЛЬНО – SSE без URL**:
```json
{
  "parameters": {
    "mcpServer": {
      "transport": "sse"
      // Missing url!
    },
    "tool": "fetch_data"
  }
}
```

❌ **НЕПРАВИЛЬНО: не выбран инструмент**:
```json
{
  "parameters": {
    "description": "Access MCP server",
    "mcpServer": {
      "transport": "stdio",
      "command": "mcp-server"
    }
    // Missing tool selection!
  }
}
```

**Общие конфигурации сервера MCP**:

**Сервер файловой системы**:
```json
{
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
}
```

**Сервер GitHub**:
```json
{
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "{{ $credentials.githubToken }}"
  }
}
```

**Сервер PostgreSQL**:
```json
{
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."]
}
```

**Сервер Кукловода**:
```json
{
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
}
```

**Удаленный сервер SSE**:
```json
{
  "transport": "sse",
  "url": "https://your-mcp-server.com/sse"
}
```

## Полная функция проверки инструмента

```typescript
function validateAllToolNodes(
  workflow: WorkflowJson,
  reverseConnections: Map<string, Connection[]>,
  result: WorkflowValidationResult
): void {
  for (const node of workflow.nodes) {
    const normalizedType = NodeTypeNormalizer.normalizeToFullForm(node.type);

    let issues: ValidationIssue[] = [];

    switch (normalizedType) {
      case '@n8n/n8n-nodes-langchain.toolHttpRequest':
        issues = validateHTTPRequestTool(node);
        break;

      case '@n8n/n8n-nodes-langchain.toolCode':
        issues = validateCodeTool(node);
        break;

      case '@n8n/n8n-nodes-langchain.toolVectorStore':
        issues = validateVectorStoreTool(node, reverseConnections, workflow);
        break;

      case '@n8n/n8n-nodes-langchain.toolWorkflow':
        issues = validateWorkflowTool(node);
        break;

      case '@n8n/n8n-nodes-langchain.toolSerpApi':
      case '@n8n/n8n-nodes-langchain.toolWikipedia':
      case '@n8n/n8n-nodes-langchain.toolSearXng':
      case '@n8n/n8n-nodes-langchain.toolWolframAlpha':
        issues = validateSearchTool(node);
        break;

      case '@n8n/n8n-nodes-langchain.agentTool':
        issues = validateAIAgentTool(node, reverseConnections);
        break;

      case '@n8n/n8n-nodes-langchain.mcpClientTool':
        issues = validateMCPClientTool(node);
        break;

      case '@n8n/n8n-nodes-langchain.toolCalculator':
      case '@n8n/n8n-nodes-langchain.toolThink':
        issues = validateSimpleTool(node);
        break;
    }

    // Add issues to result
    for (const issue of issues) {
      if (issue.severity === 'error') {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: issue.message
        });
      } else if (issue.severity === 'warning') {
        result.warnings.push({
          type: 'warning',
          nodeId: node.id,
          nodeName: node.name,
          message: issue.message
        });
      }
      // Skip 'info' level issues for now
    }

    // Generic check: Tool should be connected to AI Agent
    if (normalizedType.startsWith('@n8n/n8n-nodes-langchain.tool')) {
      const outgoing = workflow.connections[node.name];
      if (!outgoing?.ai_tool || outgoing.ai_tool.flat().filter(c => c).length === 0) {
        result.warnings.push({
          type: 'warning',
          nodeId: node.id,
          nodeName: node.name,
          message: `Tool node "${node.name}" is not connected to any AI Agent via ai_tool output.`
        });
      }
    }
  }
}
```

## Резюме: покрытие проверки

✅ **Полное покрытие**:
- AI Agent (необходимые соединения, режим потоковой передачи, тип запроса)
- Базовая цепочка LLM (обязательные соединения, запрещенные соединения)
- Триггер чата (режим ответа, нисходящая совместимость)
- Все 13 подузлов инструментов ИИ с особыми правилами проверки.

✅ **Контроль направления соединения**:
- Обратное сопоставление соединений для проверки входящих соединений.
— Правильная проверка ai_languageModel, ai_memory, ai_tool и т. д.

✅ **Правила для конкретных инструментов**:
- Инструмент HTTP-запросов: проверка заполнителя.
- Инструмент кода: проверка имени функции и схемы.
- Инструмент Vector Store: полная проверка цепочки (Инструмент → VectorStore → Встраивание)
- Инструмент рабочего процесса: наличие подпроцесса
- Инструменты поиска: проверка учетных данных.
- Инструмент AI Agent: проверка вложенного агента.
- Клиентский инструмент MCP: проверка конфигурации сервера.

## Сводка покрытия базы данных

### Что у нас в базе ✅

1. **Подузлы универсальных инструментов искусственного интеллекта** (13 узлов)
- HTTP-запрос инструмента, код инструмента, рабочий процесс инструмента, хранилище векторов инструментов.
- Калькулятор инструментов, Википедия инструментов, SerpAPI инструментов, Инструмент SearXNG
- Инструмент WolframAlpha, Инструмент Think
- Инструмент AI Agent, клиентский инструмент MCP, исполнитель инструмента

2. **Все компоненты AI** (21 узел из @n8n/n8n-nodes-langchain)
- AI-агент, базовая сеть LLM
- Все узлы LLM (OpenAI, Anthropic, Google Gemini, Cohere и т. д.)
- Все узлы внедрения (OpenAI, Azure, Cohere, HuggingFace)
- Все узлы цепочки (цепочка контроля качества, цепочка обобщения)
- Узлы памяти, узлы векторного хранилища, загрузчики документов и т. д.

3. **Все обычные узлы можно использовать в качестве инструментов** (248 узлов из базы n8n-nodes-base)
- Полный доступ к метаданным узла (тип, свойства, операции, учетные данные)
- Может проверять: Airtable, Slack, HTTP-запрос, Google Sheets, MySQL, PostgreSQL и т. д.
- Можно проверить: необходимые параметры, учетные данные, режимы работы.

### Возможности проверки по типу узла

| Категория узла | Граф | Уровень проверки |
|---------------|-------|------------------|
| **Специальные инструментальные узлы** | 13 | ⭐⭐⭐ **Специально** (индивидуальная проверка для каждого инструмента) |
| **Агент ИИ и сети** | 5 | ⭐⭐⭐ **Специальный** (принудительный тип подключения) |
| **LLM и узлы внедрения** | 16 | ⭐⭐ **Средний** (общая проверка компонентов ИИ) |
| **Обычные узлы как инструменты** | 248 | ⭐⭐ **Средний** (универсальная проверка инструмента + конфигурация узла) |

### Что мы можем проверить

✅ **Архитектура подключения**:
- Все 8 типов подключения AI (ai_languageModel, ai_memory, ai_tool и т. д.)
- Применение направления соединения (поток соединений к агенту AI)
- Обратное сопоставление соединений
- Ограничения режима потоковой передачи

✅ **Узлы специализированных инструментов** (13 узлов с особыми правилами):
- Инструмент HTTP-запросов: проверка заполнителя.
- Инструмент кода: имя функции, проверка входной схемы.
- Инструмент векторного хранилища: полная проверка цепочки (vectorStore → встраивание)
- Инструмент рабочего процесса: проверка ссылок на подпроцессы.
- Инструменты поиска: проверка учетных данных.
- Все остальные с соответствующими правилами

✅ **Обычные узлы как инструменты** (248 узлов):
- Поиск типа узла из базы данных
- Проверка свойств с использованием схемы узла.
- Проверка требований к учетным данным
- Проверка режима работы/ресурса
- Рекомендации по описанию инструмента

✅ **Рабочие процессы AI-агента**:
- Требуется подключение ai_languageModel.
- Дополнительные соединения ai_memory, ai_tool, ai_outputParser
- Интеграция триггера чата (режим потоковой передачи, тип приглашения)
- Подключение инструмента и описания

✅ **Основные рабочие процессы цепочки LLM**:
- Требуется подключение ai_languageModel.
- Запрещены соединения ai_memory и ai_tool.
- Дополнительное соединение ai_outputParser

### Приоритет реализации

**Этап 1: Основная инфраструктура** ✅
- [x] Документирование полной экосистемы инструментов искусственного интеллекта (269 узлов).
- [ ] Обновление интерфейса `WorkflowConnection` для всех типов подключения AI.
- [ ] Реализовать утилиту `buildReverseConnectionMap()`
- [] Добавлены вспомогательные функции для проверки типа узла.

**Этап 2: AI-агент и проверка цепочки** (КРИТИЧЕСКИ)
- [ ] Реализуйте `validateAIAgent()` с помощью:
- Требуется проверка ai_languageModel
- Проверка режима потоковой передачи
- Подсказка совместимости типов
- Проверка подключения инструмента
- [ ] Реализуйте `validateBasicLLMChain()` с помощью:
- Требуется проверка ai_languageModel
- Запрещенные проверки соединения
- [ ] Реализуйте `validateChatTrigger()` с помощью:
- Совместимость режима ответа
- Проверка нисходящего узла

**Этап 3: Проверка специального инструмента** (ВЫСОКИЙ ПРИОРИТЕТ)
- [ ] Реализовать `validateHTTPRequestTool()` с проверкой заполнителей
- [ ] Реализовать `validateCodeTool()` с проверкой схемы.
- [ ] Реализовать `validateVectorStoreTool()` с проверкой цепочки.
- [ ] Реализовать `validateWorkflowTool()` с проверкой ссылок
- [ ] Внедрить `validateSearchTool()` с проверкой учетных данных.
- [ ] Внедрить оставшиеся валидаторы для конкретных инструментов.

**Этап 4: Общая проверка инструмента** (СРЕДНИЙ ПРИОРИТЕТ)
- [] Реализовать универсальный валидатор подключения инструмента.
- [ ] Проверка описаний инструментов (toolDescription или поле описания)
- [] Проверьте учетные данные, настроенные для обычных узлов, используемых в качестве инструментов.
- [] Проверка параметров узла с использованием схемы базы данных.

**Этап 5: Тестирование и документирование**
- [] Написание модульных тестов для каждой функции проверки.
- [ ] Написание интеграционных тестов с использованием реальных шаблонов рабочих процессов (2985, 3680, 5296).
- [ ] Протестируйте все 13 специализированных узлов инструментов.
- [] Тестирование с использованием образцов обычных узлов в качестве инструментов (Slack, HTTP Request, Airtable).
- [ ] Обновление документации по проверке
- [] Добавлены примеры инструментов MCP для проверки достоверности.

## Контрольный список реализации

### Основная инфраструктура ✅
- [ ] Обновление интерфейса `WorkflowConnection` для всех типов подключения AI.
- [ ] Реализовать утилиту `buildReverseConnectionMap()`
- [] Добавлены вспомогательные функции для проверки типа узла.

### Проверка агента искусственного интеллекта (улучшенная за счет глубокого понимания) 🎯
- [ ] Реализуйте `validateAIAgent()` с помощью:
- [x] **Проверка типа запроса** (автоматическое или определение)
- [x] Проверка **Требования к текстовому полю** (когда PromptType='define')
- [x] **Проверка соединения языковой модели** (1 или 2 в зависимости от потребностейFallback)
- [x] **Проверка резервной модели** (требуется флаг Fallback + 2 соединения LLM)
- [x] **Проверка парсера вывода** (флаг hasOutputParser + соединение ai_outputParser)
- [x] **Рекомендации по системным сообщениям** (предупреждать при отсутствии)
- [x] **Проверка maxIterations** (предупреждать, если > 20)
- [x] **Проверка совместимости версий** (требуетсяFallback, требуется версия 2.1+)
- [x] **Проверка режима потоковой передачи** (Chat Trigger responseMode='streaming' → нет основного вывода)
- [ ] Проверка подключения к памяти (0-1 ai_memory)
- [ ] Проверка подключения инструмента (0-N ai_tool)

### Другая проверка узла AI
- [ ] Реализовать `validateBasicLLMChain()`
- [ ] Реализовать `validateChatTrigger()`
- [ ] Реализовать `validateAllToolNodes()` со всеми 13 дополнительными проверками.
- [] Внедрить общий регулярный узел в качестве проверки инструмента (248 узлов).

### Интеграция
- [ ] Добавлены вызовы проверки в основной метод `validateWorkflow()`.
- [] Использование базы данных для проверки схемы узла (всего 269 узлов)

### Тестирование
- [] Написание модульных тестов для каждой функции проверки.
- [ ] Написание интеграционных тестов с использованием реальных шаблонов рабочих процессов (2985, 3680, 5296).

### Документация
- [x] **Полный глубокий анализ архитектуры AI Agent**
- [x] **Построение подсказки документа (автоматическое или определение)**
- [x] **Шаблоны сообщений системы документирования и лучшие практики**
- [x] **Функция резервных моделей документов**
- [x] **Интеграция парсера вывода документов**
- [x] **Документируйте дополнительные параметры (maxIterations, returnIntermediateSteps и т. д.)**
- [x] **Различия версий документа (1.x и 2.1+)**
- [x] **Предоставьте примеры реальных конфигураций**
- [x] **Укажите улучшения ответа инструмента MCP**
- [] Обновление реализаций инструмента MCP для возврата расширенной информации.

## Ключевые идеи для реализации

### 1. AI-агент — это НЕ простой узел
Узел AI Agent — самый сложный узел в n8n:
- **2 режима подсказок** (автоматический из триггера чата или определяемый пользователем)
- **Требования к динамическому соединению** (1–2 LLM на основе резервной настройки)
- **Критическое системное сообщение**, определяющее все поведение
- **Множество дополнительных улучшений** (память, инструменты, анализаторы вывода)
- **Функции, специфичные для версии** (резервный вариант, анализатор вывода в версии 2.1+)
- **Ограничения режима потоковой передачи** (нет основного вывода при потоковой передаче Chat Trigger)

### 2. Проверка должна быть контекстно-зависимой
Правила проверки меняются в зависимости от:
- Настройка `promptType` → влияет на требования к текстовому полю.
- Флаг `needsFallback` → влияет на требование количества подключений LLM.
- флаг `hasOutputParser` → влияет на требование подключения выходного парсера
- `typeVersion` → влияет на доступные функции
- `responseMode` восходящего чат-триггера → влияет на правила нисходящего соединения.

### 3. Системное сообщение — самое важное поле
- Определяет роль, возможности и ограничения агента.
- Контролирует поведение использования инструмента.
- Определяет требования к выходному формату
- Должна быть проверена на полноту (предупреждать в случае отсутствия)
- Реальные шаблоны отображают подробные структурированные системные сообщения.

### 4. Резервные модели критически важны для производства
- Автоматическое переключение при отказе для надежности
- Снижение лимита ставок
- Стратегии оптимизации затрат
- Необходимо проверить 2 соединения LLM, если они включены.

### 5. Синтаксические анализаторы вывода обеспечивают соблюдение структуры
- Проверка схемы JSON/XML
- Требуется для извлечения структурированных данных.
- Системное сообщение должно определять формат, его обеспечивает синтаксический анализатор.
- Необходимо проверять соединение, когда установлен флаг.

### 6. Инструменты MCP нуждаются в улучшении
Текущие инструменты MCP должны вернуть:
- **Подробные сведения о конфигурации** (автоматический или определяющий режимы)
- **Важность системных сообщений и рекомендации**
- **Документация по функциям резервной модели**
- **Шаблоны интеграции выходного парсера**
- **Матрица требований к подключению**
- **Распространенные ошибки конфигурации**
- **Примеры реального использования из шаблонов**

## Реализация псевдокода

### Основная утилита: построение карты обратного соединения

```typescript
/**
 * Builds a reverse connection map to find what connects TO each node
 * This is CRITICAL for validating AI nodes since connections flow TO them
 */
function buildReverseConnectionMap(workflow: WorkflowJson): Map<string, ReverseConnection[]> {
  const map = new Map<string, ReverseConnection[]>();

  for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
    const sourceNode = workflow.nodes.find(n => n.name === sourceName);
    const sourceType = sourceNode ? NodeTypeNormalizer.normalizeToFullForm(sourceNode.type) : '';

    // Iterate through all connection types (main, error, ai_*)
    for (const [outputType, connections] of Object.entries(outputs)) {
      if (!Array.isArray(connections)) continue;

      for (const connArray of connections) {
        if (!Array.isArray(connArray)) continue;

        for (const conn of connArray) {
          if (!conn) continue;

          // Add to reverse map
          if (!map.has(conn.node)) {
            map.set(conn.node, []);
          }
          map.get(conn.node)!.push({
            sourceName,
            sourceType,
            type: outputType,
            index: conn.index
          });
        }
      }
    }
  }

  return map;
}

interface ReverseConnection {
  sourceName: string;
  sourceType: string;
  type: string;  // 'main', 'ai_languageModel', 'ai_tool', etc.
  index: number;
}
```

### Основной поток проверки

```typescript
/**
 * Main entry point for AI node validation
 */
function validateAINodes(
  workflow: WorkflowJson,
  result: WorkflowValidationResult
): void {
  // Build reverse connection map
  const reverseConnections = buildReverseConnectionMap(workflow);

  for (const node of workflow.nodes) {
    if (node.disabled || isStickyNote(node)) continue;

    const normalizedType = NodeTypeNormalizer.normalizeToFullForm(node.type);

    // Route to appropriate validator
    if (normalizedType === '@n8n/n8n-nodes-langchain.agent') {
      validateAIAgent(node, reverseConnections, workflow, result);
    } else if (normalizedType === '@n8n/n8n-nodes-langchain.chainLlm') {
      validateBasicLLMChain(node, reverseConnections, result);
    } else if (normalizedType === '@n8n/n8n-nodes-langchain.chatTrigger') {
      validateChatTrigger(node, workflow, result);
    } else if (isToolNode(normalizedType)) {
      validateToolNode(node, reverseConnections, workflow, result);
    }
  }
}

function isToolNode(nodeType: string): boolean {
  const toolNodeTypes = [
    '@n8n/n8n-nodes-langchain.toolHttpRequest',
    '@n8n/n8n-nodes-langchain.toolCode',
    '@n8n/n8n-nodes-langchain.toolWorkflow',
    '@n8n/n8n-nodes-langchain.toolVectorStore',
    '@n8n/n8n-nodes-langchain.toolCalculator',
    '@n8n/n8n-nodes-langchain.toolWikipedia',
    '@n8n/n8n-nodes-langchain.toolSerpApi',
    '@n8n/n8n-nodes-langchain.toolSearXng',
    '@n8n/n8n-nodes-langchain.toolWolframAlpha',
    '@n8n/n8n-nodes-langchain.toolThink',
    '@n8n/n8n-nodes-langchain.agentTool',
    '@n8n/n8n-nodes-langchain.mcpClientTool',
    '@n8n/n8n-nodes-langchain.toolExecutor'
  ];
  return toolNodeTypes.includes(nodeType);
}
```

### Полный валидатор агента ИИ

```typescript
function validateAIAgent(
  node: WorkflowNode,
  reverseConnections: Map<string, ReverseConnection[]>,
  workflow: WorkflowJson,
  result: WorkflowValidationResult
): void {
  const incoming = reverseConnections.get(node.name) || [];

  // 1. REQUIRED: ai_languageModel connection (1 or 2 if fallback)
  const languageModelConnections = incoming.filter(c => c.type === 'ai_languageModel');

  if (node.parameters.needsFallback === true) {
    if (languageModelConnections.length !== 2) {
      result.errors.push({
        type: 'error',
        nodeId: node.id,
        nodeName: node.name,
        message: `AI Agent "${node.name}" has needsFallback=true but has ${languageModelConnections.length} language model connection(s). Exactly 2 are required (primary + fallback).`
      });
    }

    // Check version support
    if (node.typeVersion < 2.1) {
      result.errors.push({
        type: 'error',
        nodeId: node.id,
        nodeName: node.name,
        message: `AI Agent "${node.name}" uses needsFallback but typeVersion ${node.typeVersion} does not support it. Upgrade to version 2.1+.`
      });
    }
  } else {
    if (languageModelConnections.length === 0) {
      result.errors.push({
        type: 'error',
        nodeId: node.id,
        nodeName: node.name,
        message: `AI Agent "${node.name}" requires an ai_languageModel connection. Connect a language model node (e.g., OpenAI Chat Model, Google Gemini).`
      });
    } else if (languageModelConnections.length > 1) {
      result.errors.push({
        type: 'error',
        nodeId: node.id,
        nodeName: node.name,
        message: `AI Agent "${node.name}" has ${languageModelConnections.length} ai_languageModel connections but needsFallback=false. Either enable fallback or keep only 1 language model.`
      });
    }
  }

  // 2. Output parser validation
  if (node.parameters.hasOutputParser === true) {
    const outputParserConnections = incoming.filter(c => c.type === 'ai_outputParser');

    if (outputParserConnections.length === 0) {
      result.errors.push({
        type: 'error',
        nodeId: node.id,
        nodeName: node.name,
        message: `AI Agent "${node.name}" has hasOutputParser=true but no ai_outputParser connection. Connect an Output Parser node.`
      });
    } else if (outputParserConnections.length > 1) {
      result.warnings.push({
        type: 'warning',
        nodeId: node.id,
        nodeName: node.name,
        message: `AI Agent "${node.name}" has ${outputParserConnections.length} output parser connections. Only the first will be used.`
      });
    }
  }

  // 3. Prompt type validation
  if (node.parameters.promptType === 'define') {
    if (!node.parameters.text || node.parameters.text.trim() === '') {
      result.errors.push({
        type: 'error',
        nodeId: node.id,
        nodeName: node.name,
        message: `AI Agent "${node.name}" has promptType="define" but the text field is empty. Provide a prompt or change to promptType="auto".`
      });
    }
  } else if (node.parameters.promptType === 'auto') {
    const chatTriggerInput = incoming.find(c =>
      c.type === 'main' &&
      c.sourceType === '@n8n/n8n-nodes-langchain.chatTrigger'
    );

    if (!chatTriggerInput) {
      result.warnings.push({
        type: 'warning',
        nodeId: node.id,
        nodeName: node.name,
        message: `AI Agent "${node.name}" has promptType="auto" but no Chat Trigger is connected. Either connect a Chat Trigger or change promptType to "define".`
      });
    }
  }

  // 4. Streaming mode validation (CRITICAL)
  const chatTriggerInput = incoming.find(c =>
    c.type === 'main' &&
    c.sourceType === '@n8n/n8n-nodes-langchain.chatTrigger'
  );

  if (chatTriggerInput) {
    const chatTriggerNode = workflow.nodes.find(n => n.name === chatTriggerInput.sourceName);
    const responseMode = chatTriggerNode?.parameters?.options?.responseMode;

    if (responseMode === 'streaming') {
      const outgoingMain = workflow.connections[node.name]?.main;
      if (outgoingMain && outgoingMain.flat().some(c => c)) {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: `AI Agent "${node.name}" is connected from Chat Trigger with responseMode="streaming". It must NOT have outgoing main connections. The response streams back through the Chat Trigger.`
        });
      }
    }
  }

  // 5. System message recommendation
  if (!node.parameters.options?.systemMessage) {
    result.warnings.push({
      type: 'warning',
      nodeId: node.id,
      nodeName: node.name,
      message: `AI Agent "${node.name}" has no system message. Add one in options.systemMessage to define the agent's role, capabilities, and constraints.`
    });
  }

  // 6. maxIterations validation
  const maxIterations = node.parameters.options?.maxIterations;
  if (maxIterations !== undefined && maxIterations > 20) {
    result.warnings.push({
      type: 'warning',
      nodeId: node.id,
      nodeName: node.name,
      message: `AI Agent "${node.name}" has maxIterations=${maxIterations}. High values may cause long execution times and high costs. Consider reducing to 20 or less.`
    });
  }

  // 7. Memory validation (optional, 0-1)
  const memoryConnections = incoming.filter(c => c.type === 'ai_memory');
  if (memoryConnections.length > 1) {
    result.warnings.push({
      type: 'warning',
      nodeId: node.id,
      nodeName: node.name,
      message: `AI Agent "${node.name}" has ${memoryConnections.length} ai_memory connections. Only 1 is supported; additional connections will be ignored.`
    });
  }

  // 8. Tool validation
  const toolConnections = incoming.filter(c => c.type === 'ai_tool');
  for (const toolConn of toolConnections) {
    const toolNode = workflow.nodes.find(n => n.name === toolConn.sourceName);
    if (toolNode && !toolNode.parameters.toolDescription && !toolNode.parameters.description) {
      result.warnings.push({
        type: 'warning',
        nodeId: toolNode.id,
        nodeName: toolNode.name,
        message: `Tool "${toolNode.name}" connected to AI Agent has no description. Add a toolDescription to help the LLM understand when to use this tool.`
      });
    }
  }
}
```

### Базовый валидатор цепочки LLM

```typescript
function validateBasicLLMChain(
  node: WorkflowNode,
  reverseConnections: Map<string, ReverseConnection[]>,
  result: WorkflowValidationResult
): void {
  const incoming = reverseConnections.get(node.name) || [];

  // 1. REQUIRED: ai_languageModel connection
  const languageModelConnections = incoming.filter(c => c.type === 'ai_languageModel');
  if (languageModelConnections.length === 0) {
    result.errors.push({
      type: 'error',
      nodeId: node.id,
      nodeName: node.name,
      message: `Basic LLM Chain "${node.name}" requires an ai_languageModel connection. Connect a language model node.`
    });
  } else if (languageModelConnections.length > 1) {
    result.warnings.push({
      type: 'warning',
      nodeId: node.id,
      nodeName: node.name,
      message: `Basic LLM Chain "${node.name}" has ${languageModelConnections.length} ai_languageModel connections. Only 1 is supported.`
    });
  }

  // 2. FORBIDDEN: ai_memory connections
  const memoryConnections = incoming.filter(c => c.type === 'ai_memory');
  if (memoryConnections.length > 0) {
    result.errors.push({
      type: 'error',
      nodeId: node.id,
      nodeName: node.name,
      message: `Basic LLM Chain "${node.name}" does not support ai_memory connections. Use AI Agent instead if you need conversation memory.`
    });
  }

  // 3. FORBIDDEN: ai_tool connections
  const toolConnections = incoming.filter(c => c.type === 'ai_tool');
  if (toolConnections.length > 0) {
    result.errors.push({
      type: 'error',
      nodeId: node.id,
      nodeName: node.name,
      message: `Basic LLM Chain "${node.name}" does not support ai_tool connections. Use AI Agent instead if you need tool calling.`
    });
  }

  // 4. OPTIONAL: ai_outputParser connection (0-1)
  const outputParserConnections = incoming.filter(c => c.type === 'ai_outputParser');
  if (outputParserConnections.length > 1) {
    result.warnings.push({
      type: 'warning',
      nodeId: node.id,
      nodeName: node.name,
      message: `Basic LLM Chain "${node.name}" has ${outputParserConnections.length} output parser connections. Only 1 is supported.`
    });
  }
}
```

## Следующие шаги

1. **Внедрите расширенный валидатор агента AI**, используя полную спецификацию из этого документа.
2. **Обновите ответы инструмента MCP**, чтобы включить глубокое понимание агента AI.
3. **Протестируйте с использованием реальных шаблонов** (2985, 3680, 5296), чтобы проверить правильность.
4. **Распространение на другие узлы AI** (базовая цепочка LLM, триггер чата, инструменты)
5. **Полная проверка на 269 узлах** для всех узлов инструмента.
