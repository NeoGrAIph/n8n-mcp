"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.n8nFriendlyDescriptions = void 0;
exports.makeToolsN8nFriendly = makeToolsN8nFriendly;
exports.n8nFriendlyDescriptions = {
    n8n_node_validate: {
        description: 'Validate a node configuration against its schema. Use this when you want to check required fields or perform full validation before building a workflow. Provide nodeType and config, and choose mode (minimal/full) with optional profile. Returns a structured validation result with errors, warnings, and suggestions.',
        params: {
            nodeType: 'String value like "nodes-base.slack"',
            config: 'Object value like {"resource": "channel", "operation": "create"} or empty object {}',
            mode: 'Optional string: "full" (default) or "minimal"',
            profile: 'Optional string: "minimal" or "runtime" or "ai-friendly" or "strict"'
        }
    },
    n8n_nodes_search: {
        description: 'Search the local n8n node catalog by keyword. Use this when you need to discover node types that fit an integration or capability. Provide query and optional limit/mode/includeExamples to adjust matching and sample configs. Returns a ranked list of node types with basic metadata.',
        params: {
            query: 'String keyword like "webhook" or "database"',
            limit: 'Optional number, default 20'
        }
    },
    n8n_node_get: {
        description: 'Retrieve metadata for a specific node type. Use this when you already know the nodeType and need its schema, docs, or property search. Provide nodeType plus optional detail/mode; use mode=docs for Markdown or mode=search_properties with propertyQuery. Returns node schema metadata and focused docs/search results.',
        params: {
            nodeType: 'String with prefix like "nodes-base.httpRequest"',
            mode: 'Optional string: "info" (default), "docs", "search_properties", "versions", "compare", "breaking", "migrations"',
            detail: 'Optional string: "minimal", "standard" (default), "full"',
            propertyQuery: 'For mode="search_properties": search term like "auth"'
        }
    },
    n8n_workflow_json_validate: {
        description: 'Validate a workflow JSON object locally without calling n8n. Use this when you want to check a workflow structure before API calls or deployment. Provide a workflow object (nodes and connections) and optional options for validation depth. Returns validity, summary, errors, warnings, and suggestions.',
        params: {
            workflow: 'Object with two required fields: nodes (array) and connections (object). Example: {"nodes": [{"name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [250, 300], "parameters": {}}], "connections": {}}',
            options: 'Optional object. Example: {"validateNodes": true, "validateConnections": true, "validateExpressions": true, "profile": "runtime"}'
        }
    },
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
    n8n_tools_documentation: {
        description: 'Fetch the built-in documentation for n8n MCP tools and guides. Use this when you need usage guidance, examples, or the tool index. Provide topic for a specific tool or "overview", and set depth to control verbosity. Returns Markdown content.',
        params: {
            depth: 'Optional string: "essentials" (default) or "full"',
            topic: 'Optional string tool name like "n8n_nodes_search"'
        }
    },
    n8n_workflow_file_patch: {
        description: 'Apply a unified diff patch to a workflow file (Code or Set). Use this when you need to edit part of a file without sending full contents. Provide uri, patch, and optional expectedEtag.',
        params: {
            uri: 'String resource URI like "n8n-workflows:///code/<workflowId>/<nodeId>.json"',
            patch: 'Unified diff string',
            expectedEtag: 'Optional string for optimistic concurrency control'
        }
    }
};
function makeToolsN8nFriendly(tools) {
    return tools.map(tool => {
        const toolName = tool.name;
        const friendlyDesc = exports.n8nFriendlyDescriptions[toolName];
        if (friendlyDesc) {
            const updatedTool = { ...tool };
            updatedTool.description = friendlyDesc.description;
            if (tool.inputSchema?.properties) {
                updatedTool.inputSchema = {
                    ...tool.inputSchema,
                    properties: { ...tool.inputSchema.properties }
                };
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
//# sourceMappingURL=tools-n8n-friendly.js.map