"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchNodesDoc = void 0;
exports.searchNodesDoc = {
    name: 'n8n_nodes_search',
    category: 'discovery',
    essentials: {
        description: 'Text search across node names and descriptions. Returns most relevant nodes first, with frequently-used nodes (HTTP Request, Webhook, Set, Code, Slack) prioritized in results. Searches all 500+ nodes in the database.',
        keyParameters: ['query', 'mode', 'limit'],
        example: 'n8n_nodes_search({query: "webhook"})',
        performance: '<20ms even for complex queries',
        tips: [
            'OR mode (default): Matches any search word',
            'AND mode: Requires all words present',
            'FUZZY mode: Handles typos and spelling errors',
            'Use quotes for exact phrases: "google sheets"'
        ]
    },
    full: {
        description: 'Full-text search engine for n8n nodes using SQLite FTS5. Searches across node names, descriptions, and aliases. Results are ranked by relevance with commonly-used nodes given priority. Common nodes include: HTTP Request, Webhook, Set, Code, IF, Switch, Merge, SplitInBatches, Slack, Google Sheets.',
        parameters: {
            query: { type: 'string', description: 'Search keywords. Use quotes for exact phrases like "google sheets"', required: true },
            limit: { type: 'number', description: 'Maximum results to return. Default: 20, Max: 100', required: false },
            mode: { type: 'string', description: 'Search mode: "OR" (any word matches, default), "AND" (all words required), "FUZZY" (typo-tolerant)', required: false }
        },
        returns: 'Array of node objects sorted by relevance score. Each object contains: nodeType, displayName, description, category, relevance score. Common nodes appear first when relevance is similar.',
        examples: [
            'n8n_nodes_search({query: "webhook"}) - Returns Webhook node as top result',
            'n8n_nodes_search({query: "database"}) - Returns MySQL, Postgres, MongoDB, Redis, etc.',
            'n8n_nodes_search({query: "google sheets", mode: "AND"}) - Requires both words',
            'n8n_nodes_search({query: "slak", mode: "FUZZY"}) - Finds Slack despite typo',
            'n8n_nodes_search({query: "http api"}) - Finds HTTP Request, GraphQL, REST nodes',
            'n8n_nodes_search({query: "transform data"}) - Finds Set, Code, Function, Item Lists nodes'
        ],
        useCases: [
            'Finding nodes when you know partial names',
            'Discovering nodes by functionality (e.g., "email", "database", "transform")',
            'Handling user typos in node names',
            'Finding all nodes related to a service (e.g., "google", "aws", "microsoft")'
        ],
        performance: '<20ms for simple queries, <50ms for complex FUZZY searches. Uses FTS5 index for speed',
        bestPractices: [
            'Start with single keywords for broadest results',
            'Use FUZZY mode when users might misspell node names',
            'AND mode works best for 2-3 word searches',
            'Combine with n8n_node_get after finding the right node'
        ],
        pitfalls: [
            'AND mode searches all fields (name, description) not just node names',
            'FUZZY mode with very short queries (1-2 chars) may return unexpected results',
            'Exact matches in quotes are case-sensitive'
        ],
        relatedTools: ['n8n_node_get to configure found nodes', 'n8n_templates_search to find workflow examples', 'n8n_node_validate to check configurations']
    }
};
//# sourceMappingURL=search-nodes.js.map