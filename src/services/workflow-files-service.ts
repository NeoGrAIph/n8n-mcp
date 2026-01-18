import { existsSync, promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export type WorkflowFileKind = 'code' | 'set';
export type CodeFileLanguage = 'python' | 'javascript';

export interface WorkflowFileInfo {
  workflowId: string;
  nodeId: string;
  kind: WorkflowFileKind;
  language?: CodeFileLanguage;
  uri: string;
  etag: string;
  size: number;
  lastModified: string;
}

export interface WorkflowFileContent extends WorkflowFileInfo {
  content: string;
}

const WORKFLOW_ID_RE = /^[A-Za-z0-9_-]{8,}$/;
const NODE_ID_RE = /^[0-9a-fA-F-]{36}$/;

export const WORKFLOWS_ROOT = process.env.N8N_WORKFLOWS_ROOT || process.env.WORKFLOWS_ROOT || '/workflows';
const CODE_NODES_PREFIX = process.env.N8N_CODE_NODES_PREFIX || 'code_nodes_';

export function isWorkflowFilesConfigured(): boolean {
  return Boolean(WORKFLOWS_ROOT && existsSync(WORKFLOWS_ROOT));
}

function assertWorkflowId(workflowId: string): void {
  if (!WORKFLOW_ID_RE.test(workflowId)) {
    throw new Error(`Invalid workflowId: ${workflowId}`);
  }
}

function assertNodeId(nodeId: string): void {
  if (!NODE_ID_RE.test(nodeId)) {
    throw new Error(`Invalid nodeId: ${nodeId}`);
  }
}

function computeEtag(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function statFile(filePath: string): Promise<{ etag: string; size: number; lastModified: string }>{
  const data = await fs.readFile(filePath);
  const stats = await fs.stat(filePath);
  return {
    etag: computeEtag(data),
    size: stats.size,
    lastModified: stats.mtime.toISOString(),
  };
}

function buildUri(kind: WorkflowFileKind, workflowId: string, nodeId: string, ext: string): string {
  const filename = kind === 'set' ? `${nodeId}.set.json` : `${nodeId}.${ext}`;
  return `n8n-workflows:///` + `${kind}/${workflowId}/${filename}`;
}

function parseWorkflowDirName(dirName: string): string | null {
  if (dirName.startsWith(CODE_NODES_PREFIX)) {
    const candidate = dirName.slice(CODE_NODES_PREFIX.length);
    return WORKFLOW_ID_RE.test(candidate) ? candidate : null;
  }
  return WORKFLOW_ID_RE.test(dirName) ? dirName : null;
}

async function findWorkflowDir(root: string, workflowId: string): Promise<string | null> {
  const queue: string[] = [root];
  let visited = 0;
  const maxVisited = 10000;
  let legacyMatch: string | null = null;

  while (queue.length > 0) {
    const current = queue.shift() as string;
    visited += 1;
    if (visited > maxVisited) {
      logger.warn('Workflow directory scan exceeded max depth', { workflowId, root });
      break;
    }

    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      if (entry.name === 'node_modules') continue;

      const fullPath = path.join(current, entry.name);
      if (entry.name === `${CODE_NODES_PREFIX}${workflowId}`) {
        return fullPath;
      }
      if (entry.name === workflowId) {
        legacyMatch = fullPath;
        continue;
      }
      queue.push(fullPath);
    }
  }

  return legacyMatch;
}

async function getWorkflowDir(workflowId: string): Promise<string> {
  const root = path.resolve(WORKFLOWS_ROOT);
  const dir = await findWorkflowDir(root, workflowId);
  if (!dir) {
    throw new Error(`Workflow directory not found for workflowId ${workflowId}`);
  }
  return dir;
}

function isCodeFileName(fileName: string): { nodeId: string; ext: 'py' | 'json' } | null {
  if (fileName.endsWith('.py')) {
    const nodeId = fileName.slice(0, -3);
    if (NODE_ID_RE.test(nodeId)) {
      return { nodeId, ext: 'py' };
    }
  }
  if (fileName.endsWith('.json') && !fileName.endsWith('.set.json')) {
    const nodeId = fileName.slice(0, -5);
    if (NODE_ID_RE.test(nodeId)) {
      return { nodeId, ext: 'json' };
    }
  }
  return null;
}

function isSetFileName(fileName: string): { nodeId: string } | null {
  if (!fileName.endsWith('.set.json')) return null;
  const nodeId = fileName.slice(0, -9);
  if (!NODE_ID_RE.test(nodeId)) return null;
  return { nodeId };
}

function resolveCodeLanguage(ext: 'py' | 'json'): CodeFileLanguage {
  return ext === 'py' ? 'python' : 'javascript';
}

function resolveCodeMime(ext: 'py' | 'json'): string {
  return ext === 'py' ? 'text/x-python' : 'text/javascript';
}

export async function listCodeFiles(workflowId: string): Promise<WorkflowFileInfo[]> {
  assertWorkflowId(workflowId);
  const workflowDir = await getWorkflowDir(workflowId);
  const entries = await fs.readdir(workflowDir, { withFileTypes: true });
  const results: WorkflowFileInfo[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const parsed = isCodeFileName(entry.name);
    if (!parsed) continue;

    const filePath = path.join(workflowDir, entry.name);
    const { etag, size, lastModified } = await statFile(filePath);
    results.push({
      workflowId,
      nodeId: parsed.nodeId,
      kind: 'code',
      language: resolveCodeLanguage(parsed.ext),
      uri: buildUri('code', workflowId, parsed.nodeId, parsed.ext),
      etag,
      size,
      lastModified,
    });
  }

  return results;
}

export async function listSetFiles(workflowId: string): Promise<WorkflowFileInfo[]> {
  assertWorkflowId(workflowId);
  const workflowDir = await getWorkflowDir(workflowId);
  const entries = await fs.readdir(workflowDir, { withFileTypes: true });
  const results: WorkflowFileInfo[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const parsed = isSetFileName(entry.name);
    if (!parsed) continue;

    const filePath = path.join(workflowDir, entry.name);
    const { etag, size, lastModified } = await statFile(filePath);
    results.push({
      workflowId,
      nodeId: parsed.nodeId,
      kind: 'set',
      uri: buildUri('set', workflowId, parsed.nodeId, 'set.json'),
      etag,
      size,
      lastModified,
    });
  }

  return results;
}

async function resolveCodeFilePath(workflowId: string, nodeId: string): Promise<{ filePath: string; ext: 'py' | 'json' }>{
  assertWorkflowId(workflowId);
  assertNodeId(nodeId);
  const workflowDir = await getWorkflowDir(workflowId);

  const pyPath = path.join(workflowDir, `${nodeId}.py`);
  if (existsSync(pyPath)) {
    return { filePath: pyPath, ext: 'py' };
  }

  const jsPath = path.join(workflowDir, `${nodeId}.json`);
  if (existsSync(jsPath)) {
    return { filePath: jsPath, ext: 'json' };
  }

  throw new Error(`Code file not found for nodeId ${nodeId}`);
}

async function resolveSetFilePath(workflowId: string, nodeId: string): Promise<string> {
  assertWorkflowId(workflowId);
  assertNodeId(nodeId);
  const workflowDir = await getWorkflowDir(workflowId);

  const setPath = path.join(workflowDir, `${nodeId}.set.json`);
  if (!existsSync(setPath)) {
    throw new Error(`Set file not found for nodeId ${nodeId}`);
  }

  return setPath;
}

export async function readCodeFile(workflowId: string, nodeId: string): Promise<WorkflowFileContent> {
  const { filePath, ext } = await resolveCodeFilePath(workflowId, nodeId);
  const data = await fs.readFile(filePath, 'utf-8');
  const { etag, size, lastModified } = await statFile(filePath);
  return {
    workflowId,
    nodeId,
    kind: 'code',
    language: resolveCodeLanguage(ext),
    uri: buildUri('code', workflowId, nodeId, ext),
    content: data,
    etag,
    size,
    lastModified,
  };
}

export async function readSetFile(workflowId: string, nodeId: string): Promise<WorkflowFileContent> {
  const filePath = await resolveSetFilePath(workflowId, nodeId);
  const data = await fs.readFile(filePath, 'utf-8');
  const { etag, size, lastModified } = await statFile(filePath);
  return {
    workflowId,
    nodeId,
    kind: 'set',
    uri: buildUri('set', workflowId, nodeId, 'set.json'),
    content: data,
    etag,
    size,
    lastModified,
  };
}

function resolveWriteExt(language?: string): 'py' | 'json' {
  if (!language) {
    throw new Error('language is required when creating a new code file');
  }
  const normalized = language.toLowerCase();
  if (['python', 'pythonnative', 'py'].includes(normalized)) {
    return 'py';
  }
  if (['javascript', 'js', 'json'].includes(normalized)) {
    return 'json';
  }
  throw new Error(`Unsupported language: ${language}`);
}

async function verifyExpectedEtag(filePath: string, expectedEtag?: string): Promise<void> {
  if (!expectedEtag) return;
  const { etag } = await statFile(filePath);
  if (etag !== expectedEtag) {
    const error = new Error('ETag mismatch: file has changed');
    (error as any).code = 'CONFLICT';
    throw error;
  }
}

export async function writeCodeFile(workflowId: string, nodeId: string, content: string, expectedEtag?: string, language?: string): Promise<WorkflowFileInfo> {
  assertWorkflowId(workflowId);
  assertNodeId(nodeId);
  const workflowDir = await getWorkflowDir(workflowId);

  let filePath: string;
  let ext: 'py' | 'json';

  const pyPath = path.join(workflowDir, `${nodeId}.py`);
  const jsPath = path.join(workflowDir, `${nodeId}.json`);

  if (existsSync(pyPath)) {
    filePath = pyPath;
    ext = 'py';
  } else if (existsSync(jsPath)) {
    filePath = jsPath;
    ext = 'json';
  } else {
    ext = resolveWriteExt(language);
    filePath = path.join(workflowDir, `${nodeId}.${ext}`);
  }

  if (existsSync(filePath)) {
    await verifyExpectedEtag(filePath, expectedEtag);
  } else if (expectedEtag) {
    const error = new Error('ETag mismatch: file does not exist');
    (error as any).code = 'CONFLICT';
    throw error;
  }

  await fs.writeFile(filePath, content, 'utf-8');
  await fs.chmod(filePath, 0o666).catch(() => undefined);

  const { etag, size, lastModified } = await statFile(filePath);

  return {
    workflowId,
    nodeId,
    kind: 'code',
    language: resolveCodeLanguage(ext),
    uri: buildUri('code', workflowId, nodeId, ext),
    etag,
    size,
    lastModified,
  };
}

export async function writeSetFile(workflowId: string, nodeId: string, content: string, expectedEtag?: string): Promise<WorkflowFileInfo> {
  assertWorkflowId(workflowId);
  assertNodeId(nodeId);
  const workflowDir = await getWorkflowDir(workflowId);
  const filePath = path.join(workflowDir, `${nodeId}.set.json`);

  if (existsSync(filePath)) {
    await verifyExpectedEtag(filePath, expectedEtag);
  } else if (expectedEtag) {
    const error = new Error('ETag mismatch: file does not exist');
    (error as any).code = 'CONFLICT';
    throw error;
  }

  await fs.writeFile(filePath, content, 'utf-8');
  await fs.chmod(filePath, 0o666).catch(() => undefined);

  const { etag, size, lastModified } = await statFile(filePath);

  return {
    workflowId,
    nodeId,
    kind: 'set',
    uri: buildUri('set', workflowId, nodeId, 'set.json'),
    etag,
    size,
    lastModified,
  };
}

export interface WorkflowResourceDescriptor {
  name: string;
  title: string;
  uri: string;
  description: string;
  mimeType: string;
  _meta: Record<string, unknown>;
}

export interface WorkflowResourceWriteResult {
  uri: string;
  etag: string;
  size: number;
  lastModified: string;
}

export async function listWorkflowResources(): Promise<WorkflowResourceDescriptor[]> {
  const root = path.resolve(WORKFLOWS_ROOT);
  const resources: WorkflowResourceDescriptor[] = [];
  const queue: string[] = [root];
  let visited = 0;
  const maxVisited = 20000;

  while (queue.length > 0) {
    const current = queue.shift() as string;
    visited += 1;
    if (visited > maxVisited) {
      logger.warn('Resource scan exceeded max depth', { root });
      break;
    }

    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.')) continue;
        if (entry.name === 'node_modules') continue;
        queue.push(path.join(current, entry.name));
        continue;
      }

      if (!entry.isFile()) continue;

      const setParsed = isSetFileName(entry.name);
      const codeParsed = isCodeFileName(entry.name);
      if (!setParsed && !codeParsed) continue;

      const parentDir = path.basename(current);
      const workflowId = parseWorkflowDirName(parentDir);
      if (!workflowId) continue;
      const nodeId = setParsed?.nodeId ?? codeParsed?.nodeId;
      if (!nodeId) continue;

      const filePath = path.join(current, entry.name);
      const { etag, size, lastModified } = await statFile(filePath);

      if (setParsed) {
        const uri = buildUri('set', workflowId, nodeId, 'set.json');
        resources.push({
          name: `${workflowId}/${nodeId}.set.json`,
          title: 'n8n Set(raw) node file',
          uri,
          description: 'Set(raw) node parameters saved as JSON. URI encodes workflowId and nodeId: n8n-workflows:///set/{workflowId}/{nodeId}.set.json',
          mimeType: 'application/json',
          _meta: { workflowId, nodeId, kind: 'set', etag, size, lastModified }
        });
        continue;
      }

      if (codeParsed) {
        const ext = codeParsed.ext;
        const uri = buildUri('code', workflowId, nodeId, ext);
        resources.push({
          name: `${workflowId}/${nodeId}.${ext}`,
          title: 'n8n Code node file',
          uri,
          description: 'Code node source file (JavaScript or Python). URI encodes workflowId and nodeId: n8n-workflows:///code/{workflowId}/{nodeId}.{ext}',
          mimeType: resolveCodeMime(ext),
          _meta: { workflowId, nodeId, kind: 'code', language: resolveCodeLanguage(ext), etag, size, lastModified }
        });
      }
    }
  }

  return resources;
}

