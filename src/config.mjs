import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const VALID_ENVS = new Set(['dev', 'prod']);
const VALID_WRITE_POLICIES = new Set(['off']);

export function expandHome(value) {
  if (!value || value === '~') return value === '~' ? os.homedir() : value;
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  return value;
}

export function loadConfig(env = process.env) {
  const host = env.HOST || '0.0.0.0';
  const serviceEnv = env.SYNESTRA_MCP_ENV || 'dev';
  if (!VALID_ENVS.has(serviceEnv)) throw new Error(`Invalid SYNESTRA_MCP_ENV: ${serviceEnv}`);
  const writePolicy = env.SYNESTRA_MCP_WRITE_POLICY || 'off';
  if (!VALID_WRITE_POLICIES.has(writePolicy)) throw new Error(`Invalid SYNESTRA_MCP_WRITE_POLICY: ${writePolicy}`);

  const authTokenFile = env.SYNESTRA_MCP_AUTH_TOKEN_FILE ? path.resolve(expandHome(env.SYNESTRA_MCP_AUTH_TOKEN_FILE)) : '';
  const allowUnauthenticatedLocal = readBoolean(env.SYNESTRA_MCP_ALLOW_UNAUTHENTICATED_LOCAL, false);
  if (!authTokenFile && !(allowUnauthenticatedLocal && isLocalHost(host))) {
    throw new Error('SYNESTRA_MCP_AUTH_TOKEN_FILE is required unless SYNESTRA_MCP_ALLOW_UNAUTHENTICATED_LOCAL=true and HOST is local-only');
  }

  const root = path.resolve(expandHome(env.N8N_WORKFLOWS_ROOT || env.WORKFLOWS_ROOT || '/workflows'));
  const gitRoot = path.resolve(expandHome(env.N8N_WORKFLOWS_GIT_ROOT || env.WORKFLOWS_GIT_ROOT || root));
  return {
    host,
    port: readInteger(env.PORT, 3000, 1, 65535),
    serviceEnv,
    writePolicy,
    root,
    gitRoot,
    displayRoot: env.N8N_WORKFLOWS_DISPLAY_ROOT || env.WORKFLOWS_DISPLAY_ROOT || root,
    expectedBranch: env.SYNESTRA_MCP_EXPECTED_BRANCH || '',
    maxFileBytes: readInteger(env.SYNESTRA_MCP_MAX_FILE_BYTES, 262144, 1, 10 * 1024 * 1024),
    settleTimeoutMs: readInteger(env.SYNESTRA_MCP_SETTLE_TIMEOUT_MS, 15000, 100, 120000),
    settleStableReads: readInteger(env.SYNESTRA_MCP_SETTLE_STABLE_READS, 2, 1, 20),
    allowMissingIndexReadOnly: readBoolean(env.SYNESTRA_MCP_ALLOW_MISSING_INDEX_READONLY, false),
    allowUnauthenticatedLocal,
    authTokenFile
  };
}

export function assertStartupConfig(config) {
  if (!fs.existsSync(config.root) || !fs.statSync(config.root).isDirectory()) throw new Error(`N8N_WORKFLOWS_ROOT is not a directory: ${config.root}`);
  const index = workflowIndexStatus(config);
  if (!index.exists && !index.degradedReadOnly) throw new Error(`Workflow index directory is missing: ${index.path}`);
  if (config.authTokenFile && (!fs.existsSync(config.authTokenFile) || !fs.statSync(config.authTokenFile).isFile())) throw new Error(`SYNESTRA_MCP_AUTH_TOKEN_FILE is not readable: ${config.authTokenFile}`);
  if (config.authTokenFile && fs.readFileSync(config.authTokenFile, 'utf8').trim() === '') throw new Error('SYNESTRA_MCP_AUTH_TOKEN_FILE must not be empty');
}

export function workflowIndexStatus(config) {
  const indexPath = path.join(config.root, '.index');
  const exists = fs.existsSync(indexPath) && fs.statSync(indexPath).isDirectory();
  const degradedReadOnly = !exists && config.writePolicy === 'off' && config.allowMissingIndexReadOnly;
  return {
    path: indexPath,
    exists,
    degradedReadOnly,
    mode: exists ? 'ready' : (degradedReadOnly ? 'missing-readonly-degraded' : 'missing-fatal')
  };
}

export function readAuthToken(config) {
  if (!config.authTokenFile) return config.allowUnauthenticatedLocal ? '' : failToken();
  const token = fs.readFileSync(config.authTokenFile, 'utf8').trim();
  if (!token) throw new Error('SYNESTRA_MCP_AUTH_TOKEN_FILE must not be empty');
  return token;
}

function failToken() {
  throw new Error('SYNESTRA_MCP_AUTH_TOKEN_FILE is required');
}

function readInteger(value, defaultValue, min, max) {
  if (value === undefined || value === '') return defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, parsed));
}

function readBoolean(value, defaultValue) {
  if (value === undefined || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function isLocalHost(host) {
  return host === '127.0.0.1' || host === '::1' || host === 'localhost';
}
