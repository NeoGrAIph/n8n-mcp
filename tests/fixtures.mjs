import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function createWorkflowFixture() {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'synestra-n8n-gitops-mcp-'));
  const root = path.join(repo, 'workflows');
  const workflowId = '6Us3YRUh4tkTEqvCiN12M';
  const nodeId = '33ddbc44-7e74-4edb-aa4d-05790de9b5eb';
  const setNodeId = '11111111-2222-3333-4444-555555555555';
  const workflowDir = path.join(root, 'development');
  const codeDir = path.join(workflowDir, `code_nodes_${workflowId}`);
  await fs.mkdir(path.join(root, '.index'), { recursive: true });
  await fs.mkdir(codeDir, { recursive: true });
  await fs.writeFile(path.join(root, '.index', `${workflowId}.path`), 'development\n');
  await fs.writeFile(path.join(workflowDir, `${workflowId}.fixture.json`), JSON.stringify({
    name: 'fixture',
    workflow_id: workflowId,
    workflow: {
      name: 'fixture',
      nodes: [
        {
          id: nodeId,
          name: 'Python Code',
          type: 'n8n-nodes-base.code',
          parameters: { language: 'pythonNative', pythonCode: 'print("before")' }
        },
        {
          id: setNodeId,
          name: 'Raw Set',
          type: 'n8n-nodes-base.set',
          parameters: { mode: 'raw', jsonOutput: '{"ok":true}' }
        }
      ],
      connections: {},
      settings: {}
    }
  }, null, 2));
  await fs.writeFile(path.join(codeDir, `${nodeId}.py`), 'print("before")\n');
  await fs.writeFile(path.join(codeDir, `${setNodeId}.set.json`), '{"ok":true}\n');
  await execFileAsync('git', ['init', '-b', 'main'], { cwd: repo });
  await execFileAsync('git', ['add', '.'], { cwd: repo });
  await execFileAsync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'fixture'], { cwd: repo });
  return {
    repo,
    root,
    workflowId,
    nodeId,
    setNodeId,
    codeUri: `synestra-n8n-workflows:///code/${workflowId}/${nodeId}.py`,
    setUri: `synestra-n8n-workflows:///set/${workflowId}/${setNodeId}.set.json`,
    config: {
      root,
      gitRoot: repo,
      displayRoot: '~/repo/n8n-workflows/dev/workflows',
      serviceEnv: 'dev',
      writePolicy: 'off',
      expectedBranch: 'main',
      maxFileBytes: 262144,
      settleTimeoutMs: 1000,
      settleStableReads: 1,
      allowMissingIndexReadOnly: false
    }
  };
}
