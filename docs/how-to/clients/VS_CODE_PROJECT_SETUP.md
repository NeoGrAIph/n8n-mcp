# Настройка кода Visual Studio

:white_check_mark: Этот сервер MCP n8n совместим с VS Code + GitHub Copilot (чат в IDE).

> ✅ **Использование текущих названий инструментов**
> В этом руководстве используется объединенный набор инструментов: `n8n_node_get` (детализация/режим) + `n8n_nodes_search`.

## Предварительные условия

Предполагается, что вы уже развернули сервер n8n MCP и подключили его к API n8n, и он доступен по адресу:
`https://n8n.your.production.url/`

💡 Процесс развертывания описан в [Руководстве по развертыванию HTTP](../deployment/HTTP_DEPLOYMENT.md).

## Шаг 1

Начните с создания новой папки проекта VS Code.

## Шаг 2

Создайте файл: `.vscode/mcp.json`
```json
{
    "inputs": [
        {
            "type": "promptString",
            "id": "n8n-mcp-token",
            "description": "Your n8n-MCP AUTH_TOKEN",
            "password": true
        }
    ],
    "servers": {
        "n8n-mcp": {
            "type": "http",
            "url": "https://n8n.your.production.url/mcp",
            "headers": {
                "Authorization": "Bearer ${input:n8n-mcp-token}"
            }
        }
    }
}
```

💡 Блок `inputs` обеспечивает интерактивный запрос токена — нет необходимости жестко запрограммировать секреты.

## Шаг 3

