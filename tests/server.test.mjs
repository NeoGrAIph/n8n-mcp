import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createServer, handleJsonRpc } from '../src/server.mjs';
import { createWorkflowFixture } from './fixtures.mjs';

test('initialize and tools/list expose Synestra-only tools', async () => {
  const fixture = await createWorkflowFixture();
  const init = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
  assert.equal(init.result.serverInfo.name, 'synestra-n8n-gitops-mcp');
  const tools = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  assert.equal(tools.result.tools.length, 8);
  assert.deepEqual(tools.result.tools.map(tool => tool.name).sort(), [
    'synestra_workflow_export_diagnostics',
    'synestra_workflow_file_read',
    'synestra_workflow_file_validate',
    'synestra_workflow_files_list',
    'synestra_workflow_files_status',
    'synestra_workflow_mount_diagnostics',
    'synestra_workflow_reconcile_status',
    'synestra_workflow_sync_observe'
  ]);
  assert.equal(tools.result.tools.every(tool => tool.annotations?.readOnlyHint === true), true);
  assert.equal(tools.result.tools.every(tool => tool.annotations?.destructiveHint === false), true);
  assert.equal(tools.result.tools.every(tool => tool.annotations?.openWorldHint === false), true);
  const absentNativeOrWriteTools = [
    'update_workflow',
    'create_workflow',
    'get_workflow_details',
    'search_workflows',
    'search_executions',
    'list_credentials',
    'search_nodes',
    'get_node_types',
    'synestra_workflow_file_patch',
    'synestra_workflow_file_replace'
  ];
  for (const name of absentNativeOrWriteTools) {
    assert.equal(tools.result.tools.some(tool => tool.name === name), false);
  }
  assert.equal(tools.result.tools.some(tool => tool.name === 'synestra_workflow_file_patch'), false);
  assert.equal(tools.result.tools.some(tool => tool.name === 'synestra_workflow_file_replace'), false);
  assert.equal(tools.result.tools.some(tool => tool.name === 'synestra_workflow_reconcile_status'), true);
  assert.equal(tools.result.tools.every(tool => tool.inputSchema.additionalProperties === false), true);
  const writeTools = await handleJsonRpc({ ...fixture.config, writePolicy: 'patch_replace' }, { jsonrpc: '2.0', id: 22, method: 'tools/list', params: {} });
  assert.equal(writeTools.result.tools.length, 8);
  assert.equal(writeTools.result.tools.some(tool => tool.name === 'synestra_workflow_file_patch'), false);
  assert.equal(writeTools.result.tools.some(tool => tool.name === 'synestra_workflow_file_replace'), false);
});

test('tools/list remains Synestra-only and has no legacy or native aliases', async () => {
  const fixture = await createWorkflowFixture();
  const result = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 49, method: 'tools/list', params: {} });
  const names = result.result.tools.map(tool => tool.name);
  const forbiddenPrefixes = ['n8n_', 'native_', 'workflow_'];
  const forbiddenExact = new Set([
    'search_workflows',
    'get_workflow_details',
    'update_workflow',
    'create_workflow',
    'search_executions',
    'list_credentials',
    'synestra_workflow_file_patch',
    'synestra_workflow_file_replace'
  ]);
  for (const name of names) {
    assert.equal(forbiddenExact.has(name), false);
    assert.equal(forbiddenPrefixes.some(prefix => name.startsWith(prefix)), false);
  }
});

