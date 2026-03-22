export type WorkflowFileKind = 'code' | 'set';
export type CodeFileLanguage = 'python' | 'javascript';
export interface WorkflowFileInfo {
    workflowId: string;
    nodeId: string;
    kind: WorkflowFileKind;
    language?: CodeFileLanguage;
    uri: string;
    relativePath?: string;
    path?: string;
    etag: string;
    size: number;
    lastModified: string;
}
export interface WorkflowFileContent extends WorkflowFileInfo {
    content: string;
}
export declare const WORKFLOWS_ROOT: string;
export declare function isWorkflowFilesConfigured(): boolean;
export declare function listCodeFiles(workflowId: string): Promise<WorkflowFileInfo[]>;
export declare function listSetFiles(workflowId: string): Promise<WorkflowFileInfo[]>;
export declare function readCodeFile(workflowId: string, nodeId: string): Promise<WorkflowFileContent>;
export declare function readSetFile(workflowId: string, nodeId: string): Promise<WorkflowFileContent>;
export declare function writeCodeFile(workflowId: string, nodeId: string, content: string, expectedEtag?: string, language?: string): Promise<WorkflowFileInfo>;
export declare function writeSetFile(workflowId: string, nodeId: string, content: string, expectedEtag?: string): Promise<WorkflowFileInfo>;
export interface WorkflowResourceDescriptor {
    name: string;
    title: string;
    uri: string;
    description: string;
    mimeType: string;
    _meta: Record<string, unknown>;
}
export interface WorkflowResourceWriteResult {
    uri: string;
    etag: string;
    size: number;
    lastModified: string;
}
export declare function listWorkflowResources(): Promise<WorkflowResourceDescriptor[]>;
export declare function readWorkflowResource(uri: string): Promise<{
    uri: string;
    mimeType: string;
    text: string;
    _meta: Record<string, unknown>;
}>;
export declare function writeWorkflowResource(uri: string, content: string, expectedEtag?: string): Promise<WorkflowResourceWriteResult>;
export interface PatchApplyOptions {
    minContextLines?: number;
    maxFuzz?: number;
    ignoreWhitespaceInContext?: boolean;
}
export declare function patchWorkflowResource(uri: string, patch: string, expectedEtag?: string, options?: PatchApplyOptions): Promise<WorkflowResourceWriteResult>;
export declare function listWorkflowResourceTemplates(): Array<{
    name: string;
    title: string;
    uriTemplate: string;
    description: string;
    mimeType?: string;
}>;
//# sourceMappingURL=workflow-files-service.d.ts.map