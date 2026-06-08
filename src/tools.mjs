import { exportDiagnostics, filesStatus, listWorkflowFiles, mountDiagnostics, observeWorkflowFile, readWorkflowFile, reconcileWorkflowFiles, validateWorkflowFile } from './file-store.mjs';
import { ToolError } from './errors.mjs';

export const toolDefinitions = [
  tool('synestra_workflow_files_status', 'Return read-only GitOps status for workflow file mounts, .index and optional target URI.', true, { uri: stringProperty(512) }),
  tool('synestra_workflow_files_list', 'List existing Code and Set(raw) files for one workflow resolved through workflows/.index.', true, { workflowId: { type: 'string', pattern: '^[A-Za-z0-9_-]{8,}$' } }, ['workflowId']),
  tool('synestra_workflow_file_read', 'Locate one existing Code or Set(raw) file by Synestra workflow resource URI and return filesystem path, ETag and locator status without file content.', true, { uri: stringProperty(512) }, ['uri']),
  tool('synestra_workflow_file_validate', 'Validate an existing or proposed Code/Set(raw) file payload without writing it.', true, { uri: stringProperty(512), content: stringProperty(262144), contentSha256: sha256Property() }, ['uri']),
  tool('synestra_workflow_reconcile_status', 'Return read-only file-layer parity for one workflow: workflow JSON, .index, Code files and Set(raw) files.', true, { workflowId: { type: 'string', pattern: '^[A-Za-z0-9_-]{8,}$' } }, ['workflowId']),
  tool('synestra_workflow_sync_observe', 'Observe a workflow file after an external filesystem edit and report ETag/content settle status.', true, { uri: stringProperty(512), expectedEtag: etagProperty(), expectedContent: stringProperty(262144), expectedContentSha256: sha256Property(), timeoutMs: { type: 'integer', minimum: 100, maximum: 120000 } }, ['uri']),
  tool('synestra_workflow_mount_diagnostics', 'Return read-only local mount diagnostics for workflows, .index and Debezium offset files.', true, {}),
  tool('synestra_workflow_export_diagnostics', 'Return read-only local export diagnostics plus Camel K live-audit handoff metadata.', true, {})
];

export function toolsForConfig(config) {
  return toolDefinitions;
}

export async function callTool(config, name, args = {}) {
  const definition = toolsForConfig(config).find(tool => tool.name === name);
  if (!definition) throw new ToolError(`Unknown or unavailable tool: ${name}`, 'UNKNOWN_TOOL');
  validateToolArguments(definition, args);
  try {
    switch (name) {
      case 'synestra_workflow_files_status':
        return jsonContent(await filesStatus(config, args));
      case 'synestra_workflow_files_list':
        return jsonContent({ files: await listWorkflowFiles(config, args.workflowId) });
      case 'synestra_workflow_file_read':
        return jsonContent(await readWorkflowFile(config, args.uri));
      case 'synestra_workflow_file_validate':
        return jsonContent(await validateWorkflowFile(config, args));
      case 'synestra_workflow_reconcile_status':
        return jsonContent(await reconcileWorkflowFiles(config, args));
      case 'synestra_workflow_sync_observe':
        return jsonContent(await observeWorkflowFile(config, args));
      case 'synestra_workflow_mount_diagnostics':
        return jsonContent(await mountDiagnostics(config));
      case 'synestra_workflow_export_diagnostics':
        return jsonContent(await exportDiagnostics(config));
      default:
        throw new ToolError(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
    }
  } catch (error) {
    if (error instanceof ToolError) return toolErrorContent(error);
    throw error;
  }
}

function validateToolArguments(definition, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw invalidArgs(definition.name, 'arguments must be an object');
  }
  const schema = definition.inputSchema;
  const properties = schema.properties || {};
  const required = new Set(schema.required || []);
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(args, key)) {
      throw invalidArgs(definition.name, `missing required argument: ${key}`);
    }
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(args)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        throw invalidArgs(definition.name, `unknown argument: ${key}`);
      }
    }
  }
  for (const [key, value] of Object.entries(args)) {
    const property = properties[key];
    if (!property || value === undefined) continue;
    validateProperty(definition.name, key, value, property);
  }
  validateSemanticArgumentConflicts(definition.name, args);
}

function validateSemanticArgumentConflicts(toolName, args) {
  if (toolName === 'synestra_workflow_file_validate' && args.content !== undefined && args.contentSha256 !== undefined) {
    throw invalidArgs(toolName, 'content and contentSha256 are mutually exclusive');
  }
  if (toolName === 'synestra_workflow_sync_observe' && args.expectedContent !== undefined && args.expectedContentSha256 !== undefined) {
    throw invalidArgs(toolName, 'expectedContent and expectedContentSha256 are mutually exclusive');
  }
}

function validateProperty(toolName, key, value, property) {
  if (property.type === 'string') {
    if (typeof value !== 'string') throw invalidArgs(toolName, `${key} must be a string`);
    if (property.maxLength !== undefined && value.length > property.maxLength) {
      throw invalidArgs(toolName, `${key} exceeds maxLength ${property.maxLength}`);
    }
    if (property.pattern && !new RegExp(property.pattern).test(value)) {
      throw invalidArgs(toolName, `${key} does not match required pattern`);
    }
    return;
  }
  if (property.type === 'boolean') {
    if (typeof value !== 'boolean') throw invalidArgs(toolName, `${key} must be a boolean`);
    return;
  }
  if (property.type === 'integer') {
    if (!Number.isInteger(value)) throw invalidArgs(toolName, `${key} must be an integer`);
    if (property.minimum !== undefined && value < property.minimum) {
      throw invalidArgs(toolName, `${key} must be >= ${property.minimum}`);
    }
    if (property.maximum !== undefined && value > property.maximum) {
      throw invalidArgs(toolName, `${key} must be <= ${property.maximum}`);
    }
  }
}

function invalidArgs(toolName, message) {
  return new ToolError(`${toolName}: invalid arguments: ${message}`, 'INVALID_TOOL_ARGUMENTS');
}

function tool(name, description, readOnly, properties, required = [], destructive = false) {
  return {
    name,
    description,
    inputSchema: { type: 'object', properties, required, additionalProperties: false },
    annotations: { readOnlyHint: readOnly, destructiveHint: destructive, openWorldHint: false }
  };
}

function jsonContent(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }], structuredContent: value };
}

function toolErrorContent(error) {
  const structuredContent = {
    error: {
      code: error.code,
      message: error.message,
      status: error.status,
      ...(error.data ? { details: error.data } : {})
    }
  };
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent
  };
}

function stringProperty(maxLength) {
  return { type: 'string', maxLength };
}

function etagProperty() {
  return sha256Property();
}

function sha256Property() {
  return { type: 'string', pattern: '^[a-f0-9]{64}$' };
}