test('tools/call list returns workflow files', async () => {
  const fixture = await createWorkflowFixture();
  const result = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'synestra_workflow_files_list', arguments: { workflowId: fixture.workflowId } }
  });
  assert.equal(result.result.structuredContent.files.length, 2);
  assert.equal(result.result.structuredContent.files[0].locator.status, 'ready');
  assert.equal(result.result.structuredContent.files[0].editReadiness.localLocatorReady, true);
  assert.equal(result.result.structuredContent.files[0].editReadiness.effectiveDecision, 'requires-platform-preflight');
  assert.equal(result.result.structuredContent.files[0].editReadiness.platformPreflightRequired, true);
  assert.equal(result.result.structuredContent.files[0].editReadiness.externalEditAllowed, null);
  assert.equal(result.result.structuredContent.files[0].editReadiness.externalFilesystemEditAllowed, false);
  assert.equal(result.result.structuredContent.files[0].editReadiness.readOnlyInspectionAllowed, true);
  assert.equal(result.result.structuredContent.files[0].editReadiness.filesystemToolPolicy, 'inspect-only-until-platform-go');
  assert.equal(result.result.structuredContent.files[0].editReadiness.platformBridge.aggregateField, 'fileLayerSafety.synestraMcpBridge');
  assert.equal(result.result.structuredContent.files[0].editReadiness.platformBridge.localLocatorReadinessIsSufficient, false);
});

test('tools/call returns workflow reconcile status', async () => {
  const fixture = await createWorkflowFixture();
  const result = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 37,
    method: 'tools/call',
    params: { name: 'synestra_workflow_reconcile_status', arguments: { workflowId: fixture.workflowId } }
  });
  assert.equal(result.result.structuredContent.summary.ready, 2);
  assert.equal(result.result.structuredContent.summary.missing_file, 0);
  const serialized = JSON.stringify(result.result.structuredContent);
  assert.equal(serialized.includes('print("before")'), false);
  assert.equal(serialized.includes('{"ok":true}'), false);
  assert.equal(serialized.includes('expectedContent'), false);
});

test('tools/call file_read returns locator metadata without source content', async () => {
  const fixture = await createWorkflowFixture();
  const result = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 38,
    method: 'tools/call',
    params: { name: 'synestra_workflow_file_read', arguments: { uri: fixture.codeUri } }
  });
  const file = result.result.structuredContent;
  assert.equal(file.uri, fixture.codeUri);
  assert.equal(file.locator.status, 'ready');
  assert.equal(file.editReadiness.localLocatorReady, true);
  assert.equal(file.editReadiness.effectiveDecision, 'requires-platform-preflight');
  assert.equal(file.editReadiness.platformPreflightRequired, true);
  assert.equal(file.editReadiness.externalFilesystemEditAllowed, false);
  assert.equal(file.editReadiness.readOnlyInspectionAllowed, true);
  assert.equal(file.editReadiness.filesystemToolPolicy, 'inspect-only-until-platform-go');
  assert.equal(file.editReadiness.platformBridge.aggregateField, 'fileLayerSafety.synestraMcpBridge');
  assert.equal(file.editReadiness.platformBridge.localLocatorReadinessIsSufficient, false);
  assert.equal(Object.prototype.hasOwnProperty.call(file, 'content'), false);
  assert.match(file.filesystemPath, /code_nodes_/);
});

