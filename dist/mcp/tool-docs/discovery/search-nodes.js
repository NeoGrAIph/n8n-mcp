"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchNodesDoc = void 0;
exports.searchNodesDoc = {
    name: 'n8n_nodes_search',
    category: 'discovery',
    essentials: {
        description: 'Text search across node names and descriptions. Returns most relevant nodes first, with frequently-used nodes (HTTP Request, Webhook, Set, Code, Slack) prioritized in results. Searches all 800+ nodes including 300+ verified community nodes.',
        keyParameters: ['query', 'mode', 'limit', 'source', 'includeExamples'],
        example: 'n8n_nodes_search({query: "webhook"})',
        performance: '<20ms even for complex queries',
        tips: [
            'OR mode (default): Matches any search word',
            'AND mode: Requires all words present',
            'FUZZY mode: Handles typos and spelling errors',
            'Use quotes for exact phrases: "google sheets"',
            'Use source="community" to search only community nodes',
            'Use source="verified" for verified community nodes only'
        ]
    },
    full: {
        description: 'Full-text search engine for n8n nodes using SQLite FTS5. Searches across node names, descriptions, and aliases. Results are ranked by relevance with commonly-used nodes given priority. Includes 500+ core nodes and 300+ community nodes. Common core nodes include: HTTP Request, Webhook, Set, Code, IF, Switch, Merge, SplitInBatches, Slack, Google Sheets. Community nodes include verified integrations like BrightData, ScrapingBee, CraftMyPDF, and more.',
        parameters: {
            query: { type: 'string', description: 'Search keywords. Use quotes for exact phrases like "google sheets"', required: true },
            limit: { type: 'number', description: 'Maximum results to return. Default: 20, Max: 100', required: false },
            mode: { type: 'string', description: 'Search mode: "OR" (any word matches, default), "AND" (all words required), "FUZZY" (typo-tolerant)', required: false },
            source: { type: 'string', description: 'Filter by node source: "all" (default, everything), "core" (n8n base nodes only), "community" (community nodes only), "verified" (verified community nodes only)', required: false },
            includeExamples: { type: 'boolean', description: 'Include top 2 real-world configuration examples from popular templates for each node. Default: false. Adds ~200-400 tokens per node.', required: false }
        },
        returns: 'Array of node objects sorted by relevance score. Each object contains: nodeType, displayName, description, category, relevance score. For community nodes, also includes: isCommunity (boolean), isVerified (boolean), authorName (string), npmDownloads (number). Common nodes appear first when relevance is similar.',
        examples: [
            'n8n_nodes_search({query: "webhook"}) - Returns Webhook node as top result',
            'n8n_nodes_search({query: "database"}) - Returns MySQL, Postgres, MongoDB, Redis, etc.',
            'n8n_nodes_search({query: "google sheets", mode: "AND"}) - Requires both words',
            'n8n_nodes_search({query: "slak", mode: "FUZZY"}) - Finds Slack despite typo',
            'n8n_nodes_search({query: "http api"}) - Finds HTTP Request, GraphQL, REST nodes',
            'n8n_nodes_search({query: "transform data"}) - Finds Set, Code, Function, Item Lists nodes',
            'n8n_nodes_search({query: "scraping", source: "community"}) - Find community scraping nodes',
            'n8n_nodes_search({query: "pdf", source: "verified"}) - Find verified community PDF nodes',
            'n8n_nodes_search({query: "brightdata"}) - Find BrightData community node',
            'n8n_nodes_search({query: "slack", includeExamples: true}) - Get Slack with template examples'
        ],
        useCases: [
            'Finding nodes when you know partial names',
            'Discovering nodes by functionality (e.g., "email", "database", "transform")',
            'Handling user typos in node names',
            'Finding all nodes related to a service (e.g., "google", "aws", "microsoft")',
            'Discovering community integrations for specific services',
            'Finding verified community nodes for enhanced trust'
        ],
        performance: '<20ms for simple queries, <50ms for complex FUZZY searches. Uses FTS5 index for speed',
        bestPractices: [
            'Start with single keywords for broadest results',
            'Use FUZZY mode when users might misspell node names',
            'AND mode works best for 2-3 word searches',
            'Combine with n8n_node_get after finding the right node',
            'Use source="verified" when recommending community nodes for production',
            'Check isVerified flag to ensure community node quality'
        ],
        pitfalls: [
            'AND mode searches all fields (name, description) not just node names',
            'FUZZY mode with very short queries (1-2 chars) may return unexpected results',
            'Exact matches in quotes are case-sensitive',
            'Community nodes require npm installation (n8n npm install <package-name>)',
            'Unverified community nodes (isVerified: false) may have limited support'
        ],
        relatedTools: ['n8n_node_get to configure found nodes', 'n8n_templates_search to find workflow examples', 'n8n_node_validate to check configurations']
    }
};
//# sourceMappingURL=search-nodes.js.map