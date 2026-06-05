import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { ToolError } from './errors.mjs';
import { buildResourceUri, displayPath, relativePath, resolveTargetFile, resolveWorkflowDir } from './path-resolver.mjs';
import { gitSummary, targetGitStatus } from './git-state.mjs';
import { applyUnifiedPatch } from './patch.mjs';
import { workflowIndexStatus } from './config.mjs';

const writeLocks = new Map();

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function statFile(config, filePath) {
  const buffer = await fs.readFile(filePath);
  const stats = await fs.stat(filePath);
  return {
    etag: sha256(buffer),
    size: stats.size,
    lastModified: stats.mtime.toISOString(),
    relativePath: relativePath(config, filePath),
    path: displayPath(config, filePath)
  };
}

export async function listWorkflowFiles(config, workflowId) {
  const workflow = await resolveWorkflowDir(config, workflowId);
  if (!fssync.existsSync(workflow.codeDir)) return [];
  const entries = await fs.readdir(workflow.codeDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const code = entry.name.match(/^([0-9a-fA-F-]{36})\.(py|json)$/);
    const set = entry.name.match(/^([0-9a-fA-F-]{36})\.set\.json$/);
    if (!code && !set) continue;
    const filePath = path.join(workflow.codeDir, entry.name);
    const meta = await statFile(config, filePath);
    if (set) {
      files.push({ workflowId, nodeId: set[1], kind: 'set', uri: buildResourceUri('set', workflowId, set[1], 'set.json'), ...meta });
    } else {
      const ext = code[2];
      files.push({ workflowId, nodeId: code[1], kind: 'code', language: ext === 'py' ? 'python' : 'javascript', uri: buildResourceUri('code', workflowId, code[1], ext), ...meta });
    }
  }
  return files.sort((a, b) => a.uri.localeCompare(b.uri));
}

export async function listWorkflowResources(config) {
  const indexDir = path.join(config.root, '.index');
  if (!fssync.existsSync(indexDir)) return [];
  const entries = await fs.readdir(indexDir, { withFileTypes: true });
  const resources = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.path')) continue;
    const workflowId = entry.name.slice(0, -'.path'.length);
    try {
      for (const file of await listWorkflowFiles(config, workflowId)) {
        resources.push({
          uri: file.uri,
          name: `${file.workflowId}/${file.nodeId}`,
          title: `${file.kind === 'set' ? 'Set(raw)' : 'Code'} file ${file.nodeId}`,
          mimeType: file.kind === 'set' || file.language === 'javascript' ? 'application/json' : 'text/x-python',
          annotations: { audience: ['assistant'], priority: 0.6 }
        });
      }
    } catch {
      continue;
    }
  }
  return resources.sort((a, b) => a.uri.localeCompare(b.uri));
}

export async function readWorkflowResource(config, uri) {
  const file = await readWorkflowFile(config, uri);
  return {
    _meta: {
      etag: file.etag,
      size: file.size,
      lastModified: file.lastModified,
      relativePath: file.relativePath
    },
    contents: [{
      uri,
      mimeType: file.kind === 'set' || file.language === 'javascript' ? 'application/json' : 'text/x-python',
      text: file.content
    }]
  };
}

export async function exportDiagnostics(config) {
  return {
    local: await mountDiagnostics(config),
    camelK: { availableInContainer: false, message: 'Use platform Camel K audit for live IntegrationPlatform and Debezium checks.' }
  };
}

export async function readWorkflowFile(config, uri) {
  const target = await resolveTargetFile(config, uri);
  if (!fssync.existsSync(target.filePath)) throw new ToolError(`File not found for URI: ${uri}`, 'FILE_NOT_FOUND', 404);
  const stats = await fs.stat(target.filePath);
  if (stats.size > config.maxFileBytes) throw new ToolError(`File exceeds max size: ${stats.size} > ${config.maxFileBytes}`, 'FILE_TOO_LARGE');
  const content = await fs.readFile(target.filePath, 'utf8');
  return {
    workflowId: target.workflowId,
    nodeId: target.nodeId,
    kind: target.kind,
    language: target.kind === 'code' ? (target.ext === 'py' ? 'python' : 'javascript') : undefined,
    uri,
    content,
    ...(await statFile(config, target.filePath))
  };
}

export async function validateWorkflowFile(config, { uri, content }) {
  const target = await resolveTargetFile(config, uri);
  const diagnostics = [];
  if (!fssync.existsSync(target.filePath)) diagnostics.push({ level: 'error', code: 'FILE_NOT_FOUND', message: 'Target file does not exist' });
  const value = content ?? (fssync.existsSync(target.filePath) ? await fs.readFile(target.filePath, 'utf8') : '');
  if (target.kind === 'set') {
    try {
      JSON.parse(value);
    } catch (error) {
      diagnostics.push({ level: 'error', code: 'INVALID_SET_JSON', message: error.message });
    }
  }
  return {
    uri,
    valid: diagnostics.every(d => d.level !== 'error'),
    diagnostics,
    target: { workflowId: target.workflowId, nodeId: target.nodeId, kind: target.kind, relativePath: relativePath(config, target.filePath), path: displayPath(config, target.filePath) }
  };
}