test('public locator paths report unsafe editReadiness for stale exports', async () => {
  const fixture = await createWorkflowFixture();
  const stalePath = path.join(fixture.root, 'development', `code_nodes_${fixture.workflowId}`, `${fixture.nodeId}.py`);
  await fs.writeFile(stalePath, 'print("stale")\n');

  const list = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 53,
    method: 'tools/call',
    params: { name: 'synestra_workflow_files_list', arguments: { workflowId: fixture.workflowId } }
  });
  const listed = list.result.structuredContent.files.find(file => file.uri === fixture.codeUri);
  assert.equal(listed.locator.status, 'stale_export');
  assert.equal(listed.editReadiness.localLocatorReady, false);
  assert.equal(listed.editReadiness.effectiveDecision, 'no-go');
  assert.equal(listed.editReadiness.platformPreflightRequired, true);
  assert.equal(listed.editReadiness.externalFilesystemEditAllowed, false);
  assert.equal(listed.editReadiness.readOnlyInspectionAllowed, false);
  assert.equal(listed.editReadiness.filesystemToolPolicy, 'blocked-unsafe-locator');
  assert.equal(listed.editReadiness.platformBridge.aggregateField, 'fileLayerSafety.synestraMcpBridge');
  assert.equal(listed.editReadiness.platformBridge.localLocatorReadinessIsSufficient, false);

  const read = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 54,
    method: 'tools/call',
    params: { name: 'synestra_workflow_file_read', arguments: { uri: fixture.codeUri } }
  });
  assert.equal(read.result.structuredContent.locator.status, 'stale_export');
  assert.equal(read.result.structuredContent.editReadiness.localLocatorReady, false);
  assert.equal(read.result.structuredContent.editReadiness.effectiveDecision, 'no-go');
  assert.equal(read.result.structuredContent.editReadiness.platformPreflightRequired, true);
  assert.equal(read.result.structuredContent.editReadiness.externalFilesystemEditAllowed, false);
  assert.equal(read.result.structuredContent.editReadiness.readOnlyInspectionAllowed, false);
  assert.equal(read.result.structuredContent.editReadiness.filesystemToolPolicy, 'blocked-unsafe-locator');
  assert.equal(read.result.structuredContent.editReadiness.platformBridge.aggregateField, 'fileLayerSafety.synestraMcpBridge');
  assert.equal(read.result.structuredContent.editReadiness.platformBridge.localLocatorReadinessIsSufficient, false);
  assert.equal(Object.prototype.hasOwnProperty.call(read.result.structuredContent, 'content'), false);
  assertNoSourceLeak(read.result.structuredContent);

  const resource = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 55,
    method: 'resources/read',
    params: { uri: fixture.codeUri }
  });
  const locator = JSON.parse(resource.result.contents[0].text);
  assert.equal(locator.locator.status, 'stale_export');
  assert.equal(locator.editReadiness.localLocatorReady, false);
  assert.equal(locator.editReadiness.effectiveDecision, 'no-go');
  assert.equal(locator.editReadiness.platformPreflightRequired, true);
  assert.equal(locator.editReadiness.externalFilesystemEditAllowed, false);
  assert.equal(locator.editReadiness.readOnlyInspectionAllowed, false);
  assert.equal(locator.editReadiness.filesystemToolPolicy, 'blocked-unsafe-locator');
  assert.equal(locator.editReadiness.platformBridge.aggregateField, 'fileLayerSafety.synestraMcpBridge');
  assert.equal(locator.editReadiness.platformBridge.localLocatorReadinessIsSufficient, false);
  assert.equal(Object.prototype.hasOwnProperty.call(locator, 'content'), false);
  assertNoSourceLeak(locator);
  assert.equal(resource.result.contents[0].text.includes('print("stale")'), false);
});

test('all read-only tool outputs omit workflow source markers', async () => {
  const fixture = await createWorkflowFixture();
  const calls = [
    { name: 'synestra_workflow_files_status', arguments: {} },
    { name: 'synestra_workflow_files_list', arguments: { workflowId: fixture.workflowId } },
    { name: 'synestra_workflow_file_read', arguments: { uri: fixture.codeUri } },
    { name: 'synestra_workflow_file_validate', arguments: { uri: fixture.codeUri } },
    { name: 'synestra_workflow_reconcile_status', arguments: { workflowId: fixture.workflowId } },
    { name: 'synestra_workflow_sync_observe', arguments: { uri: fixture.codeUri, expectedContent: 'SYNESTRA_DO_NOT_ECHO_PROPOSED_CONTENT pythonCode jsCode jsonOutput expectedContent', timeoutMs: 100 } },
    { name: 'synestra_workflow_mount_diagnostics', arguments: {} },
    { name: 'synestra_workflow_export_diagnostics', arguments: {} }
  ];
  for (const call of calls) {
    const result = await handleJsonRpc(fixture.config, {
      jsonrpc: '2.0',
      id: `no-leak-${call.name}`,
      method: 'tools/call',
      params: call
    });
    assert.equal(result.error, undefined, call.name);
    assertNoSourceLeak(result.result.structuredContent);
  }
});

