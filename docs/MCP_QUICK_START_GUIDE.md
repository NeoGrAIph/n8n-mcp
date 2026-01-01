# MCP Implementation Quick Start Guide

This guide shows how to implement the **consolidated `n8n_get_node` tool** with detail levels and property search.

## Immediate Actions (Day 1)

### 1. Create Essential Properties Configuration

Create `src/data/essential-properties.json`:
```json
{
  "nodes-base.httpRequest": {
    "required": ["url"],
    "common": ["method", "authentication", "sendBody", "contentType", "sendHeaders"],
    "examples": {
      "minimal": {
        "url": "https://api.example.com/data"
      },
      "getWithAuth": {
        "method": "GET",
        "url": "https://api.example.com/protected",
        "authentication": "genericCredentialType",
        "genericAuthType": "headerAuth"
      },
      "postJson": {
        "method": "POST",
        "url": "https://api.example.com/create",
        "sendBody": true,
        "contentType": "json",
        "jsonBody": "{ \"name\": \"example\" }"
      }
    }
  },
  "nodes-base.webhook": {
    "required": [],
    "common": ["path", "method", "responseMode", "responseData"],
    "examples": {
      "minimal": {
        "path": "webhook",
        "method": "POST"
      }
    }
  }
}
```

### 2. Implement `n8n_get_node` (detail: standard/minimal)

Add to `src/mcp/server.ts`:

```typescript
// Add to tool implementations
case "n8n_get_node": {
  const {
    nodeType,
    detail = "standard",
    mode = "info",
    includeExamples = true
  } = request.params.arguments as {
    nodeType: string;
    detail?: "minimal" | "standard" | "full";
    mode?: "info" | "docs" | "search_properties";
    includeExamples?: boolean;
  };

  if (mode === "search_properties") {
    // handled in Day 2-3 section
  }

  if (detail === "full") {
    // Return full node info (existing full builder)
    return await service.getNodeFullInfo(nodeType);
  }

  // Standard/minimal detail: use essentials config
  const essentialsConfig = require("../data/essential-properties.json");
  const nodeConfig = essentialsConfig[nodeType];

  const node = await service.getNodeByType(nodeType);
  if (!node) {
    return { error: `Node type ${nodeType} not found` };
  }

  const properties = JSON.parse(node.properties_schema || "[]");
  const required = nodeConfig?.required ?? [];
  const common = nodeConfig?.common ?? properties.slice(0, 5).map((p: any) => p.name);

  const requiredProps = required.map((name: string) => {
    const prop = findPropertyByName(properties, name);
    return prop ? simplifyProperty(prop) : null;
  }).filter(Boolean);

  const commonProps = common.map((name: string) => {
    const prop = findPropertyByName(properties, name);
    return prop ? simplifyProperty(prop) : null;
  }).filter(Boolean);

  return {
    nodeType,
    displayName: node.display_name,
    description: node.description,
    requiredProperties: requiredProps,
    commonProperties: commonProps,
    examples: includeExamples ? (nodeConfig?.examples || {}) : {}
  };
}

// Helper functions
function simplifyProperty(prop: any) {
  return {
    name: prop.name,
    type: prop.type,
    description: prop.description || prop.displayName || "",
    default: prop.default,
    options: prop.options?.map((opt: any) =>
      typeof opt === "string" ? opt : opt.value
    ),
    placeholder: prop.placeholder
  };
}

function findPropertyByName(properties: any[], name: string): any {
  for (const prop of properties) {
    if (prop.name === name) return prop;
    if (prop.type === "collection" && prop.options) {
      const found = findPropertyByName(prop.options, name);
      if (found) return found;
    }
  }
  return null;
}
```

### 3. Add Tool Definition

Add to tool definitions:

```typescript
{
  name: "n8n_get_node",
  description: "Get node info with detail levels and modes (info/docs/search_properties). Use detail='standard' for essentials.",
  inputSchema: {
    type: "object",
    properties: {
      nodeType: {
        type: "string",
        description: "The node type (e.g., 'nodes-base.httpRequest')"
      },
      detail: {
        type: "string",
        enum: ["minimal", "standard", "full"]
      },
      mode: {
        type: "string",
        enum: ["info", "docs", "search_properties"]
      },
      includeExamples: {
        type: "boolean"
      },
      propertyQuery: {
        type: "string",
        description: "For mode=search_properties"
      }
    },
    required: ["nodeType"]
  }
}
```

### 4. Create Property Parser Service

Create `src/services/property-parser.ts`:

