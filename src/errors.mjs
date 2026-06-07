export class ToolError extends Error {
  constructor(message, code = 'TOOL_ERROR', status = 400, data = undefined) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

export class InvalidParamsError extends Error {
  constructor(message, data = undefined) {
    super(message);
    this.name = 'InvalidParamsError';
    this.data = data;
  }
}

export function toJsonRpcError(error) {
  if (error instanceof InvalidParamsError) {
    return {
      code: -32602,
      message: error.message,
      ...(error.data ? { data: error.data } : {})
    };
  }
  if (error instanceof ToolError) {
    return {
      code: error.status === 404 ? -32002 : -32000,
      message: error.message,
      data: { code: error.code, status: error.status, ...(error.data ? { details: error.data } : {}) }
    };
  }
  return { code: -32603, message: error?.message || 'Internal error' };
}
