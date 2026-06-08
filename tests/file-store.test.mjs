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
  assert.equal(files.every(file => file.editReadiness.localLocatorReady === true), true);
  assert.equal(files.every(file => file.editReadiness.effectiveDecision === 'requires-platform-preflight'), true);
  const code = await readWorkflowFile(fixture.config, fixture.codeUri);
  assert.equal(code.kind, 'code');
  assert.equal(code.language, 'python');
  assert.equal(code.locator.status, 'ready');
  assert.equal(code.editReadiness.localLocatorReady, true);
  assert.equal(code.editReadiness.effectiveDecision, 'requires-platform-preflight');
  assert.equal(code.editReadiness.platformPreflightRequired, true);
  assert.equal(code.editReadiness.externalFilesystemEditAllowed, false);
  assert.equal(code.editReadiness.readOnlyInspectionAllowed, true);
  assert.equal(code.editReadiness.filesystemToolPolicy, 'inspect-only-until-platform-go');
  assert.equal(code.editReadiness.platformBridge.aggregateField, 'fileLayerSafety.synestraMcpBridge');
  assert.equal(code.editReadiness.platformBridge.localLocatorReadinessIsSufficient, false);
  assert.deepEqual(code.editReadiness.platformBridge.finalExternalEditAllowedRequires, [
    'editReadiness.localLocatorReady=true',
    'editReadiness.effectiveDecision=requires-platform-preflight',
    'filesystemToolGuard.finalExternalFilesystemEditAllowed=true',
    'filesystemToolGuard.exactTargetGatePresent=true',
    'fileLayerSafety.effectiveDecision=go',
    'fileLayerSafety.externalFileEditAllowed=true',
    'fileLayerSafety.blockers=[]',
    'fileLayerSafety.n8nDbContract.status=verified'
  ]);
  assert.equal(code.editReadiness.requiredPlatformFields.includes('filesystemToolGuard.finalExternalFilesystemEditAllowed'), true);
  assert.equal(code.editReadiness.requiredPlatformFields.includes('filesystemToolGuard.exactTargetGatePresent'), true);
  assert.equal(code.editReadiness.requiredPlatformFields.includes('fileLayerSafety.n8nDbContract.status'), true);
  assert.equal(code.editReadiness.requiredPlatformFields.includes('nextActions'), true);
  assert.equal(code.editReadiness.requiredPlatformFields.includes('fileLayerSafety.synestraMcpBridge'), true);
  assert.equal(code.editReadiness.noGoSignals.includes('filesystemToolGuard.finalExternalFilesystemEditAllowed=false'), true);
  assert.equal(code.editReadiness.noGoSignals.includes('filesystemToolGuard.exactTargetGatePresent=false'), true);
  assert.equal(code.editReadiness.noGoSignals.includes('fileLayerSafety.n8nDbContract.status!=verified'), true);
  assert.match(code.editReadiness.message, /filesystemToolGuard\.finalExternalFilesystemEditAllowed=true/);
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
  assert.equal(observed.contentSha256Matches, true);
  assert.equal(JSON.stringify(observed).includes('print("after")'), false);
  const hashObserved = await observeWorkflowFile(fixture.config, { uri: fixture.codeUri, expectedContentSha256: after.etag, timeoutMs: 100 });
  assert.equal(hashObserved.settled, true);
  assert.equal(hashObserved.contentMatches, true);
  assert.equal(hashObserved.contentSha256Matches, true);
  assert.equal(hashObserved.normalized, false);
  assert.deepEqual(hashObserved.diagnostics, []);
  const hashMismatchObserved = await observeWorkflowFile(fixture.config, { uri: fixture.codeUri, expectedContentSha256: '0'.repeat(64), timeoutMs: 100 });
  assert.equal(hashMismatchObserved.contentSha256Matches, false);
  assert.equal(hashMismatchObserved.normalized, true);
  assert.equal(hashMismatchObserved.diagnostics.some(item => item.code === 'EXPECTED_CONTENT_SHA256_MISMATCH'), true);
});

