export class ToolError extends Error {
  constructor(message, code = 'TOOL_ERROR', status = 400, data = undefined) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

export function toJsonRpcError(error) {
  if (error instanceof ToolError) {
    return {
      code: -32000,
      message: error.message,
      data: { code: error.code, status: error.status, ...(error.data ? { details: error.data } : {}) }
    };
  }
  return { code: -32603, message: error?.message || 'Internal error' };
}