test('tools/call validates arguments against published schemas', async () => {
  const fixture = await createWorkflowFixture();
  const unknown = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 31,
    method: 'tools/call',
    params: { name: 'synestra_workflow_files_list', arguments: { workflowId: fixture.workflowId, extra: true } }
  });
  assert.equal(unknown.error.data.code, 'INVALID_TOOL_ARGUMENTS');
  assert.match(unknown.error.message, /unknown argument: extra/);

  const missing = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 32,
    method: 'tools/call',
    params: { name: 'synestra_workflow_file_read', arguments: {} }
  });
  assert.equal(missing.error.data.code, 'INVALID_TOOL_ARGUMENTS');
  assert.match(missing.error.message, /missing required argument: uri/);

  const badType = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 33,
    method: 'tools/call',
    params: { name: 'synestra_workflow_sync_observe', arguments: { uri: fixture.codeUri, timeoutMs: '1000' } }
  });
  assert.equal(badType.error.data.code, 'INVALID_TOOL_ARGUMENTS');
  assert.match(badType.error.message, /timeoutMs must be an integer/);

  const badPattern = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 34,
    method: 'tools/call',
    params: { name: 'synestra_workflow_sync_observe', arguments: { uri: fixture.codeUri, expectedEtag: 'bad' } }
  });
  assert.equal(badPattern.error.data.code, 'INVALID_TOOL_ARGUMENTS');
  assert.match(badPattern.error.message, /expectedEtag does not match required pattern/);
});

test('tools/call refuses write tools in every config', async () => {
  const fixture = await createWorkflowFixture();
  const result = await handleJsonRpc({ ...fixture.config, writePolicy: 'patch_replace' }, {
    jsonrpc: '2.0',
    id: 35,
    method: 'tools/call',
    params: { name: 'synestra_workflow_file_patch', arguments: { uri: fixture.codeUri, patch: 'x', expectedEtag: '0'.repeat(64) } }
  });
  assert.equal(result.error.data.code, 'UNKNOWN_TOOL');
  assert.match(result.error.message, /Unknown or unavailable tool/);
});

test('tools/call validate and observe do not echo proposed file content', async () => {
  const fixture = await createWorkflowFixture();
  const proposedContent = 'SYNESTRA_DO_NOT_ECHO_PROPOSED_CONTENT pythonCode jsCode jsonOutput expectedContent';
  const validate = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 39,
    method: 'tools/call',
    params: { name: 'synestra_workflow_file_validate', arguments: { uri: fixture.codeUri, content: proposedContent } }
  });
  assert.equal(validate.error, undefined);
  assertNoSourceLeak(validate.result.structuredContent);
  assert.equal(JSON.stringify(validate.result.structuredContent).includes(proposedContent), false);
  assert.equal(validate.result.structuredContent.safeToEditScope, 'local-locator-only');
  assert.equal(validate.result.structuredContent.editReadiness.effectiveDecision, 'no-go');
  assert.equal(validate.result.structuredContent.editReadiness.localLocatorReady, false);
  assert.equal(validate.result.structuredContent.editReadiness.platformPreflightRequired, true);

  const observe = await handleJsonRpc({ ...fixture.config, settleStableReads: 1 }, {
    jsonrpc: '2.0',
    id: 40,
    method: 'tools/call',
    params: { name: 'synestra_workflow_sync_observe', arguments: { uri: fixture.codeUri, expectedContent: proposedContent, timeoutMs: 100 } }
  });
  assert.equal(observe.error, undefined);
  assertNoSourceLeak(observe.result.structuredContent);
  assert.equal(JSON.stringify(observe.result.structuredContent).includes(proposedContent), false);
});