export async function readWorkflowResource(uri: string): Promise<{ uri: string; mimeType: string; text: string; _meta: Record<string, unknown> }>{
  const parsed = parseWorkflowResourceUri(uri);

  if (parsed.kind === 'code') {
    const workflowDir = await getWorkflowDir(parsed.workflowId);
    const filePath = path.join(workflowDir, `${parsed.nodeId}.${parsed.ext}`);
    if (!existsSync(filePath)) {
      throw new Error(`File not found for URI: ${uri}`);
    }
    const content = await fs.readFile(filePath, 'utf-8');
    const { etag, size, lastModified } = await statFile(filePath);
    return {
      uri,
      mimeType: resolveCodeMime(parsed.ext),
      text: content,
      _meta: {
        workflowId: parsed.workflowId,
        nodeId: parsed.nodeId,
        kind: 'code',
        language: resolveCodeLanguage(parsed.ext),
        etag,
        size,
        lastModified
      }
    };
  }

  const workflowDir = await getWorkflowDir(parsed.workflowId);
  const filePath = path.join(workflowDir, `${parsed.nodeId}.set.json`);
  if (!existsSync(filePath)) {
    throw new Error(`File not found for URI: ${uri}`);
  }
  const content = await fs.readFile(filePath, 'utf-8');
  const { etag, size, lastModified } = await statFile(filePath);
  return {
    uri,
    mimeType: 'application/json',
    text: content,
    _meta: { workflowId: parsed.workflowId, nodeId: parsed.nodeId, kind: 'set', etag, size, lastModified }
  };
}

