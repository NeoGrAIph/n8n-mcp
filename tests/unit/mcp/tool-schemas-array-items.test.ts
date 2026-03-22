import { describe, it, expect } from 'vitest';
import { n8nDocumentationToolsFinal } from '../../../src/mcp/tools';
import { n8nManagementTools } from '../../../src/mcp/tools-n8n-manager';
import { n8nWorkflowFileTools } from '../../../src/mcp/tools-workflow-files';

type AnySchema = Record<string, any>;

function findArraysMissingItems(schema: unknown, path: string): string[] {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  const typedSchema = schema as AnySchema;
  const missing: string[] = [];

  if (typedSchema.type === 'array' && typedSchema.items === undefined) {
    missing.push(path);
  }

  if (typedSchema.properties && typeof typedSchema.properties === 'object') {
    Object.entries(typedSchema.properties).forEach(([key, value]) => {
      missing.push(...findArraysMissingItems(value, `${path}.properties.${key}`));
    });
  }

  if (typedSchema.items !== undefined) {
    missing.push(...findArraysMissingItems(typedSchema.items, `${path}.items`));
  }

  ['oneOf', 'anyOf', 'allOf'].forEach(combinator => {
    const variants = typedSchema[combinator];
    if (Array.isArray(variants)) {
      variants.forEach((variant, index) => {
        missing.push(...findArraysMissingItems(variant, `${path}.${combinator}[${index}]`));
      });
    }
  });

  if (typedSchema.additionalProperties && typeof typedSchema.additionalProperties === 'object') {
    missing.push(...findArraysMissingItems(typedSchema.additionalProperties, `${path}.additionalProperties`));
  }

  return missing;
}

describe('MCP Tool Schemas - array items validation', () => {
  it('should define items for every array schema in all tool input schemas', () => {
    const allTools = [
      ...n8nDocumentationToolsFinal,
      ...n8nManagementTools,
      ...n8nWorkflowFileTools
    ];

    const violations = allTools.flatMap(tool =>
      findArraysMissingItems(tool.inputSchema, 'inputSchema').map(path => `${tool.name}: ${path}`)
    );

    expect(violations).toEqual([]);
  });
});