test('tools/call returns tool execution failures as MCP tool errors', async () => {
  const fixture = await createWorkflowFixture();
  const result = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 36,
    method: 'tools/call',
    params: {
      name: 'synestra_workflow_file_read',
      arguments: {
        uri: `synestra-n8n-workflows:///code/${fixture.workflowId}/00000000-0000-0000-0000-000000000000.py`
      }
    }
  });
  assert.equal(result.error, undefined);
  assert.equal(result.result.isError, true);
  assert.equal(result.result.structuredContent.error.code, 'FILE_NOT_FOUND');
});

test('JSON-RPC notifications do not produce response bodies', async () => {
  const fixture = await createWorkflowFixture();
  const single = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(single, undefined);
  const batch = await handleJsonRpc(fixture.config, [
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', method: 'notifications/initialized' }
  ]);
  assert.equal(batch, undefined);
});

test('invalid JSON-RPC payloads return invalid request errors', async () => {
  const fixture = await createWorkflowFixture();
  const number = await handleJsonRpc(fixture.config, 1);
  assert.equal(number.error.code, -32600);
  const string = await handleJsonRpc(fixture.config, 'x');
  assert.equal(string.error.code, -32600);
});

test('HTTP notification-only requests return no content', async () => {
  const fixture = await createWorkflowFixture();
  const tokenFile = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'synestra-mcp-token-')), 'token');
  await fs.writeFile(tokenFile, 'test-token\n');
  const server = createServer({ ...fixture.config, authTokenFile: tokenFile });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })
    });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('HTTP MCP endpoint enforces Bearer auth without leaking diagnostics', async () => {
  const fixture = await createWorkflowFixture();
  const tokenFile = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'synestra-mcp-token-')), 'token');
  await fs.writeFile(tokenFile, 'test-token\n');
  const server = createServer({ ...fixture.config, authTokenFile: tokenFile });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    const missing = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
    assert.equal(missing.status, 401);
    assert.equal(missing.headers.get('www-authenticate'), 'Bearer realm="synestra-n8n-gitops-mcp"');
    assert.deepEqual(await missing.json(), { error: 'unauthorized' });

    const wrongSameLength = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: { Authorization: 'Bearer wrongtoken', 'Content-Type': 'application/json' }, body: payload });
    assert.equal(wrongSameLength.status, 401);

    const wrongDifferentLength = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: { Authorization: 'Bearer wrong', 'Content-Type': 'application/json' }, body: payload });
    assert.equal(wrongDifferentLength.status, 401);

    const ok = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' }, body: payload });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).result.serverInfo.name, 'synestra-n8n-gitops-mcp');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('HTTP server rejects unauthenticated non-local manual config', async () => {
  const fixture = await createWorkflowFixture();
  assert.throws(() => createServer({
    ...fixture.config,
    host: '0.0.0.0',
    authTokenFile: '',
    allowUnauthenticatedLocal: true
  }), /Unauthenticated MCP server is allowed only on local-only HOST/);
});