export async function writeWorkflowResource(
  uri: string,
  content: string,
  expectedEtag?: string
): Promise<WorkflowResourceWriteResult> {
  const parsed = parseWorkflowResourceUri(uri);
  const workflowDir = await getWorkflowDir(parsed.workflowId);
  const fileName = parsed.kind === 'code'
    ? `${parsed.nodeId}.${parsed.ext}`
    : `${parsed.nodeId}.set.json`;
  const filePath = path.join(workflowDir, fileName);

  if (existsSync(filePath)) {
    await verifyExpectedEtag(filePath, expectedEtag);
  } else if (expectedEtag) {
    const error = new Error('ETag mismatch: file does not exist');
    (error as any).code = 'CONFLICT';
    throw error;
  }

  await fs.writeFile(filePath, content, 'utf-8');
  await fs.chmod(filePath, 0o666).catch(() => undefined);
  const { etag, size, lastModified } = await statFile(filePath);
  return { uri, etag, size, lastModified };
}

export interface PatchApplyOptions {
  minContextLines?: number;
  maxFuzz?: number;
  ignoreWhitespaceInContext?: boolean;
}

export async function patchWorkflowResource(
  uri: string,
  patch: string,
  expectedEtag?: string,
  options?: PatchApplyOptions
): Promise<WorkflowResourceWriteResult> {
  const parsed = parseWorkflowResourceUri(uri);
  const workflowDir = await getWorkflowDir(parsed.workflowId);
  const fileName = parsed.kind === 'code'
    ? `${parsed.nodeId}.${parsed.ext}`
    : `${parsed.nodeId}.set.json`;
  const filePath = path.join(workflowDir, fileName);

  if (!existsSync(filePath)) {
    throw new Error(`File not found for URI: ${uri}`);
  }

  await verifyExpectedEtag(filePath, expectedEtag);

  const current = await fs.readFile(filePath, 'utf-8');
  const updated = applyUnifiedPatch(current, patch, options);

  await fs.writeFile(filePath, updated, 'utf-8');
  await fs.chmod(filePath, 0o666).catch(() => undefined);
  const { etag, size, lastModified } = await statFile(filePath);
  return { uri, etag, size, lastModified };
}

