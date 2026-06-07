import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { InvalidParamsError, ToolError } from './errors.mjs';
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
    filesystemPath: displayPath(config, filePath),
    containerPath: filePath,
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
  return (await listWorkflowResourcesWithDiagnostics(config)).resources;
}

export async function listWorkflowResourcesWithDiagnostics(config, params = {}) {
  const cursor = decodeResourceListCursor(params.cursor);
  const limit = config.resourceListLimit || 200;
  const indexDir = path.join(config.root, '.index');
  if (!fssync.existsSync(indexDir)) {
    return {
      resources: [],
      _meta: {
        skippedWorkflows: [],
        summary: {
          indexedWorkflows: 0,
          resourceCount: 0,
          returnedResourceCount: 0,
          pageOffset: 0,
          pageLimit: limit,
          hasNextPage: false,
          skippedWorkflowCount: 0
        }
      }
    };
  }
  const entries = await fs.readdir(indexDir, { withFileTypes: true });
  const resources = [];
  const skippedWorkflows = [];
  let indexedWorkflows = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.path')) continue;
    const workflowId = entry.name.slice(0, -'.path'.length);
    indexedWorkflows += 1;
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
    } catch (error) {
      skippedWorkflows.push({
        workflowId,
        code: error?.code || 'RESOURCE_LIST_WORKFLOW_ERROR',
        message: error?.message || 'Unable to list workflow resources'
      });
    }
  }
  resources.sort((a, b) => a.uri.localeCompare(b.uri));
  skippedWorkflows.sort((a, b) => a.workflowId.localeCompare(b.workflowId));
  const startOffset = cursor.afterUri ? resources.findIndex(resource => resource.uri > cursor.afterUri) : 0;
  const pageOffset = startOffset < 0 ? resources.length : startOffset;
  const page = resources.slice(pageOffset, pageOffset + limit);
  const last = page.at(-1);
  const nextCursor = last && pageOffset + page.length < resources.length ? encodeResourceListCursor(last.uri) : undefined;
  return {
    resources: page,
    ...(nextCursor ? { nextCursor } : {}),
    _meta: {
      skippedWorkflows,
      summary: {
        indexedWorkflows,
        resourceCount: resources.length,
        returnedResourceCount: page.length,
        pageOffset,
        pageLimit: limit,
        hasNextPage: Boolean(nextCursor),
        skippedWorkflowCount: skippedWorkflows.length
      }
    }
  };
}

function encodeResourceListCursor(afterUri) {
  return Buffer.from(JSON.stringify({ v: 1, afterUri }), 'utf8').toString('base64url');
}

function decodeResourceListCursor(cursor) {
  if (cursor === undefined || cursor === null || cursor === '') return { afterUri: '' };
  if (typeof cursor !== 'string' || cursor.length > 256) throw new InvalidParamsError('Invalid resources/list cursor', { code: 'INVALID_CURSOR' });
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (parsed?.v !== 1 || typeof parsed.afterUri !== 'string' || parsed.afterUri.length > 512) throw new Error('bad cursor');
    return { afterUri: parsed.afterUri };
  } catch {
    throw new InvalidParamsError('Invalid resources/list cursor', { code: 'INVALID_CURSOR' });
  }
}

export async function readWorkflowResource(config, uri) {
  if (typeof uri !== 'string' || uri.length === 0) throw new InvalidParamsError('resources/read requires params.uri', { code: 'INVALID_RESOURCE_URI' });
  let file;
  try {
    file = await locateWorkflowFile(config, uri);
  } catch (error) {
    if (error instanceof ToolError && ['INVALID_URI', 'INVALID_WORKFLOW_ID', 'INVALID_NODE_ID'].includes(error.code)) {
      throw new InvalidParamsError(error.message, { code: error.code });
    }
    throw error;
  }
  return {
    _meta: {
      etag: file.etag,
      size: file.size,
      lastModified: file.lastModified,
      relativePath: file.relativePath,
      filesystemPath: file.filesystemPath
    },
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(file, null, 2)
    }]
  };
}

