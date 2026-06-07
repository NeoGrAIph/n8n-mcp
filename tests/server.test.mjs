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
  assert.equal(Object.prototype.hasOwnProperty.call(file, 'content'), false);
  assert.match(file.filesystemPath, /code_nodes_/);
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
  const proposedContent = 'SYNESTRA_DO_NOT_ECHO_PROPOSED_CONTENT';
  const validate = await handleJsonRpc(fixture.config, {
    jsonrpc: '2.0',
    id: 39,
    method: 'tools/call',
    params: { name: 'synestra_workflow_file_validate', arguments: { uri: fixture.codeUri, content: proposedContent } }
  });
  assert.equal(validate.error, undefined);
  assert.equal(JSON.stringify(validate.result.structuredContent).includes(proposedContent), false);

  const observe = await handleJsonRpc({ ...fixture.config, settleStableReads: 1 }, {
    jsonrpc: '2.0',
    id: 40,
    method: 'tools/call',
    params: { name: 'synestra_workflow_sync_observe', arguments: { uri: fixture.codeUri, expectedContent: proposedContent, timeoutMs: 100 } }
  });
  assert.equal(observe.error, undefined);
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
  assert.equal(Object.prototype.hasOwnProperty.call(locator, 'content'), false);
  assert.match(locator.filesystemPath, /code_nodes_/);
  assert.notEqual(read.result.contents[0].text, 'print("before")\n');
  assert.match(read.result._meta.etag, /^[a-f0-9]{64}$/);
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
