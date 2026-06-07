import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { ToolError } from './errors.mjs';

export const WORKFLOW_ID_RE = /^[A-Za-z0-9_-]{8,}$/;
export const NODE_ID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const RESOURCE_SCHEME = 'synestra-n8n-workflows:';

export function buildResourceUri(kind, workflowId, nodeId, ext) {
  if (kind === 'set') return `synestra-n8n-workflows:///set/${workflowId}/${nodeId}.set.json`;
  return `synestra-n8n-workflows:///code/${workflowId}/${nodeId}.${ext}`;
}

export function parseResourceUri(uri) {
  if (typeof uri !== 'string' || uri.length > 512 || uri.includes('\0') || /%2f|%5c/i.test(uri)) throw new ToolError('Invalid resource URI', 'INVALID_URI');
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new ToolError(`Invalid resource URI: ${uri}`, 'INVALID_URI');
  }
  if (parsed.protocol !== RESOURCE_SCHEME) throw new ToolError(`Unsupported resource URI scheme: ${parsed.protocol}`, 'INVALID_URI');
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length !== 3) throw new ToolError(`Invalid resource URI path: ${uri}`, 'INVALID_URI');
  const [kind, workflowId, fileName] = parts;
  assertWorkflowId(workflowId);
  if (kind === 'code') {
    const match = fileName.match(/^([0-9a-fA-F-]{36})\.(py|json)$/);
    if (!match) throw new ToolError(`Invalid Code file name in URI: ${uri}`, 'INVALID_URI');
    assertNodeId(match[1]);
    return { kind: 'code', workflowId, nodeId: match[1], ext: match[2] };
  }
  if (kind === 'set') {
    const match = fileName.match(/^([0-9a-fA-F-]{36})\.set\.json$/);
    if (!match) throw new ToolError(`Invalid Set(raw) file name in URI: ${uri}`, 'INVALID_URI');
    assertNodeId(match[1]);
    return { kind: 'set', workflowId, nodeId: match[1], ext: 'set.json' };
  }
  throw new ToolError(`Unsupported resource kind: ${kind}`, 'INVALID_URI');
}

export function assertWorkflowId(workflowId) {
  if (!WORKFLOW_ID_RE.test(String(workflowId || ''))) throw new ToolError(`Invalid workflowId: ${workflowId}`, 'INVALID_WORKFLOW_ID');
}

export function assertNodeId(nodeId) {
  if (!NODE_ID_RE.test(String(nodeId || ''))) throw new ToolError(`Invalid nodeId: ${nodeId}`, 'INVALID_NODE_ID');
}

export async function resolveWorkflowDir(config, workflowId, { allowArchived = false, requireWorkflowJson = true } = {}) {
  assertWorkflowId(workflowId);
  const rootReal = await fs.realpath(config.root);
  const indexPath = path.join(rootReal, '.index', `${workflowId}.path`);
  let folderRel;
  try {
    folderRel = (await fs.readFile(indexPath, 'utf8')).trim();
  } catch {
    throw new ToolError(`Canonical index entry is missing for workflow ${workflowId}`, 'MISSING_INDEX');
  }
  validateIndexRelativePath(folderRel, allowArchived);
  const workflowDir = path.resolve(rootReal, folderRel || '.');
  assertContainedPath(rootReal, workflowDir, 'Workflow directory escapes root');
  if (!fssync.existsSync(workflowDir)) throw new ToolError(`Workflow directory from index does not exist: ${folderRel || '.'}`, 'STALE_INDEX');
  const dirReal = await fs.realpath(workflowDir);
  assertContainedPath(rootReal, dirReal, 'Workflow directory realpath escapes root');
  if (requireWorkflowJson) await assertWorkflowJsonExists(dirReal, workflowId);
  const codeDir = await resolveCodeDir(rootReal, dirReal, workflowId);
  return {
    rootReal,
    folderRel,
    workflowDir: dirReal,
    codeDir,
    archived: folderRel === '.archived' || folderRel.startsWith('.archived/'),
    indexPath
  };
}