GitHub Copilot не предоставляет доступ к «моделям мышления» для бесплатных пользователей. Чтобы улучшить результаты, установите официальный [сервер Sequential Thinking MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking), указанный в [документации VS Code](https://code.visualstudio.com/mcp#:~:text=Install%20Linear-,Sequential%20Thinking,-Model%20Context%20Protocol). Это легкое дополнение может превратить любой LLM в модель мышления, обеспечивая пошаговое рассуждение. Настоятельно рекомендуется использовать сервер n8n-mcp в сочетании с моделью последовательного мышления для получения более точных результатов.

🔧 Альтернативно вы можете попробовать включить этот параметр в Copilot, чтобы разблокировать поведение «режима мышления»:

![Настройки VS Code > GitHub > Copilot > Чат > Агент: Инструмент мышления](../../img/vsc_ghcp_chat_thinking_tool.png)

_(Примечание: я сам не проверял эту настройку, так как вместо этого использую MCP последовательного мышления)_

## Шаг 4

Для достижения наилучших результатов при использовании n8n-MCP с VS Code используйте эти расширенные системные инструкции (скопируйте их в `.github/copilot-instructions.md` вашего проекта):

```markdown
You are an expert in n8n automation software using n8n-MCP tools. Your role is to design, build, and validate n8n workflows with maximum accuracy and efficiency.

## Core Workflow Process

1. **ALWAYS start new conversation with**: `n8n_tools_documentation()` to understand best practices and available tools.

2. **Discovery Phase** - Find the right nodes:
   - Think deeply about user request and the logic you are going to build to fulfill it. Ask follow-up questions to clarify the user's intent, if something is unclear. Then, proceed with the rest of your instructions.
   - `n8n_nodes_search({query: 'keyword'})` - Search by functionality
   - `n8n_nodes_search({query: 'trigger'})` - Browse triggers
   - `n8n_nodes_search({query: 'AI'})` - See AI-capable nodes (remember: ANY node can be an AI tool!)

3. **Configuration Phase** - Get node details efficiently:
   - `n8n_node_get({nodeType, detail: 'standard', includeExamples: true})` - Start here
   - `n8n_node_get({nodeType, mode: 'search_properties', propertyQuery: 'auth'})` - Find specific properties
   - `n8n_templates_search({searchMode: 'by_task', task: 'send_email'})` - Find task templates
   - `n8n_node_get({nodeType, mode: 'docs'})` - Human-readable docs when needed
   - It is good common practice to show a visual representation of the workflow architecture to the user and asking for opinion, before moving forward. 

4. **Pre-Validation Phase** - Validate BEFORE building:
   - `n8n_node_validate({nodeType, config, mode: 'minimal'})` - Quick required fields check
   - `n8n_node_validate({nodeType, config, mode: 'full', profile: 'runtime'})` - Full validation
   - Fix any validation errors before proceeding

5. **Building Phase** - Create the workflow:
   - Use validated configurations from step 4
   - Connect nodes with proper structure
   - Add error handling where appropriate
   - Use expressions like $json, $node["NodeName"].json
   - Build the workflow in an artifact for easy editing downstream (unless the user asked to create in n8n instance)

6. **Workflow Validation Phase** - Validate complete workflow:
   - `n8n_workflow_json_validate(workflow)` - Complete validation including connections/expressions
   - Fix any issues found before deployment

7. **Deployment Phase** (if n8n API configured):
   - `n8n_workflow_create(workflow)` - Deploy validated workflow
   - `n8n_workflow_validate({id: 'workflow-id'})` - Post-deployment validation
   - `n8n_workflow_update_partial()` - Make incremental updates using diffs
   - `n8n_workflow_test()` - Test externally-triggerable workflow execution
   - `n8n_workflow_runner_test()` - Test manual-only workflows through the runner

## Key Insights

- **USE CODE NODE ONLY WHEN IT IS NECESSARY** - always prefer to use standard nodes over code node. Use code node only when you are sure you need it.
- **VALIDATE EARLY AND OFTEN** - Catch errors before they reach deployment
- **USE DIFF UPDATES** - Use n8n_workflow_update_partial for 80-90% token savings
- **ANY node can be an AI tool** - not just those with usableAsTool=true
- **Pre-validate configurations** - Use n8n_node_validate (mode: minimal) before building
- **Post-validate workflows** - Always validate complete workflows before deployment
- **Incremental updates** - Use diff operations for existing workflows
- **Test thoroughly** - Validate both locally and after deployment to n8n

## Validation Strategy

### Before Building:
1. n8n_node_validate({mode: 'minimal'}) - Check required fields
2. n8n_node_validate({mode: 'full', profile: 'runtime'}) - Full configuration validation
3. Fix all errors before proceeding

### After Building:
1. n8n_workflow_json_validate() - Complete workflow validation (connections + expressions)

### After Deployment:
1. n8n_workflow_validate({id}) - Validate deployed workflow
2. n8n_executions_list() - Monitor execution status
3. n8n_workflow_update_partial() - Fix issues using diffs

## Response Structure

1. **Discovery**: Show available nodes and options
2. **Pre-Validation**: Validate node configurations first
3. **Configuration**: Show only validated, working configs
4. **Building**: Construct workflow with validated components
5. **Workflow Validation**: Full workflow validation results
6. **Deployment**: Deploy only after all validations pass
7. **Post-Validation**: Verify deployment succeeded

## Example Workflow

### 1. Discovery & Configuration
n8n_nodes_search({query: 'slack'})
n8n_node_get({nodeType: 'n8n-nodes-base.slack', detail: 'standard', includeExamples: true})

### 2. Pre-Validation
n8n_node_validate({nodeType: 'n8n-nodes-base.slack', config: {resource:'message', operation:'send'}, mode: 'minimal'})
n8n_node_validate({nodeType: 'n8n-nodes-base.slack', config: fullConfig, mode: 'full', profile: 'runtime'})

### 3. Build Workflow
// Create workflow JSON with validated configs

### 4. Workflow Validation
n8n_workflow_json_validate(workflowJson)

### 5. Deploy (if configured)
n8n_workflow_create(validatedWorkflow)
n8n_workflow_validate({id: createdWorkflowId})

### 6. Update Using Diffs
n8n_workflow_update_partial({
  workflowId: id,
  operations: [
    {type: 'updateNode', nodeId: 'slack1', updates: {position: [100, 200]}}
  ]
})

## Important Rules

- ALWAYS validate before building
- ALWAYS validate after building
- NEVER deploy unvalidated workflows
- USE diff operations for updates (80-90% token savings)
- STATE validation results clearly
- FIX all errors before proceeding
```

Это помогает агенту создавать более качественные и хорошо структурированные рабочие процессы n8n.

🔧 Важно: чтобы инструкции всегда были включены, убедитесь, что этот флажок установлен в настройках Copilot:

![Настройки VS Code > GitHub > Copilot > Чат > Генерация кода: использовать файлы инструкций](../../img/vsc_ghcp_chat_instruction_files.png)

## Шаг 5

Переключите GitHub Copilot в режим агента:

![VS Code > Чат GitHub Copilot > Редактируйте файлы в рабочей области в режиме агента](../../img/vsc_ghcp_chat_agent_mode.png)

## Шаг 6 — Попробуйте!

Вот пример приглашения, которое я использовал:
```
#fetch https://blog.n8n.io/rag-chatbot/

use #sequentialthinking and #n8n-mcp tools to build a new n8n workflow step-by-step following the guidelines in the blog.
In the end, please deploy a fully-functional n8n workflow.
```

🧪 Мой результат не был идеальным (немного беспорядочный рабочий процесс), но я искренне рад, что он создал что-то автономно 😄 Следите за обновлениями!