function applyUnifiedPatch(
  originalText: string,
  patchText: string,
  options?: PatchApplyOptions
): string {
  const usesCrlf = originalText.includes('\r\n');
  const normalizedOriginal = originalText.replace(/\r\n/g, '\n');
  const normalizedPatch = normalizePatchText(patchText);
  const resolvedOptions = normalizePatchOptions(options);

  const originalLines = normalizedOriginal.split('\n');
  const patchLines = normalizedPatch.split('\n');

  let offset = 0;
  let sawHunk = false;

  for (let i = 0; i < patchLines.length; i++) {
    const line = patchLines[i];
    if (!line.startsWith('@@')) {
      continue;
    }

    sawHunk = true;
    const hunkLines = collectHunkLines(patchLines, i + 1);
    const hunkEndIndex = i + hunkLines.length;

    let startOld: number | null = null;
    const match = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!match) {
      if (line.trim() === '@@') {
        startOld = findHunkStart(originalLines, hunkLines, resolvedOptions) + 1;
      } else {
        throw new Error(`Invalid hunk header: ${line}`);
      }
    } else {
      startOld = Number(match[1]);
    }

    if (startOld === null) {
      throw new Error(`Invalid hunk header: ${line}`);
    }

    let added = 0;
    let removed = 0;
    let index = startOld - 1 + offset;
    if (index < 0 || index > originalLines.length) {
      throw new Error(`Hunk out of range: ${line}`);
    }

    try {
      ({ added, removed } = applyHunk(originalLines, index, hunkLines, resolvedOptions));
    } catch (error) {
      if (resolvedOptions.maxFuzz > 0 || resolvedOptions.ignoreWhitespaceInContext || resolvedOptions.minContextLines > 0) {
        const relocated = findHunkStart(originalLines, hunkLines, resolvedOptions);
        ({ added, removed } = applyHunk(originalLines, relocated, hunkLines, resolvedOptions));
      } else {
        throw error;
      }
    }

    offset += added - removed;
    i = hunkEndIndex;
  }

  if (!sawHunk) {
    throw new Error('Patch does not contain any hunks');
  }

  let result = originalLines.join('\n');
  if (usesCrlf) {
    result = result.replace(/\n/g, '\r\n');
  }
  return result;
}