export async function exportDiagnostics(config) {
  const local = await mountDiagnostics(config);
  const mcpLocatorReadiness = localLocatorReadiness(local);
  return {
    env: config.serviceEnv,
    readOnly: true,
    local,
    mcpLocatorReadiness,
    productionReadiness: {
      decision: 'requires-platform-preflight',
      ready: false,
      reason: 'MCP can prove only local file locator state. Production readiness also requires live n8n DB, Camel K/Debezium and DB-to-files parity gates from the platform repository.',
      handoff: platformReadinessHandoff(config),
      requiredChecks: platformReadinessChecks(config)
    },
    allowedActions: [
      'Use ready locator metadata to inspect files with external filesystem tools',
      'Use synestra_workflow_reconcile_status for an exact workflow before any file edit',
      'Run platform read-only Camel K and DB parity audits before claiming production readiness'
    ],
    forbiddenActions: [
      'Do not treat MCP /health or tools/list as DB-to-files parity proof',
      'Do not edit files whose locator status is not ready',
      'Do not use MCP diagnostics as permission for DB writes, Argo sync, workflow restart or files-to-API backfill'
    ],
    camelK: {
      availableInContainer: false,
      message: 'Use platform Camel K audit for live IntegrationPlatform, Debezium slot/publication and DB-to-files parity checks.',
      handoff: platformReadinessChecks(config)
    }
  };
}

export async function locateWorkflowFile(config, uri) {
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
    ...(await statFile(config, target.filePath))
  };
}

export const readWorkflowFile = locateWorkflowFile;

export async function validateWorkflowFile(config, { uri, content }) {
  const target = await resolveTargetFile(config, uri);
  const diagnostics = [];
  let validSyntax = true;
  if (!fssync.existsSync(target.filePath)) diagnostics.push({ level: 'error', code: 'FILE_NOT_FOUND', message: 'Target file does not exist' });
  const value = content ?? (fssync.existsSync(target.filePath) ? await fs.readFile(target.filePath, 'utf8') : '');
  if (target.kind === 'set') {
    const syntax = setRawSyntax(value);
    if (syntax === 'invalid_json') {
      validSyntax = false;
      diagnostics.push({ level: 'error', code: 'INVALID_SET_JSON', message: 'Set(raw) content must be JSON or an n8n expression starting with =' });
    }
    else diagnostics.push({ level: 'info', code: `SET_RAW_${syntax.toUpperCase()}`, message: `Set(raw) syntax: ${syntax}` });
  }
  const locator = await targetNodeMetadata(config, target, value);
  const safeToEdit = locator.status === 'ready';
  if (!safeToEdit) diagnostics.push({ level: 'error', code: 'UNSAFE_LOCATOR_STATUS', locatorStatus: locator.status, message: `File-layer locator status is ${locator.status}` });
  return {
    uri,
    valid: validSyntax && safeToEdit,
    validSyntax,
    safeToEdit,
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
      return settleResult(config, uri, started, last, expectedEtag, expectedContent, true);
    }
    await sleep(250);
  }
  return settleResult(config, uri, started, last, expectedEtag, expectedContent, false);
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

async function settleResult(config, uri, started, last, expectedEtag, expectedContent, settled) {
  const contentMatches = expectedContent === undefined || await workflowFileContentMatches(config, uri, expectedContent);
  return {
    settled,
    elapsedMs: Date.now() - started,
    etag: last?.etag || null,
    contentMatches,
    etagMatches: expectedEtag === undefined || last?.etag === expectedEtag,
    normalized: expectedContent !== undefined && !contentMatches
  };
}

