/**
 * n8n-friendly tool descriptions
 * These descriptions are optimized to reduce schema validation errors in n8n's AI Agent
 * 
 * Key principles:
 * 1. Use exact JSON examples in descriptions
 * 2. Be explicit about data types
 * 3. Keep descriptions short and directive
 * 4. Avoid ambiguity
 */

export const n8nFriendlyDescriptions: Record<string, {
  description: string;
  params: Record<string, string>;
}> = {
  // Consolidated validation tool (replaces legacy n8n_node_validate_* variants)
  n8n_node_validate: {
    description: 'Validate a node configuration against its schema. Use this when you want to check required fields or perform full validation before building a workflow. Provide nodeType and config, and choose mode (minimal/full) with optional profile. Returns a structured validation result with errors, warnings, and suggestions.',
    params: {
      nodeType: 'String value like "nodes-base.slack"',
      config: 'Object value like {"resource": "channel", "operation": "create"} or empty object {}',
      mode: 'Optional string: "full" (default) or "minimal"',
      profile: 'Optional string: "minimal" or "runtime" or "ai-friendly" or "strict"'
    }
  },

  // Search tool
  n8n_nodes_search: {
    description: 'Search the local n8n node catalog by keyword. Use this when you need to discover node types that fit an integration or capability. Provide query and optional limit/mode/includeExamples to adjust matching and sample configs. Returns a ranked list of node types with basic metadata.',
    params: {
      query: 'String keyword like "webhook" or "database"',
      limit: 'Optional number, default 20'
    }
  },

  // Consolidated node info tool (replaces get_node_info, get_node_essentials, get_node_documentation, search_node_properties)
  n8n_node_get: {
    description: 'Retrieve metadata for a specific node type. Use this when you already know the nodeType and need its schema, docs, or property search. Provide nodeType plus optional detail/mode; use mode=docs for Markdown or mode=search_properties with propertyQuery. Returns node schema metadata and focused docs/search results.',
    params: {
      nodeType: 'String with prefix like "nodes-base.httpRequest"',
      mode: 'Optional string: "info" (default), "docs", "search_properties", "versions", "compare", "breaking", "migrations"',
      detail: 'Optional string: "minimal", "standard" (default), "full"',
      propertyQuery: 'For mode="search_properties": search term like "auth"'
    }
  },

  // Workflow validation
  n8n_workflow_json_validate: {
    description: 'Validate a workflow JSON object locally without calling n8n. Use this when you want to check a workflow structure before API calls or deployment. Provide a workflow object (nodes and connections) and optional options for validation depth. Returns validity, summary, errors, warnings, and suggestions.',
    params: {
      workflow: 'Object with two required fields: nodes (array) and connections (object). Example: {"nodes": [{"name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [250, 300], "parameters": {}}], "connections": {}}',
      options: 'Optional object. Example: {"validateNodes": true, "validateConnections": true, "validateExpressions": true, "profile": "runtime"}'
    }
  },

  // Consolidated template search (replaces n8n_templates_search, list_node_templates, search_templates_by_metadata, get_templates_for_task)
  n8n_templates_search: {
    description: 'Search the local workflow templates catalog. Use this when you want to discover templates by keyword, node types, task, or metadata filters. Provide searchMode and matching parameters plus limit/offset for pagination. Returns a list of templates with summary metadata and tips.',
    params: {
      query: 'For searchMode="keyword": string keyword like "chatbot"',
      searchMode: 'Optional: "keyword" (default), "by_nodes", "by_task", "by_metadata"',
      nodeTypes: 'For searchMode="by_nodes": array like ["n8n-nodes-base.httpRequest"]',
      task: 'For searchMode="by_task": task like "webhook_processing", "ai_automation"',
      limit: 'Optional number, default 20'
    }
  },

  n8n_template_get: {
    description: 'Fetch a workflow template by templateId from the local template database. Use this when you already know the template ID and need its structure. Provide templateId and optional mode to control response size (nodes_only, structure, full). Returns template data suitable for analysis or import.',
    params: {
      templateId: 'Number ID like 1234',
      mode: 'Optional: "full" (default), "nodes_only", "structure"'
    }
  },

  // Documentation tool
  n8n_tools_documentation: {
    description: 'Fetch the built-in documentation for n8n MCP tools and guides. Use this when you need usage guidance, examples, or the tool index. Provide topic for a specific tool or "overview", and set depth to control verbosity. Returns Markdown content.',
    params: {
      depth: 'Optional string: "essentials" (default) or "full"',
      topic: 'Optional string tool name like "n8n_nodes_search"'
    }
  },

  n8n_workflow_file_patch: {
    description: 'Apply a unified diff patch to a workflow file (Code or Set). Wrapper-style patches (*** Begin/End Patch, ---/+++) are accepted and stripped. Use this when you need to edit part of a file without sending full contents. Provide uri, patch, and optional expectedEtag.',
    params: {
      uri: 'String resource URI like "n8n-workflows:///code/<workflowId>/<nodeId>.json"',
      patch: 'Unified diff string',
      expectedEtag: 'Optional string for optimistic concurrency control',
      minContextLines: 'Optional integer: minimum context lines that must match (default 0)',
      maxFuzz: 'Optional integer: maximum fuzz allowed (default 0, max 2)',
      ignoreWhitespaceInContext: 'Optional boolean: ignore whitespace differences in context matching'
    }
  },

  n8n_code_node_test: {
    description: 'Execute a Code node from an existing workflow using the utility runner. Provide workflowId and nodeId or nodeName, plus optional items/item for input. Returns the Code node output.',
    params: {
      workflowId: 'String workflow ID',
      nodeId: 'Optional string Code node ID (preferred)',
      nodeName: 'Optional string Code node name (used if nodeId not provided)',
      items: 'Optional array of items (full n8n items or plain objects)',
      item: 'Optional single object input',
      runnerWorkflowId: 'Optional string runner workflow ID override',
      runnerWebhookPath: 'Optional string runner webhook path (default mcp-code-node-runner)',
      waitForResponse: 'Optional boolean (default true)'
    }
  }
};

/**
 * Apply n8n-friendly descriptions to tools
 * This function modifies tool descriptions to be more explicit for n8n's AI agent
 */
export function makeToolsN8nFriendly(tools: any[]): any[] {
  return tools.map(tool => {
    const toolName = tool.name as string;
    const friendlyDesc = n8nFriendlyDescriptions[toolName];
    if (friendlyDesc) {
      // Clone the tool to avoid mutating the original
      const updatedTool = { ...tool };
      
      // Update the main description
      updatedTool.description = friendlyDesc.description;
      
      // Clone inputSchema if it exists
      if (tool.inputSchema?.properties) {
        updatedTool.inputSchema = {
          ...tool.inputSchema,
          properties: { ...tool.inputSchema.properties }
        };
        
        // Update parameter descriptions
        Object.keys(updatedTool.inputSchema.properties).forEach(param => {
          if (friendlyDesc.params[param]) {
            updatedTool.inputSchema.properties[param] = {
              ...updatedTool.inputSchema.properties[param],
              description: friendlyDesc.params[param]
            };
          }
        });
      }
      
      return updatedTool;
    }
    return tool;
  });
}
