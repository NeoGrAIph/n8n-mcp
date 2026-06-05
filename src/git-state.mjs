import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function gitSummary(config) {
  try {
    const cwd = config.gitRoot || config.root;
    const gitRoot = await git(cwd, ['rev-parse', '--show-toplevel']);
    const branch = await git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
    const head = await git(cwd, ['rev-parse', '--short=12', 'HEAD']);
    const status = await git(cwd, ['status', '--porcelain=v1', '--', config.root]);
    const lines = status.split('\n').filter(Boolean);
    return {
      available: true,
      gitRoot,
      branch,
      head,
      dirty: lines.length > 0,
      dirtyCount: lines.length,
      dirtyByKind: classifyStatus(lines)
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

export async function targetGitStatus(config, filePath) {
  try {
    const status = await git(config.gitRoot || config.root, ['status', '--porcelain=v1', '--', filePath]);
    const lines = status.split('\n').filter(Boolean);
    return { available: true, dirty: lines.length > 0, status: lines };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

function classifyStatus(lines) {
  const result = { workflowJson: 0, codeSetFile: 0, runtimeHash: 0, runtimeIndex: 0, debeziumOffset: 0, other: 0 };
  for (const line of lines) {
    const file = line.slice(3);
    if (file.includes('/.index/') || file.startsWith('.index/')) result.runtimeIndex += 1;
    else if (file.includes('.debezium-offsets-')) result.debeziumOffset += 1;
    else if (file.endsWith('.hash')) result.runtimeHash += 1;
    else if (/code_nodes_[^/]+\/[0-9a-fA-F-]{36}\.(py|json|set\.json)$/.test(file)) result.codeSetFile += 1;
    else if (/^[^?].*\.json$/.test(path.basename(file))) result.workflowJson += 1;
    else result.other += 1;
  }
  return result;
}

async function git(cwd, args) {
  const { stdout } = await execFileAsync('git', ['-c', 'core.optionalLocks=false', ...args], { cwd, timeout: 5000, maxBuffer: 1024 * 1024 });
  return stdout.trim();
}