export async function patchWorkflowFile(config, { uri, patch, expectedEtag, waitForSettle = true }) {
  const target = await resolveTargetFile(config, uri, { requireNoDuplicateCodeDir: true });
  return withTargetWriteLock(target.filePath, async () => {
    assertPatchWriteAllowed(config, expectedEtag, waitForSettle);
    const current = await readWorkflowFile(config, uri);
    await assertCleanTarget(config, target.filePath);
    if (current.etag !== expectedEtag) throw new ToolError('ETag mismatch: file has changed', 'ETAG_MISMATCH', 409);
    const updated = applyUnifiedPatch(current.content, patch);
    if (target.kind === 'set') parseSetJson(updated);
    return writeExistingFile(config, target.filePath, updated, uri, expectedEtag);
  });
}

export async function replaceWorkflowFile(config, { uri, content, expectedEtag, waitForSettle = true }) {
  if (config.writePolicy !== 'patch_replace') throw new ToolError('Replace writes require SYNESTRA_MCP_WRITE_POLICY=patch_replace', 'WRITE_POLICY_DENIED');
  const target = await resolveTargetFile(config, uri, { requireNoDuplicateCodeDir: true });
  return withTargetWriteLock(target.filePath, async () => {
    assertWriteBaseAllowed(config, expectedEtag, waitForSettle);
    const current = await readWorkflowFile(config, uri);
    await assertCleanTarget(config, target.filePath);
    if (current.etag !== expectedEtag) throw new ToolError('ETag mismatch: file has changed', 'ETAG_MISMATCH', 409);
    if (target.kind === 'set') parseSetJson(content);
    return writeExistingFile(config, target.filePath, content, uri, expectedEtag);
  });
}

export async function observeWorkflowFile(config, { uri, expectedEtag, expectedContent, timeoutMs }) {
  const started = Date.now();
  const timeout = Math.min(Math.max(Number(timeoutMs || config.settleTimeoutMs), 100), 120000);
  let stableReads = 0;
  let previousEtag = null;
  let last = null;
  while (Date.now() - started <= timeout) {
    last = await readWorkflowFile(config, uri);
    stableReads = last.etag === previousEtag ? stableReads + 1 : 1;
    previousEtag = last.etag;
    if (stableReads >= config.settleStableReads) {
      return settleResult(started, last, expectedEtag, expectedContent, true);
    }
    await sleep(250);
  }
  return settleResult(started, last, expectedEtag, expectedContent, false);
}

export async function mountDiagnostics(config) {
  const exists = fssync.existsSync(config.root);
  const index = workflowIndexStatus(config);
  return {
    root: config.root,
    displayRoot: config.displayRoot,
    exists,
    index,
    offsetFiles: exists ? await listDebeziumOffsetFiles(config) : [],
    artifacts: exists ? await scanWorkflowArtifacts(config) : emptyArtifactSummary()
  };
}

export async function filesStatus(config, args = {}) {
  const result = {
    env: config.serviceEnv,
    writePolicy: config.writePolicy,
    root: config.root,
    gitRoot: config.gitRoot || config.root,
    displayRoot: config.displayRoot,
    index: workflowIndexStatus(config),
    git: await gitSummary(config)
  };
  if (args.uri) {
    const target = await resolveTargetFile(config, args.uri, { allowArchived: true });
    result.target = { workflowId: target.workflowId, nodeId: target.nodeId, kind: target.kind, archived: target.archived, path: target.filePath, git: await targetGitStatus(config, target.filePath) };
  }
  return result;
}

async function writeExistingFile(config, filePath, content, uri, expectedEtag) {
  if (!fssync.existsSync(filePath)) throw new ToolError('Target file does not exist; create semantics are disabled', 'FILE_NOT_FOUND', 404);
  if (Buffer.byteLength(content, 'utf8') > config.maxFileBytes) throw new ToolError(`Content exceeds max size: ${config.maxFileBytes}`, 'FILE_TOO_LARGE');
  const temp = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  const handle = await fs.open(temp, 'wx', 0o600);
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  if (config.beforeRenameForTest) await config.beforeRenameForTest(filePath);
  const preRename = await statFile(config, filePath);
  if (preRename.etag !== expectedEtag) {
    await fs.unlink(temp).catch(() => {});
    throw new ToolError('ETag mismatch: file changed before atomic rename', 'ETAG_MISMATCH', 409);
  }
  await fs.rename(temp, filePath);
  if (config.afterRenameForTest) await config.afterRenameForTest(filePath);
  await syncDirectory(path.dirname(filePath));
  const meta = await statFile(config, filePath);
  const settle = await observeWorkflowFile(config, { uri, expectedEtag: meta.etag, expectedContent: content });
  if (!settle.settled || !settle.etagMatches || !settle.contentMatches) {
    throw new ToolError('Workflow file did not settle to the written content', 'WRITE_SETTLE_MISMATCH', 409, { settle });
  }
  return { uri, ...meta, settle };
}

async function syncDirectory(dirPath) {
  let fd;
  try {
    fd = fssync.openSync(dirPath, 'r');
    fssync.fsyncSync(fd);
  } catch {
    return;
  } finally {
    if (fd !== undefined) fssync.closeSync(fd);
  }
}

