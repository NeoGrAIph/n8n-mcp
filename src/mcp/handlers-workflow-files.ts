import { z } from 'zod';
import { McpToolResponse } from '../types/n8n-api';
import {
  isWorkflowFilesConfigured,
  listCodeFiles,
  listSetFiles,
  readCodeFile,
  readSetFile,
  writeCodeFile,
  writeSetFile,
  listWorkflowResources,
  readWorkflowResource,
  listWorkflowResourceTemplates,
  WorkflowResourceDescriptor
} from '../services/workflow-files-service';
import { logger } from '../utils/logger';

const listSchema = z.object({
  workflowId: z.string().min(1)
});

const readSchema = z.object({
  workflowId: z.string().min(1),
  nodeId: z.string().min(1)
});

const writeCodeSchema = z.object({
  workflowId: z.string().min(1),
  nodeId: z.string().min(1),
  content: z.string(),
  expectedEtag: z.string().optional(),
  language: z.string().optional()
});

const writeSetSchema = z.object({
  workflowId: z.string().min(1),
  nodeId: z.string().min(1),
  content: z.string(),
  expectedEtag: z.string().optional()
});

const RESOURCE_PAGE_SIZE = 200;

function ensureWorkflowFilesConfigured(): void {
  if (!isWorkflowFilesConfigured()) {
    throw new Error('Workflow files root is not configured. Mount the workflows directory and set N8N_WORKFLOWS_ROOT.');
  }
}

function handleError(error: unknown): McpToolResponse {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: 'Invalid input',
      details: { errors: error.errors }
    };
  }

  const err = error as { message?: string; code?: string };
  if (err?.code === 'CONFLICT') {
    return {
      success: false,
      error: err.message || 'ETag conflict',
      code: 'CONFLICT'
    };
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred'
  };
}

export async function handleListCodeFiles(args: unknown): Promise<McpToolResponse> {
  try {
    ensureWorkflowFilesConfigured();
    const input = listSchema.parse(args || {});
    const files = await listCodeFiles(input.workflowId);
    return {
      success: true,
      data: {
        workflowId: input.workflowId,
        files,
        returned: files.length
      }
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleListSetFiles(args: unknown): Promise<McpToolResponse> {
  try {
    ensureWorkflowFilesConfigured();
    const input = listSchema.parse(args || {});
    const files = await listSetFiles(input.workflowId);
    return {
      success: true,
      data: {
        workflowId: input.workflowId,
        files,
        returned: files.length
      }
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleReadCodeFile(args: unknown): Promise<McpToolResponse> {
  try {
    ensureWorkflowFilesConfigured();
    const input = readSchema.parse(args || {});
    const file = await readCodeFile(input.workflowId, input.nodeId);
    return {
      success: true,
      data: file
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleReadSetFile(args: unknown): Promise<McpToolResponse> {
  try {
    ensureWorkflowFilesConfigured();
    const input = readSchema.parse(args || {});
    const file = await readSetFile(input.workflowId, input.nodeId);
    return {
      success: true,
      data: file
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleWriteCodeFile(args: unknown): Promise<McpToolResponse> {
  try {
    ensureWorkflowFilesConfigured();
    const input = writeCodeSchema.parse(args || {});
    const result = await writeCodeFile(
      input.workflowId,
      input.nodeId,
      input.content,
      input.expectedEtag,
      input.language
    );
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleWriteSetFile(args: unknown): Promise<McpToolResponse> {
  try {
    ensureWorkflowFilesConfigured();
    const input = writeSetSchema.parse(args || {});
    const result = await writeSetFile(
      input.workflowId,
      input.nodeId,
      input.content,
      input.expectedEtag
    );
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleListWorkflowResources(cursor?: string | null): Promise<{ resources: WorkflowResourceDescriptor[]; nextCursor?: string }>{
  ensureWorkflowFilesConfigured();
  const resources = await listWorkflowResources();

  let start = 0;
  if (cursor) {
    const parsed = Number(cursor);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      start = parsed;
    }
  }

  const paged = resources.slice(start, start + RESOURCE_PAGE_SIZE);
  const next = start + RESOURCE_PAGE_SIZE < resources.length
    ? String(start + RESOURCE_PAGE_SIZE)
    : undefined;

  return {
    resources: paged,
    nextCursor: next
  };
}

export async function handleReadWorkflowResource(uri: string): Promise<{ uri: string; mimeType: string; text: string; _meta: Record<string, unknown> }>{
  ensureWorkflowFilesConfigured();
  return readWorkflowResource(uri);
}

export function handleListWorkflowResourceTemplates(): Array<{ name: string; title: string; uriTemplate: string; description: string; mimeType?: string }>{
  return listWorkflowResourceTemplates();
}

export function logWorkflowFilesConfig(): void {
  if (!isWorkflowFilesConfigured()) {
    logger.warn('Workflow files root is not configured; workflow file tools/resources will be disabled');
  }
}