test('HTTP server allows unauthenticated local-only manual config', async () => {
  const fixture = await createWorkflowFixture();
  const server = createServer({
    ...fixture.config,
    host: '127.0.0.1',
    authTokenFile: '',
    allowUnauthenticatedLocal: true
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).result.serverInfo.name, 'synestra-n8n-gitops-mcp');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('HTTP server rejects unauthenticated non-local listen override', async () => {
  const fixture = await createWorkflowFixture();
  const server = createServer({
    ...fixture.config,
    host: '127.0.0.1',
    authTokenFile: '',
    allowUnauthenticatedLocal: true
  });
  assert.throws(() => server.listen(0, '0.0.0.0'), /Unauthenticated MCP server listen host must be local-only/);
});

test('resources/list and resources/read expose workflow file locators without source content', async () => {
  const fixture = await createWorkflowFixture();
  const list = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 4, method: 'resources/list', params: {} });
  assert.equal(list.result.resources.length, 2);
  assert.deepEqual(list.result._meta.summary, {
    indexedWorkflows: 1,
    resourceCount: 2,
    returnedResourceCount: 2,
    pageOffset: 0,
    pageLimit: 200,
    hasNextPage: false,
    skippedWorkflowCount: 0
  });
  assert.equal(list.result.resources.some(resource => resource.uri === fixture.codeUri), true);
  const listedCode = list.result.resources.find(resource => resource.uri === fixture.codeUri);
  assert.equal(listedCode.mimeType, 'text/x-python');
  const read = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 5, method: 'resources/read', params: { uri: fixture.codeUri } });
  assert.equal(read.result.contents[0].uri, fixture.codeUri);
  assert.equal(read.result.contents[0].mimeType, 'application/json');
  assert.notEqual(read.result.contents[0].mimeType, listedCode.mimeType);
  const locator = JSON.parse(read.result.contents[0].text);
  assert.equal(locator.uri, fixture.codeUri);
  assert.equal(locator.kind, 'code');
  assert.equal(locator.locator.status, 'ready');
  assert.equal(locator.editReadiness.localLocatorReady, true);
  assert.equal(locator.editReadiness.effectiveDecision, 'requires-platform-preflight');
  assert.equal(locator.editReadiness.platformPreflightRequired, true);
  assert.equal(locator.editReadiness.externalFilesystemEditAllowed, false);
  assert.equal(locator.editReadiness.readOnlyInspectionAllowed, true);
  assert.equal(locator.editReadiness.filesystemToolPolicy, 'inspect-only-until-platform-go');
  assert.equal(locator.editReadiness.platformBridge.aggregateField, 'fileLayerSafety.synestraMcpBridge');
  assert.equal(locator.editReadiness.platformBridge.localLocatorReadinessIsSufficient, false);
  assert.equal(Object.prototype.hasOwnProperty.call(locator, 'content'), false);
  assertNoSourceLeak(locator);
  assert.match(locator.filesystemPath, /code_nodes_/);
  assert.notEqual(read.result.contents[0].text, 'print("before")\n');
  assert.match(read.result._meta.etag, /^[a-f0-9]{64}$/);

  const listedSet = list.result.resources.find(resource => resource.uri === fixture.setUri);
  assert.equal(listedSet.mimeType, 'application/json');
  const setRead = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 50, method: 'resources/read', params: { uri: fixture.setUri } });
  assert.equal(setRead.result.contents[0].uri, fixture.setUri);
  assert.equal(setRead.result.contents[0].mimeType, 'application/json');
  const setLocator = JSON.parse(setRead.result.contents[0].text);
  assert.equal(setLocator.kind, 'set');
  assert.equal(setLocator.locator.status, 'ready');
  assert.equal(setLocator.editReadiness.localLocatorReady, true);
  assert.equal(setLocator.editReadiness.effectiveDecision, 'requires-platform-preflight');
  assert.equal(setLocator.editReadiness.platformPreflightRequired, true);
  assert.equal(setLocator.editReadiness.externalFilesystemEditAllowed, false);
  assert.equal(setLocator.editReadiness.readOnlyInspectionAllowed, true);
  assert.equal(setLocator.editReadiness.filesystemToolPolicy, 'inspect-only-until-platform-go');
  assert.equal(setLocator.editReadiness.platformBridge.aggregateField, 'fileLayerSafety.synestraMcpBridge');
  assert.equal(setLocator.editReadiness.platformBridge.localLocatorReadinessIsSufficient, false);
  assert.equal(Object.prototype.hasOwnProperty.call(setLocator, 'content'), false);
  assertNoSourceLeak(setLocator);
  assert.equal(setRead.result.contents[0].text.includes('{"ok":true}'), false);
});

