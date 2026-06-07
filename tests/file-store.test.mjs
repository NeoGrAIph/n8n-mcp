import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { exportDiagnostics, listWorkflowFiles, observeWorkflowFile, readWorkflowFile, reconcileWorkflowFiles, validateWorkflowFile } from '../src/file-store.mjs';
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

test('ETag is a strong byte hash and observes external edits without echoing content', async () => {
  const fixture = await createWorkflowFixture();
  const before = await readWorkflowFile(fixture.config, fixture.codeUri);
  const filePath = path.join(fixture.root, 'development', `code_nodes_${fixture.workflowId}`, `${fixture.nodeId}.py`);
  await fs.writeFile(filePath, 'print("after")\n');
  const after = await readWorkflowFile(fixture.config, fixture.codeUri);
  assert.notEqual(after.etag, before.etag);
  assert.equal(after.etag, crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex'));
  const observed = await observeWorkflowFile(fixture.config, { uri: fixture.codeUri, expectedEtag: before.etag, expectedContent: 'print("after")\n', timeoutMs: 100 });
  assert.equal(observed.settled, true);
  assert.equal(observed.etagMatches, false);
  assert.equal(observed.contentMatches, true);
  assert.equal(JSON.stringify(observed).includes('print("after")'), false);
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
  assert.equal(valid.validSyntax, true);
  assert.equal(valid.safeToEdit, true);
  assert.equal(valid.locator.node.type, 'n8n-nodes-base.set');
  const invalid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri, content: '{bad' });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.validSyntax, false);
  assert.equal(invalid.safeToEdit, false);
});

test('validates Set(raw) n8n expression content', async () => {
  const fixture = await createWorkflowFixture();
  const valid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri, content: '={{ { ok: true } }}' });
  assert.equal(valid.valid, false);
  assert.equal(valid.validSyntax, true);
  assert.equal(valid.safeToEdit, false);
  assert.equal(valid.diagnostics.some(item => item.code === 'SET_RAW_EXPRESSION'), true);
  assert.equal(valid.diagnostics.some(item => item.code === 'UNSAFE_LOCATOR_STATUS'), true);
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

test('empty workflow nodes are unsafe locator status', async () => {
  const fixture = await createWorkflowFixture();
  const workflowJson = path.join(fixture.root, 'development', `${fixture.workflowId}.fixture.json`);
  const envelope = JSON.parse(await fs.readFile(workflowJson, 'utf8'));
  envelope.workflow.nodes = [];
  await fs.writeFile(workflowJson, JSON.stringify(envelope, null, 2));
  const status = await reconcileWorkflowFiles(fixture.config, { workflowId: fixture.workflowId });
  assert.equal(status.status, 'nodes_empty');
  assert.equal(status.summary.nodes_empty, 1);
  assert.equal(status.summary.ready, 0);
  const files = await listWorkflowFiles(fixture.config, fixture.workflowId);
  assert.equal(files.length, 2);
  assert.equal(files.every(file => file.locator.status === 'nodes_empty'), true);
});

test('ambiguous workflow JSON is an unsafe locator status', async () => {
  const fixture = await createWorkflowFixture();
  const workflowJson = path.join(fixture.root, 'development', `${fixture.workflowId}.duplicate.json`);
  await fs.writeFile(workflowJson, JSON.stringify({ workflow: { nodes: [] } }, null, 2));
  const status = await reconcileWorkflowFiles(fixture.config, { workflowId: fixture.workflowId });
  assert.equal(status.status, 'ambiguous_workflow_json');
  assert.equal(status.summary.ambiguous_workflow_json, 1);
  assert.equal(status.targets.length, 0);
  assert.equal(status.workflowJsonCandidates.length, 2);
  const files = await listWorkflowFiles(fixture.config, fixture.workflowId);
  assert.equal(files.length, 2);
  assert.equal(files.every(file => file.locator.status === 'ambiguous_workflow_json'), true);
});

test('export diagnostics require platform preflight for production readiness', async () => {
  const fixture = await createWorkflowFixture();
  const diagnostics = await exportDiagnostics(fixture.config);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.mcpLocatorReadiness.status, 'degraded');
  assert.equal(diagnostics.mcpLocatorReadiness.errorCount, 0);
  assert.equal(diagnostics.productionReadiness.ready, false);
  assert.equal(diagnostics.productionReadiness.decision, 'requires-platform-preflight');
  assert.equal(diagnostics.camelK.availableInContainer, false);
  const byName = new Map(diagnostics.productionReadiness.requiredChecks.map(check => [check.name, check]));
  const aggregate = byName.get('n8n-split-mcp-production-readiness');
  assert.equal(aggregate.readOnly, true);
  assert.deepEqual(aggregate.requiredFor, ['production-readiness', 'native-mcp-readiness', 'gateway-exposure', 'production-file-layer-readiness']);
  assert.match(aggregate.command, /^cd '~\/repo\/synestra-platform' && scripts\/mcp\/audit_n8n_two_mcp_production_readiness\.sh --env dev /);
  assert.match(aggregate.command, /--native-token-file '<secure-native-token-file>'/);
  assert.match(aggregate.command, /--safe-workflow-id '<disposable-or-known-safe-workflow-id>'/);
  assert.match(aggregate.command, / --json$/);
  const camelK = byName.get('camel-k-db-files-recovery-preflight');
  assert.equal(camelK.readOnly, true);
  assert.match(camelK.command, /^cd '~\/repo\/synestra-platform' && scripts\/mcp\/preflight_n8n_camelk_recovery\.sh --env dev --json$/);
  const classifier = byName.get('n8n-recovery-candidate-classifier');
  assert.equal(classifier.readOnly, true);
  assert.match(classifier.command, /^cd '~\/repo\/synestra-platform' && scripts\/mcp\/classify_n8n_recovery_candidates\.sh --env dev --json$/);
  assert.equal(JSON.stringify(diagnostics).includes('print("before")'), false);
  assert.equal(JSON.stringify(diagnostics).includes('{"ok":true}'), false);
});