function normalizePatchOptions(options?: PatchApplyOptions): Required<PatchApplyOptions> {
  const minContextLines = Number.isFinite(options?.minContextLines) ? Number(options?.minContextLines) : 0;
  const maxFuzz = Number.isFinite(options?.maxFuzz) ? Number(options?.maxFuzz) : 0;
  const ignoreWhitespaceInContext = Boolean(options?.ignoreWhitespaceInContext);

  return {
    minContextLines: Math.max(0, Math.min(minContextLines, 10)),
    maxFuzz: Math.max(0, Math.min(maxFuzz, 2)),
    ignoreWhitespaceInContext
  };
}

function normalizePatchText(patchText: string): string {
  const normalized = patchText.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const cleaned: string[] = [];

  for (const line of lines) {
    if (line.startsWith('*** Begin Patch')) continue;
    if (line.startsWith('*** End Patch')) continue;
    if (line.startsWith('*** Update File:')) continue;
    if (line.startsWith('*** Add File:')) continue;
    if (line.startsWith('*** Delete File:')) continue;
    if (line.startsWith('*** Move to:')) continue;
    if (line.startsWith('diff --git ')) continue;
    if (line.startsWith('--- ')) continue;
    if (line.startsWith('+++ ')) continue;
    cleaned.push(line);
  }

  return cleaned.join('\n');
}

