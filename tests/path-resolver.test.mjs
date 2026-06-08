import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { parseResourceUri, resolveTargetFile } from '../src/path-resolver.mjs';
import { createWorkflowFixture } from './fixtures.mjs';

test('parses Synestra workflow resource URI', () => {
  const parsed = parseResourceUri('synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb.py');
  assert.equal(parsed.kind, 'code');
  assert.equal(parsed.ext, 'py');
});

test('rejects encoded slash URI traversal', () => {
  assert.throws(() => parseResourceUri('synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb%2f.py'), /Invalid resource URI/);
});

test('rejects archived targets by default', async () => {
  const fixture = await createWorkflowFixture();
  await fs.mkdir(path.join(fixture.root, '.archived'), { recursive: true });
  await fs.writeFile(path.join(fixture.root, '.index', `${fixture.workflowId}.path`), '.archived\n');
  await assert.rejects(() => resolveTargetFile(fixture.config, fixture.codeUri), /Archived workflow path/);
});

test('rejects hidden index paths', async () => {
  const fixture = await createWorkflowFixture();
  await fs.writeFile(path.join(fixture.root, '.index', `${fixture.workflowId}.path`), '.hidden\n');
  await assert.rejects(() => resolveTargetFile(fixture.config, fixture.codeUri), /Hidden workflow directories are not allowed/);
});

test('rejects index path escape', async () => {
  const fixture = await createWorkflowFixture();
  await fs.writeFile(path.join(fixture.root, '.index', `${fixture.workflowId}.path`), '../outside\n');
  await assert.rejects(() => resolveTargetFile(fixture.config, fixture.codeUri), /Workflow index path must stay relative to root/);
});

test('rejects workflow code directory symlink', async () => {
  const fixture = await createWorkflowFixture();
  const codeDir = path.join(fixture.root, 'development', `code_nodes_${fixture.workflowId}`);
  const realCodeDir = path.join(fixture.repo, 'real-code-dir');
  await fs.rename(codeDir, realCodeDir);
  await fs.symlink(realCodeDir, codeDir, 'dir');
  await assert.rejects(() => resolveTargetFile(fixture.config, fixture.codeUri), /Workflow code directory must not be a symlink/);
});

test('rejects target file symlink', async () => {
  const fixture = await createWorkflowFixture();
  const targetFile = path.join(fixture.root, 'development', `code_nodes_${fixture.workflowId}`, `${fixture.nodeId}.py`);
  const realTargetFile = path.join(fixture.repo, 'real-target.py');
  await fs.rename(targetFile, realTargetFile);
  await fs.symlink(realTargetFile, targetFile);
  await assert.rejects(() => resolveTargetFile(fixture.config, fixture.codeUri), /Symlink targets are not allowed/);
});
