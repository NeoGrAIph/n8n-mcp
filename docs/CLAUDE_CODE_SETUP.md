# Настройка кода Клода

Подключите n8n-MCP к интерфейсу командной строки Claude Code для расширенной разработки рабочих процессов n8n из командной строки.

## Быстрая настройка через CLI

### Базовая конфигурация (только инструменты документирования)

**Для Linux, macOS или Windows (WSL/Git Bash):**
```bash
claude mcp add n8n-mcp \
  -e MCP_MODE=stdio \
  -e LOG_LEVEL=error \
  -e DISABLE_CONSOLE_OUTPUT=true \
  -- npx n8n-mcp
```

**Для встроенной оболочки Windows PowerShell:**
```powershell
# Note: The backtick ` is PowerShell's line continuation character.
claude mcp add n8n-mcp `
  '-e MCP_MODE=stdio' `
  '-e LOG_LEVEL=error' `
  '-e DISABLE_CONSOLE_OUTPUT=true' `
  -- npx n8n-mcp
```

![Добавление сервера n8n-MCP в Claude Code](./img/cc_command.png)

### Полная конфигурация (с инструментами управления n8n)

**Для Linux, macOS или Windows (WSL/Git Bash):**
```bash
claude mcp add n8n-mcp \
  -e MCP_MODE=stdio \
  -e LOG_LEVEL=error \
  -e DISABLE_CONSOLE_OUTPUT=true \
  -e N8N_API_URL=https://your-n8n-instance.com \
  -e N8N_API_KEY=your-api-key \
  -- npx n8n-mcp
```

**Для встроенной оболочки Windows PowerShell:**
```powershell
# Note: The backtick ` is PowerShell's line continuation character.
claude mcp add n8n-mcp `
  '-e MCP_MODE=stdio' `
  '-e LOG_LEVEL=error' `
  '-e DISABLE_CONSOLE_OUTPUT=true' `
  '-e N8N_API_URL=https://your-n8n-instance.com' `
  '-e N8N_API_KEY=your-api-key' `
  -- npx n8n-mcp
```

Обязательно замените `https://your-n8n-instance.com` своим фактическим URL-адресом n8n и `your-api-key` своим ключом API n8n.

## Альтернативные методы установки

### Вариант 1: Импорт из Claude Desktop

Если у вас уже настроен n8n-MCP в Claude Desktop:
```bash
claude mcp add-from-claude-desktop
```

### Вариант 2: Конфигурация проекта

Для совместного использования командой добавьте `.mcp.json` в корень вашего проекта:
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

Затем используйте с флагом области:
```bash
claude mcp add n8n-mcp --scope project
```

## Управление вашим сервером MCP

Проверьте статус сервера:
```bash
claude mcp list
claude mcp get n8n-mcp
```

Во время разговора используйте команду `/mcp`, чтобы просмотреть состояние сервера и доступные инструменты.

![n8n-MCP подключен и показывает 39 доступных инструментов](./img/cc_connected.png)

Удалить сервер:
```bash
claude mcp remove n8n-mcp
```

## 🎓 Добавьте навыки Клода (необязательно)

Усовершенствуйте свой рабочий процесс n8n с помощью специальных навыков Claude Code! Репозиторий [n8n-skills](https://github.com/czlonkowski/n8n-skills) предоставляет 7 дополнительных навыков, которые учат помощников ИИ создавать готовые к работе рабочие процессы n8n.

### Что вы получаете

- ✅ **Синтаксис выражений n8n** - Исправьте шаблоны {{}} и распространённые ошибки.
- ✅ **Эксперт по инструментам n8n MCP** - Как эффективно использовать инструменты n8n-mcp
- ✅ **Шаблоны рабочих процессов n8n** — 5 проверенных архитектурных шаблонов
- ✅ **n8n Эксперт по валидации** - Интерпретация и исправление ошибок валидации
- ✅ **Конфигурация узла n8n** - Руководство по настройке с учетом операций
- ✅ **n8n Code JavaScript** — Напишите эффективный JavaScript в узлах кода.
- ✅ **n8n Code Python** — Шаблоны Python с учетом ограничений

### Установка

**Метод 1: Установка плагина** (рекомендуется)
```bash
/plugin install czlonkowski/n8n-skills
```

**Метод 2: через торговую площадку**
```bash
# Add as marketplace, then browse and install
/plugin marketplace add czlonkowski/n8n-skills

# Then browse available plugins
/plugin install
# Select "n8n-mcp-skills" from the list
```

**Метод 3: Установка вручную**
```bash
# 1. Clone the repository
git clone https://github.com/czlonkowski/n8n-skills.git

# 2. Copy skills to your Claude Code skills directory
cp -r n8n-skills/skills/* ~/.claude/skills/

# 3. Reload Claude Code
# Skills will activate automatically
```

Полные инструкции по установке, параметры конфигурации и примеры использования см. в [README n8n-skills](https://github.com/czlonkowski/n8n-skills#-installation).

Skills безупречно работает с n8n-mcp, обеспечивая экспертное руководство на протяжении всего процесса построения рабочего процесса!

## Инструкции по проекту

Для достижения оптимальных результатов создайте файл `CLAUDE.md` в корне вашего проекта, следуя инструкциям из [основного раздела настройки проекта Claude в README](../README.md#-claude-project-setup).

## Советы

- Если вы используете n8n локально, используйте `http://localhost:5678` в качестве `N8N_API_URL`.
- Учетные данные API n8n не являются обязательными. Без них у вас будет доступ только к документации и инструментам проверки. Имея учетные данные, вы получаете полные возможности управления рабочим процессом.
- **Управление объемом:**
- По умолчанию `claude mcp add` использует `--scope local` (также называемый «областью пользователя»), что сохраняет конфигурацию в глобальных настройках пользователя и сохраняет конфиденциальность ключей API.
- Чтобы поделиться конфигурацией со своей командой, используйте `--scope project`. При этом конфигурация сохраняется в файле `.mcp.json` в корневом каталоге вашего проекта.
- **Переключение области действия:** Самый простой способ — это `remove` сервер, а затем `add` его обратно с нужным флагом области (например, `claude mcp remove n8n-mcp`, за которым следует `claude mcp add n8n-mcp --scope project`).
- **Ручное переключение (дополнительно):** Вы можете вручную редактировать файл `.claude.json` (например, `C:\Users\YourName\.claude.json`). Чтобы переключиться, вырежьте блок `"n8n-mcp": { ... }` из объекта `"mcpServers"` верхнего уровня (область пользователя) и вставьте его во вложенный объект `"mcpServers"` под ключом пути вашего проекта (область проекта) или наоборот. **Важно!** Возможно, вам придется перезапустить Claude Code, чтобы изменения, внесенные вручную, вступили в силу.
- Claude Code автоматически запустит сервер MCP, когда вы начнете разговор.
