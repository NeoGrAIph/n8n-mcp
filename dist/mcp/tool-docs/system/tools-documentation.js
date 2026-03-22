"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsDocumentationDoc = void 0;
exports.toolsDocumentationDoc = {
    name: 'n8n_tools_documentation',
    category: 'system',
    essentials: {
        description: 'The meta-documentation tool. Returns documentation for any MCP tool, including itself. Call without parameters for a comprehensive overview of all available tools. This is your starting point for discovering n8n MCP capabilities.',
        keyParameters: ['topic', 'depth'],
        example: 'n8n_tools_documentation({topic: "n8n_nodes_search"})',
        performance: 'Instant (static content)',
        tips: [
            'Call without parameters first to see all tools',
            'Can document itself: n8n_tools_documentation({topic: "n8n_tools_documentation"})',
            'Workflow files resources guide: n8n_tools_documentation({topic: "workflow_files_resources_guide"})',
            'Use depth:"full" for comprehensive details'
        ]
    },
    full: {
        description: 'The self-referential documentation system for all MCP tools. This tool can document any other tool, including itself. It\'s the primary discovery mechanism for understanding what tools are available and how to use them. Returns utilitarian documentation optimized for AI agent consumption.',
        parameters: {
            topic: { type: 'string', description: 'Tool name (e.g., "n8n_nodes_search"), special topic ("javascript_code_node_guide", "python_code_node_guide"), or "overview". Leave empty for quick reference.', required: false },
            depth: { type: 'string', description: 'Level of detail: "essentials" (default, concise) or "full" (comprehensive with examples)', required: false }
        },
        returns: 'Markdown-formatted documentation tailored for the requested tool and depth. For essentials: key info, parameters, example, tips. For full: complete details, all examples, use cases, best practices.',
        examples: [
            '// Get started - see all available tools',
            'n8n_tools_documentation()',
            '',
            '// Learn about a specific tool',
            'n8n_tools_documentation({topic: "n8n_nodes_search"})',
            '',
            '// Get comprehensive details',
            'n8n_tools_documentation({topic: "n8n_workflow_json_validate", depth: "full"})',
            '',
            '// Self-referential example - document this tool',
            'n8n_tools_documentation({topic: "n8n_tools_documentation", depth: "full"})',
            '',
            '// Code node guides',
            'n8n_tools_documentation({topic: "javascript_code_node_guide"})',
            'n8n_tools_documentation({topic: "python_code_node_guide"})',
            '',
            '// Workflow files resources guide',
            'n8n_tools_documentation({topic: "workflow_files_resources_guide"})'
        ],
        useCases: [
            'Initial discovery of available MCP tools',
            'Learning how to use specific tools',
            'Finding required and optional parameters',
            'Getting working examples to copy',
            'Understanding tool performance characteristics',
            'Discovering related tools for workflows'
        ],
        performance: 'Instant - all documentation is pre-loaded in memory',
        bestPractices: [
            'Always start with n8n_tools_documentation() to see available tools',
            'Use essentials for quick parameter reference during coding',
            'Switch to full depth when debugging or learning new tools',
            'Check Code node guides when working with Code nodes'
        ],
        pitfalls: [
            'Tool names must match exactly - use the overview to find correct names',
            'Not all internal functions are documented',
            'Special topics (code guides) require exact names'
        ],
        relatedTools: ['n8n_health_check for verifying API connection', 'n8n_templates_search for workflow examples', 'n8n_nodes_search for finding nodes']
    }
};
//# sourceMappingURL=tools-documentation.js.map