async function workflowFileContentMatches(config, uri, expectedContent) {
  const target = await resolveTargetFile(config, uri);
  if (!fssync.existsSync(target.filePath)) return false;
  return await fs.readFile(target.filePath, 'utf8') === expectedContent;
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

function localLocatorReadiness(local) {
  const issues = [];
  if (!local.exists) issues.push({ severity: 'error', code: 'workflow_root_missing', message: 'Workflow root is not mounted or not readable' });
  if (!local.index.exists) {
    issues.push({
      severity: local.index.degradedReadOnly ? 'warning' : 'error',
      code: local.index.degradedReadOnly ? 'workflow_index_missing_degraded' : 'workflow_index_missing',
      message: 'Workflow .index is required for canonical workflowId-to-folder resolution'
    });
  }
  if (local.artifacts.truncated) issues.push({ severity: 'warning', code: 'artifact_scan_truncated', message: 'Artifact scan hit the directory limit' });
  if (local.exists && local.artifacts.workflowJsonFiles === 0) issues.push({ severity: 'warning', code: 'no_workflow_json_files', message: 'No workflow JSON artifacts were found under the mounted root' });
  if (local.exists && local.offsetFiles.length === 0) issues.push({ severity: 'warning', code: 'no_debezium_offset_files', message: 'No local Debezium offset files were found; sync freshness must be checked through platform audits' });
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(issue => issue.severity === 'warning').length;
  return {
    status: errorCount ? 'no-go' : (warningCount ? 'degraded' : 'ready'),
    ready: errorCount === 0,
    issueCount: issues.length,
    errorCount,
    warningCount,
    issues
  };
}

function platformReadinessChecks(config) {
  const repo = shellQuote(config.platformRepoDisplayRoot || '~/repo/synestra-platform');
  const env = config.serviceEnv || 'dev';
  return [
    {
      name: 'n8n-split-mcp-production-readiness',
      command: `cd ${repo} && scripts/mcp/audit_n8n_two_mcp_production_readiness.sh --env ${env} --native-token-file '<secure-native-token-file>' --safe-workflow-id '<disposable-or-known-safe-workflow-id>' --json`,
      readOnly: true,
      requiredFor: ['production-readiness', 'native-mcp-readiness', 'gateway-exposure', 'production-file-layer-readiness']
    },
    {
      name: 'native-n8n-mcp-service-local-acceptance',
      command: `cd ${repo} && scripts/mcp/accept_native_n8n_mcp_service_local.sh --env ${env} --safe-workflow-id '<disposable-or-known-safe-workflow-id>'`,
      readOnly: true,
      requiredFor: ['native-mcp-readiness']
    },
    {
      name: 'mcp-gateway-hardening',
      command: `cd ${repo} && scripts/mcp/audit_mcp_gateway_hardening.sh --json`,
      readOnly: true,
      requiredFor: ['gateway-exposure']
    },
    {
      name: 'camel-k-db-files-recovery-preflight',
      command: `cd ${repo} && scripts/mcp/preflight_n8n_camelk_recovery.sh --env ${env} --summary-json`,
      readOnly: true,
      requiredFor: ['production-file-layer-readiness'],
      notes: ['Use --json instead of --summary-json for incident analysis or evidence archiving']
    },
    {
      name: 'n8n-recovery-candidate-classifier',
      command: `cd ${repo} && scripts/mcp/classify_n8n_recovery_candidates.sh --env ${env} --json`,
      readOnly: true,
      requiredFor: ['recovery-planning', 'db-files-risk-inventory']
    },
    {
      name: 'n8n-db-files-render-candidate-preview',
      command: `cd ${repo} && scripts/mcp/render_n8n_db_files_backfill_candidates.sh --env ${env} --workflow-id '<reviewed-workflow-id>' --render-no-go-candidates-for-review --json`,
      readOnly: true,
      writesWorkflowRoot: false,
      sensitiveArtifacts: true,
      requiredFor: ['recovery-preview', 'db-files-human-review'],
      notes: [
        'Writes only sensitive preview artifacts under a fresh temp output root, never the mounted workflow root',
        'Requires an explicit workflow id; prod bulk render is forbidden by the platform script',
        'Use only after preflight/classifier identified a reviewed workflow candidate'
      ]
    }
  ];
}

function platformReadinessHandoff(config) {
  const repo = shellQuote(config.platformRepoDisplayRoot || '~/repo/synestra-platform');
  const env = config.serviceEnv || 'dev';
  return {
    handoffKind: 'platform-readiness-required',
    sourceOfTruth: 'synestra-platform',
    platformRepo: config.platformRepoDisplayRoot || '~/repo/synestra-platform',
    mcpMustNotWriteWorkflow: true,
    workflowIdRequiredForRenderPreview: true,
    nextAction: 'run-platform-readiness-gates',
    useFilesToolWhenLocatorReady: 'Use synestra_workflow_file_read or resources/read to get filesystemPath/etag, then inspect or edit with normal filesystem tools only when locator.status is ready.',
    usePlatformRenderWhenNoGo: 'If Camel K/DB/files preflight is no-go or the locator is missing/stale/null, run classifier first and render a reviewed workflow candidate only to an isolated temp output root.',
    commandSequence: [
      `cd ${repo} && scripts/mcp/audit_n8n_two_mcp_production_readiness.sh --env ${env} --native-token-file '<secure-native-token-file>' --safe-workflow-id '<disposable-or-known-safe-workflow-id>' --json`,
      `cd ${repo} && scripts/mcp/preflight_n8n_camelk_recovery.sh --env ${env} --summary-json`,
      `cd ${repo} && scripts/mcp/classify_n8n_recovery_candidates.sh --env ${env} --json`,
      `cd ${repo} && scripts/mcp/render_n8n_db_files_backfill_candidates.sh --env ${env} --workflow-id '<reviewed-workflow-id>' --render-no-go-candidates-for-review --json`
    ],
    forbiddenActions: [
      'Do not copy render preview artifacts into the workflow root without a separately approved recovery plan',
      'Do not use MCP diagnostics as permission for DB writes, Argo sync, workflow restart or files-to-API backfill'
    ]
  };
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