test('resources/list paginates with opaque cursor and stable global summary', async () => {
  const fixture = await createWorkflowFixture();
  await addWorkflow(fixture, 'Bbbbbbbb22222222', '22222222-2222-4222-8222-222222222222', 'alpha');
  await addWorkflow(fixture, 'Cccccccc33333333', '33333333-3333-4333-8333-333333333333', 'bravo');
  const config = { ...fixture.config, resourceListLimit: 2 };
  const first = await handleJsonRpc(config, { jsonrpc: '2.0', id: 42, method: 'resources/list', params: {} });
  assert.equal(first.result.resources.length, 2);
  assert.match(first.result.nextCursor, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(first.result._meta.summary, {
    indexedWorkflows: 3,
    resourceCount: 4,
    returnedResourceCount: 2,
    pageOffset: 0,
    pageLimit: 2,
    hasNextPage: true,
    skippedWorkflowCount: 0
  });

  const second = await handleJsonRpc(config, { jsonrpc: '2.0', id: 43, method: 'resources/list', params: { cursor: first.result.nextCursor } });
  assert.equal(second.result.resources.length, 2);
  assert.equal(second.result.nextCursor, undefined);
  assert.equal(second.result._meta.summary.resourceCount, 4);
  assert.equal(second.result._meta.summary.pageOffset, 2);
  assert.deepEqual(
    [...first.result.resources, ...second.result.resources].map(resource => resource.uri),
    [...first.result.resources, ...second.result.resources].map(resource => resource.uri).sort()
  );
});

test('resources/list rejects invalid cursor as JSON-RPC invalid params', async () => {
  const fixture = await createWorkflowFixture();
  const result = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 44, method: 'resources/list', params: { cursor: 'not-a-valid-cursor' } });
  assert.equal(result.error.code, -32602);
  assert.equal(result.error.data.code, 'INVALID_CURSOR');
});

test('resources/list rejects non-object params as JSON-RPC invalid params', async () => {
  const fixture = await createWorkflowFixture();
  for (const params of ['bad', [], 1, true]) {
    const result = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 48, method: 'resources/list', params });
    assert.equal(result.error.code, -32602);
    assert.equal(result.error.data.code, 'INVALID_PARAMS');
  }
});

test('resources/read maps invalid URI and missing files to resource errors', async () => {
  const fixture = await createWorkflowFixture();
  const missingUri = `synestra-n8n-workflows:///code/${fixture.workflowId}/00000000-0000-0000-0000-000000000000.py`;
  const missing = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 45, method: 'resources/read', params: { uri: missingUri } });
  assert.equal(missing.error.code, -32002);
  assert.equal(missing.error.data.code, 'FILE_NOT_FOUND');

  const invalid = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 46, method: 'resources/read', params: { uri: 'not-a-resource-uri' } });
  assert.equal(invalid.error.code, -32602);
  assert.equal(invalid.error.data.code, 'INVALID_URI');

  const missingParam = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 47, method: 'resources/read', params: {} });
  assert.equal(missingParam.error.code, -32602);
  assert.equal(missingParam.error.data.code, 'INVALID_RESOURCE_URI');
});

test('resources/list reports skipped workflows instead of hiding index problems', async () => {
  const fixture = await createWorkflowFixture();
  await fs.writeFile(path.join(fixture.root, '.index', 'MissingWF1.path'), 'missing-folder\n');
  const list = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 41, method: 'resources/list', params: {} });
  assert.equal(list.result.resources.length, 2);
  assert.equal(list.result._meta.summary.indexedWorkflows, 2);
  assert.equal(list.result._meta.summary.skippedWorkflowCount, 1);
  assert.equal(list.result._meta.skippedWorkflows[0].workflowId, 'MissingWF1');
  assert.equal(list.result._meta.skippedWorkflows[0].code, 'STALE_INDEX');
});

