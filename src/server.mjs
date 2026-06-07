import http from 'node:http';
import crypto from 'node:crypto';
import { serverInfo, synestraBuildInfo } from './build-info.mjs';
import { readAuthToken } from './config.mjs';
import { InvalidParamsError, toJsonRpcError } from './errors.mjs';
import { listWorkflowResourcesWithDiagnostics, readWorkflowResource } from './file-store.mjs';
import { callTool, toolsForConfig } from './tools.mjs';

export function createServer(config) {
  const authToken = readAuthToken(config);
  assertHttpAuthInvariant(config, authToken);
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/health') {
        return writeJson(res, 200, { status: 'ok' });
      }
      if (req.url !== '/mcp') return writeJson(res, 404, { error: 'not_found' });
      if (!isAuthorized(req, authToken)) {
        res.setHeader('WWW-Authenticate', 'Bearer realm="synestra-n8n-gitops-mcp"');
        return writeJson(res, 401, { error: 'unauthorized' });
      }
      if (req.method !== 'POST') return writeJson(res, 405, jsonRpcError(null, -32000, 'Method not allowed'));
      let message;
      try {
        message = JSON.parse(await readBody(req) || '{}');
      } catch {
        return writeJson(res, 400, jsonRpcError(null, -32700, 'Parse error'));
      }
      const response = await handleJsonRpc(config, message);
      if (response === undefined) return writeNoContent(res, { 'Mcp-Session-Id': req.headers['mcp-session-id'] || 'stateless' });
      return writeJson(res, 200, response, { 'Mcp-Session-Id': req.headers['mcp-session-id'] || 'stateless' });
    } catch (error) {
      return writeJson(res, 500, { jsonrpc: '2.0', error: toJsonRpcError(error), id: null });
    }
  });
  installListenAuthInvariant(server, config, authToken);
  return server;
}

export async function handleJsonRpc(config, message) {
  if (Array.isArray(message)) {
    const responses = await Promise.all(message.map(item => handleSingleJsonRpc(config, item)));
    const filtered = responses.filter(Boolean);
    return filtered.length ? filtered : undefined;
  }
  return handleSingleJsonRpc(config, message);
}

async function handleSingleJsonRpc(config, message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return jsonRpcError(null, -32600, 'Invalid JSON-RPC request');
  }
  const hasId = Object.prototype.hasOwnProperty.call(message || {}, 'id');
  const id = hasId ? message.id : null;
  try {
    if (message?.jsonrpc !== '2.0') return hasId ? jsonRpcError(id, -32600, 'Invalid JSON-RPC request') : undefined;
    if (!hasId && message.method !== 'notifications/initialized') return undefined;
    switch (message.method) {
      case 'initialize':
        return { jsonrpc: '2.0', id, result: { protocolVersion: message.params?.protocolVersion || '2024-11-05', capabilities: { tools: {}, resources: {} }, serverInfo: serverInfo(), _meta: { synestraBuild: synestraBuildInfo() } } };
      case 'notifications/initialized':
        return undefined;
      case 'tools/list':
        return { jsonrpc: '2.0', id, result: { tools: toolsForConfig(config) } };
      case 'tools/call':
        return { jsonrpc: '2.0', id, result: await callTool(config, message.params?.name, message.params?.arguments || {}) };
      case 'resources/list':
        return { jsonrpc: '2.0', id, result: await listWorkflowResourcesWithDiagnostics(config, paramsObject(message.params, 'resources/list')) };
      case 'resources/read':
        return { jsonrpc: '2.0', id, result: await readWorkflowResource(config, message.params?.uri) };
      default:
        return jsonRpcError(id, -32601, `Method not found: ${message.method}`);
    }
  } catch (error) {
    return { jsonrpc: '2.0', id, error: toJsonRpcError(error) };
  }
}

function paramsObject(params, method) {
  if (params === undefined || params === null) return {};
  if (typeof params !== 'object' || Array.isArray(params)) throw new InvalidParamsError(`${method} params must be an object`, { code: 'INVALID_PARAMS' });
  return params;
}

function isAuthorized(req, authToken) {
  if (!authToken) return true;
  const expected = Buffer.from(`Bearer ${authToken}`);
  const actual = Buffer.from(req.headers.authorization || '');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function assertHttpAuthInvariant(config, authToken) {
  if (authToken) return;
  const host = config.host || '0.0.0.0';
  if (config.allowUnauthenticatedLocal === true && isLocalHost(host)) return;
  throw new Error('Unauthenticated MCP server is allowed only on local-only HOST');
}

function installListenAuthInvariant(server, config, authToken) {
  if (authToken) return;
  const originalListen = server.listen.bind(server);
  server.listen = (...args) => {
    const host = listenHost(args);
    if (!host || !isLocalHost(host)) {
      throw new Error('Unauthenticated MCP server listen host must be local-only');
    }
    return originalListen(...args);
  };
}

function listenHost(args) {
  const first = args[0];
  if (first && typeof first === 'object') return first.host || '';
  if (typeof first === 'string') return 'local-ipc';
  if (typeof args[1] === 'string') return args[1];
  return '';
}

function isLocalHost(host) {
  return host === '127.0.0.1' || host === '::1' || host === 'localhost' || host === 'local-ipc';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function writeJson(res, status, value, headers = {}) {
  const body = JSON.stringify(value);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers });
  res.end(body);
}

function writeNoContent(res, headers = {}) {
  res.writeHead(204, headers);
  res.end();
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}
