"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListCodeFiles = handleListCodeFiles;
exports.handleListSetFiles = handleListSetFiles;
exports.handleReadCodeFile = handleReadCodeFile;
exports.handleReadSetFile = handleReadSetFile;
exports.handleWriteCodeFile = handleWriteCodeFile;
exports.handleWriteSetFile = handleWriteSetFile;
exports.handlePatchWorkflowResource = handlePatchWorkflowResource;
exports.handleListWorkflowResources = handleListWorkflowResources;
exports.handleReadWorkflowResource = handleReadWorkflowResource;
exports.handleListWorkflowResourceTemplates = handleListWorkflowResourceTemplates;
exports.handleWriteWorkflowResource = handleWriteWorkflowResource;
exports.logWorkflowFilesConfig = logWorkflowFilesConfig;
const zod_1 = require("zod");
const workflow_files_service_1 = require("../services/workflow-files-service");
const logger_1 = require("../utils/logger");
const listSchema = zod_1.z.object({
    workflowId: zod_1.z.string().min(1)
});
const readSchema = zod_1.z.object({
    workflowId: zod_1.z.string().min(1),
    nodeId: zod_1.z.string().min(1)
});
const writeCodeSchema = zod_1.z.object({
    workflowId: zod_1.z.string().min(1),
    nodeId: zod_1.z.string().min(1),
    content: zod_1.z.string(),
    expectedEtag: zod_1.z.string().optional(),
    language: zod_1.z.string().optional()
});
const writeSetSchema = zod_1.z.object({
    workflowId: zod_1.z.string().min(1),
    nodeId: zod_1.z.string().min(1),
    content: zod_1.z.string(),
    expectedEtag: zod_1.z.string().optional()
});
const patchSchema = zod_1.z.object({
    uri: zod_1.z.string().min(1),
    patch: zod_1.z.string().min(1),
    expectedEtag: zod_1.z.string().optional(),
    minContextLines: zod_1.z.number().int().min(0).max(10).optional(),
    maxFuzz: zod_1.z.number().int().min(0).max(2).optional(),
    ignoreWhitespaceInContext: zod_1.z.boolean().optional()
});
const RESOURCE_PAGE_SIZE = 200;
function ensureWorkflowFilesConfigured() {
    if (!(0, workflow_files_service_1.isWorkflowFilesConfigured)()) {
        throw new Error('Workflow files root is not configured. Mount the workflows directory and set N8N_WORKFLOWS_ROOT.');
    }
}
function handleError(error) {
    if (error instanceof zod_1.z.ZodError) {
        return {
            success: false,
            error: 'Invalid input',
            details: { errors: error.errors }
        };
    }
    const err = error;
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
async function handleListCodeFiles(args) {
    try {
        ensureWorkflowFilesConfigured();
        const input = listSchema.parse(args || {});
        const files = await (0, workflow_files_service_1.listCodeFiles)(input.workflowId);
        return {
            success: true,
            data: {
                workflowId: input.workflowId,
                files,
                returned: files.length
            }
        };
    }
    catch (error) {
        return handleError(error);
    }
}
async function handleListSetFiles(args) {
    try {
        ensureWorkflowFilesConfigured();
        const input = listSchema.parse(args || {});
        const files = await (0, workflow_files_service_1.listSetFiles)(input.workflowId);
        return {
            success: true,
            data: {
                workflowId: input.workflowId,
                files,
                returned: files.length
            }
        };
    }
    catch (error) {
        return handleError(error);
    }
}
async function handleReadCodeFile(args) {
    try {
        ensureWorkflowFilesConfigured();
        const input = readSchema.parse(args || {});
        const file = await (0, workflow_files_service_1.readCodeFile)(input.workflowId, input.nodeId);
        return {
            success: true,
            data: file
        };
    }
    catch (error) {
        return handleError(error);
    }
}
async function handleReadSetFile(args) {
    try {
        ensureWorkflowFilesConfigured();
        const input = readSchema.parse(args || {});
        const file = await (0, workflow_files_service_1.readSetFile)(input.workflowId, input.nodeId);
        return {
            success: true,
            data: file
        };
    }
    catch (error) {
        return handleError(error);
    }
}
async function handleWriteCodeFile(args) {
    try {
        ensureWorkflowFilesConfigured();
        const input = writeCodeSchema.parse(args || {});
        const result = await (0, workflow_files_service_1.writeCodeFile)(input.workflowId, input.nodeId, input.content, input.expectedEtag, input.language);
        return {
            success: true,
            data: result
        };
    }
    catch (error) {
        return handleError(error);
    }
}
async function handleWriteSetFile(args) {
    try {
        ensureWorkflowFilesConfigured();
        const input = writeSetSchema.parse(args || {});
        const result = await (0, workflow_files_service_1.writeSetFile)(input.workflowId, input.nodeId, input.content, input.expectedEtag);
        return {
            success: true,
            data: result
        };
    }
    catch (error) {
        return handleError(error);
    }
}
async function handlePatchWorkflowResource(args) {
    try {
        ensureWorkflowFilesConfigured();
        const input = patchSchema.parse(args || {});
        const result = await (0, workflow_files_service_1.patchWorkflowResource)(input.uri, input.patch, input.expectedEtag, {
            minContextLines: input.minContextLines,
            maxFuzz: input.maxFuzz,
            ignoreWhitespaceInContext: input.ignoreWhitespaceInContext
        });
        return {
            success: true,
            data: result
        };
    }
    catch (error) {
        return handleError(error);
    }
}
async function handleListWorkflowResources(cursor) {
    ensureWorkflowFilesConfigured();
    const resources = await (0, workflow_files_service_1.listWorkflowResources)();
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
async function handleReadWorkflowResource(uri) {
    ensureWorkflowFilesConfigured();
    return (0, workflow_files_service_1.readWorkflowResource)(uri);
}
function handleListWorkflowResourceTemplates() {
    return (0, workflow_files_service_1.listWorkflowResourceTemplates)();
}
async function handleWriteWorkflowResource(uri, text, expectedEtag) {
    ensureWorkflowFilesConfigured();
    return (0, workflow_files_service_1.writeWorkflowResource)(uri, text, expectedEtag);
}
function logWorkflowFilesConfig() {
    if (!(0, workflow_files_service_1.isWorkflowFilesConfigured)()) {
        logger_1.logger.warn('Workflow files root is not configured; workflow file tools/resources will be disabled');
    }
}
//# sourceMappingURL=handlers-workflow-files.js.map