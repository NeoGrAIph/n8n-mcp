import { ToolDefinition } from '../types';

/**
 * n8n Documentation MCP Tools - FINAL OPTIMIZED VERSION
 * 
 * Incorporates all lessons learned from real workflow building.
 * Designed to help AI agents avoid common pitfalls and build workflows efficiently.
 */
export const n8nDocumentationToolsFinal: ToolDefinition[] = [
  {
    name: 'tools_documentation',
    description: `Use this when you need guidance on the n8n-mcp toolset or a specific tool. Do not use it to fetch node or workflow data.`,
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Tool name (e.g., "search_nodes") or "overview" for general guide. Leave empty for quick reference.',
        },
        depth: {
          type: 'string',
          enum: ['essentials', 'full'],
          description: 'Level of detail. "essentials" (default) for quick reference, "full" for comprehensive docs.',
          default: 'essentials',
        },
      },
    },
  },
  {
    name: 'search_nodes',
    description: `Use this when the user needs to discover which n8n node fits a capability or integration. Do not use it when you already know the exact node type.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms. Use quotes for exact phrase.',
        },
        limit: {
          type: 'integer',
          description: 'Max results (default 20)',
          default: 20,
        },
        mode: {
          type: 'string',
          enum: ['OR', 'AND', 'FUZZY'],
          description: 'OR=any word, AND=all words, FUZZY=typo-tolerant',
          default: 'OR',
        },
        includeExamples: {
          type: 'boolean',
          description: 'Include top 2 real-world configuration examples from popular templates (default: false)',
          default: false,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_node',
    description: `Use this when you need detailed info or docs for a specific node type. Do not use it for discovery—use search_nodes instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        nodeType: {
          type: 'string',
          description: 'Full node type: "nodes-base.httpRequest" or "nodes-langchain.agent"',
        },
        detail: {
          type: 'string',
          enum: ['minimal', 'standard', 'full'],
          default: 'standard',
          description: 'Information detail level. standard=essential properties (recommended), full=everything',
        },
        mode: {
          type: 'string',
          enum: ['info', 'docs', 'search_properties', 'versions', 'compare', 'breaking', 'migrations'],
          default: 'info',
          description: 'Operation mode. info=node schema, docs=readable markdown documentation, search_properties=find specific properties, versions/compare/breaking/migrations=version info',
        },
        includeTypeInfo: {
          type: 'boolean',
          default: false,
          description: 'Include type structure metadata (type category, JS type, validation rules). Only applies to mode=info. Adds ~80-120 tokens per property.',
        },
        includeExamples: {
          type: 'boolean',
          default: false,
          description: 'Include real-world configuration examples from templates. Only applies to mode=info with detail=standard. Adds ~200-400 tokens per example.',
        },
        fromVersion: {
          type: 'string',
          description: 'Source version for compare/breaking/migrations modes (e.g., "1.0")',
        },
        toVersion: {
          type: 'string',
          description: 'Target version for compare mode (e.g., "2.0"). Defaults to latest if omitted.',
        },
        propertyQuery: {
          type: 'string',
          description: 'For mode=search_properties: search term to find properties (e.g., "auth", "header", "body")',
        },
        maxPropertyResults: {
          type: 'integer',
          description: 'For mode=search_properties: max results (default 20)',
          default: 20,
        },
      },
      required: ['nodeType'],
    },
  },
  {
    name: 'validate_node',
    description: `Use this when validating a single node configuration against its node type. Do not use it for full workflow validation.`,
    inputSchema: {
      type: 'object',
      properties: {
        nodeType: {
          type: 'string',
          description: 'Node type as string. Example: "nodes-base.slack"',
        },
        config: {
          type: 'object',
          description: 'Configuration as object. For simple nodes use {}. For complex nodes include fields like {resource:"channel",operation:"create"}',
        },
        mode: {
          type: 'string',
          enum: ['full', 'minimal'],
          description: 'Validation mode. full=comprehensive validation with errors/warnings/suggestions, minimal=quick required fields check only. Default is "full"',
          default: 'full',
        },
        profile: {
          type: 'string',
          enum: ['strict', 'runtime', 'ai-friendly', 'minimal'],
          description: 'Profile for mode=full: "minimal", "runtime", "ai-friendly", or "strict". Default is "ai-friendly"',
          default: 'ai-friendly',
        },
      },
      required: ['nodeType', 'config'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_template',
    description: `Use this when you need the details of a specific template by ID. Do not use it for searching.`,
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'integer',
          description: 'The template ID to retrieve',
        },
        mode: {
          type: 'string',
          enum: ['nodes_only', 'structure', 'full'],
          description: 'Response detail level. nodes_only: just node list, structure: nodes+connections, full: complete workflow JSON.',
          default: 'full',
        },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'search_templates',
    description: `Use this when you need to find workflow templates by keyword, node types, or task. Do not use it to fetch a template by ID.`,
    inputSchema: {
      type: 'object',
      properties: {
        searchMode: {
          type: 'string',
          enum: ['keyword', 'by_nodes', 'by_task', 'by_metadata'],
          description: 'Search mode. keyword=text search (default), by_nodes=find by node types, by_task=curated task templates, by_metadata=filter by complexity/services',
          default: 'keyword',
        },
        // For searchMode='keyword'
        query: {
          type: 'string',
          description: 'For searchMode=keyword: search keyword (e.g., "chatbot")',
        },
        fields: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['id', 'name', 'description', 'author', 'nodes', 'views', 'created', 'url', 'metadata'],
          },
          description: 'For searchMode=keyword: fields to include in response. Default: all fields.',
        },
        // For searchMode='by_nodes'
        nodeTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'For searchMode=by_nodes: array of node types (e.g., ["n8n-nodes-base.httpRequest", "n8n-nodes-base.slack"])',
        },
        // For searchMode='by_task'
        task: {
          type: 'string',
          enum: [
            'ai_automation',
            'data_sync',
            'webhook_processing',
            'email_automation',
            'slack_integration',
            'data_transformation',
            'file_processing',
            'scheduling',
            'api_integration',
            'database_operations'
          ],
          description: 'For searchMode=by_task: the type of task',
        },
        // For searchMode='by_metadata'
        category: {
          type: 'string',
          description: 'For searchMode=by_metadata: filter by category (e.g., "automation", "integration")',
        },
        complexity: {
          type: 'string',
          enum: ['simple', 'medium', 'complex'],
          description: 'For searchMode=by_metadata: filter by complexity level',
        },
        maxSetupMinutes: {
          type: 'integer',
          description: 'For searchMode=by_metadata: maximum setup time in minutes',
          minimum: 5,
          maximum: 480,
        },
        minSetupMinutes: {
          type: 'integer',
          description: 'For searchMode=by_metadata: minimum setup time in minutes',
          minimum: 5,
          maximum: 480,
        },
        requiredService: {
          type: 'string',
          description: 'For searchMode=by_metadata: filter by required service (e.g., "openai", "slack")',
        },
        targetAudience: {
          type: 'string',
          description: 'For searchMode=by_metadata: filter by target audience (e.g., "developers", "marketers")',
        },
        // Common pagination
        limit: {
          type: 'integer',
          description: 'Maximum number of results. Default 20.',
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        offset: {
          type: 'integer',
          description: 'Pagination offset. Default 0.',
          default: 0,
          minimum: 0,
        },
      },
    },
  },
  {
    name: 'validate_workflow',
    description: `Use this when you have full workflow JSON and need validation before deployment. Do not use it when you only have a workflow ID.`,
    inputSchema: {
      type: 'object',
      properties: {
        workflow: {
          type: 'object',
          description: 'The complete workflow JSON to validate. Must include nodes array and connections object.',
        },
        options: {
          type: 'object',
          properties: {
            validateNodes: {
              type: 'boolean',
              description: 'Validate individual node configurations. Default true.',
              default: true,
            },
            validateConnections: {
              type: 'boolean',
              description: 'Validate node connections and flow. Default true.',
              default: true,
            },
            validateExpressions: {
              type: 'boolean',
              description: 'Validate n8n expressions syntax and references. Default true.',
              default: true,
            },
            profile: {
              type: 'string',
              enum: ['minimal', 'runtime', 'ai-friendly', 'strict'],
              description: 'Validation profile for node validation. Default "runtime".',
              default: 'runtime',
            },
          },
          description: 'Optional validation settings',
        },
      },
      required: ['workflow'],
      additionalProperties: false,
    },
  },
];