function collectHunkLines(patchLines: string[], startIndex: number): string[] {
  const hunkLines: string[] = [];
  for (let j = startIndex; j < patchLines.length; j++) {
    const line = patchLines[j];
    if (line.startsWith('@@')) {
      break;
    }
    hunkLines.push(line);
  }
  return hunkLines;
}

function applyHunk(
  originalLines: string[],
  startIndex: number,
  hunkLines: string[],
  options: Required<PatchApplyOptions>
): { added: number; removed: number } {
  let index = startIndex;
  let added = 0;
  let removed = 0;

  for (const hunkLine of hunkLines) {
    if (hunkLine.startsWith('@@')) {
      break;
    }
    if (hunkLine.startsWith('\\')) {
      continue;
    }
    if (hunkLine === '') {
      continue;
    }
    if (hunkLine.startsWith(' ')) {
      const expected = hunkLine.slice(1);
      if (!contextMatches(originalLines[index], expected, options)) {
        throw new Error(`Patch context mismatch at line ${index + 1}`);
      }
      index += 1;
      continue;
    }
    if (hunkLine.startsWith('-')) {
      const expected = hunkLine.slice(1);
      if (originalLines[index] !== expected) {
        throw new Error(`Patch removal mismatch at line ${index + 1}`);
      }
      originalLines.splice(index, 1);
      removed += 1;
      continue;
    }
    if (hunkLine.startsWith('+')) {
      const value = hunkLine.slice(1);
      originalLines.splice(index, 0, value);
      index += 1;
      added += 1;
      continue;
    }
    throw new Error(`Invalid patch line: ${hunkLine}`);
  }

  return { added, removed };
}

