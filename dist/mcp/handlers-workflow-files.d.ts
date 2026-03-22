import { McpToolResponse } from '../types/n8n-api';
import { WorkflowResourceDescriptor } from '../services/workflow-files-service';
export declare function handleListCodeFiles(args: unknown): Promise<McpToolResponse>;
export declare function handleListSetFiles(args: unknown): Promise<McpToolResponse>;
export declare function handleReadCodeFile(args: unknown): Promise<McpToolResponse>;
export declare function handleReadSetFile(args: unknown): Promise<McpToolResponse>;
export declare function handleWriteCodeFile(args: unknown): Promise<McpToolResponse>;
export declare function handleWriteSetFile(args: unknown): Promise<McpToolResponse>;
export declare function handlePatchWorkflowResource(args: unknown): Promise<McpToolResponse>;
export declare function handleListWorkflowResources(cursor?: string | null): Promise<{
    resources: WorkflowResourceDescriptor[];
    nextCursor?: string;
}>;
export declare function handleReadWorkflowResource(uri: string): Promise<{
    uri: string;
    mimeType: string;
    text: string;
    _meta: Record<string, unknown>;
}>;
export declare function handleListWorkflowResourceTemplates(): Array<{
    name: string;
    title: string;
    uriTemplate: string;
    description: string;
    mimeType?: string;
}>;
export declare function handleWriteWorkflowResource(uri: string, text: string, expectedEtag?: string): Promise<{
    uri: string;
    etag: string;
    size: number;
    lastModified: string;
}>;
export declare function logWorkflowFilesConfig(): void;
//# sourceMappingURL=handlers-workflow-files.d.ts.map