import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { buildResourceUri, displayPath, relativePath, resolveWorkflowDir } from './path-resolver.mjs';

export const JS_CODE_MIME = 'text/javascript';
export const PYTHON_CODE_MIME = 'text/x-python';
export const SET_RAW_MIME = 'application/json';

export async function loadWorkflowMetadata(config, workflowId) {
  const workflow = await resolveWorkflowDir(config, workflowId, { allowArchived: true });
  const workflowJson = await findWorkflowJson(workflow.workflowDir, workflowId);
  if (!workflowJson) {
    return { ...workflow, workflowJson: null, envelope: null, workflowData: null, nodes: [], targets: [], status: 'missing_workflow_json' };
  }
  let envelope;
  try {
    envelope = JSON.parse(await fs.readFile(workflowJson, 'utf8'));
  } catch (error) {
    return { ...workflow, workflowJson, envelope: null, workflowData: null, nodes: [], targets: [], status: 'invalid_workflow_json', error: error.message };
  }
  const workflowData = envelope.workflow && typeof envelope.workflow === 'object' ? envelope.workflow : envelope;
  const nodes = Array.isArray(workflowData.nodes) ? workflowData.nodes : [];
  return {
    ...workflow,
    workflowJson,
    envelope,
    workflowData,
    nodes,
    targets: supportedTargets(workflowId, nodes),
    status: 'ready'
  };
}

export async function workflowReconcileStatus(config, workflowId) {
  const metadata = await loadWorkflowMetadata(config, workflowId);
  const result = {
    workflowId,
    status: metadata.status,
    indexPath: metadata.indexPath ? displayPath(config, metadata.indexPath) : null,
    folderRel: metadata.folderRel,
    workflowJson: metadata.workflowJson ? displayPath(config, metadata.workflowJson) : null,
    nodeCount: metadata.nodes.length,
    supportedNodeCount: metadata.targets.length,
    targets: [],
    summary: { ready: 0, missing_file: 0, stale_export: 0, unsupported_node_type: 0 }
  };
  if (metadata.error) result.error = metadata.error;
  for (const target of metadata.targets) {
    const fileName = target.kind === 'set' ? `${target.nodeId}.set.json` : `${target.nodeId}.${target.ext}`;
    const filePath = path.join(metadata.codeDir, fileName);
    const file = await fileStatus(config, filePath, target.expectedContent);
    const status = file.exists ? (file.normalizedHashMatches ? 'ready' : 'stale_export') : 'missing_file';
    result.summary[status] += 1;
    result.targets.push({
      ...target,
      uri: target.kind === 'set'
        ? buildResourceUri('set', workflowId, target.nodeId, 'set.json')
        : buildResourceUri('code', workflowId, target.nodeId, target.ext),
      status,
      path: displayPath(config, filePath),
      relativePath: relativePath(config, filePath),
      file
    });
  }
  return result;
}

export async function targetNodeMetadata(config, target, content) {
  const metadata = await loadWorkflowMetadata(config, target.workflowId);
  const node = metadata.nodes.find(item => item && item.id === target.nodeId);
  if (!node) return targetStatus('missing_node', null, metadata, content);
  const expected = expectedTargetForNode(target.workflowId, node);
  if (!expected) return targetStatus('unsupported_node_type', nodeSummary(node), metadata, content);
  if (expected.kind !== target.kind || expected.ext !== target.ext) {
    return targetStatus('stale_export', { ...nodeSummary(node), expected }, metadata, content);
  }
  const normalizedHash = hashWithTrailingLf(expected.expectedContent);
  return {
    status: content === undefined || sha256(Buffer.from(content, 'utf8')) === normalizedHash ? 'ready' : 'stale_export',
    node: nodeSummary(node),
    expected: stripExpectedContent(expected),
    workflow: workflowSummary(metadata),
    normalizedExpectedEtag: normalizedHash
  };
}

export function setRawSyntax(content) {
  const value = String(content ?? '');
  if (value.startsWith('=')) return 'expression';
  try {
    JSON.parse(value);
    return 'json';
  } catch {
    return 'invalid_json';
  }
}

export function mimeTypeForFile(file) {
  if (file.kind === 'set') return SET_RAW_MIME;
  return file.language === 'python' ? PYTHON_CODE_MIME : JS_CODE_MIME;
}

async function findWorkflowJson(workflowDir, workflowId) {
  const entries = await fs.readdir(workflowDir, { withFileTypes: true }).catch(() => []);
  const escapedWorkflowId = workflowId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escapedWorkflowId}\\..+\\.json$`);
  const matches = entries.filter(entry => entry.isFile() && re.test(entry.name) && !entry.name.endsWith('.hash')).map(entry => entry.name).sort();
  return matches.length ? path.join(workflowDir, matches[0]) : null;
}

function supportedTargets(workflowId, nodes) {
  return nodes.map(node => expectedTargetForNode(workflowId, node)).filter(Boolean);
}

function expectedTargetForNode(workflowId, node) {
  if (!node || typeof node !== 'object' || !node.id) return null;
  if (node.type === 'n8n-nodes-base.code') {
    const python = node.parameters?.language === 'pythonNative';
    return {
      workflowId,
      nodeId: node.id,
      nodeName: node.name || '',
      nodeType: node.type,
      kind: 'code',
      language: python ? 'python' : 'javascript',
      ext: python ? 'py' : 'json',
      expectedContent: python ? (node.parameters?.pythonCode || '') : (node.parameters?.jsCode || '')
    };
  }
  if (node.type === 'n8n-nodes-base.set' && node.parameters?.mode === 'raw') {
    return {
      workflowId,
      nodeId: node.id,
      nodeName: node.name || '',
      nodeType: node.type,
      kind: 'set',
      mode: 'raw',
      ext: 'set.json',
      setRawSyntax: setRawSyntax(node.parameters?.jsonOutput || ''),
      expectedContent: node.parameters?.jsonOutput || ''
    };
  }
  return null;
}

async function fileStatus(config, filePath, expectedContent) {
  if (!fssync.existsSync(filePath)) return { exists: false, etag: null, normalizedHashMatches: false };
  const content = await fs.readFile(filePath, 'utf8');
  const etag = sha256(Buffer.from(content, 'utf8'));
  return {
    exists: true,
    etag,
    normalizedHashMatches: etag === hashWithTrailingLf(expectedContent),
    size: Buffer.byteLength(content, 'utf8')
  };
}

function hashWithTrailingLf(content) {
  return sha256(Buffer.from(`${content ?? ''}\n`, 'utf8'));
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function targetStatus(status, node, metadata, content) {
  return {
    status,
    node,
    workflow: workflowSummary(metadata),
    normalizedExpectedEtag: null,
    ...(content !== undefined ? { contentEtag: sha256(Buffer.from(content, 'utf8')) } : {})
  };
}

function workflowSummary(metadata) {
  return {
    status: metadata.status,
    workflowJson: metadata.workflowJson ? metadata.workflowJson : null,
    name: metadata.workflowData?.name || metadata.envelope?.name || '',
    active: Boolean(metadata.envelope?.active ?? metadata.workflowData?.active ?? false),
    archived: Boolean(metadata.envelope?.archived ?? false)
  };
}

function nodeSummary(node) {
  return {
    id: node.id,
    name: node.name || '',
    type: node.type || '',
    language: node.parameters?.language,
    mode: node.parameters?.mode
  };
}

function stripExpectedContent(target) {
  const { expectedContent, ...rest } = target;
  return rest;
}
