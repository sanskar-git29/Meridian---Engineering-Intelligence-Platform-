export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(
    message: string,
    code = "BAD_REQUEST",
    details?: unknown
  ) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(
    message = "Authentication required",
    code = "UNAUTHORIZED"
  ) {
    return new ApiError(401, message, code);
  }

  static forbidden(
    message = "You do not have permission to perform this action",
    code = "FORBIDDEN"
  ) {
    return new ApiError(403, message, code);
  }

  static notFound(
    message = "Resource not found",
    code = "NOT_FOUND"
  ) {
    return new ApiError(404, message, code);
  }

  static conflict(
    message: string,
    code = "CONFLICT"
  ) {
    return new ApiError(409, message, code);
  }

  static tooManyRequests(
    message = "Too many requests",
    code = "RATE_LIMIT_EXCEEDED"
  ) {
    return new ApiError(429, message, code);
  }

  static internal(
    message = "Internal server error",
    code = "INTERNAL_SERVER_ERROR"
  ) {
    return new ApiError(500, message, code);
  }
}