test('resources/list paginates while preserving skipped workflow diagnostics', async () => {
  const fixture = await createWorkflowFixture();
  await addWorkflow(fixture, 'Bbbbbbbb22222222', '22222222-2222-4222-8222-222222222222', 'alpha');
  await addWorkflow(fixture, 'Cccccccc33333333', '33333333-3333-4333-8333-333333333333', 'bravo');
  await fs.writeFile(path.join(fixture.root, '.index', 'MissingWF1.path'), 'missing-folder\n');
  const config = { ...fixture.config, resourceListLimit: 2 };
  const first = await handleJsonRpc(config, { jsonrpc: '2.0', id: 51, method: 'resources/list', params: {} });
  assert.equal(first.result.resources.length, 2);
  assert.match(first.result.nextCursor, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(first.result._meta.summary, {
    indexedWorkflows: 4,
    resourceCount: 4,
    returnedResourceCount: 2,
    pageOffset: 0,
    pageLimit: 2,
    hasNextPage: true,
    skippedWorkflowCount: 1
  });
  assert.equal(first.result._meta.skippedWorkflows[0].workflowId, 'MissingWF1');

  const second = await handleJsonRpc(config, { jsonrpc: '2.0', id: 52, method: 'resources/list', params: { cursor: first.result.nextCursor } });
  assert.equal(second.result.resources.length, 2);
  assert.equal(second.result.nextCursor, undefined);
  assert.equal(second.result._meta.summary.indexedWorkflows, 4);
  assert.equal(second.result._meta.summary.resourceCount, 4);
  assert.equal(second.result._meta.summary.skippedWorkflowCount, 1);
  assert.equal(second.result._meta.skippedWorkflows[0].workflowId, 'MissingWF1');
});

test('unauthenticated health endpoint is minimal', async () => {
  const fixture = await createWorkflowFixture();
  const tokenFile = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'synestra-mcp-token-')), 'token');
  await fs.writeFile(tokenFile, 'test-token\n');
  const server = createServer({ ...fixture.config, authTokenFile: tokenFile });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();
    assert.deepEqual(body, { status: 'ok' });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

async function addWorkflow(fixture, workflowId, nodeId, name) {
  const workflowDir = path.join(fixture.root, 'development');
  const codeDir = path.join(workflowDir, `code_nodes_${workflowId}`);
  await fs.mkdir(codeDir, { recursive: true });
  await fs.writeFile(path.join(fixture.root, '.index', `${workflowId}.path`), 'development\n');
  await fs.writeFile(path.join(workflowDir, `${workflowId}.${name}.json`), JSON.stringify({
    name,
    workflow_id: workflowId,
    workflow: {
      name,
      nodes: [{
        id: nodeId,
        name: `${name} Code`,
        type: 'n8n-nodes-base.code',
        parameters: { language: 'javaScript', jsCode: `return [{ json: { name: '${name}' } }];` }
      }],
      connections: {},
      settings: {}
    }
  }, null, 2));
  await fs.writeFile(path.join(codeDir, `${nodeId}.json`), `return [{ json: { name: '${name}' } }];\n`);
}

function assertNoSourceLeak(value) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    'print("before")',
    '{"ok":true}',
    'pythonCode',
    'jsCode',
    'jsonOutput',
    'expectedContent',
    'SYNESTRA_DO_NOT_ECHO_PROPOSED_CONTENT'
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked marker: ${forbidden}`);
  }
  assertNoSensitiveKeys(value);
}

function assertNoSensitiveKeys(value, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveKeys(item, [...pathParts, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...pathParts, key];
    const pathText = nextPath.join('.');
    if (['expectedContent', 'pythonCode', 'jsCode', 'jsonOutput'].includes(key)) {
      assert.fail(`leaked sensitive key: ${pathText}`);
    }
    if (key === 'content' && !isMcpProtocolContentPath(nextPath)) {
      assert.fail(`leaked content key: ${pathText}`);
    }
    assertNoSensitiveKeys(child, nextPath);
  }
}

function isMcpProtocolContentPath(pathParts) {
  if (pathParts.length === 1 && pathParts[0] === 'content') return true;
  if (pathParts.length >= 3 && pathParts.at(-3) === 'content' && /^\d+$/.test(pathParts.at(-2))) return true;
  return false;
}
