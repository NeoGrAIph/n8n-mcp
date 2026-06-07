import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { ToolError } from './errors.mjs';
import { buildResourceUri, displayPath, relativePath, resolveTargetFile, resolveWorkflowDir } from './path-resolver.mjs';
import { gitSummary, targetGitStatus } from './git-state.mjs';
import { workflowIndexStatus } from './config.mjs';
import { mimeTypeForFile, setRawSyntax, targetNodeMetadata, workflowReconcileStatus } from './workflow-metadata.mjs';

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
  const workflow = await resolveWorkflowDir(config, workflowId, { requireWorkflowJson: false });
  if (!fssync.existsSync(workflow.codeDir)) return [];
  const entries = await fs.readdir(workflow.codeDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const code = entry.name.match(/^([0-9a-fA-F-]{36})\.(py|json)$/);
    const set = entry.name.match(/^([0-9a-fA-F-]{36})\.set\.json$/);
    if (!code && !set) continue;
    const filePath = path.join(workflow.codeDir, entry.name);
    const content = await fs.readFile(filePath, 'utf8');
    const meta = await statFile(config, filePath);
    if (set) {
      const file = { workflowId, nodeId: set[1], kind: 'set', uri: buildResourceUri('set', workflowId, set[1], 'set.json'), ...meta };
      files.push({ ...file, locator: await targetNodeMetadata(config, { workflowId, nodeId: set[1], kind: 'set', ext: 'set.json' }, content) });
    } else {
      const ext = code[2];
      const file = { workflowId, nodeId: code[1], kind: 'code', language: ext === 'py' ? 'python' : 'javascript', uri: buildResourceUri('code', workflowId, code[1], ext), ...meta };
      files.push({ ...file, locator: await targetNodeMetadata(config, { workflowId, nodeId: code[1], kind: 'code', ext }, content) });
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
          mimeType: mimeTypeForFile(file),
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
      mimeType: mimeTypeForFile(file),
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
    locator: await targetNodeMetadata(config, target, content),
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
    const syntax = setRawSyntax(value);
    if (syntax === 'invalid_json') diagnostics.push({ level: 'error', code: 'INVALID_SET_JSON', message: 'Set(raw) content must be JSON or an n8n expression starting with =' });
    else diagnostics.push({ level: 'info', code: `SET_RAW_${syntax.toUpperCase()}`, message: `Set(raw) syntax: ${syntax}` });
  }
  const locator = await targetNodeMetadata(config, target, value);
  if (locator.status !== 'ready') diagnostics.push({ level: 'warning', code: locator.status.toUpperCase(), message: `File-layer locator status is ${locator.status}` });
  return {
    uri,
    valid: diagnostics.every(d => d.level !== 'error'),
    diagnostics,
    locator,
    target: { workflowId: target.workflowId, nodeId: target.nodeId, kind: target.kind, relativePath: relativePath(config, target.filePath), path: displayPath(config, target.filePath) }
  };
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

export async function reconcileWorkflowFiles(config, { workflowId }) {
  return workflowReconcileStatus(config, workflowId);
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
