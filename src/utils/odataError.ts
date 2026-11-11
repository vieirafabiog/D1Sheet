export class ODataHttpError extends Error {
  public statusCode: number;
  public code: string;
  public target?: string;
  public details?: unknown[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    target?: string,
    details?: unknown[]
  ) {
    super(message);
    this.name = 'ODataHttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.target = target;
    this.details = details;
    Object.setPrototypeOf(this, ODataHttpError.prototype);
  }
}

export interface ODataErrorPayload {
  error: {
    code: string;
    message: string;
    target?: string;
    details?: unknown[];
  };
}

export function formatODataError(
  code: string,
  message: string,
  target?: string,
  details?: unknown[]
): ODataErrorPayload {
  return {
    error: {
      code,
      message,
      ...(target ? { target } : {}),
      ...(details && details.length > 0 ? { details } : {}),
    },
  };
}

