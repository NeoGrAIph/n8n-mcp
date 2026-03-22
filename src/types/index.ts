// Export n8n node type definitions and utilities
export * from './node-types';
export * from './type-structures';
export * from './instance-context';
export * from './session-state';

export interface MCPServerConfig {
  port: number;
  host: string;
  authToken?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  annotations?: ToolAnnotations;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean | Record<string, any>;
  };
}

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
  idempotentHint?: boolean;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface PromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}
