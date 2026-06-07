import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

export const PACKAGE_VERSION = packageJson.version;

export function serverInfo() {
  return {
    name: packageJson.name,
    version: PACKAGE_VERSION
  };
}

export function synestraBuildInfo(env = process.env) {
  return cleanObject({
    packageVersion: PACKAGE_VERSION,
    sourceRef: cleanValue(env.SYNESTRA_MCP_SOURCE_REF),
    sourceCommit: cleanValue(env.SYNESTRA_MCP_SOURCE_COMMIT),
    platformImageTag: cleanValue(env.SYNESTRA_MCP_PLATFORM_IMAGE_TAG),
    platformCommit: cleanValue(env.SYNESTRA_MCP_PLATFORM_COMMIT),
    buildNamespace: cleanValue(env.SYNESTRA_MCP_BUILD_NAMESPACE)
  });
}

function cleanValue(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function cleanObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== null));
}
