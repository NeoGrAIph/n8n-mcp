import { describe, expect, it } from 'vitest';
import { n8nManagementTools } from '@/mcp/tools-n8n-manager';

describe('n8nManagementTools', () => {
  it('should expose n8n_workflow_runner_test with workflowId required', () => {
    const tool = n8nManagementTools.find(entry => entry.name === 'n8n_workflow_runner_test');

    expect(tool).toBeDefined();
    expect(tool?.inputSchema.required).toContain('workflowId');
    expect(tool?.inputSchema.properties?.dryRun).toBeDefined();
    expect(tool?.inputSchema.properties?.diagnostics?.enum).toEqual(['none', 'preview', 'summary', 'full', 'error']);
  });

  it('should keep n8n_workflow_test limited to external trigger types', () => {
    const tool = n8nManagementTools.find(entry => entry.name === 'n8n_workflow_test');

    expect(tool).toBeDefined();
    expect(tool?.inputSchema.properties?.triggerType?.enum).toEqual(['webhook', 'form', 'chat']);
  });

  it('should keep n8n_code_node_test mode schema but describe full-mode migration', () => {
    const tool = n8nManagementTools.find(entry => entry.name === 'n8n_code_node_test');

    expect(tool).toBeDefined();
    expect(tool?.inputSchema.properties?.mode?.enum).toEqual(['full', 'node', 'subgraph']);
    expect(tool?.inputSchema.properties?.mode?.description).toContain('n8n_workflow_runner_test');
  });
});
