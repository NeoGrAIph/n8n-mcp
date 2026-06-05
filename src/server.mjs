import http from 'node:http';
import { readAuthToken } from './config.mjs';
import { toJsonRpcError } from './errors.mjs';
import { listWorkflowResources, readWorkflowResource } from './file-store.mjs';
import { callTool, toolsForConfig } from './tools.mjs';

const SERVER_INFO = { name: 'synestra-n8n-gitops-mcp', version: '0.1.0' };

export function createServer(config) {
  const authToken = readAuthToken(config);
  return http.createServer(async (req, res) => {
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
        return { jsonrpc: '2.0', id, result: { protocolVersion: message.params?.protocolVersion || '2024-11-05', capabilities: { tools: {}, resources: {} }, serverInfo: SERVER_INFO } };
      case 'notifications/initialized':
        return undefined;
      case 'tools/list':
        return { jsonrpc: '2.0', id, result: { tools: toolsForConfig(config) } };
      case 'tools/call':
        return { jsonrpc: '2.0', id, result: await callTool(config, message.params?.name, message.params?.arguments || {}) };
      case 'resources/list':
        return { jsonrpc: '2.0', id, result: { resources: await listWorkflowResources(config) } };
      case 'resources/read':
        return { jsonrpc: '2.0', id, result: await readWorkflowResource(config, message.params?.uri) };
      default:
        return jsonRpcError(id, -32601, `Method not found: ${message.method}`);
    }
  } catch (error) {
    return { jsonrpc: '2.0', id, error: toJsonRpcError(error) };
  }
}

function isAuthorized(req, authToken) {
  return !authToken || (req.headers.authorization || '') === `Bearer ${authToken}`;
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