test('list reports stale exports instead of ready locators', async () => {
  const fixture = await createWorkflowFixture();
  await fs.writeFile(path.join(fixture.root, 'development', `code_nodes_${fixture.workflowId}`, `${fixture.nodeId}.py`), 'print("stale")\n');
  const files = await listWorkflowFiles(fixture.config, fixture.workflowId);
  const code = files.find(file => file.nodeId === fixture.nodeId);
  assert.equal(code.locator.status, 'stale_export');
  assert.equal(code.editReadiness.localLocatorReady, false);
  assert.equal(code.editReadiness.effectiveDecision, 'no-go');
  assert.equal(code.editReadiness.platformPreflightRequired, true);
});

test('locator metadata redacts expected content on stale kind or extension mismatch', async () => {
  const fixture = await createWorkflowFixture();
  const workflowJson = path.join(fixture.root, 'development', `${fixture.workflowId}.fixture.json`);
  const envelope = JSON.parse(await fs.readFile(workflowJson, 'utf8'));
  const codeNode = envelope.workflow.nodes.find(node => node.id === fixture.nodeId);
  codeNode.parameters = { language: 'javaScript', jsCode: 'return [{ json: { secret: "do-not-leak" } }];' };
  await fs.writeFile(workflowJson, JSON.stringify(envelope, null, 2));
  const code = await readWorkflowFile(fixture.config, fixture.codeUri);
  const serialized = JSON.stringify(code);
  assert.equal(code.locator.status, 'stale_export');
  assert.equal(code.locator.node.expected.ext, 'json');
  assert.equal(Object.prototype.hasOwnProperty.call(code.locator.node.expected, 'expectedContent'), false);
  assert.equal(serialized.includes('expectedContent'), false);
  assert.equal(serialized.includes('do-not-leak'), false);
  assert.equal(serialized.includes('jsCode'), false);
});

