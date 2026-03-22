import { Workflow } from '../types/n8n-api';
export type SubWorkflowMode = 'full' | 'node' | 'subgraph';
export interface SubWorkflowBuildInput {
    workflow: Workflow;
    mode: SubWorkflowMode;
    targetNodeName?: string;
    startNodeName?: string;
    endNodeNames?: string[];
    includeUpstream?: boolean;
    includeDownstream?: boolean;
}
export interface SubWorkflowBuildResult {
    workflow: Workflow;
    selectedNodeNames: string[];
    warnings: string[];
    triggerNodeName: string;
}
export declare function buildSubWorkflow(input: SubWorkflowBuildInput): SubWorkflowBuildResult;
//# sourceMappingURL=workflow-subgraph.d.ts.map