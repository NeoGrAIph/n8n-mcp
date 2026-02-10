# Настройка виндсерфинга

Подключите n8n-MCP к Windsurf IDE, чтобы улучшить рабочий процесс n8n с помощью искусственного интеллекта.

[![n8n-mcp Руководство по настройке Windsurf](../../img/windsurf_tut.png)](https://www.youtube.com/watch?v=klxxT1__izg)

## Видеоурок

Посмотрите полный процесс установки: [Руководство по настройке n8n-MCP Windsurf](https://www.youtube.com/watch?v=klxxT1__izg)

## Процесс установки

### 1. Доступ к конфигурации MCP

1. Зайдите в настройки виндсерфинга.
2. Перейдите к настройкам виндсерфинга.
3. Перейдите в раздел «Серверы MCP» > «Управление плагинами».
4. Нажмите «Просмотреть необработанную конфигурацию».

### 2. Добавьте конфигурацию n8n-MCP

Скопируйте конфигурацию из этого репозитория и добавьте ее в свою конфигурацию MCP:

**Базовая конфигурация (только инструменты документирования):**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true"
      }
    }
  }
}
```

**Полная конфигурация (с инструментами управления n8n):**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 3. Настройте соединение n8n

1. Замените `https://your-n8n-instance.com` своим фактическим URL-адресом n8n.
2. Замените `your-api-key` своим ключом API n8n.
3. Нажмите «Обновить», чтобы применить изменения.

### 4. Настройка инструкций по проекту

1. Создайте файл `.windsurfrules` в корне вашего проекта.
2. Скопируйте инструкции проекта Claude из [основного раздела настройки проекта Claude в README](../README.md#-claude-project-setup)