export async function resolveTargetFile(config, uri, options = {}) {
  const parsed = parseResourceUri(uri);
  const workflow = await resolveWorkflowDir(config, parsed.workflowId, options);
  if (workflow.archived && !options.allowArchived) throw new ToolError('Archived workflow files are diagnostics-only and cannot be targeted by file tools', 'ARCHIVED_TARGET');
  const fileName = parsed.kind === 'set' ? `${parsed.nodeId}.set.json` : `${parsed.nodeId}.${parsed.ext}`;
  const filePath = path.join(workflow.codeDir, fileName);
  assertContainedPath(workflow.rootReal, filePath, 'Target file escapes root');
  if (fssync.existsSync(filePath)) {
    const lstat = await fs.lstat(filePath);
    if (lstat.isSymbolicLink()) throw new ToolError('Symlink targets are not allowed', 'SYMLINK_TARGET');
    assertContainedPath(workflow.rootReal, await fs.realpath(filePath), 'Target file realpath escapes root');
  }
  if (options.requireNoDuplicateCodeDir) {
    const duplicates = await findDuplicateCodeDirs(workflow.rootReal, parsed.workflowId, workflow.codeDir);
    if (duplicates.length) throw new ToolError('Duplicate workflow code directories found; refusing mutation', 'DUPLICATE_CODE_DIR', 409, { duplicates });
  }
  return { ...parsed, ...workflow, fileName, filePath };
}

export function displayPath(config, absolutePath) {
  const rel = toPosix(path.relative(config.root, absolutePath));
  const root = String(config.displayRoot || config.root).replace(/[\\/]+$/, '');
  return rel && rel !== '.' ? `${root}/${rel}` : root;
}

export function relativePath(config, absolutePath) {
  return toPosix(path.relative(config.root, absolutePath));
}

async function findDuplicateCodeDirs(rootReal, workflowId, canonicalCodeDir) {
  const canonical = path.resolve(canonicalCodeDir);
  const duplicates = [];
  const queue = [rootReal];
  let visited = 0;
  while (queue.length) {
    const current = queue.shift();
    if (++visited > 20000) throw new ToolError('Duplicate scan exceeded max directory count', 'DUPLICATE_SCAN_LIMIT');
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(current, entry.name);
      if (entry.name === `code_nodes_${workflowId}`) {
        if (path.resolve(full) !== canonical) duplicates.push(toPosix(path.relative(rootReal, path.resolve(full))));
        continue;
      }
      queue.push(full);
    }
  }
  return duplicates;
}

function validateIndexRelativePath(folderRel, allowArchived) {
  if (folderRel.includes('\0') || folderRel.includes('\\') || path.isAbsolute(folderRel) || folderRel.split('/').includes('..')) throw new ToolError('Workflow index path must stay relative to root', 'INVALID_INDEX_PATH');
  if (folderRel.split('/').some(part => part && part.startsWith('.') && part !== '.archived')) throw new ToolError('Hidden workflow directories are not allowed', 'INVALID_INDEX_PATH');
  if (!allowArchived && (folderRel === '.archived' || folderRel.startsWith('.archived/'))) throw new ToolError('Archived workflow path is diagnostics-only', 'ARCHIVED_TARGET');
}

function assertContainedPath(rootReal, candidate, message) {
  const rel = path.relative(rootReal, path.resolve(candidate));
  if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) return;
  throw new ToolError(message, 'PATH_ESCAPE');
}

async function assertWorkflowJsonExists(workflowDir, workflowId) {
  const entries = await fs.readdir(workflowDir, { withFileTypes: true }).catch(() => []);
  const escapedWorkflowId = workflowId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escapedWorkflowId}\\..+\\.json$`);
  if (!entries.some(entry => entry.isFile() && re.test(entry.name) && !entry.name.endsWith('.hash'))) throw new ToolError(`Workflow JSON is missing in indexed directory for workflow ${workflowId}`, 'STALE_INDEX');
}

async function resolveCodeDir(rootReal, workflowDir, workflowId) {
  const codeDir = path.join(workflowDir, `code_nodes_${workflowId}`);
  if (!fssync.existsSync(codeDir)) return codeDir;
  const lstat = await fs.lstat(codeDir);
  if (lstat.isSymbolicLink()) throw new ToolError('Workflow code directory must not be a symlink', 'SYMLINK_TARGET');
  if (!lstat.isDirectory()) throw new ToolError('Workflow code path is not a directory', 'STALE_INDEX');
  const real = await fs.realpath(codeDir);
  assertContainedPath(rootReal, real, 'Workflow code directory realpath escapes root');
  return real;
}

function toPosix(value) {
  return value.split(path.sep).join(path.posix.sep);
}
