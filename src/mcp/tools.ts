import { ToolDefinition } from '../types';

/**
 * n8n Documentation MCP Tools - FINAL OPTIMIZED VERSION
 * 
 * Incorporates all lessons learned from real workflow building.
 * Designed to help AI agents avoid common pitfalls and build workflows efficiently.
 */
export const n8nDocumentationToolsFinal: ToolDefinition[] = [
  {
    name: 'n8n_tools_documentation',
    description: `Fetch the built-in documentation for n8n MCP tools and guides. Use topic to target a specific tool or "overview" for the index, and set depth to control verbosity. Returns Markdown with usage guidance, examples, and best practices.`,
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Tool name (e.g., "n8n_search_nodes") or "overview" for general guide. Leave empty for quick reference.',
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
    name: 'n8n_search_nodes',
    description: `Search the local n8n node catalog by keyword to discover node types. Provide query plus optional mode/limit and includeExamples to control matching and sample configs. Returns a ranked list of node types with basic metadata.`,
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
    name: 'n8n_get_node',
    description: `Retrieve detailed metadata for a specific node type. Provide nodeType and optionally detail/mode; use mode=docs for Markdown or mode=search_properties with propertyQuery. Returns node schema metadata and focused docs/search results.`,
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
    name: 'n8n_validate_node',
    description: `Validate a node configuration against its schema. Provide nodeType and config, and set mode to minimal or full with an optional profile for strictness. Returns a structured validation result with errors, warnings, and suggestions.`,
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
    name: 'n8n_get_template',
    description: `Fetch a workflow template from the local template database by templateId. Use mode to control response size (nodes_only, structure, full). Returns template data suitable for analysis or import.`,
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
    name: 'n8n_search_templates',
    description: `Search the local workflow templates catalog. Choose searchMode and provide matching parameters (query, nodeTypes, task, or metadata filters) plus limit/offset for pagination. Returns a list of templates with summary metadata and tips.`,
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
    name: 'n8n_validate_workflow_json',
    description: `Validate a workflow JSON object locally without calling n8n. Provide workflow with nodes and connections, plus optional options to control validation depth. Returns validity, summary, errors, warnings, and suggestions.`,
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
 *    - Start: n8n_search_nodes → n8n_get_node → n8n_validate_node
 *    - Discovery: n8n_search_nodes({query:"trigger"}) for finding nodes
 *    - Quick Config: n8n_get_node("nodes-base.httpRequest", {detail:"standard"}) - only essential properties
 *    - Documentation: n8n_get_node("nodes-base.httpRequest", {mode:"docs"}) - readable markdown docs
 *    - Find Properties: n8n_get_node("nodes-base.httpRequest", {mode:"search_properties", propertyQuery:"auth"})
 *    - Full Details: n8n_get_node with detail="full" only when standard isn't enough
 *    - Validation: Use n8n_validate_node for complex nodes (Slack, Google Sheets, etc.)
 *
 * 2. COMMON NODE TYPES:
 *    Triggers: webhook, schedule, emailReadImap, slackTrigger
 *    Core: httpRequest, code, set, if, merge, splitInBatches
 *    Integrations: slack, gmail, googleSheets, postgres, mongodb
 *    AI: agent, openAi, chainLlm, documentLoader
 *
 * 3. SEARCH TIPS:
 *    - n8n_search_nodes returns ANY word match (OR logic)
 *    - Single words more precise, multiple words broader
 *    - If no results: try different keywords or partial names
 *
 * 4. TEMPLATE SEARCHING:
 *    - n8n_search_templates("slack") searches template names/descriptions, NOT node types!
 *    - To find templates using Slack node: n8n_search_templates({searchMode:"by_nodes", nodeTypes:["n8n-nodes-base.slack"]})
 *    - For task-based templates: n8n_search_templates({searchMode:"by_task", task:"slack_integration"})
 *
 * 5. KNOWN ISSUES:
 *    - Some nodes have duplicate properties with different conditions
 *    - Package names: use 'n8n-nodes-base' not '@n8n/n8n-nodes-base'
 *    - Check showWhen/hideWhen to identify the right property variant
 *
 * 6. PERFORMANCE:
 *    - n8n_get_node (detail=standard): Fast (<5KB)
 *    - n8n_get_node (detail=full): Slow (100KB+) - use sparingly
 *    - n8n_search_nodes: Fast, cached
 */