function contextMatches(actual: string | undefined, expected: string, options: Required<PatchApplyOptions>): boolean {
  if (actual === undefined) return false;
  if (!options.ignoreWhitespaceInContext) {
    return actual === expected;
  }
  return normalizeWhitespace(actual) === normalizeWhitespace(expected);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function findHunkStart(
  originalLines: string[],
  hunkLines: string[],
  options: Required<PatchApplyOptions>
): number {
  const sequence = buildOldSequence(hunkLines);
  if (sequence.lines.length === 0) {
    throw new Error('Cannot infer hunk range: no context or removals. Use @@ -a,b +c,d @@.');
  }

  let ambiguous = false;

  for (let fuzz = 0; fuzz <= options.maxFuzz; fuzz += 1) {
    for (let trimStart = 0; trimStart <= fuzz; trimStart += 1) {
      for (let trimEnd = 0; trimEnd <= fuzz - trimStart; trimEnd += 1) {
        const trimmed = trimSequence(sequence, trimStart, trimEnd, options.minContextLines);
        if (!trimmed) {
          continue;
        }

        const matches = findSequenceMatches(originalLines, trimmed.lines, trimmed.contextMask, options);
        if (matches.length === 1) {
          return matches[0];
        }
        if (matches.length > 1) {
          ambiguous = true;
        }
      }
    }
  }

  if (ambiguous) {
    throw new Error('Patch context is ambiguous. Use @@ -a,b +c,d @@.');
  }

  throw new Error('Patch context not found. Use @@ -a,b +c,d @@.');
}

function buildOldSequence(hunkLines: string[]): { lines: string[]; contextMask: boolean[] } {
  const lines: string[] = [];
  const contextMask: boolean[] = [];

  for (const line of hunkLines) {
    if (line.startsWith('\\')) {
      continue;
    }
    if (line === '') {
      continue;
    }
    if (line.startsWith(' ')) {
      lines.push(line.slice(1));
      contextMask.push(true);
      continue;
    }
    if (line.startsWith('-')) {
      lines.push(line.slice(1));
      contextMask.push(false);
      continue;
    }
    if (line.startsWith('+')) {
      continue;
    }
    throw new Error(`Invalid patch line: ${line}`);
  }

  return { lines, contextMask };
}

function trimSequence(
  sequence: { lines: string[]; contextMask: boolean[] },
  trimStart: number,
  trimEnd: number,
  minContextLines: number
): { lines: string[]; contextMask: boolean[] } | null {
  let start = 0;
  let end = sequence.lines.length - 1;
  let removedStart = 0;
  let removedEnd = 0;

  while (removedStart < trimStart && start <= end) {
    if (!sequence.contextMask[start]) {
      return null;
    }
    start += 1;
    removedStart += 1;
  }

  while (removedEnd < trimEnd && end >= start) {
    if (!sequence.contextMask[end]) {
      return null;
    }
    end -= 1;
    removedEnd += 1;
  }

  const lines = sequence.lines.slice(start, end + 1);
  const contextMask = sequence.contextMask.slice(start, end + 1);
  const contextCount = contextMask.filter(Boolean).length;

  if (contextCount < minContextLines) {
    return null;
  }

  return { lines, contextMask };
}

function findSequenceMatches(
  originalLines: string[],
  sequenceLines: string[],
  contextMask: boolean[],
  options: Required<PatchApplyOptions>
): number[] {
  const matches: number[] = [];
  if (sequenceLines.length === 0) {
    return matches;
  }

  for (let i = 0; i <= originalLines.length - sequenceLines.length; i++) {
    let ok = true;
    for (let j = 0; j < sequenceLines.length; j++) {
      const actual = originalLines[i + j];
      const expected = sequenceLines[j];
      if (contextMask[j]) {
        if (!contextMatches(actual, expected, options)) {
          ok = false;
          break;
        }
      } else if (actual !== expected) {
        ok = false;
        break;
      }
    }
    if (ok) {
      matches.push(i);
    }
  }

  return matches;
}

function parseWorkflowResourceUri(
  uri: string
):
  | { kind: 'code'; workflowId: string; nodeId: string; ext: 'py' | 'json' }
  | { kind: 'set'; workflowId: string; nodeId: string } {
  const parsed = new URL(uri);
  if (parsed.protocol !== 'n8n-workflows:') {
    throw new Error(`Unsupported resource URI: ${uri}`);
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 3) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const kind = parts[0];
  const workflowId = parts[1];
  const fileName = parts.slice(2).join('/');

  assertWorkflowId(workflowId);

  if (kind === 'code') {
    const match = fileName.match(/^([0-9a-fA-F-]{36})\.(py|json)$/);
    if (!match) throw new Error(`Invalid code file name in URI: ${uri}`);
    const nodeId = match[1];
    const ext = match[2] as 'py' | 'json';
    assertNodeId(nodeId);
    return { kind: 'code', workflowId, nodeId, ext };
  }

  if (kind === 'set') {
    const match = fileName.match(/^([0-9a-fA-F-]{36})\.set\.json$/);
    if (!match) throw new Error(`Invalid set file name in URI: ${uri}`);
    const nodeId = match[1];
    assertNodeId(nodeId);
    return { kind: 'set', workflowId, nodeId };
  }

  throw new Error(`Unsupported resource URI: ${uri}`);
}

export function listWorkflowResourceTemplates(): Array<{ name: string; title: string; uriTemplate: string; description: string; mimeType?: string }>{
  return [
    {
      name: 'n8n_code_file',
      title: 'n8n code node file',
      uriTemplate: 'n8n-workflows:///code/{workflowId}/{nodeId}.{ext}',
      description: 'Code node source file (JavaScript .json or Python .py) by workflowId and nodeId'
    },
    {
      name: 'n8n_set_file',
      title: 'n8n set(raw) node file',
      uriTemplate: 'n8n-workflows:///set/{workflowId}/{nodeId}.set.json',
      description: 'Set(raw) node JSON file by workflowId and nodeId',
      mimeType: 'application/json'
    }
  ];
}
