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

describe('workflow-files resources behavior', () => {
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

  it('writeWorkflowResource rejects creation when file is absent (read-only semantics)', async () => {
    process.env.N8N_WORKFLOWS_ROOT = rootDir;
    const svc = await import('../../../src/services/workflow-files-service');
    const uri = `n8n-workflows:///code/${WORKFLOW_ID}/${NODE_ID}.py`;

    await expect(svc.writeWorkflowResource(uri, '# new\n')).rejects.toThrow(/Workflow directory not found/);
  });

  it('writeWorkflowResource enforces ETag on existing file', async () => {
    process.env.N8N_WORKFLOWS_ROOT = rootDir;
    const svc = await import('../../../src/services/workflow-files-service');

    const filePath = path.join(rootDir, `code_nodes_${WORKFLOW_ID}`, `${NODE_ID}.py`);
    await writeFile(filePath, '# test\n');
    const { _meta } = await svc.readWorkflowResource(`n8n-workflows:///code/${WORKFLOW_ID}/${NODE_ID}.py`);
    const etag = (_meta as any).etag as string;

    await expect(
      svc.writeWorkflowResource(`n8n-workflows:///code/${WORKFLOW_ID}/${NODE_ID}.py`, '# overwrite\n', 'wrong')
    ).rejects.toThrow(/ETag mismatch/);

    await expect(
      svc.writeWorkflowResource(`n8n-workflows:///code/${WORKFLOW_ID}/${NODE_ID}.py`, '# ok\n', etag)
    ).resolves.toMatchObject({ uri: expect.stringContaining(WORKFLOW_ID) });
  });
});
