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
  // Consolidated validation tool (replaces legacy n8n_validate_node_* variants)
  n8n_validate_node: {
    description: 'Validate a node configuration against its schema. Provide nodeType and config, and set mode to minimal or full with an optional profile for strictness. Returns a structured validation result with errors, warnings, and suggestions.',
    params: {
      nodeType: 'String value like "nodes-base.slack"',
      config: 'Object value like {"resource": "channel", "operation": "create"} or empty object {}',
      mode: 'Optional string: "full" (default) or "minimal"',
      profile: 'Optional string: "minimal" or "runtime" or "ai-friendly" or "strict"'
    }
  },

  // Search tool
  n8n_search_nodes: {
    description: 'Search the local n8n node catalog by keyword to discover node types. Provide query plus optional limit/mode and includeExamples to control matching and sample configs. Returns a ranked list of node types with basic metadata.',
    params: {
      query: 'String keyword like "webhook" or "database"',
      limit: 'Optional number, default 20'
    }
  },

  // Consolidated node info tool (replaces get_node_info, get_node_essentials, get_node_documentation, search_node_properties)
  n8n_get_node: {
    description: 'Retrieve detailed metadata for a specific node type. Provide nodeType and optionally detail/mode; use mode=docs for Markdown or mode=search_properties with propertyQuery. Returns node schema metadata and focused docs/search results.',
    params: {
      nodeType: 'String with prefix like "nodes-base.httpRequest"',
      mode: 'Optional string: "info" (default), "docs", "search_properties", "versions", "compare", "breaking", "migrations"',
      detail: 'Optional string: "minimal", "standard" (default), "full"',
      propertyQuery: 'For mode="search_properties": search term like "auth"'
    }
  },

  // Workflow validation
  n8n_validate_workflow_json: {
    description: 'Validate a workflow JSON object locally without calling n8n. Provide workflow with nodes and connections, plus optional options to control validation depth. Returns validity, summary, errors, warnings, and suggestions.',
    params: {
      workflow: 'Object with two required fields: nodes (array) and connections (object). Example: {"nodes": [{"name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [250, 300], "parameters": {}}], "connections": {}}',
      options: 'Optional object. Example: {"validateNodes": true, "validateConnections": true, "validateExpressions": true, "profile": "runtime"}'
    }
  },

  // Consolidated template search (replaces n8n_search_templates, list_node_templates, search_templates_by_metadata, get_templates_for_task)
  n8n_search_templates: {
    description: 'Search the local workflow templates catalog. Choose searchMode and provide matching parameters (query, nodeTypes, task, or metadata filters) plus limit/offset for pagination. Returns a list of templates with summary metadata and tips.',
    params: {
      query: 'For searchMode="keyword": string keyword like "chatbot"',
      searchMode: 'Optional: "keyword" (default), "by_nodes", "by_task", "by_metadata"',
      nodeTypes: 'For searchMode="by_nodes": array like ["n8n-nodes-base.httpRequest"]',
      task: 'For searchMode="by_task": task like "webhook_processing", "ai_automation"',
      limit: 'Optional number, default 20'
    }
  },

  n8n_get_template: {
    description: 'Fetch a workflow template from the local template database by templateId. Use mode to control response size (nodes_only, structure, full). Returns template data suitable for analysis or import.',
    params: {
      templateId: 'Number ID like 1234',
      mode: 'Optional: "full" (default), "nodes_only", "structure"'
    }
  },

  // Documentation tool
  n8n_tools_documentation: {
    description: 'Fetch the built-in documentation for n8n MCP tools and guides. Use topic to target a specific tool or "overview" for the index, and set depth to control verbosity. Returns Markdown with usage guidance, examples, and best practices.',
    params: {
      depth: 'Optional string: "essentials" (default) or "full"',
      topic: 'Optional string tool name like "n8n_search_nodes"'
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