function assertPatchWriteAllowed(config, expectedEtag, waitForSettle) {
  if (config.writePolicy !== 'patch' && config.writePolicy !== 'patch_replace') throw new ToolError('Patch writes require SYNESTRA_MCP_WRITE_POLICY=patch or patch_replace', 'WRITE_POLICY_DENIED');
  assertWriteBaseAllowed(config, expectedEtag, waitForSettle);
}

function assertWriteBaseAllowed(config, expectedEtag, waitForSettle) {
  if (config.serviceEnv !== 'dev') throw new ToolError('File writes are dev-only in v1', 'WRITE_POLICY_DENIED');
  if (!expectedEtag) throw new ToolError('expectedEtag is mandatory for file writes', 'EXPECTED_ETAG_REQUIRED');
  if (!config.expectedBranch) throw new ToolError('SYNESTRA_MCP_EXPECTED_BRANCH is required for file writes', 'EXPECTED_BRANCH_REQUIRED');
  if (waitForSettle === false) throw new ToolError('waitForSettle=false is not allowed for file writes', 'WRITE_SETTLE_REQUIRED');
}

async function assertCleanTarget(config, filePath) {
  const summary = await gitSummary(config);
  if (!summary.available) throw new ToolError('Git status is unavailable; refusing write in GitOps mode', 'GIT_STATUS_UNAVAILABLE', 409);
  if (summary.branch !== config.expectedBranch) throw new ToolError('Current branch does not match SYNESTRA_MCP_EXPECTED_BRANCH; refusing write', 'BRANCH_MISMATCH', 409, { expectedBranch: config.expectedBranch, actualBranch: summary.branch });
  if (summary.dirty) throw new ToolError('Workflow Git worktree is dirty; refusing write in GitOps mode', 'DIRTY_WORKTREE', 409, { dirtyCount: summary.dirtyCount, dirtyByKind: summary.dirtyByKind });
  const status = await targetGitStatus(config, filePath);
  if (!status.available) throw new ToolError('Git status is unavailable; refusing write in GitOps mode', 'GIT_STATUS_UNAVAILABLE', 409);
  if (status.dirty) throw new ToolError('Target file has git changes; refusing write', 'DIRTY_TARGET', 409, { status: status.status });
}

async function withTargetWriteLock(filePath, callback) {
  const key = path.resolve(filePath);
  const previous = writeLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise(resolve => {
    release = resolve;
  });
  const chained = previous.catch(() => {}).then(() => current);
  writeLocks.set(key, chained);
  await previous.catch(() => {});
  try {
    return await callback();
  } finally {
    release();
    if (writeLocks.get(key) === chained) writeLocks.delete(key);
  }
}

function parseSetJson(content) {
  try {
    JSON.parse(content);
  } catch (error) {
    throw new ToolError(`Set(raw) JSON is invalid: ${error.message}`, 'INVALID_SET_JSON');
  }
}

function settleResult(started, last, expectedEtag, expectedContent, settled) {
  const contentMatches = expectedContent === undefined || last?.content === expectedContent;
  return {
    settled,
    elapsedMs: Date.now() - started,
    etag: last?.etag || null,
    contentMatches,
    etagMatches: expectedEtag === undefined || last?.etag === expectedEtag,
    normalized: expectedContent !== undefined && !contentMatches
  };
}

async function listDebeziumOffsetFiles(config) {
  const names = (await fs.readdir(config.root)).filter(name => name.startsWith('.debezium-offsets-') && name.endsWith('.dat')).sort();
  const now = Date.now();
  const result = [];
  for (const name of names) {
    const stats = await fs.stat(path.join(config.root, name));
    result.push({ name, size: stats.size, lastModified: stats.mtime.toISOString(), ageSeconds: Math.max(0, Math.round((now - stats.mtime.getTime()) / 1000)) });
  }
  return result;
}

async function scanWorkflowArtifacts(config) {
  const summary = emptyArtifactSummary();
  const queue = [config.root];
  while (queue.length && summary.scannedDirectories <= 20000) {
    const current = queue.shift();
    summary.scannedDirectories += 1;
    const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.index' || (entry.name.startsWith('.') && entry.name !== '.archived')) continue;
        if (entry.name.startsWith('code_nodes_')) summary.codeDirectories += 1;
        queue.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (entry.name.endsWith('.hash')) summary.hashFiles += 1;
      else if (/^[0-9a-fA-F-]{36}\.(py|json)$/.test(entry.name)) summary.codeFiles += 1;
      else if (/^[0-9a-fA-F-]{36}\.set\.json$/.test(entry.name)) summary.setFiles += 1;
      else if (entry.name.endsWith('.json')) summary.workflowJsonFiles += 1;
    }
  }
  summary.truncated = summary.scannedDirectories > 20000;
  return summary;
}

function emptyArtifactSummary() {
  return { workflowJsonFiles: 0, codeDirectories: 0, codeFiles: 0, setFiles: 0, hashFiles: 0, scannedDirectories: 0, truncated: false };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