test('validates Set(raw) JSON content', async () => {
  const fixture = await createWorkflowFixture();
  const valid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri });
  assert.equal(valid.valid, true);
  assert.equal(valid.validSyntax, true);
  assert.equal(valid.safeToEdit, true);
  assert.equal(valid.safeToEditScope, 'local-locator-only');
  assert.equal(valid.validationInputSource, 'current-file');
  assert.equal(valid.contentSha256Matches, null);
  assert.equal(valid.editReadiness.effectiveDecision, 'requires-platform-preflight');
  assert.equal(valid.locator.node.type, 'n8n-nodes-base.set');
  const setPath = path.join(fixture.root, 'development', `code_nodes_${fixture.workflowId}`, `${fixture.setNodeId}.set.json`);
  const setHash = crypto.createHash('sha256').update(await fs.readFile(setPath)).digest('hex');
  const hashValid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri, contentSha256: setHash });
  assert.equal(hashValid.valid, true);
  assert.equal(hashValid.validationInputSource, 'current-file');
  assert.equal(hashValid.contentSha256Matches, true);
  const hashMismatch = await validateWorkflowFile(fixture.config, { uri: fixture.setUri, contentSha256: '0'.repeat(64) });
  assert.equal(hashMismatch.valid, false);
  assert.equal(hashMismatch.validationInputSource, 'current-file');
  assert.equal(hashMismatch.contentSha256Matches, false);
  assert.equal(hashMismatch.diagnostics.some(item => item.code === 'CONTENT_SHA256_MISMATCH'), true);
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
  assert.equal(diagnostics.build.packageVersion, '0.1.0');
  assert.equal(diagnostics.mcpLocatorReadiness.status, 'degraded');
  assert.equal(diagnostics.mcpLocatorReadiness.errorCount, 0);
  assert.equal(diagnostics.productionReadiness.ready, false);
  assert.equal(diagnostics.productionReadiness.decision, 'requires-platform-preflight');
  assert.equal(diagnostics.productionReadiness.handoff.handoffKind, 'platform-readiness-required');
  assert.equal(diagnostics.productionReadiness.handoff.sourceOfTruth, 'synestra-platform');
  assert.equal(diagnostics.productionReadiness.handoff.mcpMustNotWriteWorkflow, true);
  assert.equal(diagnostics.productionReadiness.handoff.workflowIdRequiredForRenderPreview, true);
  assert.equal(diagnostics.productionReadiness.handoff.nextAction, 'run-platform-readiness-gates');
  assert.match(diagnostics.productionReadiness.handoff.useFilesToolWhenLocatorReady, /locator\.status is ready/);
  assert.match(diagnostics.productionReadiness.handoff.useFilesToolWhenLocatorReady, /exact-target gate/);
  assert.match(diagnostics.productionReadiness.handoff.useFilesToolWhenLocatorReady, /sampled aggregate locator is not enough/);
  assert.deepEqual(diagnostics.productionReadiness.handoff.usePlatformPreflightFields, [
    'filesystemToolGuard.finalExternalFilesystemEditAllowed',
    'filesystemToolGuard.globalExternalEditPrerequisitesMet',
    'filesystemToolGuard.exactTargetGateRequired',
    'filesystemToolGuard.exactTargetGatePresent',
    'filesystemToolGuard.failedChecks',
    'filesystemToolGuard.checks',
    'filesystemToolGuard.blockerMatrix',
    'fileLayerSafety.synestraMcpBridge',
    'fileLayerSafety.effectiveDecision',
    'fileLayerSafety.blockers',
    'fileLayerSafety.blockerEvidence',
    'fileLayerSafety.targetReadinessGap',
    'fileLayerSafety.n8nDbContract.status',
    'fileLayerSafety.n8nDbContract.schemaFingerprint',
    'externalFileEditAllowed',
    'nextActions',
    'nextActionSummary',
    'dbFilesBackfillDryRun.dirtyArtifactSafety',
    'debeziumCdcFreshness.status',
    'debeziumLogRisk.overallStatus',
    'applyForbiddenReasons'
  ]);
  assert.match(diagnostics.productionReadiness.handoff.usePlatformRenderWhenNoGo, /filesystemToolGuard\.finalExternalFilesystemEditAllowed is false/);
  assert.match(diagnostics.productionReadiness.handoff.usePlatformRenderWhenNoGo, /follow platform nextActions/);
  assert.match(diagnostics.productionReadiness.handoff.usePlatformRenderWhenNoGo, /fileLayerSafety\.effectiveDecision is no-go/);
  assert.match(diagnostics.productionReadiness.handoff.usePlatformRenderWhenNoGo, /N8N_CAMELK_LOG_ACTIVE_WINDOW_SEC/);
  assert.match(diagnostics.productionReadiness.handoff.usePlatformRenderWhenNoGo, /classifier first/);
  assert.match(diagnostics.productionReadiness.handoff.commandSequence[0], /audit_n8n_two_mcp_production_readiness\.sh --env dev .* --uri '<same-uri>' --expected-etag '<pre-edit-etag>' --json$/);
  assert.match(diagnostics.productionReadiness.handoff.commandSequence[1], /preflight_n8n_camelk_recovery\.sh --env dev --summary-json$/);
  assert.match(diagnostics.productionReadiness.handoff.commandSequence[3], /--workflow-id '<reviewed-workflow-id>' --render-no-go-candidates-for-review --json$/);
  assert.match(diagnostics.productionReadiness.handoff.forbiddenActions.join('\n'), /Do not copy render preview artifacts/);
  assert.equal(diagnostics.camelK.availableInContainer, false);
  const byName = new Map(diagnostics.productionReadiness.requiredChecks.map(check => [check.name, check]));
  const aggregate = byName.get('n8n-split-mcp-production-readiness');
  assert.equal(aggregate.readOnly, true);
  assert.deepEqual(aggregate.requiredFor, ['production-readiness', 'native-mcp-readiness', 'gateway-exposure', 'production-file-layer-readiness']);
  assert.deepEqual(aggregate.requiredFields, [
    'filesystemToolGuard.finalExternalFilesystemEditAllowed',
    'filesystemToolGuard.globalExternalEditPrerequisitesMet',
    'filesystemToolGuard.exactTargetGateRequired',
    'filesystemToolGuard.exactTargetGatePresent',
    'filesystemToolGuard.failedChecks',
    'filesystemToolGuard.checks',
    'filesystemToolGuard.blockerMatrix',
    'fileLayerSafety.effectiveDecision',
    'fileLayerSafety.blockers',
    'fileLayerSafety.n8nDbContract.status',
    'fileLayerSafety.n8nDbContract.schemaFingerprint',
    'fileLayerSafety.blockerEvidence',
    'fileLayerSafety.targetReadinessGap'
  ]);
  assert.match(aggregate.noGoSignals.join('\n'), /filesystemToolGuard\.finalExternalFilesystemEditAllowed=false/);
  assert.match(aggregate.command, /^cd '~\/repo\/synestra-platform' && scripts\/mcp\/audit_n8n_two_mcp_production_readiness\.sh --env dev /);
  assert.match(aggregate.command, /--native-token-file '<secure-native-token-file>'/);
  assert.match(aggregate.command, /--safe-workflow-id '<disposable-or-known-safe-workflow-id>'/);
  assert.match(aggregate.command, / --json$/);
  const camelK = byName.get('camel-k-db-files-recovery-preflight');
  assert.equal(camelK.readOnly, true);
  assert.match(camelK.command, /^cd '~\/repo\/synestra-platform' && scripts\/mcp\/preflight_n8n_camelk_recovery\.sh --env dev --summary-json$/);
  assert.deepEqual(camelK.requiredFields, [
    'decision',
    'externalFileEditAllowed',
    'applyForbiddenReasons',
    'nextActions',
    'nextActionSummary',
    'targetReadinessGap',
    'blockerEvidence',
    'n8nDbContract.status',
    'n8nDbContract.schemaFingerprint',
    'dbFilesBackfillDryRun.dirtyArtifactSafety',
    'debeziumCdcFreshness.status',
    'debeziumLogRisk.overallStatus'
  ]);
  assert.match(camelK.noGoSignals.join('\n'), /dirtyArtifactSafety\.externalEditBlockedByDirtyArtifacts=true/);
  assert.match(camelK.noGoSignals.join('\n'), /active_blocker\|inconclusive\|historical_blocker/);
  assert.match(camelK.notes.join('\n'), /Use --json instead/);
  assert.match(camelK.notes.join('\n'), /Docs-only dirty artifacts/);
  assert.match(camelK.notes.join('\n'), /N8N_CAMELK_LOG_ACTIVE_WINDOW_SEC/);
  assert.match(camelK.notes.join('\n'), /quiet window/);
  const classifier = byName.get('n8n-recovery-candidate-classifier');
  assert.equal(classifier.readOnly, true);
  assert.match(classifier.command, /^cd '~\/repo\/synestra-platform' && scripts\/mcp\/classify_n8n_recovery_candidates\.sh --env dev --json$/);
  const renderPreview = byName.get('n8n-db-files-render-candidate-preview');
  assert.equal(renderPreview.readOnly, true);
  assert.equal(renderPreview.writesWorkflowRoot, false);
  assert.equal(renderPreview.sensitiveArtifacts, true);
  assert.deepEqual(renderPreview.requiredFor, ['recovery-preview', 'db-files-human-review']);
  assert.match(renderPreview.command, /^cd '~\/repo\/synestra-platform' && scripts\/mcp\/render_n8n_db_files_backfill_candidates\.sh --env dev --workflow-id '<reviewed-workflow-id>' --render-no-go-candidates-for-review --json$/);
  assert.equal(JSON.stringify(diagnostics).includes('print("before")'), false);
  assert.equal(JSON.stringify(diagnostics).includes('{"ok":true}'), false);
});
