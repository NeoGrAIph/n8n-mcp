import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

const WORKFLOW_ID = '6Us3YRUh4tkTEqvCiN12M';
const NODE_ID = '33ddbc44-7e74-4edb-aa4d-05790de9b5eb';

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'n8n-mcp-wf-'));
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

describe('workflow-files-service path fields', () => {
  const prevEnv = { ...process.env };
  let rootDir = '';

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...prevEnv };
    rootDir = await mkTmpDir();
  });

  afterEach(async () => {
    process.env = { ...prevEnv };
    if (rootDir) {
      await fs.rm(rootDir, { recursive: true, force: true });
    }
  });

  it('includes nested folder in relativePath and builds ~/ display path for code files', async () => {
    process.env.N8N_WORKFLOWS_ROOT = rootDir;
    process.env.N8N_WORKFLOWS_DISPLAY_ROOT = '~/repo/n8n-workflows/dev/workflows';

    const filePath = path.join(
      rootDir,
      'development',
      `code_nodes_${WORKFLOW_ID}`,
      `${NODE_ID}.py`
    );
    await writeFile(filePath, '# test\n');

    const svc = await import('../../../src/services/workflow-files-service');
    const files = await svc.listCodeFiles(WORKFLOW_ID);
    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe(
      `development/code_nodes_${WORKFLOW_ID}/${NODE_ID}.py`
    );
    expect(files[0].path).toBe(
      `~/repo/n8n-workflows/dev/workflows/development/code_nodes_${WORKFLOW_ID}/${NODE_ID}.py`
    );

    const read = await svc.readCodeFile(WORKFLOW_ID, NODE_ID);
    expect(read.relativePath).toBe(
      `development/code_nodes_${WORKFLOW_ID}/${NODE_ID}.py`
    );
    expect(read.path).toBe(
      `~/repo/n8n-workflows/dev/workflows/development/code_nodes_${WORKFLOW_ID}/${NODE_ID}.py`
    );
  });

  it('includes nested folder in relativePath and builds ~/ display path for set files', async () => {
    process.env.N8N_WORKFLOWS_ROOT = rootDir;
    process.env.N8N_WORKFLOWS_DISPLAY_ROOT = '~/repo/n8n-workflows/dev/workflows';

    const filePath = path.join(
      rootDir,
      'development',
      `code_nodes_${WORKFLOW_ID}`,
      `${NODE_ID}.set.json`
    );
    await writeFile(filePath, '{"k": "v"}\n');

    const svc = await import('../../../src/services/workflow-files-service');
    const files = await svc.listSetFiles(WORKFLOW_ID);
    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe(
      `development/code_nodes_${WORKFLOW_ID}/${NODE_ID}.set.json`
    );
    expect(files[0].path).toBe(
      `~/repo/n8n-workflows/dev/workflows/development/code_nodes_${WORKFLOW_ID}/${NODE_ID}.set.json`
    );

    const read = await svc.readSetFile(WORKFLOW_ID, NODE_ID);
    expect(read.relativePath).toBe(
      `development/code_nodes_${WORKFLOW_ID}/${NODE_ID}.set.json`
    );
    expect(read.path).toBe(
      `~/repo/n8n-workflows/dev/workflows/development/code_nodes_${WORKFLOW_ID}/${NODE_ID}.set.json`
    );
  });

  it('fails when duplicate workflow directories are present', async () => {
    process.env.N8N_WORKFLOWS_ROOT = rootDir;

    const filePathA = path.join(rootDir, 'envA', `code_nodes_${WORKFLOW_ID}`, `${NODE_ID}.py`);
    const filePathB = path.join(rootDir, 'envB', `code_nodes_${WORKFLOW_ID}`, `${NODE_ID}.py`);
    await writeFile(filePathA, '# a\n');
    await writeFile(filePathB, '# b\n');

    const svc = await import('../../../src/services/workflow-files-service');
    await expect(svc.listCodeFiles(WORKFLOW_ID)).rejects.toThrow(/Multiple workflow directories/);
  });
});