```typescript
export class PropertyParser {
  /**
   * Parse nested properties and flatten to searchable format
   */
  static parseProperties(properties: any[], path = ""): ParsedProperty[] {
    const results: ParsedProperty[] = [];

    for (const prop of properties) {
      const currentPath = path ? `${path}.${prop.name}` : prop.name;

      // Add current property
      results.push({
        name: prop.name,
        path: currentPath,
        type: prop.type,
        description: prop.description || prop.displayName || "",
        required: prop.required || false,
        displayConditions: prop.displayOptions,
        default: prop.default,
        options: prop.options?.filter((opt: any) => typeof opt === "string" || opt.value)
      });

      // Recursively parse nested properties
      if (prop.type === "collection" && prop.options) {
        results.push(...this.parseProperties(prop.options, currentPath));
      } else if (prop.type === "fixedCollection" && prop.options) {
        for (const option of prop.options) {
          if (option.values) {
            results.push(...this.parseProperties(option.values, `${currentPath}.${option.name}`));
          }
        }
      }
    }

    return results;
  }

  /**
   * Find properties matching a search query
   */
  static searchProperties(properties: ParsedProperty[], query: string): ParsedProperty[] {
    const lowerQuery = query.toLowerCase();
    return properties.filter(prop =>
      prop.name.toLowerCase().includes(lowerQuery) ||
      prop.description.toLowerCase().includes(lowerQuery) ||
      prop.path.toLowerCase().includes(lowerQuery)
    );
  }
}
```

### 5. Quick Test Script

Create `scripts/test-essentials.ts`:

```typescript
import { MCPClient } from "../src/mcp/client";

async function testEssentials() {
  const client = new MCPClient();

  console.log("Testing n8n_get_node (standard)...\n");

  // Test HTTP Request node
  const httpEssentials = await client.call("n8n_get_node", {
    nodeType: "nodes-base.httpRequest",
    detail: "standard",
    includeExamples: true
  });

  console.log("HTTP Request Essentials:");
  console.log(`- Required: ${httpEssentials.requiredProperties.map((p: any) => p.name).join(", ")}`);
  console.log(`- Common: ${httpEssentials.commonProperties.map((p: any) => p.name).join(", ")}`);
  console.log(`- Total properties: ${httpEssentials.requiredProperties.length + httpEssentials.commonProperties.length}`);

  // Compare with full response
  const fullInfo = await client.call("n8n_get_node", {
    nodeType: "nodes-base.httpRequest",
    detail: "full"
  });

  const fullSize = JSON.stringify(fullInfo).length;
  const essentialSize = JSON.stringify(httpEssentials).length;

  console.log("\nSize comparison:");
  console.log(`- Full response: ${(fullSize / 1024).toFixed(1)}KB`);
  console.log(`- Standard response: ${(essentialSize / 1024).toFixed(1)}KB`);
  console.log(`- Reduction: ${((1 - essentialSize / fullSize) * 100).toFixed(1)}%`);
}

testEssentials().catch(console.error);
```

## Day 2-3: Implement search_properties mode

Add a branch inside the `n8n_get_node` handler:

```typescript
if (mode === "search_properties") {
  const { propertyQuery = "" } = request.params.arguments as { propertyQuery?: string };

  const node = await service.getNodeByType(nodeType);
  if (!node) {
    return { error: `Node type ${nodeType} not found` };
  }

  const properties = JSON.parse(node.properties_schema || "[]");
  const parsed = PropertyParser.parseProperties(properties);
  const matches = PropertyParser.searchProperties(parsed, propertyQuery);

  return {
    nodeType,
    query: propertyQuery,
    matches: matches.map(prop => ({
      name: prop.name,
      type: prop.type,
      path: prop.path,
      description: prop.description,
      visibleWhen: prop.displayConditions?.show
    })),
    totalMatches: matches.length
  };
}
```

## Day 4-5: Implement task templates (via n8n_search_templates)

Create `src/data/task-templates.json` and expose task search via `n8n_search_templates` (`searchMode: "by_task"`). Example entry:

```json
{
  "post_json_request": {
    "description": "Make a POST request with JSON data",
    "nodeType": "nodes-base.httpRequest",
    "configuration": {
      "method": "POST",
      "url": "",
      "sendBody": true,
      "contentType": "json",
      "specifyBody": "json",
      "jsonBody": ""
    },
    "userMustProvide": [
      { "property": "url", "description": "API endpoint URL" },
      { "property": "jsonBody", "description": "JSON data to send" }
    ],
    "optionalEnhancements": [
      { "property": "authentication", "description": "Add authentication if required" },
      { "property": "sendHeaders", "description": "Add custom headers" }
    ]
  }
}
```

## Testing Checklist

- [ ] Test `n8n_get_node` (detail: standard) with HTTP Request node
- [ ] Verify size reduction is >90%
- [ ] Test with Webhook, Agent, and Code nodes
- [ ] Validate examples work correctly
- [ ] Test `mode: "search_properties"` functionality
- [ ] Verify task templates are valid
- [ ] Check backward compatibility
- [ ] Measure response times (<100ms)

## Success Indicators

1. **Immediate (Day 1)**:
   - `n8n_get_node` (detail: standard) returns <5KB for HTTP Request
   - Response includes working examples
   - No errors with top 10 nodes

2. **Week 1**:
   - 90% reduction in response size
   - Property search working
   - 5+ task templates created
   - Positive AI agent feedback

3. **Month 1**:
   - All tools implemented
   - 50+ nodes optimized
   - Configuration time <1 minute
   - Error rate <10%
