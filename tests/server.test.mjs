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
  assert.equal(tools.result.tools.some(tool => tool.name === 'update_workflow'), false);
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

test('resources/list and resources/read expose workflow file locators without source content', async () => {
  const fixture = await createWorkflowFixture();
  const list = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 4, method: 'resources/list', params: {} });
  assert.equal(list.result.resources.length, 2);
  assert.equal(list.result.resources.some(resource => resource.uri === fixture.codeUri), true);
  const read = await handleJsonRpc(fixture.config, { jsonrpc: '2.0', id: 5, method: 'resources/read', params: { uri: fixture.codeUri } });
  assert.equal(read.result.contents[0].uri, fixture.codeUri);
  const locator = JSON.parse(read.result.contents[0].text);
  assert.equal(locator.uri, fixture.codeUri);
  assert.equal(locator.kind, 'code');
  assert.equal(locator.locator.status, 'ready');
  assert.equal(Object.prototype.hasOwnProperty.call(locator, 'content'), false);
  assert.match(locator.filesystemPath, /code_nodes_/);
  assert.notEqual(read.result.contents[0].text, 'print("before")\n');
  assert.match(read.result._meta.etag, /^[a-f0-9]{64}$/);
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