/**
 * QUICK REFERENCE for AI Agents:
 *
 * 1. RECOMMENDED WORKFLOW:
 *    - Start: search_nodes → get_node → validate_node
 *    - Discovery: search_nodes({query:"trigger"}) for finding nodes
 *    - Quick Config: get_node("nodes-base.httpRequest", {detail:"standard"}) - only essential properties
 *    - Documentation: get_node("nodes-base.httpRequest", {mode:"docs"}) - readable markdown docs
 *    - Find Properties: get_node("nodes-base.httpRequest", {mode:"search_properties", propertyQuery:"auth"})
 *    - Full Details: get_node with detail="full" only when standard isn't enough
 *    - Validation: Use validate_node for complex nodes (Slack, Google Sheets, etc.)
 *
 * 2. COMMON NODE TYPES:
 *    Triggers: webhook, schedule, emailReadImap, slackTrigger
 *    Core: httpRequest, code, set, if, merge, splitInBatches
 *    Integrations: slack, gmail, googleSheets, postgres, mongodb
 *    AI: agent, openAi, chainLlm, documentLoader
 *
 * 3. SEARCH TIPS:
 *    - search_nodes returns ANY word match (OR logic)
 *    - Single words more precise, multiple words broader
 *    - If no results: try different keywords or partial names
 *
 * 4. TEMPLATE SEARCHING:
 *    - search_templates("slack") searches template names/descriptions, NOT node types!
 *    - To find templates using Slack node: search_templates({searchMode:"by_nodes", nodeTypes:["n8n-nodes-base.slack"]})
 *    - For task-based templates: search_templates({searchMode:"by_task", task:"slack_integration"})
 *
 * 5. KNOWN ISSUES:
 *    - Some nodes have duplicate properties with different conditions
 *    - Package names: use 'n8n-nodes-base' not '@n8n/n8n-nodes-base'
 *    - Check showWhen/hideWhen to identify the right property variant
 *
 * 6. PERFORMANCE:
 *    - get_node (detail=standard): Fast (<5KB)
 *    - get_node (detail=full): Slow (100KB+) - use sparingly
 *    - search_nodes: Fast, cached
 */
