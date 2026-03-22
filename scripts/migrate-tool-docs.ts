#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

// This is a helper script to migrate tool documentation to the new structure
// It creates a template file for each tool that needs to be migrated

const toolsByCategory = {
  discovery: [
    'n8n_nodes_search',
    'list_nodes', 
    'list_ai_tools',
    'get_database_statistics'
  ],
  configuration: [
    'get_node_info',
    'get_node_essentials',
    'get_node_documentation',
    'search_node_properties',
    'get_node_as_tool_info',
    'get_property_dependencies'
  ],
  validation: [
    'n8n_node_validate_minimal',
    'n8n_node_validate_operation',
    'n8n_workflow_json_validate',
    'validate_workflow_connections',
    'validate_workflow_expressions'
  ],
  templates: [
    'get_node_for_task',
    'list_tasks',
    'list_node_templates',
    'n8n_template_get',
    'n8n_templates_search',
    'get_templates_for_task'
  ],
  workflow_management: [
    'n8n_workflow_create',
    'n8n_workflow_get',
    'n8n_workflow_get_details',
    'n8n_workflow_get_structure',
    'n8n_workflow_get_minimal',
    'n8n_workflow_update_full',
    'n8n_workflow_update_partial',
    'n8n_workflow_delete',
    'n8n_workflows_list',
    'n8n_workflow_validate',
    'n8n_workflow_test',
    'n8n_executions_get',
    'n8n_executions_list',
    'n8n_executions_delete'
  ],
  system: [
    'n8n_tools_documentation',
    'n8n_diagnostic',
    'n8n_health_check',
    'n8n_list_available_tools'
  ],
  special: [
    'code_node_guide'
  ]
};

const template = (toolName: string, category: string) => `import { ToolDocumentation } from '../types';

export const ${toCamelCase(toolName)}Doc: ToolDocumentation = {
  name: '${toolName}',
  category: '${category}',
  essentials: {
    description: 'TODO: Add description from old file',
    keyParameters: ['TODO'],
    example: '${toolName}({TODO})',
    performance: 'TODO',
    tips: [
      'TODO: Add tips'
    ]
  },
  full: {
    description: 'TODO: Add full description',
    parameters: {
      // TODO: Add parameters
    },
    returns: 'TODO: Add return description',
    examples: [
      '${toolName}({TODO}) - TODO'
    ],
    useCases: [
      'TODO: Add use cases'
    ],
    performance: 'TODO: Add performance description',
    bestPractices: [
      'TODO: Add best practices'
    ],
    pitfalls: [
      'TODO: Add pitfalls'
    ],
    relatedTools: ['TODO']
  }
};`;

function toCamelCase(str: string): string {
  return str.split('_').map((part, index) => 
    index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

function toKebabCase(str: string): string {
  return str.replace(/_/g, '-');
}

// Create template files for tools that don't exist yet
Object.entries(toolsByCategory).forEach(([category, tools]) => {
  tools.forEach(toolName => {
    const fileName = toKebabCase(toolName) + '.ts';
    const filePath = path.join('src/mcp/tool-docs', category, fileName);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${filePath} already exists`);
      return;
    }
    
    // Create the file with template
    fs.writeFileSync(filePath, template(toolName, category));
    console.log(`✨ Created ${filePath}`);
  });
  
  // Create index file for the category
  const indexPath = path.join('src/mcp/tool-docs', category, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    const indexContent = tools.map(toolName => 
      `export { ${toCamelCase(toolName)}Doc } from './${toKebabCase(toolName)}';`
    ).join('\n');
    
    fs.writeFileSync(indexPath, indexContent);
    console.log(`✨ Created ${indexPath}`);
  }
});

console.log('\n📝 Migration templates created!');
console.log('Next steps:');
console.log('1. Copy documentation from the old tools-documentation.ts file');
console.log('2. Update each template file with the actual documentation');
console.log('3. Update src/mcp/tool-docs/index.ts to import all tools');
console.log('4. Replace the old tools-documentation.ts with the new one');