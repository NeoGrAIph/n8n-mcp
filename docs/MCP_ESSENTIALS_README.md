# n8n MCP Essentials Tools - User Guide

## Overview

n8n MCP now exposes a single `n8n_node_get` tool for node information. Use its **detail levels** to get only what you need:
- `detail: "standard"` for essential properties + examples (recommended default)
- `detail: "minimal"` for the smallest possible response
- `detail: "full"` only when you truly need exhaustive data

This guide focuses on **essential configuration** using `n8n_node_get` with `detail: "standard"`.

## Core Tool: `n8n_node_get` (detail: standard/minimal)

**Purpose**: Get only the 10-20 most important properties for a node instead of 200+

**When to use**:
- Starting to configure a new node
- Need quick access to common properties
- Want working examples
- Building basic workflows

**Example usage**:
```json
{
  "name": "n8n_node_get",
  "arguments": {
    "nodeType": "nodes-base.httpRequest",
    "detail": "standard",
    "includeExamples": true
  }
}
```

**Response structure (standard)**:
```json
{
  "nodeType": "nodes-base.httpRequest",
  "displayName": "HTTP Request",
  "description": "Makes HTTP requests and returns the response data",
  "requiredProperties": [
    {
      "name": "url",
      "displayName": "URL",
      "type": "string",
      "description": "The URL to make the request to",
      "placeholder": "https://api.example.com/endpoint"
    }
  ],
  "commonProperties": [
    {
      "name": "method",
      "type": "options",
      "options": [
        { "value": "GET", "label": "GET" },
        { "value": "POST", "label": "POST" }
      ],
      "default": "GET"
    }
  ],
  "examples": {
    "minimal": {
      "url": "https://api.example.com/data"
    },
    "common": {
      "method": "POST",
      "url": "https://api.example.com/users",
      "sendBody": true,
      "contentType": "json",
      "jsonBody": "{ \"name\": \"John\" }"
    }
  },
  "metadata": {
    "totalProperties": 245,
    "isAITool": false,
    "isTrigger": false
  }
}
```

**Benefits**:
- 95% smaller response (5KB vs 100KB+)
- Only shows properties you actually need
- Includes working examples
- No duplicate or confusing properties
- Clear indication of what's required

## Search Properties with `n8n_node_get` (mode: search_properties)

**Purpose**: Find specific properties within a node without downloading everything

**When to use**:
- Looking for authentication options
- Finding specific configuration like headers or body
- Exploring what options are available
- Need to configure advanced features

**Example usage**:
```json
{
  "name": "n8n_node_get",
  "arguments": {
    "nodeType": "nodes-base.httpRequest",
    "mode": "search_properties",
    "propertyQuery": "auth"
  }
}
```

**Response structure**:
```json
{
  "nodeType": "nodes-base.httpRequest",
  "query": "auth",
  "matches": [
    {
      "name": "authentication",
      "displayName": "Authentication",
      "type": "options",
      "description": "Method of authentication to use",
      "path": "authentication",
      "options": [
        { "value": "none", "label": "None" },
        { "value": "basicAuth", "label": "Basic Auth" }
      ]
    }
  ],
  "totalMatches": 5,
  "searchedIn": "245 properties"
}
```

## Recommended Workflow

### For Basic Configuration

1. **Start with essentials**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", detail: "standard", includeExamples: true})
   ```

2. **Use the provided examples**:
   - Start with `minimal` example
   - Upgrade to `common` for typical use cases
   - Modify based on your needs

3. **Search for specific features** (if needed):
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", mode: "search_properties", propertyQuery: "header"})
   ```

### For Complex Configuration

1. **Get documentation first**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", mode: "docs"})
   ```

2. **Get essentials for the basics**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", detail: "standard", includeExamples: true})
   ```

3. **Search for advanced properties**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", mode: "search_properties", propertyQuery: "proxy"})
   ```

4. **Only use full detail if absolutely necessary**:
   ```
   n8n_node_get({nodeType: "nodes-base.httpRequest", detail: "full"})
   ```

## Common Patterns

### Making API Calls
```javascript
// Start with essentials
const essentials = n8n_node_get({ nodeType: "nodes-base.httpRequest", detail: "standard", includeExamples: true });

// Use the POST example
const config = essentials.examples.common;

// Modify for your needs
config.url = "https://api.myservice.com/endpoint";
config.jsonBody = JSON.stringify({ my: "data" });
```

### Setting up Webhooks
```javascript
// Get webhook essentials
const essentials = n8n_node_get({ nodeType: "nodes-base.webhook", detail: "standard", includeExamples: true });

// Start with minimal
const config = essentials.examples.minimal;
config.path = "my-webhook-endpoint";
```

### Database Operations
```javascript
// Get database essentials
const essentials = n8n_node_get({ nodeType: "nodes-base.postgres", detail: "standard", includeExamples: true });

// Check available operations
const operations = essentials.operations;

// Use appropriate example
const config = essentials.examples.common;
```

## Tips for AI Agents

1. **Always start with n8n_node_get (detail: standard)** - It has everything needed for 90% of use cases
2. **Use examples as templates** - They're tested, working configurations
3. **Search before diving deep** - Use search_properties to find specific options
4. **Check metadata** - Know if you need credentials, if it's a trigger, etc.
5. **Progressive disclosure** - Start simple, add complexity only when needed

## Supported Nodes

The essentials flow has optimized configurations for 20+ commonly used nodes:

- **Core**: httpRequest, webhook, code, set, if, merge, splitInBatches
- **Databases**: postgres, mysql, mongodb, redis
- **Communication**: slack, email, discord
- **Files**: ftp, ssh, googleSheets
- **AI**: openAi, agent
- **Utilities**: executeCommand, function
