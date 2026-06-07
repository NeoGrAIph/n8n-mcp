import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { listWorkflowFiles, readWorkflowFile, reconcileWorkflowFiles, validateWorkflowFile } from '../src/file-store.mjs';
import { createWorkflowFixture } from './fixtures.mjs';

test('lists and reads Code and Set(raw) files with ETags', async () => {
  const fixture = await createWorkflowFixture();
  const files = await listWorkflowFiles(fixture.config, fixture.workflowId);
  assert.equal(files.length, 2);
  assert.equal(files.every(file => file.locator.status === 'ready'), true);
  const code = await readWorkflowFile(fixture.config, fixture.codeUri);
  assert.equal(code.kind, 'code');
  assert.equal(code.language, 'python');
  assert.equal(code.locator.status, 'ready');
  assert.equal(code.locator.node.type, 'n8n-nodes-base.code');
  assert.equal(Object.prototype.hasOwnProperty.call(code, 'content'), false);
  assert.match(code.filesystemPath, /code_nodes_/);
  assert.match(code.containerPath, /code_nodes_/);
  assert.match(code.etag, /^[a-f0-9]{64}$/);
});

test('list reports stale exports instead of ready locators', async () => {
  const fixture = await createWorkflowFixture();
  await fs.writeFile(path.join(fixture.root, 'development', `code_nodes_${fixture.workflowId}`, `${fixture.nodeId}.py`), 'print("stale")\n');
  const files = await listWorkflowFiles(fixture.config, fixture.workflowId);
  const code = files.find(file => file.nodeId === fixture.nodeId);
  assert.equal(code.locator.status, 'stale_export');
});

test('validates Set(raw) JSON content', async () => {
  const fixture = await createWorkflowFixture();
  const valid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri });
  assert.equal(valid.valid, true);
  assert.equal(valid.locator.node.type, 'n8n-nodes-base.set');
  const invalid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri, content: '{bad' });
  assert.equal(invalid.valid, false);
});

test('validates Set(raw) n8n expression content', async () => {
  const fixture = await createWorkflowFixture();
  const valid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri, content: '={{ { ok: true } }}' });
  assert.equal(valid.valid, true);
  assert.equal(valid.diagnostics.some(item => item.code === 'SET_RAW_EXPRESSION'), true);
});

test('reconcile reports workflow file-layer parity', async () => {
  const fixture = await createWorkflowFixture();
  const status = await reconcileWorkflowFiles(fixture.config, { workflowId: fixture.workflowId });
  assert.equal(status.status, 'ready');
  assert.equal(status.summary.ready, 2);
  assert.equal(status.summary.missing_file, 0);
  assert.equal(status.targets.length, 2);
});

test('reconcile reports null Set(raw) payload as unsafe locator status', async () => {
  const fixture = await createWorkflowFixture();
  const workflowJson = path.join(fixture.root, 'development', `${fixture.workflowId}.fixture.json`);
  const envelope = JSON.parse(await fs.readFile(workflowJson, 'utf8'));
  envelope.workflow.nodes.find(node => node.id === fixture.setNodeId).parameters.jsonOutput = null;
  await fs.writeFile(workflowJson, JSON.stringify(envelope, null, 2));
  const status = await reconcileWorkflowFiles(fixture.config, { workflowId: fixture.workflowId });
  assert.equal(status.summary.null_set_raw_payload, 1);
  const files = await listWorkflowFiles(fixture.config, fixture.workflowId);
  const setFile = files.find(file => file.nodeId === fixture.setNodeId);
  assert.equal(setFile.locator.status, 'null_set_raw_payload');
});

test('list reports missing workflow JSON for orphan extracted files', async () => {
  const fixture = await createWorkflowFixture();
  await fs.rm(path.join(fixture.root, 'development', `${fixture.workflowId}.fixture.json`));
  const files = await listWorkflowFiles(fixture.config, fixture.workflowId);
  assert.equal(files.length, 2);
  assert.equal(files.every(file => file.locator.status === 'missing_workflow_json'), true);
});
